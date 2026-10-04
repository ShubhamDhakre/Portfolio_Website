import assert from 'assert';
import app from '../index.js';

console.log('🧪 Starting Security Headers & CORS Tests...');

// Helper to make simulated requests against Express app
function simulateRequest(options) {
  return new Promise((resolve) => {
    const req = {
      method: options.method || 'GET',
      url: options.url || '/api/health',
      path: options.url || '/api/health',
      headers: options.headers || {},
      socket: { remoteAddress: '127.0.0.1' },
      cookies: options.cookies || {}
    };

    const resHeaders = {};
    let statusCode = 200;
    let body = '';

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
        body = JSON.stringify(data);
        resolve({ statusCode, headers: resHeaders, body: data });
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

async function runTests() {
  // 1. Health check without origin header (same-origin / server-to-server)
  const r1 = await simulateRequest({ url: '/api/health' });
  assert.strictEqual(r1.statusCode, 200, 'Health check should return 200');
  assert.strictEqual(r1.headers['x-content-type-options'], 'nosniff', 'Must include nosniff header');
  assert.strictEqual(r1.headers['x-frame-options'], 'DENY', 'Must include DENY header');
  assert.strictEqual(r1.headers['referrer-policy'], 'strict-origin-when-cross-origin', 'Must include referrer policy');
  console.log('  ✓ Security headers verified (nosniff, X-Frame-Options, Referrer-Policy)');

  // 2. CORS check with allowed origin
  const r2 = await simulateRequest({
    url: '/api/health',
    headers: { origin: 'http://localhost:5173' }
  });
  assert.strictEqual(r2.statusCode, 200, 'Allowed origin should return 200');
  assert.strictEqual(r2.headers['access-control-allow-origin'], 'http://localhost:5173', 'Allowed origin must match');
  assert.strictEqual(r2.headers['access-control-allow-credentials'], 'true', 'Credentials header must be true for allowed origin');
  console.log('  ✓ Allowed origin (localhost:5173) accepted with credentials');

  // 3. CORS check with unauthorized origin
  const r3 = await simulateRequest({
    url: '/api/health',
    headers: { origin: 'https://malicious-attacker.evil' }
  });
  assert.strictEqual(r3.statusCode, 403, 'Unauthorized origin must be rejected with 403');
  assert.strictEqual(r3.headers['access-control-allow-origin'], undefined, 'Must not echo unauthorized origin');
  console.log('  ✓ Unauthorized origin (malicious-attacker.evil) rejected with 403 Forbidden');

  console.log('✅ ALL SECURITY HEADERS & CORS TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
