/**
 * session_revocation_and_lock.test.js
 * Comprehensive regression tests for:
 * 1. Session Revocation Failure during Logout (KV timeout, 500, malformed, cookie clearing, fail-closed)
 * 2. Distributed Lock Ownership Verification (atomic Lua compare-and-delete, wrong token, expired lock, contention)
 *
 * NOTE: These tests use an in-memory mock of the Upstash Redis / Vercel KV REST API.
 * The mock implements the exact REST protocol (including EVAL Lua compare-and-delete).
 * To test against a real Upstash / Vercel KV provider, set KV_REST_API_URL and KV_REST_API_TOKEN.
 */

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD_HASH = '$2a$12$e80yvE4.zO5qIek1d22kueFmQ9z3zFwXQY64e1yS9Y9N4H0d9sO9.'; // Valid bcrypt hash for test
process.env.SESSION_SECRET = 'test_secure_session_secret_at_least_32_characters_long_for_regression_tests';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFile = path.resolve(__dirname, '../data/site-settings.json');
const backupFile = path.resolve(__dirname, '../data/site-settings.backup.json');

const originalSettingsRaw = fs.existsSync(settingsFile) ? fs.readFileSync(settingsFile, 'utf8') : null;
const originalBackupRaw = fs.existsSync(backupFile) ? fs.readFileSync(backupFile, 'utf8') : null;

function restoreDataFiles() {
  try {
    if (originalSettingsRaw) fs.writeFileSync(settingsFile, originalSettingsRaw, 'utf8');
    if (originalBackupRaw) fs.writeFileSync(backupFile, originalBackupRaw, 'utf8');
  } catch {}
}

console.log('🧪 Starting Session Revocation & Distributed Lock Ownership Regression Tests...\n');

// ---------------------------------------------------------------------------
// In-Memory Mock Upstash / Vercel KV REST API Server
// ---------------------------------------------------------------------------
const kvStorage = new Map();
let mockServerMode = 'normal'; // 'normal' | '500' | 'timeout' | 'malformed' | 'setFail'

