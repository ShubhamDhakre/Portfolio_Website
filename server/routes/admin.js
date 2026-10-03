import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  createSession,
  destroySession,
  verifySessionToken,
  requireAdminAuth,
  loginRateLimiter,
  SESSION_COOKIE_NAME,
  SESSION_LIFETIME_MS
} from '../middleware/auth.js';
import { getSiteSettings, saveSiteSettings, validateSettingsPayload } from '../services/settingsStore.js';

const router = Router();

// Fallback hashes: Shubham's password 'Shubh@m2004' and dev fallback
const DEFAULT_SHUBHAM_HASH = '$2b$10$iOIN65YNnkVvkBknS99gVuyhxW4sBBQR4kQ0NSAuDW4aCoQ3X8waK';
const DEFAULT_DEV_HASH = '$2b$10$RZ0wYXSilRceFPA3Kam3mux9Ddci5c5gQjyGnLD6mcIlKUPt6cPIa';

/**
 * POST /api/admin/login
 * Validates password and sets HttpOnly cookie
 */
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.', message: 'Password is required.' });
    }

    const targetHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_SHUBHAM_HASH;

    let isValid = await bcrypt.compare(password, targetHash);

    // Fallback checks if target hash didn't match
    if (!isValid && targetHash !== DEFAULT_SHUBHAM_HASH) {
      isValid = await bcrypt.compare(password, DEFAULT_SHUBHAM_HASH);
    }
    if (!isValid && targetHash !== DEFAULT_DEV_HASH) {
      isValid = await bcrypt.compare(password, DEFAULT_DEV_HASH);
    }

    if (!isValid) {
      // Delay response slightly to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 300));
      return res.status(401).json({ error: 'Invalid password. Please try again.', message: 'Invalid password. Please try again.' });
    }

    const sessionToken = createSession();
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_LIFETIME_MS,
      path: '/'
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
 * Clears session cookie
 */
router.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    destroySession(token);
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
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
 * Checks whether active admin session is valid
 */
router.get('/session', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const isValid = verifySessionToken(token);

  return res.status(200).json({
    authenticated: Boolean(isValid)
  });
});

/**
 * GET /api/admin/settings
 * Returns full global site settings (requires auth)
 */
router.get('/settings', requireAdminAuth, (req, res) => {
  try {
    const settings = getSiteSettings();
    return res.status(200).json(settings);
  } catch (err) {
    console.error('Error fetching admin settings:', err);
    return res.status(500).json({ error: 'Failed to retrieve site settings.' });
  }
});

/**
 * PUT or POST /api/admin/settings
 * Updates global site settings atomically (requires auth)
 */
const handleSaveSettings = (req, res) => {
  try {
    const validated = validateSettingsPayload(req.body);
    const updated = saveSiteSettings(validated, 'admin');

    return res.status(200).json({
      success: true,
      message: 'GLOBAL SETTINGS SAVED',
      data: updated
    });
  } catch (err) {
    console.error('Error updating admin settings:', err);
    return res.status(err.status || 500).json({
      error: 'CONFIGURATION SAVE FAILED',
      message: err.message || 'Server could not persist configuration.'
    });
  }
};

router.put('/settings', requireAdminAuth, handleSaveSettings);
router.post('/settings', requireAdminAuth, handleSaveSettings);

export default router;
