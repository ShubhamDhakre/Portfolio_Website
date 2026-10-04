import assert from 'assert';
import { getAdminPasswordHash } from '../routes/admin.js';

console.log('🧪 Starting Admin Authentication Hardening Tests...');

// 1. In production, missing ADMIN_PASSWORD_HASH must throw FATAL error
{
  const oldEnv = process.env.NODE_ENV;
  const oldHash = process.env.ADMIN_PASSWORD_HASH;

  process.env.NODE_ENV = 'production';
  delete process.env.ADMIN_PASSWORD_HASH;

  assert.throws(
    () => getAdminPasswordHash(),
    /SECURITY FATAL.*Production requires a valid bcrypt ADMIN_PASSWORD_HASH/,
    'Production without ADMIN_PASSWORD_HASH must throw a security fatal error'
  );
  console.log('  ✓ Production without ADMIN_PASSWORD_HASH throws fatal configuration error');

  // 2. In production, invalid/plaintext ADMIN_PASSWORD_HASH must throw FATAL error
  process.env.ADMIN_PASSWORD_HASH = 'plaintext_password_not_bcrypt';
  assert.throws(
    () => getAdminPasswordHash(),
    /SECURITY FATAL.*Production requires a valid bcrypt ADMIN_PASSWORD_HASH/,
    'Production with invalid bcrypt hash must throw a security fatal error'
  );
  console.log('  ✓ Production with non-bcrypt ADMIN_PASSWORD_HASH throws fatal configuration error');

  // 3. In production, valid bcrypt hash is accepted
  // Standard bcrypt test hash for string "test"
  const validBcrypt = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  process.env.ADMIN_PASSWORD_HASH = validBcrypt;
  const configured = getAdminPasswordHash();
  assert.strictEqual(configured, validBcrypt, 'Valid bcrypt hash must be accepted');
  console.log('  ✓ Production with valid bcrypt hash parses and succeeds');

  // Restore env
  process.env.NODE_ENV = oldEnv;
  if (oldHash !== undefined) {
    process.env.ADMIN_PASSWORD_HASH = oldHash;
  } else {
    delete process.env.ADMIN_PASSWORD_HASH;
  }
}

// 4. In development, missing ADMIN_PASSWORD_HASH returns null (handled by 503 response, NO fallback)
{
  const oldEnv = process.env.NODE_ENV;
  const oldHash = process.env.ADMIN_PASSWORD_HASH;

  process.env.NODE_ENV = 'development';
  delete process.env.ADMIN_PASSWORD_HASH;

  const hashDev = getAdminPasswordHash();
  assert.strictEqual(hashDev, null, 'Development without hash returns null to trigger 503 instead of fallback');
  console.log('  ✓ Development without hash returns null (no hardcoded fallback password exists)');

  // Restore env
  process.env.NODE_ENV = oldEnv;
  if (oldHash !== undefined) {
    process.env.ADMIN_PASSWORD_HASH = oldHash;
  } else {
    delete process.env.ADMIN_PASSWORD_HASH;
  }
}

console.log('✅ ALL ADMIN AUTHENTICATION HARDENING TESTS PASSED!\n');
