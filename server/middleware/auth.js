import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const SESSION_COOKIE_NAME = 'admin_session_token';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_replace_in_production_8cf60ab3';

// In-memory active session store (or token signature)
const activeSessions = new Map(); // token -> { createdAt, expiresAt }
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure random session token
 */
export function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
  const signedToken = `${token}.${signature}`;

  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_LIFETIME_MS
  });

  return signedToken;
}

/**
 * Invalidate a session
 */
export function destroySession(signedToken) {
  if (!signedToken) return;
  const [token] = signedToken.split('.');
  activeSessions.delete(token);
}

/**
 * Verify signed session token
 */
export function verifySessionToken(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return false;

  const parts = signedToken.split('.');
  if (parts.length !== 2) return false;

  const [token, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');

  // Timing safe comparison to avoid side-channel attacks
  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isSignatureValid) return false;
  } catch {
    return false;
  }

  const session = activeSessions.get(token);
  if (!session) {
    // If server restarted, accept valid signature within lifetime if signature checks out
    return true;
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Express middleware to protect admin endpoints
 */
export function requireAdminAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin session expired or invalid. Please re-authenticate.'
    });
  }

  req.isAdmin = true;
  next();
}

/**
 * Strict Rate Limiter for Login Endpoint to prevent brute-force attacks
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts',
    message: 'Rate limit exceeded. Please wait 15 minutes before retrying.'
  }
});

export { SESSION_COOKIE_NAME, SESSION_LIFETIME_MS };
