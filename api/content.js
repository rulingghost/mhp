const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('./auth-util');

// In-memory cache as fallback
let memoryCache = null;

// Paths to local data files
const localFilePath = path.join(process.cwd(), 'data', 'site-content.json');
const tmpFilePath = path.join('/tmp', 'site-content.json');

/**
 * Storage Helpers - Supabase
 */
async function readFromSupabase(supabaseUrl, supabaseKey) {
  try {
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/site_content?id=eq.main&select=data`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
        return typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
      }
    }
  } catch (e) {
    console.warn('Supabase read error:', e.message);
  }
  return null;
}

async function saveToSupabase(supabaseUrl, supabaseKey, content) {
  try {
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/site_content`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: 'main', data: content })
    });
    return res.ok;
  } catch (e) {
    console.warn('Supabase save error:', e.message);
  }
  return false;
}

/**
 * Storage Helpers - Vercel KV / Upstash Redis
 */
async function readFromKv(kvUrl, kvToken) {
  const cleanUrl = kvUrl.replace(/\/$/, '');

  // Try 1: Upstash array command
  try {
    const res1 = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', 'site_content']),
      cache: 'no-store'
    });
    if (res1.ok) {
      const data = await res1.json();
      if (data && data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    }
  } catch (e) {
    console.warn('KV array read failed, trying GET /get:', e.message);
  }

  // Try 2: Endpoint style GET /get/site_content
  try {
    const res2 = await fetch(`${cleanUrl}/get/site_content`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${kvToken}` },
      cache: 'no-store'
    });
    if (res2.ok) {
      const data = await res2.json();
      if (data && data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    }
  } catch (e) {
    console.warn('KV endpoint read failed:', e.message);
  }

  return null;
}

async function saveToKv(kvUrl, kvToken, content) {
  const cleanUrl = kvUrl.replace(/\/$/, '');
  const jsonStr = JSON.stringify(content);

  // Try 1: Upstash array command ['SET', 'site_content', jsonStr]
  try {
    const res1 = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', 'site_content', jsonStr])
    });
    if (res1.ok) {
      const data = await res1.json();
      if (data.result === 'OK' || data.result) return true;
    }
  } catch (e) {
    console.warn('KV array set failed, trying /set endpoint:', e.message);
  }

  // Try 2: Endpoint style POST /set/site_content
  try {
    const res2 = await fetch(`${cleanUrl}/set/site_content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: jsonStr
    });
    if (res2.ok) return true;
  } catch (e) {
    console.warn('KV endpoint set failed:', e.message);
  }

  return false;
}

/**
 * Storage Adapter - Read Content
 */
async function readContent() {
  // 1. Try Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    const supaData = await readFromSupabase(supabaseUrl, supabaseKey);
    if (supaData) {
      memoryCache = supaData;
      return { content: supaData, storageType: 'supabase' };
    }
  }

  // 2. Try Vercel KV / Upstash Redis
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    const kvData = await readFromKv(kvUrl, kvToken);
    if (kvData) {
      memoryCache = kvData;
      return { content: kvData, storageType: 'vercel_kv' };
    }
  }

  // 3. Try /tmp file
  try {
    if (fs.existsSync(tmpFilePath)) {
      const data = fs.readFileSync(tmpFilePath, 'utf8');
      const parsed = JSON.parse(data);
      memoryCache = parsed;
      return { content: parsed, storageType: 'tmp_file' };
    }
  } catch (e) {}

  // 4. Try local file data/site-content.json
  try {
    if (fs.existsSync(localFilePath)) {
      const data = fs.readFileSync(localFilePath, 'utf8');
      const parsed = JSON.parse(data);
      memoryCache = parsed;
      return { content: parsed, storageType: 'local_file' };
    }
  } catch (e) {
    console.warn('Local file read failed:', e.message);
  }

  // 5. In-memory cache
  if (memoryCache) {
    return { content: memoryCache, storageType: 'memory' };
  }

  throw new Error('İçerik dosyası veya veritabanı kaydı bulunamadı.');
}

/**
 * Storage Adapter - Save Content
 */
