import assert from 'assert';

console.log('🧪 Starting Full E2E Admin Authentication Flow Test against live server...');

const API_BASE = 'http://localhost:3001';

async function testFullFlow() {
  // 1. Initial session check without cookie
  const res1 = await fetch(`${API_BASE}/api/admin/session`);
  const data1 = await res1.json();
  assert.strictEqual(data1.authenticated, false, 'Initial state should be unauthenticated');
  console.log('  ✓ Initial session check: unauthenticated (false)');

  // 2. Unauthorized settings attempt
  const res2 = await fetch(`${API_BASE}/api/admin/settings`);
  assert.strictEqual(res2.status, 401, 'Unauthenticated access to settings must return 401');
  console.log('  ✓ Unauthenticated access to /api/admin/settings rejected with 401');

  // 3. Login with wrong password
  const res3 = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong_password_123' })
  });
  assert.strictEqual(res3.status, 401, 'Wrong password must return 401');
  console.log('  ✓ Wrong password rejected with 401');

  // 4. Login with correct password
  const res4 = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Shubh@m2004' })
  });
  assert.strictEqual(res4.status, 200, 'Valid password must return 200');
  const cookieHeader = res4.headers.get('set-cookie');
  assert.ok(cookieHeader, 'Login response must set a cookie');
  const tokenMatch = cookieHeader.match(/admin_session_token=([^;]+)/);
  assert.ok(tokenMatch, 'Cookie header must contain admin_session_token');
  const sessionCookie = tokenMatch[0];
  console.log('  ✓ Valid password accepted with 200 OK and secure HttpOnly cookie set');

  // 5. Check session with cookie
  const res5 = await fetch(`${API_BASE}/api/admin/session`, {
    headers: { Cookie: sessionCookie }
  });
  const data5 = await res5.json();
  assert.strictEqual(data5.authenticated, true, 'Session with valid cookie must be authenticated');
  console.log('  ✓ Session check with cookie: authenticated (true)');

  // 6. Authorized settings fetch
  const res6 = await fetch(`${API_BASE}/api/admin/settings`, {
    headers: { Cookie: sessionCookie }
  });
  assert.strictEqual(res6.status, 200, 'Authenticated request to settings must return 200');
  const settingsData = await res6.json();
  assert.ok(settingsData.global, 'Settings response must contain global settings');
  console.log('  ✓ Authorized request to /api/admin/settings succeeded');

  // 7. Logout
  const res7 = await fetch(`${API_BASE}/api/admin/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie }
  });
  assert.strictEqual(res7.status, 200, 'Logout must return 200');
  const clearCookieHeader = res7.headers.get('set-cookie');
  assert.ok(clearCookieHeader, 'Logout must clear cookie');
  console.log('  ✓ Logout succeeded and cookie clearing header received');

  // 8. Subsequent check with the logged-out cookie MUST FAIL (revocation check)
  const res8 = await fetch(`${API_BASE}/api/admin/session`, {
    headers: { Cookie: sessionCookie }
  });
  const data8 = await res8.json();
  assert.strictEqual(data8.authenticated, false, 'Logged out session must not authenticate');
  console.log('  ✓ Post-logout session check: revoked cookie correctly returns authenticated: false');

  // 9. Subsequent settings access with logged-out cookie MUST BE REJECTED with 401
  const res9 = await fetch(`${API_BASE}/api/admin/settings`, {
    headers: { Cookie: sessionCookie }
  });
  assert.strictEqual(res9.status, 401, 'Revoked session cannot access protected settings');
  console.log('  ✓ Post-logout protected route access correctly rejected with 401 Unauthorized');

  console.log('✅ ALL E2E AUTHENTICATION FLOW TESTS PASSED!\n');
}

testFullFlow().catch((err) => {
  console.error('❌ E2E test failed:', err);
  process.exit(1);
});
