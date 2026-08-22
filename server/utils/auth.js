/**
 * Authentication & Security Utilities
 * - Password Hashing & Verification (bcrypt standard / PBKDF2-SHA256)
 * - Standard HS256 JWT Generation & Verification
 * - Input Validation
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Safe .env loader without requiring external dotenv package
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}
loadEnv();

const DEFAULT_SECRET = 'plan-my-journey-hackathon-jwt-secret-2026';

function getJwtSecret() {
  return process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== ''
    ? process.env.JWT_SECRET
    : DEFAULT_SECRET;
}

/**
 * Parse expiration string (e.g. '1h', '30m', '7d', '3600') into seconds.
 */
function parseExpiresIn(expiresIn) {
  if (!expiresIn) return 3600; // 1 hour default
  if (typeof expiresIn === 'number') return expiresIn;
  
  const match = expiresIn.match(/^(\d+)([smhd])?$/);
  if (!match) return 3600;
  
  const val = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return val;
    case 'm': return val * 60;
    case 'h': return val * 3600;
    case 'd': return val * 86400;
    default: return val;
  }
}

/**
 * Base64URL Encoding & Decoding
 */
function base64UrlEncode(strOrBuffer) {
  const buf = Buffer.isBuffer(strOrBuffer) ? strOrBuffer : Buffer.from(strOrBuffer, 'utf8');
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Password Hashing using PBKDF2-SHA256 with 100,000 iterations & salt
 * Stored format: $pbkdf2$100000$salt$hash
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `$pbkdf2$100000$${salt}$${hash}`;
}

function comparePassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length === 5 && parts[1] === 'pbkdf2') {
    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const expectedHash = parts[4];
    const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  }
  // Fallback check
  const fallbackHash = crypto.createHash('sha256').update(password).digest('hex');
  return storedHash === fallbackHash;
}

/**
 * Generate standard HS256 JWT
 * Payload shape: { userId: string, email: string, iat: number, exp: number }
 */
function generateToken(user, expiresInStr = process.env.JWT_EXPIRES_IN || '1h') {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const durationSeconds = parseExpiresIn(expiresInStr);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    userId: user.id || user.userId,
    email: user.email,
    iat: now,
    exp: now + durationSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify and decode standard HS256 JWT
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token missing or not a string');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT structure');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const secret = getJwtSecret();
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest();

  const expectedEncodedSig = base64UrlEncode(expectedSignature);
  
  // Timing safe equality check
  const sigBuf = Buffer.from(encodedSignature);
  const expBuf = Buffer.from(expectedEncodedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid signature');
  }

  // Parse payload
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch (err) {
    throw new Error('Invalid token payload');
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    throw error;
  }

  return payload;
}

/**
 * Input validation helpers
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ name, email, password }) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { isValid: false, message: 'Name is required and cannot be empty' };
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, message: 'Valid email is required' };
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
}

function validateLoginInput({ email, password }) {
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, message: 'Valid email is required' };
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    return { isValid: false, message: 'Password is required' };
  }
  return { isValid: true };
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  validateRegisterInput,
  validateLoginInput,
  getJwtSecret
};
