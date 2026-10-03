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

// Middlewares
app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());

// CORS configuration (in dev, Vite runs on 5173 with proxy; allow direct if needed)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Request logging (sanitized, never logs credentials or passwords)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/site-settings', siteSettingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'portfolio-control-center-api' });
});

// Serve production static assets if dist directory exists
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing in production
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

app.listen(PORT, () => {
  console.log(`🚀 [CONTROL CENTER API] Running on http://localhost:${PORT}`);
  console.log(`🔐 Admin auth active. Endpoint: /api/admin/login`);
});
