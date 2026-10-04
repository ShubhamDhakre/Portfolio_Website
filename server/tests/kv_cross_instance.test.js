import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSession, verifySessionTokenAsync, destroySession } from '../middleware/auth.js';
import { getSiteSettingsAsync, saveSiteSettings, invalidateSettingsCache } from '../services/settingsStore.js';
import { isSharedKVConfigured } from '../services/kvStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFile = path.resolve(__dirname, '../data/site-settings.json');
const backupFile = path.resolve(__dirname, '../data/site-settings.backup.json');

const originalSettingsRaw = fs.existsSync(settingsFile) ? fs.readFileSync(settingsFile, 'utf8') : null;
const originalBackupRaw = fs.existsSync(backupFile) ? fs.readFileSync(backupFile, 'utf8') : null;

console.log('🧪 Starting Comprehensive Cross-Instance KV Storage & Fail-Closed Regression Tests...');

// In-memory mock Upstash/Vercel KV REST Server
const kvStorage = new Map();
let mockServerMode = 'normal'; // 'normal' | '500' | 'timeout' | 'malformed' | 'setFail'

const mockServer = http.createServer((req, res) => {
  if (mockServerMode === '500') {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Mock KV Error' }));
    return;
  }

  if (mockServerMode === 'timeout') {
    // Intentionally delay longer than the 3500ms client timeout to trigger AbortError
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
    res.end('<html><head><title>502 Bad Gateway</title></head><body>Bad Gateway</body></html>');
    return;
  }

  // Check auth header
  const auth = req.headers['authorization'];
  if (auth !== 'Bearer test-mock-token') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
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
          // Key already exists, NX fails
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
        const script = command[1];
        const numKeys = Number(command[2]);

        // Case A: RENEW_LEASE_LUA: ['EVAL', script, 1, lockKey, lockToken, ttlSeconds]
        if (script && script.includes('expire') && !script.includes('del')) {
          const lockKey = command[3];
          const lockToken = command[4];
          const currentVal = kvStorage.has(lockKey) ? kvStorage.get(lockKey) : null;
          if (currentVal !== null && String(currentVal) === String(lockToken)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 1 }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 0 }));
          }
          return;
        }

        // Case B: ATOMIC_COMMIT_SETTINGS_LUA: ['EVAL', script, 2, settingsKey, lockKey, serializedDoc, lockToken, baseVersion]
        if (numKeys === 2) {
          const settingsKey = command[3];
          const lockKey = command[4];
          const serializedDoc = command[5];
          const lockToken = command[6];
          const baseVersion = command[7];

          // 1. Validate lockToken
          if (!lockToken || String(lockToken).trim() === '') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 'MISSING_LOCK_TOKEN' }));
            return;
          }

          // 2. Validate baseVersion
          if (baseVersion === undefined || baseVersion === null || String(baseVersion).trim() === '' || isNaN(Number(baseVersion))) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 'INVALID_EXPECTED_VERSION' }));
            return;
          }
          const expectedVer = Number(baseVersion);

          // 3. Check lock ownership
          const currentLock = kvStorage.has(lockKey) ? kvStorage.get(lockKey) : null;
          if (!currentLock || currentLock !== lockToken) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 'LOCK_LOST' }));
            return;
          }

          // 4. Stored document check
          if (!kvStorage.has(settingsKey)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 'DOCUMENT_MISSING' }));
            return;
          }

          const currentVal = kvStorage.get(settingsKey);
          let currentVer = null;
          if (typeof currentVal === 'object' && currentVal !== null && currentVal.version !== undefined) {
            currentVer = Number(currentVal.version);
          } else if (typeof currentVal === 'string') {
            try {
              const parsed = JSON.parse(currentVal);
              if (parsed && parsed.version !== undefined) {
                currentVer = Number(parsed.version);
              }
            } catch {
              const match = currentVal.match(/"version"\s*:\s*(\d+)/);
              if (match) currentVer = Number(match[1]);
            }
          }

          if (currentVer === null || isNaN(currentVer)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 'MALFORMED_STORED_SETTINGS' }));
            return;
          }

          if (currentVer !== expectedVer) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result: 'VERSION_CONFLICT' }));
            return;
          }

          let toStore = serializedDoc;
          if (typeof serializedDoc === 'string') {
            try { toStore = JSON.parse(serializedDoc); } catch {}
          }
          kvStorage.set(settingsKey, toStore);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: 'OK' }));
          return;
        }

        // Case C: COMPARE_AND_DELETE_LUA: ['EVAL', script, 1, key, expectedToken]
        const key = command[3];
        const expectedToken = command[4];
        const currentVal = kvStorage.has(key) ? kvStorage.get(key) : null;
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
        res.end(JSON.stringify({ error: `Unknown command: ${action}` }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

mockServer.listen(0, '127.0.0.1', async () => {
  const port = mockServer.address().port;
  process.env.KV_REST_API_URL = `http://127.0.0.1:${port}`;
  process.env.KV_REST_API_TOKEN = 'test-mock-token';

  function restoreFiles() {
    try {
      if (originalSettingsRaw) fs.writeFileSync(settingsFile, originalSettingsRaw, 'utf8');
      if (originalBackupRaw) fs.writeFileSync(backupFile, originalBackupRaw, 'utf8');
    } catch {}
  }

  try {
    assert.strictEqual(isSharedKVConfigured(), true, 'Shared KV must be recognized as configured');
    console.log('  ✓ Shared KV adapter configured and connected to mock endpoint');

    // -------------------------------------------------------------
    // PART 1: CROSS-INSTANCE SESSION REVOCATION (HAPPY PATH)
    // -------------------------------------------------------------
    console.log('\n  [Scenario A: Cross-Instance Session Revocation]');
    const token = createSession();
    assert.ok(token, 'Instance A must generate token');

    const initialCheck = await verifySessionTokenAsync(token);
    assert.strictEqual(initialCheck, true, 'Instance B verifies newly issued token as valid');

    await destroySession(token);
    console.log('    ✓ Instance A executes logout and broadcasts revocation to shared KV');

    const crossInstanceCheck = await verifySessionTokenAsync(token);
    assert.strictEqual(crossInstanceCheck, false, 'Instance B rejects token revoked in shared KV');
    console.log('    ✓ Instance B queries shared KV, detects revocation, and REJECTS revoked token');

    // -------------------------------------------------------------
    // PART 2: CROSS-INSTANCE SETTINGS PERSISTENCE (HAPPY PATH)
    // -------------------------------------------------------------
    console.log('\n  [Scenario B: Cross-Instance Dynamic Settings Persistence]');
    const updatedSettings = await saveSiteSettings({
      global: {
        theme: 'aurora',
        performanceMode: 'EXTREME_QUALITY'
      },
      content: {
        developerNote: 'Cross-instance sync verified.'
      }
    }, 'admin_instance_A');

    assert.strictEqual(updatedSettings.global.theme, 'aurora');
    assert.strictEqual(kvStorage.has('site_settings'), true, 'Site settings must be written to shared KV');

    const fetchedOnInstanceB = await getSiteSettingsAsync();
    assert.strictEqual(fetchedOnInstanceB.global.theme, 'aurora', 'Instance B receives theme updated by Instance A');
    console.log('    ✓ Instance B fetches and synchronizes updated settings directly from shared KV');

    // -------------------------------------------------------------
    // PART 3: FAIL-CLOSED ON KV HTTP 500 ERROR
    // -------------------------------------------------------------
    console.log('\n  [Scenario C: Fail-Closed on KV HTTP 500 Outage]');
    mockServerMode = '500';

    const testToken500 = createSession();
    // In production with authoritative KV, HTTP 500 MUST NEVER ACCEPT an unverified session
    let authError500Thrown = false;
    try {
      await verifySessionTokenAsync(testToken500);
    } catch (err) {
      authError500Thrown = true;
      assert.strictEqual(err.code, 'KV_UNAVAILABLE', 'Must throw KV_UNAVAILABLE error');
    }
    assert.strictEqual(authError500Thrown, true, 'Session verification MUST fail closed on KV 500 outage');
    console.log('    ✓ When KV returns HTTP 500, verifySessionTokenAsync fails closed with KV_UNAVAILABLE');

    // Settings read must NOT serve stale local settings as authoritative
    invalidateSettingsCache();
    let settingsRead500Thrown = false;
    try {
      await getSiteSettingsAsync({ forceRefresh: true });
    } catch (err) {
      settingsRead500Thrown = true;
      assert.strictEqual(err.code, 'KV_UNAVAILABLE');
    }
    assert.strictEqual(settingsRead500Thrown, true, 'getSiteSettingsAsync MUST fail closed on KV 500 outage');
    console.log('    ✓ When KV returns HTTP 500, getSiteSettingsAsync fails closed rather than serving stale defaults');

    // Settings write must fail closed and NOT report success
    let settingsWrite500Thrown = false;
    try {
      await saveSiteSettings({ global: { theme: 'minimal' } }, 'admin');
    } catch (err) {
      settingsWrite500Thrown = true;
      assert.strictEqual(err.code, 'KV_WRITE_FAILED');
    }
    assert.strictEqual(settingsWrite500Thrown, true, 'saveSiteSettings MUST reject update when KV write fails');
    console.log('    ✓ When KV returns HTTP 500, saveSiteSettings fails closed and does not report false success');

    mockServerMode = 'normal';

    // -------------------------------------------------------------
    // PART 4: FAIL-CLOSED ON MALFORMED / CORRUPTED RESPONSE
    // -------------------------------------------------------------
    console.log('\n  [Scenario D: Fail-Closed on Malformed KV Response]');
    mockServerMode = 'malformed';

    const testTokenMalformed = createSession();
    let malformedAuthThrown = false;
    try {
      await verifySessionTokenAsync(testTokenMalformed);
    } catch (err) {
      malformedAuthThrown = true;
      assert.strictEqual(err.code, 'KV_UNAVAILABLE');
    }
    assert.strictEqual(malformedAuthThrown, true, 'Session verification fails closed on malformed response');
    console.log('    ✓ When KV returns unparseable HTML/non-JSON, auth fails closed with KV_UNAVAILABLE');

    invalidateSettingsCache();
    let malformedSettingsThrown = false;
    try {
      await getSiteSettingsAsync({ forceRefresh: true });
    } catch (err) {
      malformedSettingsThrown = true;
      assert.strictEqual(err.code, 'KV_UNAVAILABLE');
    }
    assert.strictEqual(malformedSettingsThrown, true, 'Settings read fails closed on malformed response');
    console.log('    ✓ When KV returns malformed response, getSiteSettingsAsync fails closed without crashing');

    mockServerMode = 'normal';

    // -------------------------------------------------------------
    // PART 5: FAIL-CLOSED ON KV TIMEOUT
    // -------------------------------------------------------------
    console.log('\n  [Scenario E: Fail-Closed on KV Request Timeout (3.5s)]');
    mockServerMode = 'timeout';

    const testTokenTimeout = createSession();
    let timeoutThrown = false;
    const startTime = Date.now();
    try {
      await verifySessionTokenAsync(testTokenTimeout);
    } catch (err) {
      timeoutThrown = true;
      assert.strictEqual(err.code, 'KV_UNAVAILABLE');
    }
    const elapsed = Date.now() - startTime;
    assert.strictEqual(timeoutThrown, true, 'Must fail closed on timeout');
    assert.ok(elapsed >= 3400, `Must wait for timeout (elapsed: ${elapsed}ms)`);
    console.log(`    ✓ When KV hangs, request times out at ~${elapsed}ms and fails closed with KV_UNAVAILABLE`);

    mockServerMode = 'normal';

    // -------------------------------------------------------------
    // PART 6: CONCURRENT SETTINGS UPDATES & CONFLICT DETECTION
    // -------------------------------------------------------------
    console.log('\n  [Scenario F: Concurrent Updates & Optimistic Concurrency Control]');

    // Simultaneous updates using Promise.all: both should serialize and persist
    const [res1, res2] = await Promise.all([
      saveSiteSettings({ global: { customThemeName: 'Theme A' } }, 'admin_1'),
      saveSiteSettings({ global: { customBackgroundName: 'BG B' } }, 'admin_2')
    ]);

    assert.ok(res1 && res2, 'Both concurrent saves must complete successfully through sequential lock');
    const finalMerged = await getSiteSettingsAsync();
    assert.strictEqual(finalMerged.global.customBackgroundName, 'BG B', 'Final state must reflect sequential atomic writes');
    console.log('    ✓ Simultaneous concurrent writes cleanly serialized through distributed lock');

    // Optimistic concurrency conflict test: client passes outdated expectedVersion
    let conflictDetected = false;
    try {
      await saveSiteSettings({
        global: { theme: 'monochrome' },
        expectedVersion: 1 // Current version is much higher
      }, 'stale_client');
    } catch (err) {
      conflictDetected = true;
      assert.strictEqual(err.status, 409, 'Must return 409 status');
      assert.strictEqual(err.code, 'VERSION_CONFLICT', 'Must return VERSION_CONFLICT code');
    }
    assert.strictEqual(conflictDetected, true, 'Outdated expectedVersion must trigger HTTP 409 Conflict');
    console.log('    ✓ Stale update with outdated expectedVersion correctly rejected with 409 Conflict');

    // -------------------------------------------------------------
    // PART 7: LOCAL DEVELOPMENT FALLBACK (UNCONFIGURED KV)
    // -------------------------------------------------------------
    console.log('\n  [Scenario G: Local Development Fallback (Unconfigured KV)]');
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    assert.strictEqual(isSharedKVConfigured(), false, 'KV must be reported as unconfigured');

    const localFreshToken = createSession();
    const localAuthCheck = await verifySessionTokenAsync(localFreshToken);
    assert.strictEqual(localAuthCheck, true, 'Local auth verifies without KV');

    const localSettings = await getSiteSettingsAsync();
    assert.ok(localSettings && localSettings.global, 'Local settings load from JSON file without error');
    console.log('    ✓ When KV is unconfigured, system operates normally on local JSON files and memory');

    console.log('\n✅ ALL REGRESSION & FAIL-CLOSED TESTS PASSED!\n');
    restoreFiles();
    mockServer.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    restoreFiles();
    mockServer.close();
    process.exit(1);
  }
});
