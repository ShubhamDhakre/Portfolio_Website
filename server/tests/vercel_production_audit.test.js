import assert from 'assert';
import bcrypt from 'bcryptjs';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import app from '../../api/index.js';
import { getSiteSettings } from '../services/settingsStore.js';
import { SESSION_COOKIE_NAME } from '../middleware/auth.js';

console.log('🧪 Starting Vercel Production Routing & Security Audit Tests...');

function simulateRequest(options) {
  return new Promise((resolve) => {
    const req = {
      method: options.method || 'GET',
      url: options.url,
      path: options.url.split('?')[0],
      query: options.query || {},
      headers: { host: 'localhost', ...(options.headers || {}) },
      socket: { remoteAddress: '127.0.0.1' },
      cookies: options.cookies || {},
      body: options.body || {}
    };

    if (options.cookies && !req.headers.cookie) {
      req.headers.cookie = Object.entries(options.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    }

    const resHeaders = {};
    let statusCode = 200;

    const res = {
      statusCode: 200,
      cookiesSent: [],
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      setHeader(name, val) {
        resHeaders[name.toLowerCase()] = val;
      },
      getHeader(name) {
        return resHeaders[name.toLowerCase()];
      },
      set(name, val) {
        if (typeof name === 'object') {
          Object.entries(name).forEach(([k, v]) => {
            resHeaders[k.toLowerCase()] = v;
          });
        } else {
          resHeaders[name.toLowerCase()] = val;
        }
      },
      cookie(name, val, opts) {
        this.cookiesSent.push({ name, val, opts });
        this.setHeader(
          'set-cookie',
          `${name}=${val}; Path=${opts?.path || '/'}; SameSite=${opts?.sameSite || 'Lax'}${opts?.httpOnly ? '; HttpOnly' : ''}`
        );
      },
      clearCookie(name, opts) {
        this.cookiesSent.push({ name, val: '', opts, cleared: true });
        this.setHeader(
          'set-cookie',
          `${name}=; Path=${opts?.path || '/'}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      },
      json(data) {
        resolve({ statusCode, headers: resHeaders, body: data, cookiesSent: this.cookiesSent });
      },
      send(data) {
        resolve({ statusCode, headers: resHeaders, body: data, cookiesSent: this.cookiesSent });
      },
      end() {
        resolve({ statusCode, headers: resHeaders, body: '', cookiesSent: this.cookiesSent });
      }
    };

    app(req, res);
  });
}

async function runAuditTests() {
  // Test 1: Direct GET /api/site-settings
  const r1 = await simulateRequest({ url: '/api/site-settings' });
  assert.strictEqual(r1.statusCode, 200, 'Direct /api/site-settings must return 200');
  assert.ok(typeof r1.body.version === 'number', 'Response must include numeric version');
  assert.ok(r1.body.global && typeof r1.body.global === 'object', 'Response must include global settings');
  assert.strictEqual(r1.body.hash, undefined, 'Must NEVER expose password hash');
  assert.strictEqual(r1.body.sessionSecret, undefined, 'Must NEVER expose session secret');
  console.log('  ✓ Direct /api/site-settings returns 200 with sanitized public settings');

  // Test 2: Vercel rewrite with query.path = "site-settings"
  const r2 = await simulateRequest({ url: '/api/index.js', query: { path: 'site-settings' } });
  assert.strictEqual(r2.statusCode, 200, 'Rewritten /api/site-settings must return 200');
  assert.strictEqual(r2.body.version, r1.body.version, 'Versions must match between direct and rewritten route');
  console.log('  ✓ Vercel rewrite with string query.path="site-settings" normalized correctly');

  // Test 3: Vercel rewrite with query.path = ["site-settings"]
  const r3 = await simulateRequest({ url: '/api/index.js', query: { path: ['site-settings'] } });
  assert.strictEqual(r3.statusCode, 200, 'Rewritten array path must return 200');
  console.log('  ✓ Vercel rewrite with array query.path=["site-settings"] normalized correctly');

  // Test 4: Root /api and /api/index.js health handler
  const r4 = await simulateRequest({ url: '/api' });
  assert.strictEqual(r4.statusCode, 200, '/api root must return 200');
  assert.strictEqual(r4.body.status, 'ok');
  console.log('  ✓ Root /api endpoint returns 200 OK');

  // Test 5: Unknown GET route returns JSON 404
  const r5 = await simulateRequest({ url: '/api/nonexistent-route' });
  assert.strictEqual(r5.statusCode, 404, 'Unknown GET /api/* route must return 404');
  assert.strictEqual(r5.body.error, 'API route not found');
  console.log('  ✓ Unknown GET /api/* route returns clean JSON 404');

  // Test 6: Unknown POST route returns JSON 404 (not HTML)
  const r6 = await simulateRequest({ method: 'POST', url: '/api/nonexistent-route' });
  assert.strictEqual(r6.statusCode, 404, 'Unknown POST /api/* route must return 404');
  assert.strictEqual(r6.body.error, 'API route not found');
  console.log('  ✓ Unknown POST /api/* route returns clean JSON 404');

  // Test 7: Unknown DELETE route returns JSON 404
  const r7 = await simulateRequest({ method: 'DELETE', url: '/api/sub/nonexistent' });
  assert.strictEqual(r7.statusCode, 404, 'Unknown DELETE /api/* route must return 404');
  assert.strictEqual(r7.body.error, 'API route not found');
  console.log('  ✓ Unknown DELETE /api/* route returns clean JSON 404');

  // Test 8: Unauthenticated access to /api/admin/settings strictly rejected with 401
  const r8 = await simulateRequest({ url: '/api/admin/settings' });
  assert.strictEqual(r8.statusCode, 401, 'Unauthenticated /api/admin/settings must return 401');
  assert.strictEqual(r8.body.error, 'Unauthorized');
  console.log('  ✓ Unauthenticated admin settings request strictly rejected with 401 Unauthorized');

  // Test 9: Cross-origin state modification from untrusted origin strictly rejected with 403
  const r9 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: { origin: 'https://evil-attacker-site.com', host: 'localhost' },
    body: { password: 'test' }
  });
  assert.strictEqual(r9.statusCode, 403, 'Cross-origin state-changing request from untrusted origin must return 403');
  assert.strictEqual(r9.body.error, 'Forbidden');
  console.log('  ✓ Cross-origin state modification from untrusted origin strictly rejected with 403 Forbidden');

  // Test 10: Bundled site settings fallback sanity check
  const fallbackSettings = getSiteSettings();
  assert.ok(fallbackSettings.version >= 26, 'Initial site settings must be at least version 26');
  console.log(`  ✓ Bundled initial settings loaded cleanly: version ${fallbackSettings.version}`);

  // Test 11: Direct and Vercel rewritten GET /api/admin/session (unauthenticated)
  const r11 = await simulateRequest({ url: '/api/admin/session' });
  assert.strictEqual(r11.statusCode, 200, 'Direct /api/admin/session must return 200');
  assert.strictEqual(r11.body.authenticated, false, 'Unauthenticated session must return false');
  console.log('  ✓ Direct /api/admin/session returns 200 authenticated: false');

  const r12 = await simulateRequest({ url: '/api/index.js', query: { path: 'admin/session' } });
  assert.strictEqual(r12.statusCode, 200, 'Rewritten string /api/admin/session must return 200');
  assert.strictEqual(r12.body.authenticated, false);
  console.log('  ✓ Vercel rewrite with string query.path="admin/session" returns 200 authenticated: false');

  const r13 = await simulateRequest({ url: '/api/index.js', query: { path: ['admin', 'session'] } });
  assert.strictEqual(r13.statusCode, 200, 'Rewritten array /api/admin/session must return 200');
  assert.strictEqual(r13.body.authenticated, false);
  console.log('  ✓ Vercel rewrite with array query.path=["admin", "session"] returns 200 authenticated: false');

  // Test 14: Unmatched POST /api returns clean JSON 404 (does not fall through to HTML)
  const r14 = await simulateRequest({ method: 'POST', url: '/api' });
  assert.strictEqual(r14.statusCode, 404, 'Unmatched POST /api must return 404');
  assert.strictEqual(r14.body.error, 'API route not found');
  console.log('  ✓ Unmatched POST /api returns clean JSON 404');

  // Test 15: Unmatched /admin routes return clean JSON 404 (never HTML index)
  const r15 = await simulateRequest({ method: 'GET', url: '/admin/unknown-route' });
  assert.strictEqual(r15.statusCode, 404, 'Unmatched GET /admin/* must return 404');
  assert.strictEqual(r15.body.error, 'API route not found');
  console.log('  ✓ Unmatched GET /admin/* returns clean JSON 404');

  const r15b = await simulateRequest({ method: 'POST', url: '/admin/unknown-route' });
  assert.strictEqual(r15b.statusCode, 404, 'Unmatched POST /admin/* must return 404');
  assert.strictEqual(r15b.body.error, 'API route not found');
  console.log('  ✓ Unmatched POST /admin/* returns clean JSON 404');

  // Setup dynamic credentials for Auth and Session lifecycle verification
  const originalHash = process.env.ADMIN_PASSWORD_HASH;
  const originalSecret = process.env.SESSION_SECRET;
  const originalEnv = process.env.NODE_ENV;

  try {
    const testPassword = 'AuditTestPassword!2026';
    const testHash = await bcrypt.hash(testPassword, 10);
    process.env.ADMIN_PASSWORD_HASH = testHash;
    process.env.SESSION_SECRET = 'audit_session_secret_cryptographically_secure_min_32_bytes!';

    // Test 16: Rejected login with invalid credentials
    const r16 = await simulateRequest({
      method: 'POST',
      url: '/api/admin/login',
      headers: { origin: 'http://localhost:5173' },
      body: { password: 'incorrect_password_attempt' }
    });
    assert.strictEqual(r16.statusCode, 401, 'Invalid password must return 401');
    assert.strictEqual(r16.body.error, 'Invalid password. Please try again.');
    console.log('  ✓ Rejected login with invalid credentials returns 401');

    // Test 17: Successful login with valid credentials (and Vercel rewrite)
    const r17 = await simulateRequest({
      method: 'POST',
      url: '/api/index.js',
      query: { path: 'admin/login' },
      headers: { origin: 'http://localhost:5173' },
      body: { password: testPassword }
    });
    assert.strictEqual(r17.statusCode, 200, 'Valid login via Vercel rewrite must return 200');
    assert.strictEqual(r17.body.authenticated, true);
    assert.ok(r17.cookiesSent.length > 0, 'Login response must set cookie');
    const sessionCookieObj = r17.cookiesSent.find((c) => c.name === SESSION_COOKIE_NAME);
    assert.ok(sessionCookieObj, 'Login must set admin_session_token cookie');
    assert.strictEqual(sessionCookieObj.opts.httpOnly, true, 'Session cookie must have HttpOnly: true');
    assert.strictEqual(sessionCookieObj.opts.sameSite, 'lax', 'Session cookie must have SameSite: lax');
    const token = sessionCookieObj.val;
    console.log('  ✓ Successful login via Vercel rewrite sets secure HttpOnly session cookie');

    // Test 18: Admin session retrieval with active session token
    const r18 = await simulateRequest({
      url: '/api/admin/session',
      cookies: { [SESSION_COOKIE_NAME]: token }
    });
    assert.strictEqual(r18.statusCode, 200);
    assert.strictEqual(r18.body.authenticated, true, 'Active session must be recognized as authenticated: true');
    console.log('  ✓ Admin session retrieval with active token returns authenticated: true');

    // Test 19: Logout revokes session and clears cookie
    const r19 = await simulateRequest({
      method: 'POST',
      url: '/api/admin/logout',
      cookies: { [SESSION_COOKIE_NAME]: token },
      headers: { origin: 'http://localhost:5173' }
    });
    assert.strictEqual(r19.statusCode, 200);
    assert.strictEqual(r19.body.authenticated, false);
    const clearedCookieObj = r19.cookiesSent.find((c) => c.name === SESSION_COOKIE_NAME);
    assert.ok(clearedCookieObj?.cleared, 'Logout must clear admin_session_token cookie');
    console.log('  ✓ Admin logout successfully revokes session and clears browser cookie');

    // Test 20: Post-logout session retrieval fails
    const r20 = await simulateRequest({
      url: '/api/admin/session',
      cookies: { [SESSION_COOKIE_NAME]: token }
    });
    assert.strictEqual(r20.statusCode, 200);
    assert.strictEqual(r20.body.authenticated, false, 'Revoked session must return authenticated: false');
    console.log('  ✓ Session retrieval with revoked token correctly returns authenticated: false');

    // Test 21: Missing ADMIN_PASSWORD_HASH in production mode returns intentional 503
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_PASSWORD_HASH;
    const r21 = await simulateRequest({
      method: 'POST',
      url: '/api/admin/login',
      headers: { origin: 'http://localhost:5173' },
      body: { password: testPassword }
    });
    assert.strictEqual(r21.statusCode, 503, 'Missing hash in production must return 503 Service Unavailable');
    assert.strictEqual(r21.body.error, 'Service Unavailable');
    console.log('  ✓ Missing ADMIN_PASSWORD_HASH in production returns intentional 503 Service Unavailable');

    // Test 22: Missing SESSION_SECRET in production mode returns intentional 503
    process.env.ADMIN_PASSWORD_HASH = testHash;
    delete process.env.SESSION_SECRET;
    const r22 = await simulateRequest({
      method: 'POST',
      url: '/api/admin/login',
      headers: { origin: 'http://localhost:5173' },
      body: { password: testPassword }
    });
    assert.strictEqual(r22.statusCode, 503, 'Missing SESSION_SECRET in production must return 503 Service Unavailable');
    assert.strictEqual(r22.body.error, 'Service Unavailable');
    console.log('  ✓ Missing SESSION_SECRET in production returns intentional 503 Service Unavailable');
  } finally {
    process.env.ADMIN_PASSWORD_HASH = originalHash;
    process.env.SESSION_SECRET = originalSecret;
    process.env.NODE_ENV = originalEnv;
  }

  // Test 23: Local API proxy connectivity verification
  const backend = http.createServer((req, res) => {
    if (req.url === '/api/admin/session') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ authenticated: false, proxyVerified: true }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
  const backendPort = backend.address().port;

  const vite = await createViteServer({
    server: {
      port: 0,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    }
  });

  await vite.listen();
  const vitePort = vite.config.server.port;

  try {
    const proxyRes = await fetch(`http://localhost:${vitePort}/api/admin/session`);
    assert.strictEqual(proxyRes.status, 200, 'Vite proxy request must return 200');
    const proxyData = await proxyRes.json();
    assert.strictEqual(proxyData.proxyVerified, true, 'Vite proxy must route request to backend');
    console.log('  ✓ Local Vite dev server proxy connectivity verified successfully');
  } finally {
    await vite.close();
    backend.close();
  }

  console.log('\n========================================================================');
  console.log('✅ ALL VERCEL PRODUCTION ROUTING & SECURITY AUDIT TESTS PASSED!');
  console.log('========================================================================\n');
}

runAuditTests().catch((err) => {
  console.error('[AUDIT TEST FAILURE]', err);
  process.exit(1);
});

