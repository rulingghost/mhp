const { ADMIN_PASSWORD, createToken } = require('./auth-util');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { password } = body || {};

    if (!password) {
      return res.status(400).json({ success: false, message: 'Şifre alanı boş bırakılamaz.' });
    }

    const correctPassword = process.env.ADMIN_PASSWORD || ADMIN_PASSWORD || 'admin123';

    if (password !== correctPassword) {
      return res.status(401).json({ success: false, message: 'Hatalı şifre girdiniz.' });
    }

    const token = createToken();

    // Set cookie as well for convenience
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);

    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı.',
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
  }
};