async function saveContent(content) {
  let savedToRemoteDb = false;
  let remoteType = null;

  // 1. Try Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    const ok = await saveToSupabase(supabaseUrl, supabaseKey, content);
    if (ok) {
      savedToRemoteDb = true;
      remoteType = 'supabase';
    }
  }

  // 2. Try Vercel KV / Upstash Redis
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken && !savedToRemoteDb) {
    const ok = await saveToKv(kvUrl, kvToken, content);
    if (ok) {
      savedToRemoteDb = true;
      remoteType = 'vercel_kv';
    }
  }

  // 3. Try local project file
  let savedToLocalFile = false;
  try {
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, JSON.stringify(content, null, 2), 'utf8');
    savedToLocalFile = true;
  } catch (e) {
    // Expected on Vercel serverless read-only filesystem
  }

  // 4. Try /tmp file
  try {
    fs.writeFileSync(tmpFilePath, JSON.stringify(content, null, 2), 'utf8');
  } catch (e) {}

  memoryCache = content;

  // If on Vercel AND no database is connected:
  const isVercel = !!process.env.VERCEL;
  if (isVercel && !savedToRemoteDb) {
    return {
      success: false,
      needsDatabase: true,
      message: 'Vercel üzerinde kalıcı veritabanı (Vercel KV veya Supabase) henüz bağlanmamış! Vercel sunucusuz mimarisinde verilerin canlıda kalıcı olması için veritabanı bağlantısı zorunludur. Lütfen Vercel Dashboard > Storage > Create KV oluşturup projenize bağlayın.'
    };
  }

  if (!savedToRemoteDb && !savedToLocalFile) {
    return {
      success: false,
      message: 'Veri kalıcı depolama alanına yazılamadı. Lütfen veritabanı bağlantınızı kontrol edin.'
    };
  }

  return {
    success: true,
    storageType: remoteType || 'local_file',
    message: remoteType 
      ? `Değişiklikler ${remoteType === 'vercel_kv' ? 'Vercel KV' : 'Supabase'} veritabanına başarıyla kaydedildi ve anında yayına alındı.` 
      : 'Değişiklikler başarıyla kaydedildi.'
  };
}

/**
 * Validate incoming content structure
 */
function validateContent(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Geçersiz veri biçimi.' };
  }
  if (!Array.isArray(data.hero) || data.hero.length === 0) {
    return { valid: false, error: 'Hero (Slayt) bölümü en az 1 slayt içermelidir.' };
  }
  if (!data.about || typeof data.about !== 'object') {
    return { valid: false, error: 'Hakkımda bölümü eksik veya hatalı.' };
  }
  if (!data.vision || typeof data.vision !== 'object' || !Array.isArray(data.vision.projects)) {
    return { valid: false, error: 'Vizyon & Projeler bölümü eksik veya hatalı.' };
  }
  if (!data.values || typeof data.values !== 'object' || !Array.isArray(data.values.items)) {
    return { valid: false, error: 'İlkelerimiz bölümü eksik veya hatalı.' };
  }
  return { valid: true };
}

/**
 * Request Handler
 */
module.exports = async function handler(req, res) {
  // Strict Cache-Control headers to prevent stale CDN/browser responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Pragma, Cache-Control');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { content, storageType } = await readContent();
      res.setHeader('X-Storage-Type', storageType);
      return res.status(200).json({
        ...content,
        _storageType: storageType
      });
    } catch (err) {
      console.error('Content GET error:', err);
      return res.status(500).json({ success: false, message: 'İçerik okunamadı: ' + err.message });
    }
  }

  if (req.method === 'POST') {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: 'Yetkisiz işlem. Lütfen panele tekrar giriş yapınız.'
      });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Geçersiz JSON verisi.' });
        }
      }

      // Remove internal _storageType metadata before saving
      if (body._storageType) {
        delete body._storageType;
      }

      const validation = validateContent(body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.error });
      }

      const saveResult = await saveContent(body);

      if (!saveResult.success) {
        return res.status(saveResult.needsDatabase ? 428 : 500).json(saveResult);
      }

      return res.status(200).json({
        success: true,
        message: saveResult.message,
        storageType: saveResult.storageType,
        data: body
      });
    } catch (err) {
      console.error('Content POST error:', err);
      return res.status(500).json({ success: false, message: 'Kaydetme hatası: ' + err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Yalnızca GET ve POST desteklenmektedir.' });
};