const mockKVServer = http.createServer((req, res) => {
  if (mockServerMode === '500') {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Mock KV Internal Server Error 500' }));
    return;
  }

  if (mockServerMode === 'timeout') {
    // Delay beyond the 3500ms client timeout to trigger AbortController abort
    setTimeout(() => {
      if (!res.writableEnded) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: 'OK' }));
      }
    }, 4200);
    return;
  }

  if (mockServerMode === 'malformed') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><head><title>502 Bad Gateway</title></head><body>Non-JSON upstream response</body></html>');
    return;
  }

  const auth = req.headers['authorization'];
  if (auth !== 'Bearer test-regression-token') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized mock KV access' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      const command = JSON.parse(body);
      const action = String(command[0]).toUpperCase();

      if (mockServerMode === 'setFail' && action === 'SET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: null }));
        return;
      }

      if (action === 'GET') {
        const key = command[1];
        const val = kvStorage.has(key) ? kvStorage.get(key) : null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: val }));
      } else if (action === 'SET') {
        const key = command[1];
        const val = command[2];
        const isNx = command.includes('NX');

        if (isNx && kvStorage.has(key)) {
          // Key already exists, NX condition fails
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: null }));
          return;
        }

        kvStorage.set(key, val);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: 'OK' }));
      } else if (action === 'DEL') {
        const key = command[1];
        const existed = kvStorage.delete(key);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: existed ? 1 : 0 }));
      } else if (action === 'EVAL') {
        // command: ['EVAL', script, 1, key, expectedToken]
        const key = command[3];
        const expectedToken = command[4];
        const currentVal = kvStorage.has(key) ? kvStorage.get(key) : null;

        // Atomic compare-and-delete: only delete if current stored token matches
        if (currentVal !== null && String(currentVal) === String(expectedToken)) {
          kvStorage.delete(key);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: 1 }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: 0 }));
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Mock KV unsupported command: ${action}` }));
      }
    } catch (parseErr) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: parseErr.message }));
    }
  });
});

mockKVServer.listen(0, '127.0.0.1', async () => {
  const kvPort = mockKVServer.address().port;
  process.env.KV_REST_API_URL = `http://127.0.0.1:${kvPort}`;
  process.env.KV_REST_API_TOKEN = 'test-regression-token';

  // Import application and modules after setting environment
  const { default: app } = await import('../index.js');
  const { createSession, verifySessionTokenAsync, SESSION_COOKIE_NAME } = await import('../middleware/auth.js');
  const { kvStore, isSharedKVConfigured } = await import('../services/kvStore.js');
  const { saveSiteSettings, getSiteSettingsAsync } = await import('../services/settingsStore.js');

  const appServer = http.createServer(app);

  appServer.listen(0, '127.0.0.1', async () => {
    const appPort = appServer.address().port;
    const API_BASE = `http://127.0.0.1:${appPort}`;

    try {
      assert.strictEqual(isSharedKVConfigured(), true, 'Shared KV must be recognized as configured');
      console.log('  [Configuration] Mock KV REST server running on port', kvPort);
      console.log('  [Configuration] Express app server running on port', appPort);

      // =======================================================================
      // PART 1: SESSION REVOCATION REGRESSION TESTS
      // =======================================================================
      console.log('\n--- Section 1: Session Revocation Tests ---');

      // Test 1.1: Successful logout invalidates the session
      console.log('\n  [Test 1.1] Successful logout invalidates the session');
      const token1 = createSession();
      const dotIndex1 = token1.lastIndexOf('.');
      const payload1 = JSON.parse(Buffer.from(token1.substring(0, dotIndex1), 'base64url').toString('utf8'));

      const logoutRes1 = await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token1}`,
          Origin: 'http://127.0.0.1:5173'
        }
      });
      assert.strictEqual(logoutRes1.status, 200, 'Logout with healthy KV must return 200 OK');
      const logoutBody1 = await logoutRes1.json();
      assert.strictEqual(logoutBody1.success, true);
      assert.strictEqual(logoutBody1.authenticated, false);

      const cookieHeader1 = logoutRes1.headers.get('set-cookie');
      assert.ok(cookieHeader1, 'Set-Cookie header must be present on logout');
      assert.ok(cookieHeader1.includes(`${SESSION_COOKIE_NAME}=;`), 'Cookie must be cleared');
      assert.ok(cookieHeader1.toLowerCase().includes('httponly'), 'Cookie must preserve HttpOnly');
      assert.ok(cookieHeader1.toLowerCase().includes('samesite=lax'), 'Cookie must preserve SameSite=Lax');

      // Verify session was revoked in KV
      const isRevokedInKV1 = kvStorage.get(`revoked_session:${payload1.id}`);
      assert.strictEqual(Number(isRevokedInKV1), 1, 'Revoked session ID must be stored in shared KV');

      // Subsequent verification of the revoked session must return false
      const checkRevoked1 = await verifySessionTokenAsync(token1);
      assert.strictEqual(checkRevoked1, false, 'Revoked token must fail asynchronous verification');
      console.log('    ✓ Successful logout invalidated session in KV and returned 200 with cleared cookie');

      // Test 1.2: KV timeout during revocation produces a controlled failure (503) and clears cookie
      console.log('\n  [Test 1.2] KV timeout during revocation produces controlled 503 failure and clears cookie');
      mockServerMode = 'timeout';
      const tokenTimeout = createSession();

      const startTimeTimeout = Date.now();
      const logoutResTimeout = await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${tokenTimeout}`,
          Origin: 'http://127.0.0.1:5173'
        }
      });
      const elapsedTimeout = Date.now() - startTimeTimeout;

      assert.strictEqual(logoutResTimeout.status, 503, 'KV timeout during logout MUST return 503 Service Unavailable');
      const timeoutBody = await logoutResTimeout.json();
      assert.strictEqual(timeoutBody.success, false, 'Must not claim success');
      assert.strictEqual(timeoutBody.code, 'REVOCATION_FAILED', 'Must report REVOCATION_FAILED code');

      // Browser cookie MUST still be cleared even when server-side revocation fails
      const cookieHeaderTimeout = logoutResTimeout.headers.get('set-cookie');
      assert.ok(cookieHeaderTimeout, 'Set-Cookie header must be present even when logout fails');
      assert.ok(cookieHeaderTimeout.includes(`${SESSION_COOKIE_NAME}=;`), 'Browser cookie must be cleared on failure');
      assert.ok(cookieHeaderTimeout.toLowerCase().includes('httponly'), 'Cleared cookie must preserve HttpOnly');
      assert.ok(elapsedTimeout >= 3400, `Must respect timeout threshold (~${elapsedTimeout}ms)`);
      console.log(`    ✓ Timeout handled safely in ${elapsedTimeout}ms: returned 503 REVOCATION_FAILED and cleared browser cookie`);
      mockServerMode = 'normal';

      // Test 1.3: KV HTTP 500 during revocation produces controlled failure (503) and clears cookie
      console.log('\n  [Test 1.3] KV HTTP 500 during revocation produces controlled 503 failure and clears cookie');
      mockServerMode = '500';
      const token500 = createSession();

      const logoutRes500 = await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token500}`,
          Origin: 'http://127.0.0.1:5173'
        }
      });
      assert.strictEqual(logoutRes500.status, 503, 'KV HTTP 500 during logout MUST return 503 Service Unavailable');
      const body500 = await logoutRes500.json();
      assert.strictEqual(body500.success, false);
      assert.strictEqual(body500.code, 'REVOCATION_FAILED');

      const cookieHeader500 = logoutRes500.headers.get('set-cookie');
      assert.ok(cookieHeader500, 'Set-Cookie header must be present on 500 failure');
      assert.ok(cookieHeader500.includes(`${SESSION_COOKIE_NAME}=;`), 'Cookie must be cleared');
      console.log('    ✓ KV 500 handled safely: returned 503 REVOCATION_FAILED and cleared browser cookie');
      mockServerMode = 'normal';

      // Test 1.4: Malformed KV responses during revocation are handled safely
      console.log('\n  [Test 1.4] Malformed KV response during revocation handled safely');
      mockServerMode = 'malformed';
      const tokenMalformed = createSession();

      const logoutResMalformed = await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${tokenMalformed}`,
          Origin: 'http://127.0.0.1:5173'
        }
      });
      assert.strictEqual(logoutResMalformed.status, 503, 'Malformed KV response during logout MUST return 503');
      const bodyMalformed = await logoutResMalformed.json();
      assert.strictEqual(bodyMalformed.code, 'REVOCATION_FAILED');
      assert.strictEqual(bodyMalformed.success, false);

      const cookieHeaderMalformed = logoutResMalformed.headers.get('set-cookie');
      assert.ok(cookieHeaderMalformed.includes(`${SESSION_COOKIE_NAME}=;`), 'Cookie must be cleared on malformed KV response');
      console.log('    ✓ Malformed KV response handled safely without crash: returned 503 and cleared browser cookie');
      mockServerMode = 'normal';

      // Test 1.5: A failed revocation never causes application to accept session through local-only fallback
      console.log('\n  [Test 1.5] Failed revocation never accepts session through local fallback');
      mockServerMode = '500';
      const unrevokedToken = createSession();

      // Attempting to verify this unrevoked token when KV is down MUST FAIL CLOSED
      let failClosedErrorThrown = false;
      try {
        await verifySessionTokenAsync(unrevokedToken);
      } catch (err) {
        failClosedErrorThrown = true;
        assert.strictEqual(err.code, 'KV_UNAVAILABLE', 'Must throw KV_UNAVAILABLE error');
      }
      assert.strictEqual(failClosedErrorThrown, true, 'verifySessionTokenAsync must fail closed');

      // GET /api/admin/session when KV is down MUST return 503 AUTH_STORE_UNAVAILABLE, not 200 { authenticated: true }
      const sessionRes500 = await fetch(`${API_BASE}/api/admin/session`, {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${unrevokedToken}` }
      });
      assert.strictEqual(sessionRes500.status, 503, 'Session endpoint must return 503 when KV is down');
      const sessionBody500 = await sessionRes500.json();
      assert.strictEqual(sessionBody500.authenticated, false, 'Must not claim authenticated: true');
      assert.strictEqual(sessionBody500.code, 'AUTH_STORE_UNAVAILABLE');
      console.log('    ✓ Session verification strictly fails closed (503) without accepting unverified tokens');
      mockServerMode = 'normal';

      // Test 1.6: Browser cookie cleared with existing secure attributes preserved
      console.log('\n  [Test 1.6] Cookie clearing preserves existing attributes');
      const logoutEmptyRes = await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: { Origin: 'http://127.0.0.1:5173' }
      });
      assert.strictEqual(logoutEmptyRes.status, 200);
      const clearCookieAttr = logoutEmptyRes.headers.get('set-cookie');
      assert.ok(clearCookieAttr.toLowerCase().includes('path=/'), 'Path must be /');
      assert.ok(clearCookieAttr.toLowerCase().includes('httponly'), 'HttpOnly must be set');
      assert.ok(clearCookieAttr.toLowerCase().includes('samesite=lax'), 'SameSite=Lax must be set');
      console.log('    ✓ Cookie security attributes (Path, HttpOnly, SameSite) verified on logout');

      // Test 1.7: Existing login and verification behavior remains intact
      console.log('\n  [Test 1.7] Existing authentication behavior remains intact');
      const freshToken = createSession();
      const freshValid = await verifySessionTokenAsync(freshToken);
      assert.strictEqual(freshValid, true, 'Fresh token verifies successfully');

      const expiredPayload = { id: 'expired_123', iat: Date.now() - 100000, exp: Date.now() - 50000 };
      const expB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const expSig = (await import('crypto')).default.createHmac('sha256', process.env.SESSION_SECRET).update(expB64).digest('hex');
      const expiredToken = `${expB64}.${expSig}`;
      const expiredValid = await verifySessionTokenAsync(expiredToken);
      assert.strictEqual(expiredValid, false, 'Expired token is rejected');
      console.log('    ✓ Normal session creation and cryptographic validation remain fully intact');


      // =======================================================================
      // PART 2: DISTRIBUTED LOCK OWNERSHIP VERIFICATION REGRESSION TESTS
      // =======================================================================
      console.log('\n--- Section 2: Distributed Lock Ownership Tests ---');

      // Test 2.1: The correct owner can release its lock
      console.log('\n  [Test 2.1] Correct owner can release its lock');
      const lockKey1 = 'lock:unit_test_resource_1';
      const tokenOwner1 = await kvStore.acquireLock(lockKey1, 5);
      assert.ok(tokenOwner1, 'Owner 1 must acquire lock');
      assert.strictEqual(kvStorage.get(lockKey1), tokenOwner1, 'Stored lock token must match');

      const released1 = await kvStore.releaseLock(lockKey1, tokenOwner1);
      assert.strictEqual(released1, true, 'Correct owner must successfully release lock');
      assert.strictEqual(kvStorage.has(lockKey1), false, 'Lock key must be removed from KV');
      console.log('    ✓ Correct owner released lock atomically via Lua compare-and-delete');

      // Test 2.2: An incorrect token cannot release a lock
      console.log('\n  [Test 2.2] Incorrect token cannot release a lock');
      const lockKey2 = 'lock:unit_test_resource_2';
      const legitimateToken = await kvStore.acquireLock(lockKey2, 5);
      assert.ok(legitimateToken);

      const attackerReleaseAttempt = await kvStore.releaseLock(lockKey2, 'forged_or_wrong_token_999');
      assert.strictEqual(attackerReleaseAttempt, false, 'Release with wrong token must return false');
      assert.strictEqual(kvStorage.get(lockKey2), legitimateToken, 'Lock key must NOT be deleted');

      // Clean up with legitimate token
      const legitRelease = await kvStore.releaseLock(lockKey2, legitimateToken);
      assert.strictEqual(legitRelease, true, 'Legitimate token can clean up lock');
      console.log('    ✓ Incorrect token was rejected and could not release the lock');

      // Test 2.3: Expired lock cannot be released by former owner if another owner acquired it
      console.log('\n  [Test 2.3] Former owner cannot release expired lock after re-acquisition');
      const lockKey3 = 'lock:unit_test_resource_3';
      const formerOwnerToken = await kvStore.acquireLock(lockKey3, 5);

      // Simulate lock expiry and acquisition by a second owner
      const newOwnerToken = 'new_owner_token_abc_789';
      kvStorage.set(lockKey3, newOwnerToken);

      // Former owner tries to release lock with its old token
      const formerReleaseAttempt = await kvStore.releaseLock(lockKey3, formerOwnerToken);
      assert.strictEqual(formerReleaseAttempt, false, 'Former owner must NOT be able to release re-acquired lock');
      assert.strictEqual(kvStorage.get(lockKey3), newOwnerToken, 'New owner lock must remain untouched in KV');

      // New owner releases its own lock
      const newOwnerRelease = await kvStore.releaseLock(lockKey3, newOwnerToken);
      assert.strictEqual(newOwnerRelease, true, 'New owner successfully releases its lock');
      console.log('    ✓ Former owner could not delete lock belonging to new owner');

      // Test 2.4: Two concurrent settings updates cannot release each other\'s locks
      console.log('\n  [Test 2.4] Concurrent settings updates do not interfere with lock ownership');
      const [resSaveA, resSaveB] = await Promise.all([
        saveSiteSettings({ global: { customThemeName: 'Theme Alpha' } }, 'admin_A'),
        saveSiteSettings({ global: { customBackgroundName: 'BG Beta' } }, 'admin_B')
      ]);
      assert.ok(resSaveA && resSaveB, 'Both updates succeed without lock collision');
      const finalSettings = await getSiteSettingsAsync();
      assert.strictEqual(finalSettings.global.customBackgroundName, 'BG Beta');
      console.log('    ✓ Concurrent updates serialized safely through atomic lock acquire/release');

      // Test 2.5: KV errors and lock contention handled without silently claiming successful update
      console.log('\n  [Test 2.5] Lock contention and KV errors fail safely without claiming false success');
      // Hold lock manually to force contention
      const contentionLockKey = 'lock:site_settings';
      kvStorage.set(contentionLockKey, 'blocking_holder_token');

      let contentionErrorThrown = false;
      try {
        await saveSiteSettings({ global: { theme: 'nature' } }, 'blocked_admin');
      } catch (err) {
        contentionErrorThrown = true;
        assert.strictEqual(err.code, 'CONCURRENT_UPDATE_CONFLICT', 'Must throw CONCURRENT_UPDATE_CONFLICT');
        assert.strictEqual(err.status, 409, 'Must return 409 Conflict status');
      }
      assert.strictEqual(contentionErrorThrown, true, 'Lock contention must reject save rather than overwriting');

      // Remove blocking lock
      kvStorage.delete(contentionLockKey);

      // Verify KV write error handling
      mockServerMode = '500';
      let kvWriteErrorThrown = false;
      try {
        await saveSiteSettings({ global: { theme: 'monochrome' } }, 'admin');
      } catch (err) {
        kvWriteErrorThrown = true;
        assert.strictEqual(err.code, 'KV_WRITE_FAILED', 'Must throw KV_WRITE_FAILED');
        assert.strictEqual(err.status, 503, 'Must return 503 Service Unavailable');
      }
      assert.strictEqual(kvWriteErrorThrown, true, 'KV error during write must fail closed');
      mockServerMode = 'normal';
      console.log('    ✓ Lock contention returns 409 and KV errors return 503 without false success reports');

      console.log('\n=======================================================');
      console.log('✅ ALL SESSION REVOCATION & DISTRIBUTED LOCK TESTS PASSED!');
      console.log('=======================================================\n');

      restoreDataFiles();
      appServer.close();
      mockKVServer.close();
      process.exit(0);
    } catch (testErr) {
      console.error('\n❌ Regression Test Failed:', testErr);
      restoreDataFiles();
      appServer.close();
      mockKVServer.close();
      process.exit(1);
    }
  });
});
