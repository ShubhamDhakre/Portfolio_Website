import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/admin.js';
import siteSettingsRoutes from './routes/siteSettings.js';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (essential for Vercel, rate limiting, and client IP)
app.set('trust proxy', 1);

// Ensure socket and remoteAddress safely exist for forwarded and rate-limiter
app.use((req, res, next) => {
  if (!req.socket) req.socket = {};
  if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : null) || req.headers['x-real-ip'] || '127.0.0.1';
  }
  next();
});

// Security Headers Middleware (MIME-sniffing, clickjacking, HSTS, CSP)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Content-Security-Policy supporting Google Fonts, Three.js shaders/blobs, and self APIs
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' https:; " +
      "worker-src 'self' blob:; " +
      "frame-ancestors 'none';"
    );
  }
  next();
});

// Middlewares
app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());

// CORS configuration with explicit allowlist (eliminates arbitrary origin reflection)
export const ALLOWED_LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

export function getAllowedOrigins() {
  const customOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const vercelOrigins = [];
  if (process.env.VERCEL_URL) {
    vercelOrigins.push(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    vercelOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  return new Set([...ALLOWED_LOCAL_ORIGINS, ...customOrigins, ...vercelOrigins]);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin header (same-origin browser navigation, curl, serverless internal rewrites)
    if (!origin) {
      return callback(null, true);
    }

    const allowed = getAllowedOrigins();
    if (allowed.has(origin)) {
      return callback(null, true);
    }

    // Reject unauthorized cross-origin requests
    return callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * State-changing request origin validation middleware (CSRF defense).
 * Enforces that POST/PUT/PATCH/DELETE requests originate from an explicitly allowed domain.
 */
export function validateStateChangeOrigin(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const allowed = getAllowedOrigins();

    let requestOrigin = origin;
    if (!requestOrigin && referer) {
      try {
        const parsed = new URL(referer);
        requestOrigin = parsed.origin;
      } catch {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Malformed Referer header on state-changing request.'
        });
      }
    }

    if (requestOrigin && !allowed.has(requestOrigin)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Cross-origin state modification from '${requestOrigin}' is not permitted.`
      });
    }

    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite === 'cross-site') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cross-site request blocked by CSRF protection.'
      });
    }
  }
  next();
}

app.use(validateStateChangeOrigin);

// Route normalization for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  if (req.url === '/api/index.js' || req.url === '/api/index') {
    const original = req.headers['x-matched-path'] || req.headers['x-invoke-path'] || req.originalUrl;
    if (original && original !== req.url) {
      req.url = original;
    }
  }
  next();
});

// Request logging (sanitized, never logs credentials or passwords)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes (mount on both /api/* and root paths to handle rewrite variations)
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/site-settings', '/site-settings'], siteSettingsRoutes);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', service: 'portfolio-control-center-api' });
});

// Serve production static assets if dist directory exists (local standalone server)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing in production (local standalone server)
app.get('{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message
    });
  }

  console.error('[SERVER ERROR]', err.message);
  res.status(err.status || 500).json({
    error: 'System encountered an internal error.',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Only listen directly when running as a standalone node server (not on Vercel Serverless)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 [CONTROL CENTER API] Running on http://localhost:${PORT}`);
    console.log(`🔐 Admin auth active. Endpoint: /api/admin/login`);
  });
}

export default app;
