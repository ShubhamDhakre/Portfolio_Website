import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { kvStore, isSharedKVConfigured, KVStoreError } from '../services/kvStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_COOKIE_NAME = 'admin_session_token';
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

const DATA_DIR = path.resolve(__dirname, '../data');
const REVOKED_FILE = path.join(DATA_DIR, 'revoked-sessions.json');
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const TMP_REVOKED_FILE = path.join('/tmp', 'revoked-sessions.json');

let hasWarnedDevSecret = false;

/**
 * Validate and retrieve the session secret.
 * Enforces strict secret requirements in production to prevent session forgery.
 */
export function getSessionSecret() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.SESSION_SECRET;

  if (isProduction) {
    if (!secret || secret.length < 32 || secret.includes('dev_secret') || secret.includes('replace_in_production')) {
      throw new Error(
        '[SECURITY FATAL] Production requires a cryptographically strong SESSION_SECRET of at least 32 characters. ' +
        'Please set SESSION_SECRET in your production deployment environment variables.'
      );
    }
    return secret;
  }

  // Development / Test fallback with explicit warning
  if (!secret) {
    if (!hasWarnedDevSecret) {
      console.warn(
        '⚠️ [DEV SECURITY WARNING] SESSION_SECRET is not set in environment. ' +
        'Using local development fallback secret. Set SESSION_SECRET in .env for production readiness.'
      );
      hasWarnedDevSecret = true;
    }
    return 'local_dev_fallback_secret_must_be_at_least_32_bytes_long_safe_for_dev_only';
  }

  return secret;
}

// Fail-fast configuration validation on production startup
if (process.env.NODE_ENV === 'production') {
  try {
    getSessionSecret();
  } catch (err) {
    console.error(err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// Persistent session revocation registry (in-memory cache + file sync)
// Maps sessionId -> expiresAt timestamp
const revokedSessionsCache = new Map();
let isRevocationsLoaded = false;

function loadRevocations() {
  if (isRevocationsLoaded) return;
  isRevocationsLoaded = true;

  try {
    const filePath = IS_SERVERLESS ? TMP_REVOKED_FILE : REVOKED_FILE;
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const now = Date.now();
      if (parsed && typeof parsed === 'object') {
        for (const [id, exp] of Object.entries(parsed)) {
          if (typeof exp === 'number' && exp > now) {
            revokedSessionsCache.set(id, exp);
          }
        }
      }
    }
  } catch (err) {
    // If reading fails or file does not exist, continue with empty in-memory cache
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AUTH] Could not load revoked sessions file:', err.message);
    }
  }
}

function persistRevocations() {
  try {
    const now = Date.now();
    const data = {};
    for (const [id, exp] of revokedSessionsCache.entries()) {
      if (exp > now) {
        data[id] = exp;
      } else {
        revokedSessionsCache.delete(id);
      }
    }

    const json = JSON.stringify(data, null, 2);
    const targetDir = IS_SERVERLESS ? '/tmp' : DATA_DIR;
    const targetFile = IS_SERVERLESS ? TMP_REVOKED_FILE : REVOKED_FILE;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetFile, json, 'utf8');
  } catch (err) {
    // Read-only filesystem in serverless fallback
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AUTH] Could not persist revoked sessions to disk:', err.message);
    }
  }
}

export function isSessionRevoked(sessionId) {
  loadRevocations();
  const exp = revokedSessionsCache.get(sessionId);
  if (!exp) return false;
  if (Date.now() > exp) {
    revokedSessionsCache.delete(sessionId);
    return false;
  }
  return true;
}

export async function revokeSession(sessionId, expiresAt) {
  loadRevocations();
  const exp = expiresAt || (Date.now() + SESSION_LIFETIME_MS);
  revokedSessionsCache.set(sessionId, exp);
  persistRevocations();

  // If shared KV is configured, broadcast revocation across serverless instances
  if (isSharedKVConfigured()) {
    const ttlSeconds = Math.max(1, Math.ceil((exp - Date.now()) / 1000));
    try {
      await kvStore.set(`revoked_session:${sessionId}`, 1, { ex: ttlSeconds });
    } catch (err) {
      console.warn('[AUTH] Could not broadcast revocation to shared KV store:', err.message);
    }
  }
}

