# Portfolio & Control Center

Interactive 3D Portfolio and Administrator Control Center built with React, Vite, Three.js, and an Express backend designed for local development and Vercel Serverless Function deployment.

## Development Setup

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` defines:
* `ADMIN_PASSWORD_HASH`: Generate your hash using `npm run hash-password <your_password>`
* `SESSION_SECRET`: A cryptographically strong secret of at least 32 characters
* `PORT`: `3001` (backend Express API port)
* `ALLOWED_ORIGINS`: (optional) Comma-separated list of additional permitted CORS origins
* `KV_REST_API_URL` / `KV_REST_API_TOKEN`: (optional) Vercel KV or Upstash Redis for cross-instance serverless session revocation

### 2. Start Local Development
To run both the Vite frontend and the Express backend concurrently:
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **API Backend**: `http://localhost:3001`
* **API Proxy**: Vite automatically proxies `/api/*` to `http://localhost:3001`

To run services independently:
```bash
# Terminal 1 - Express Backend
npm run dev:server

# Terminal 2 - Vite Client
npm run dev:client
```

## Testing, Linting & Building

```bash
# Run full regression test suite
npm test

# Run code linter
npm run lint

# Build production bundle
npm run build
```

## Vercel Deployment

When deploying to Vercel:
1. Ensure the following environment variables are added in the **Vercel Project Settings > Environment Variables**:
   * `ADMIN_PASSWORD_HASH`
   * `SESSION_SECRET`
   * `ALLOWED_ORIGINS` (if using custom domains)
   * `KV_REST_API_URL` & `KV_REST_API_TOKEN` (required for distributed session revocation and cross-instance persistence)
2. Vercel automatically builds via `npm run build` and routes API traffic through `api/index.js` as defined in `vercel.json`.

