import assert from 'assert';
import crypto from 'crypto';
import {
  createSession,
  verifySessionToken,
  destroySession,
  isSessionRevoked,
  getSessionSecret
} from '../middleware/auth.js';

console.log('🧪 Starting Auth & Session Security Tests...');

// 1. Session secret check
const secret = getSessionSecret();
assert.ok(secret, 'Secret should be defined');
assert.ok(secret.length >= 32, 'Secret must be at least 32 characters');
console.log('  ✓ Session secret meets length requirements (>= 32 chars)');

// 2. Token generation and structure
const token = createSession();
assert.ok(token, 'Token must be generated');
const parts = token.split('.');
assert.strictEqual(parts.length, 2, 'Token must consist of payloadB64.signatureHex');
const [payloadB64, signature] = parts;
const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
assert.ok(payload.id, 'Payload must contain session id');
assert.ok(payload.iat, 'Payload must contain iat');
assert.ok(payload.exp, 'Payload must contain exp');
assert.ok(payload.exp > Date.now(), 'Token exp must be in future');
console.log('  ✓ Token format verified: payload contains id, iat, and future exp');

// 3. Valid token verification
const isValid = verifySessionToken(token);
assert.strictEqual(isValid, true, 'Valid token must verify as true');
console.log('  ✓ Valid session token verified successfully');

// 4. Forged signature rejection
const fakeSignature = crypto.randomBytes(32).toString('hex');
const forgedToken = `${payloadB64}.${fakeSignature}`;
assert.strictEqual(verifySessionToken(forgedToken), false, 'Forged signature must be rejected');
console.log('  ✓ Forged signature correctly rejected');

// 5. Tampered payload rejection
const tamperedPayload = { ...payload, id: 'attacker_controlled_id' };
const tamperedPayloadB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url');
const tamperedToken = `${tamperedPayloadB64}.${signature}`;
assert.strictEqual(verifySessionToken(tamperedToken), false, 'Tampered payload must be rejected');
console.log('  ✓ Tampered payload correctly rejected');

// 6. Expired token rejection
const expiredPayload = { ...payload, exp: Date.now() - 1000 };
const expiredPayloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
const expiredSig = crypto.createHmac('sha256', secret).update(expiredPayloadB64).digest('hex');
const expiredToken = `${expiredPayloadB64}.${expiredSig}`;
assert.strictEqual(verifySessionToken(expiredToken), false, 'Expired token must be rejected');
console.log('  ✓ Expired token correctly rejected');

// 7. Revocation upon logout
destroySession(token);
assert.strictEqual(isSessionRevoked(payload.id), true, 'Session ID must be recorded as revoked');
assert.strictEqual(verifySessionToken(token), false, 'Revoked token must fail verification');
console.log('  ✓ Logout properly revokes session across instances');

// 8. Re-verification after revocation remains false
assert.strictEqual(verifySessionToken(token), false, 'Subsequent checks on revoked token must remain false');
console.log('  ✓ Revoked token cannot be reused');

// 9. Malformed input tests
assert.strictEqual(verifySessionToken(null), false, 'null token returns false');
assert.strictEqual(verifySessionToken(''), false, 'empty token returns false');
assert.strictEqual(verifySessionToken('invalid.token.extra.dots'), false, 'extra dots return false');
assert.strictEqual(verifySessionToken('onlyonepart'), false, 'single part returns false');
console.log('  ✓ Malformed tokens safely rejected');

console.log('✅ ALL AUTH & SESSION TESTS PASSED!\n');