/**
 * Generate a cryptographically secure signed session token with embedded timestamp.
 * Structure: <base64url(payload)>.<hex(hmac-sha256)>
 */
export function createSession() {
  const secret = getSessionSecret();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_LIFETIME_MS;

  const payload = {
    id: sessionId,
    iat: now,
    exp: expiresAt
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');

  return `${payloadB64}.${signature}`;
}

/**
 * Revoke and invalidate a session token upon logout
 */
export async function destroySession(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return;
  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex <= 0) return;

  const payloadB64 = signedToken.substring(0, dotIndex);
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload?.id) {
      await revokeSession(payload.id, payload.exp);
    }
  } catch {
    // Malformed payload
  }
}

/**
 * Verify signed session token synchronously against local memory/file store
 */
export function verifySessionToken(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return false;

  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex <= 0) return false;

  const payloadB64 = signedToken.substring(0, dotIndex);
  const signature = signedToken.substring(dotIndex + 1);

  if (!payloadB64 || !signature) return false;

  const secret = getSessionSecret();
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
  } catch {
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return false;
  }

  if (!payload || typeof payload !== 'object') return false;
  if (!payload.id || typeof payload.id !== 'string') return false;
  if (!payload.exp || typeof payload.exp !== 'number') return false;

  if (Date.now() > payload.exp) {
    return false;
  }

  if (isSessionRevoked(payload.id)) {
    return false;
  }

  return true;
}

/**
 * Asynchronously verify signed session token, checking shared KV store for cross-instance revocation
 */
export async function verifySessionTokenAsync(signedToken) {
  // 1. Synchronous cryptographic integrity and local revocation check
  if (!verifySessionToken(signedToken)) {
    return false;
  }

  const dotIndex = signedToken.lastIndexOf('.');
  const payloadB64 = signedToken.substring(0, dotIndex);
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return false;
  }

  // 2. Query shared KV store if configured (cross-instance serverless verification)
  if (isSharedKVConfigured()) {
    try {
      const isRevokedInKV = await kvStore.get(`revoked_session:${payload.id}`);
      if (isRevokedInKV) {
        revokedSessionsCache.set(payload.id, payload.exp);
        return false;
      }
    } catch (err) {
      // In production or when shared KV is the authoritative revocation store:
      // A timeout, network error, HTTP 500, or malformed response must NEVER cause an unverified session to be accepted!
      // Fail closed with a controlled error.
      console.error('[AUTH CRITICAL] Authoritative KV revocation check failed:', err.message);
      const kvErr = new Error('Authoritative session verification store is temporarily unavailable. Please retry.');
      kvErr.status = 503;
      kvErr.code = 'KV_UNAVAILABLE';
      kvErr.originalError = err;
      throw kvErr;
    }
  } else {
    kvStore.warnIfUnconfiguredServerless();
  }

  return true;
}

/**
 * Express middleware to protect admin endpoints
 */
export async function requireAdminAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin session expired, revoked, or invalid. Please re-authenticate.'
    });
  }

  try {
    const isValid = await verifySessionTokenAsync(token);
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin session expired, revoked, or invalid. Please re-authenticate.'
      });
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    if (err.code === 'KV_UNAVAILABLE' || err instanceof KVStoreError) {
      return res.status(503).json({
        error: 'Service Unavailable',
        code: 'AUTH_STORE_UNAVAILABLE',
        message: 'Authoritative session verification store is temporarily unavailable. Please retry.'
      });
    }

    return res.status(500).json({
      error: 'Authentication Error',
      message: 'Session verification failed unexpectedly.'
    });
  }
}

/**
 * Strict Rate Limiter for Login Endpoint to prevent brute-force attacks
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] || req.ip || req.socket?.remoteAddress || '127.0.0.1';
  },
  validate: { xForwardedForHeader: false, default: false },
  message: {
    error: 'Too many login attempts',
    message: 'Rate limit exceeded. Please wait 15 minutes before retrying.'
  }
});

export { SESSION_COOKIE_NAME, SESSION_LIFETIME_MS };

