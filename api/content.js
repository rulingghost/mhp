const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('./auth-util');

// In-memory cache as fallback
let memoryCache = null;

// Paths to local data files
const localFilePath = path.join(process.cwd(), 'data', 'site-content.json');
const tmpFilePath = path.join('/tmp', 'site-content.json');

/**
 * Storage Adapter - Read Content
 * Priority:
 * 1. Supabase (if SUPABASE_URL & SUPABASE_KEY configured)
 * 2. Vercel KV / Upstash Redis (if KV_REST_API_URL & KV_REST_API_TOKEN configured)
 * 3. /tmp/site-content.json
 * 4. data/site-content.json
 * 5. In-memory cache
 */
async function readContent() {
  // 1. Try Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/site_content?id=eq.main&select=data`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
          const content = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
          memoryCache = content;
          return content;
        }
      }
    } catch (e) {
      console.warn('Supabase read failed, trying next adapter:', e.message);
    }
  }

  // 2. Try Vercel KV / Upstash Redis
  const kvUrl = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      // Upstash REST command
      const res = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'site_content'])
      });
      const data = await res.json();
      if (data && data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        memoryCache = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('KV Read failed, trying local file:', e.message);
    }
  }

  // 3. Try /tmp file (writable in Vercel serverless during same instance lifespan)
  try {
    if (fs.existsSync(tmpFilePath)) {
      const data = fs.readFileSync(tmpFilePath, 'utf8');
      const parsed = JSON.parse(data);
      memoryCache = parsed;
      return parsed;
    }
  } catch (e) {
    // Ignore tmp error
  }

  // 4. Try primary local file data/site-content.json
  try {
    if (fs.existsSync(localFilePath)) {
      const data = fs.readFileSync(localFilePath, 'utf8');
      const parsed = JSON.parse(data);
      memoryCache = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('Local file read failed:', e.message);
  }

  // 5. Return in-memory cache if available
  if (memoryCache) {
    return memoryCache;
  }

  throw new Error('İçerik dosyası veya veritabanı kaydı bulunamadı.');
}

/**
 * Storage Adapter - Save Content
 * Saves to available remote database (Supabase or KV) and falls back to local file / tmp.
 */
async function saveContent(content) {
  memoryCache = content;
  const jsonStr = JSON.stringify(content, null, 2);
  let saved = false;

  // 1. Try Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
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
      if (res.ok) {
        saved = true;
      } else {
        const errorText = await res.text();
        console.warn('Supabase save returned status:', res.status, errorText);
      }
    } catch (e) {
      console.warn('Supabase save error:', e.message);
    }
  }

  // 2. Try Vercel KV / Upstash Redis
  const kvUrl = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'site_content', JSON.stringify(content)])
      });
      if (res.ok) {
        saved = true;
      }
    } catch (e) {
      console.warn('KV Save failed:', e.message);
    }
  }

  // 3. Try local project file data/site-content.json
  try {
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, jsonStr, 'utf8');
    saved = true;
  } catch (e) {
    // Read-only serverless disk error is expected on Vercel
    console.warn('Local file save skipped (serverless environment):', e.message);
  }

  // 4. Try /tmp file
  try {
    fs.writeFileSync(tmpFilePath, jsonStr, 'utf8');
    saved = true;
  } catch (e) {
    // Ignore tmp error
  }

  if (!saved && !memoryCache) {
    throw new Error('İçerik kaydedilemedi. Lütfen veritabanı bağlantı ayarlarınızı kontrol ediniz.');
  }

  return true;
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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const content = await readContent();
      return res.status(200).json(content);
    } catch (err) {
      console.error('Content GET error:', err);
      return res.status(500).json({ success: false, message: 'İçerik okunamadı: ' + err.message });
    }
  }

  if (req.method === 'POST') {
    // Security check
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

      const validation = validateContent(body);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.error });
      }

      await saveContent(body);

      return res.status(200).json({
        success: true,
        message: 'Değişiklikler başarıyla kaydedildi.',
        data: body
      });
    } catch (err) {
      console.error('Content POST error:', err);
      return res.status(500).json({ success: false, message: 'Kaydetme hatası: ' + err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Yalnızca GET ve POST desteklenmektedir.' });
};
