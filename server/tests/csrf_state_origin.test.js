import assert from 'assert';

process.env.NODE_ENV = 'test';
process.env.VERCEL_PROJECT_PRODUCTION_URL = 'shubham-portfolio.vercel.app';
process.env.ALLOWED_ORIGINS = 'https://custom-domain.com';

import app, { getAllowedOrigins } from '../index.js';

console.log('🧪 Starting CORS Allowlist & CSRF Origin Validation Tests...');

// 1. Verify Allowed Origins Set
const allowed = getAllowedOrigins();
assert.ok(allowed.has('http://localhost:5173'), 'localhost:5173 must be allowed');
assert.ok(allowed.has('http://localhost:3000'), 'localhost:3000 must be allowed');
assert.ok(allowed.has('https://shubham-portfolio.vercel.app'), 'VERCEL_PROJECT_PRODUCTION_URL must be allowed');
assert.ok(allowed.has('https://custom-domain.com'), 'Custom domain from ALLOWED_ORIGINS must be allowed');
assert.strictEqual(allowed.has('https://attacker.vercel.app'), false, 'Arbitrary .vercel.app must NOT be allowed');
assert.strictEqual(allowed.has('https://phishing.com'), false, 'Arbitrary external origin must NOT be allowed');
console.log('  ✓ Allowed origins set correctly excludes arbitrary .vercel.app domains');

// Helper to make simulated requests against Express app
function simulateRequest(options) {
  return new Promise((resolve) => {
    const req = {
      method: options.method || 'GET',
      url: options.url || '/api/health',
      path: options.url || '/api/health',
      headers: options.headers || {},
      socket: { remoteAddress: '127.0.0.1' },
      cookies: options.cookies || {},
      body: options.body || {}
    };

    const resHeaders = {};
    let statusCode = 200;
    let body = null;

    const res = {
      statusCode: 200,
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
      json(data) {
        body = data;
        resolve({ statusCode, headers: resHeaders, body });
      },
      send(data) {
        body = data;
        resolve({ statusCode, headers: resHeaders, body });
      },
      end() {
        resolve({ statusCode, headers: resHeaders, body });
      }
    };

    app(req, res);
  });
}

async function runCSRFTests() {
  // 2. Reject POST request with unauthorized Origin
  const r1 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      origin: 'https://attacker.vercel.app',
      'content-type': 'application/json'
    },
    body: { password: 'test' }
  });
  assert.strictEqual(r1.statusCode, 403, 'POST from arbitrary vercel domain must be rejected with 403');
  assert.ok(r1.body?.message?.includes('not permitted') || r1.body?.message?.includes('CORS policy'), 'Rejection message expected');
  console.log('  ✓ State-changing POST from arbitrary vercel origin rejected with 403 Forbidden');

  // 3. Reject POST request with cross-site Sec-Fetch-Site
  const r2 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      origin: 'http://localhost:5173',
      'sec-fetch-site': 'cross-site',
      'content-type': 'application/json'
    },
    body: { password: 'test' }
  });
  assert.strictEqual(r2.statusCode, 403, 'POST with sec-fetch-site: cross-site must be rejected with 403');
  assert.ok(r2.body?.message?.includes('CSRF protection'), 'Must state CSRF protection triggered');
  console.log('  ✓ State-changing request with sec-fetch-site: cross-site blocked by CSRF defense');

  // 4. Accept state-changing request from legitimate authorized origin
  const r3 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      origin: 'http://localhost:5173',
      'sec-fetch-site': 'same-site',
      'content-type': 'application/json'
    },
    body: { password: 'invalid_password_to_check_auth_progression' }
  });
  assert.notStrictEqual(r3.statusCode, 403, 'Legitimate origin must not be blocked by CSRF or CORS');
  console.log('  ✓ Authorized origin passes CSRF/CORS filter and reaches application handler');

  // 5. Accept state-changing request from production domain
  const r4 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      origin: 'https://shubham-portfolio.vercel.app',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json'
    },
    body: { password: 'test' }
  });
  assert.notStrictEqual(r4.statusCode, 403, 'VERCEL_PROJECT_PRODUCTION_URL must be allowed');
  console.log('  ✓ VERCEL_PROJECT_PRODUCTION_URL exact match passes CSRF filter');

  // 6. Reject state-changing request with malformed Referer
  const r5 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      referer: 'not-a-valid-url-format',
      'content-type': 'application/json'
    },
    body: { password: 'test' }
  });
  assert.strictEqual(r5.statusCode, 403, 'Malformed referer must be rejected with 403');
  assert.ok(r5.body?.message?.includes('Malformed Referer'), 'Must specify malformed referer');
  console.log('  ✓ State-changing request with malformed Referer header rejected with 403 Forbidden');

  // 7. Reject state-changing request with Origin: null
  const r6 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      origin: 'null',
      'content-type': 'application/json'
    },
    body: { password: 'test' }
  });
  assert.strictEqual(r6.statusCode, 403, 'Origin null must be rejected with 403');
  console.log('  ✓ State-changing request with Origin "null" rejected with 403 Forbidden');

  // 8. Reject state-changing request with malformed/hostile origin URI
  const r7 = await simulateRequest({
    method: 'POST',
    url: '/api/admin/login',
    headers: {
      origin: 'javascript:alert(1)',
      'content-type': 'application/json'
    },
    body: { password: 'test' }
  });
  assert.strictEqual(r7.statusCode, 403, 'Malformed URI origin must be rejected with 403');
  console.log('  ✓ State-changing request with hostile/malformed URI origin rejected with 403 Forbidden');

  console.log('✅ ALL CORS & CSRF ORIGIN VALIDATION TESTS PASSED!\n');
}

runCSRFTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
