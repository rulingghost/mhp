const crypto = require('crypto');
require('dotenv').config();

const SECRET_KEY = process.env.SESSION_SECRET || 'mhp_admin_panel_secure_secret_2026_uygar_ozturk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Generate a signed session token
 */
function createToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  return `${data}.${signature}`;
}

/**
 * Verify session token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  if (expectedSig !== signature) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    if (payload.exp && payload.exp > Date.now()) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Check if request has valid authorization
 */
function isAuthorized(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    return verifyToken(token);
  }
  // Check cookie if available
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
    if (cookies.admin_token && verifyToken(cookies.admin_token)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  ADMIN_PASSWORD,
  createToken,
  verifyToken,
  isAuthorized
};
