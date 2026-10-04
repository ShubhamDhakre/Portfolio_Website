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

// Middlewares
app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());

// CORS configuration (support local dev, preview URLs, and production domains)
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin, curl/postman/server-to-server without origin, and all web origins
    callback(null, true);
  },
  credentials: true
}));

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
