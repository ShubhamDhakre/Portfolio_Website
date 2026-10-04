import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  createSession,
  destroySession,
  verifySessionTokenAsync,
  requireAdminAuth,
  loginRateLimiter,
  SESSION_COOKIE_NAME,
  SESSION_LIFETIME_MS
} from '../middleware/auth.js';
import { getSiteSettingsAsync, saveSiteSettings, validateSettingsPayload } from '../services/settingsStore.js';

const router = Router();

/**
 * Safely retrieve and validate the configured administrator password hash.
 * In production, fails safely with an explicit error if missing or malformed.
 */
export function getAdminPasswordHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const isProduction = process.env.NODE_ENV === 'production';

  // Standard bcrypt hash format: $2a$, $2b$, or $2y$, 2-digit cost, 53 salt+hash chars (total 60 chars)
  const isBcrypt = typeof hash === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash.trim());

  if (isProduction) {
    if (!hash || !isBcrypt) {
      throw new Error(
        '[SECURITY FATAL] Production requires a valid bcrypt ADMIN_PASSWORD_HASH in environment variables. ' +
        'Please generate one using: npm run hash-password <your_password>'
      );
    }
    return hash.trim();
  }

  // Development environment check
  if (!hash || !isBcrypt) {
    return null;
  }

  return hash.trim();
}

// Fail-fast configuration validation on production startup
if (process.env.NODE_ENV === 'production') {
  try {
    getAdminPasswordHash();
  } catch (err) {
    console.error(err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

/**
 * POST /api/admin/login
 * Validates password against configured environment hash and sets HttpOnly cookie
 */
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.', message: 'Password is required.' });
    }

    let targetHash;
    try {
      targetHash = getAdminPasswordHash();
    } catch (configErr) {
      console.error('[AUTH CONFIG ERROR]', configErr.message);
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Administrator authentication is not configured in production.'
      });
    }

    if (!targetHash) {
      return res.status(503).json({
        error: 'Configuration Required',
        message: 'ADMIN_PASSWORD_HASH is not configured in .env. Generate one with: npm run hash-password'
      });
    }

    const isValid = await bcrypt.compare(password, targetHash);

    if (!isValid) {
      // Delay response slightly to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 300));
      return res.status(401).json({ error: 'Invalid password. Please try again.', message: 'Invalid password. Please try again.' });
    }

    const sessionToken = createSession();
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    };

    // Invalidate any previous session and clear stale cookie to prevent session fixation
    const previousToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (previousToken) {
      await destroySession(previousToken);
      res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
    }

    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: SESSION_LIFETIME_MS
    });

    return res.status(200).json({
      success: true,
      authenticated: true,
      message: 'Global control session established.'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication service error.' });
  }
});

/**
 * POST /api/admin/logout
 * Revokes session from server registry and clears session cookie with matching security flags
 */
router.post('/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    await destroySession(token);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  });

  return res.status(200).json({
    success: true,
    authenticated: false,
    message: 'Global control session terminated.'
  });
});

/**
 * GET /api/admin/session
 * Checks whether active admin session is valid.
 * Fails closed if authoritative KV store is unavailable.
 */
router.get('/session', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const isValid = await verifySessionTokenAsync(token);
    return res.status(200).json({
      authenticated: Boolean(isValid)
    });
  } catch (err) {
    if (err.code === 'KV_UNAVAILABLE') {
      return res.status(503).json({
        authenticated: false,
        error: 'Service Unavailable',
        code: 'AUTH_STORE_UNAVAILABLE',
        message: 'Authoritative session verification store is temporarily unavailable. Please retry.'
      });
    }
    return res.status(200).json({ authenticated: false });
  }
});

/**
 * GET /api/admin/settings
 * Returns full global site settings (requires auth)
 */
router.get('/settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = await getSiteSettingsAsync();
    return res.status(200).json(settings);
  } catch (err) {
    console.error('Error fetching admin settings:', err.message);
    if (err.code === 'KV_UNAVAILABLE') {
      return res.status(503).json({
        error: 'Service Unavailable',
        code: 'SETTINGS_STORE_UNAVAILABLE',
        message: 'Authoritative settings store is temporarily unavailable. Please retry.'
      });
    }
    return res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

/**
 * PUT or POST /api/admin/settings
 * Updates global site settings atomically (requires auth)
 */
const handleSaveSettings = async (req, res) => {
  try {
    const validated = validateSettingsPayload(req.body);
    const updated = await saveSiteSettings(validated, 'admin');

    return res.status(200).json({
      success: true,
      message: 'GLOBAL SETTINGS SAVED',
      data: updated
    });
  } catch (err) {
    console.error('Error updating admin settings:', err.message);
    return res.status(err.status || 500).json({
      error: err.code || 'CONFIGURATION SAVE FAILED',
      message: err.message || 'Server could not persist configuration.'
    });
  }
};

router.put('/settings', requireAdminAuth, handleSaveSettings);
router.post('/settings', requireAdminAuth, handleSaveSettings);

export default router;
