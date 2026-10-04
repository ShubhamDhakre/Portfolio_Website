/**
 * kvStore.js
 * Zero-dependency durable Key-Value storage adapter supporting:
 * 1. Shared Production Store: Vercel KV / Upstash Redis REST API (native fetch, 0 dependencies)
 * 2. Local File / Memory Fallback: server/data/ JSON files for local development and standalone Node servers
 *
 * Provides cross-instance durability for session revocation and global site settings in serverless environments.
 */

let hasWarnedMissingKV = false;

/**
 * Lua script for Redis EVAL:
 * Atomically checks if the lock key's value matches the supplied lock token (ARGV[1]).
 * If they match, deletes the key and returns 1.
 * If they do not match or the key has expired, returns 0 without deleting anything.
 */
const COMPARE_AND_DELETE_LUA =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';

/**
 * Lua script for Redis EVAL:
 * Atomically renews a distributed lock's TTL (ARGV[2]) only if the key's value matches lock token (ARGV[1]).
 * If they match, updates expiration and returns 1.
 * If they do not match or the key has expired, returns 0 without extending anything.
 */
const RENEW_LEASE_LUA =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("expire", KEYS[1], ARGV[2]) else return 0 end';

/**
 * Lua script for Redis EVAL:
 * Atomically commits settings to shared KV with strict fail-closed checks:
 * 1. Requires non-empty lock token and valid expected base version.
 * 2. Mandatory lock ownership check: KEYS[2] must equal ARGV[2].
 * 3. Mandatory version check: KEYS[1] must exist, be valid JSON with a valid numeric version,
 *    and its version must equal ARGV[3].
 * If any check fails, returns an explicit error code instead of writing.
 */
const ATOMIC_COMMIT_SETTINGS_LUA = `
if not ARGV[2] or ARGV[2] == "" then
  return "MISSING_LOCK_TOKEN"
end

if not ARGV[3] or ARGV[3] == "" then
  return "INVALID_EXPECTED_VERSION"
end

local expectedVer = tonumber(ARGV[3])
if not expectedVer or math.floor(expectedVer) ~= expectedVer or expectedVer < 0 then
  return "INVALID_EXPECTED_VERSION"
end

local currentLock = redis.call("get", KEYS[2])
if not currentLock or currentLock ~= ARGV[2] then
  return "LOCK_LOST"
end

local currentRaw = redis.call("get", KEYS[1])
if not currentRaw then
  return "DOCUMENT_MISSING"
end

local currentVer = nil
if type(cjson) == "table" and type(cjson.decode) == "function" then
  local status, doc = pcall(cjson.decode, currentRaw)
  if not status or type(doc) ~= "table" or doc.version == nil then
    return "MALFORMED_STORED_SETTINGS"
  end
  currentVer = tonumber(doc.version)
  if not currentVer then
    return "MALFORMED_STORED_SETTINGS"
  end
else
  local match = string.match(currentRaw, '"version"%s*:%s*(%d+)')
  if match then
    currentVer = tonumber(match)
  else
    return "MALFORMED_STORED_SETTINGS"
  end
end

if currentVer ~= expectedVer then
  return "VERSION_CONFLICT"
end

redis.call("set", KEYS[1], ARGV[1])
return "OK"
`.trim();

/**
 * Custom error class for failures in authoritative shared KV operations.
 * Allows middleware and route handlers to differentiate between missing keys
 * and network/upstream failures (to enforce fail-closed security).
 */
export class KVStoreError extends Error {
  constructor(message, status = 503, originalError = null) {
    super(message);
    this.name = 'KVStoreError';
    this.status = status;
    this.code = 'KV_UNAVAILABLE';
    this.originalError = originalError;
  }
}

/**
 * Check whether a genuinely shared external KV store is configured
 */
export function isSharedKVConfigured() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}

/**
 * Post JSON payload command (for setting complex values or values with TTL)
 * Throws KVStoreError on timeout, network failure, HTTP 500, or malformed JSON
 * so authoritative security checks fail closed.
 */
async function executeKVPost(commandArray) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const endpoint = url.replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(commandArray),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new KVStoreError('Shared KV store request timed out (fail-closed)', 504, err);
    }
    throw new KVStoreError(`Shared KV store network error: ${err.message}`, 503, err);
  }

  clearTimeout(timeout);

  if (!res.ok) {
    throw new KVStoreError(`Upstream KV store returned HTTP status ${res.status}: ${res.statusText}`, 502);
  }

  let json;
  try {
    json = await res.json();
  } catch (jsonErr) {
    throw new KVStoreError('Shared KV store returned malformed or unparseable response', 502, jsonErr);
  }

  if (json?.error) {
    throw new KVStoreError(`Upstream KV store error: ${json.error}`, 502);
  }

  return json?.result !== undefined ? json.result : null;
}

export const kvStore = {
  /**
   * Retrieve a value by key. Returns parsed object, string, or null if key does not exist.
   * Throws KVStoreError if shared store is configured but fails (fail-closed).
   */
  async get(key) {
    if (!isSharedKVConfigured()) {
      return null;
    }

    const result = await executeKVPost(['GET', key]);
    if (result === null || result === undefined) {
      return null;
    }

    if (typeof result === 'string') {
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    }
    return result;
  },

  /**
   * Set a key-value pair with optional TTL in seconds.
   * Throws KVStoreError on failure.
   */
  async set(key, value, options = {}) {
    if (!isSharedKVConfigured()) {
      return false;
    }

    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);

    let cmd = ['SET', key, serialized];
    if (typeof options.nx === 'boolean' && options.nx) {
      cmd.push('NX');
    }
    if (typeof options.ex === 'number' && options.ex > 0) {
      cmd.push('EX', Math.round(options.ex));
    }

    const res = await executeKVPost(cmd);
    return res === 'OK';
  },

  /**
   * Delete a key.
   * Throws KVStoreError on failure.
   */
  async del(key) {
    if (!isSharedKVConfigured()) {
      return false;
    }

    const res = await executeKVPost(['DEL', key]);
    return Boolean(res);
  },

  /**
   * Acquire a distributed lock using atomic SET key token NX EX ttl
   * Retries up to maxRetries with backoff.
   */
  async acquireLock(lockKey, ttlSeconds = 3, maxRetries = 5, retryDelayMs = 50) {
    if (!isSharedKVConfigured()) {
      return null;
    }

    const lockToken = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const acquired = await this.set(lockKey, lockToken, { nx: true, ex: ttlSeconds });
      if (acquired) {
        return lockToken;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    const conflictErr = new Error('Resource is currently locked by a concurrent update. Please retry.');
    conflictErr.status = 409;
    conflictErr.code = 'CONCURRENT_UPDATE_CONFLICT';
    throw conflictErr;
  },

  /**
   * Atomically release a distributed lock only if the supplied lock token
   * matches the token currently stored in the KV key.
   * Uses Redis Lua script (EVAL) to ensure compare-and-delete is atomic.
   * Prevents an expired or unauthorized lock token from releasing another request's lock.
   */
  async releaseLock(lockKey, lockToken) {
    if (!isSharedKVConfigured()) {
      return false;
    }
    if (!lockKey || !lockToken || typeof lockToken !== 'string') {
      return false;
    }

    try {
      const res = await executeKVPost([
        'EVAL',
        COMPARE_AND_DELETE_LUA,
        1,
        lockKey,
        lockToken
      ]);
      return Number(res) === 1;
    } catch (err) {
      console.warn('[STORAGE] Error releasing distributed lock:', err.message);
      return false;
    }
  },

  /**
   * Renew the lease of a distributed lock if the token matches.
   * Uses Redis Lua script (EVAL) to ensure renewal is atomic.
   * Returns true if lease was extended, false if lock was lost or token mismatch.
   */
  async renewLock(lockKey, lockToken, ttlSeconds = 4) {
    if (!isSharedKVConfigured()) {
      return false;
    }
    if (!lockKey || !lockToken || typeof lockToken !== 'string') {
      return false;
    }

    try {
      const res = await executeKVPost([
        'EVAL',
        RENEW_LEASE_LUA,
        1,
        lockKey,
        lockToken,
        Math.round(ttlSeconds)
      ]);
      return Number(res) === 1;
    } catch (err) {
      console.warn('[STORAGE] Error renewing distributed lock lease:', err.message);
      return false;
    }
  },

  /**
   * Creates a managed lease handle that automatically renews the distributed lock
   * in the background at regular intervals until stopped.
   * If renewal fails (e.g. lock expired/stolen or network outage), marks the lease as lost.
   */
  createLockLease(lockKey, lockToken, ttlSeconds = 4, renewIntervalMs = 1500) {
    let active = true;
    let lost = false;
    let timer = null;

    const renew = async () => {
      if (!active) return;
      try {
        const ok = await this.renewLock(lockKey, lockToken, ttlSeconds);
        if (!ok && active) {
          lost = true;
          active = false;
          if (timer) clearInterval(timer);
        }
      } catch (err) {
        console.warn('[STORAGE] Lock lease heartbeat error:', err?.message || err);
        if (active) {
          lost = true;
          active = false;
          if (timer) clearInterval(timer);
        }
      }
    };

    if (isSharedKVConfigured() && lockToken) {
      timer = setInterval(renew, renewIntervalMs);
      if (timer.unref) timer.unref();
    }

    return {
      isLost: () => lost,
      stop: () => {
        active = false;
        if (timer) clearInterval(timer);
      }
    };
  },

  /**
   * Atomically commits settings to shared KV only if:
   * 1. A non-empty lock token and valid expected base version are provided.
   * 2. The distributed lock is STILL owned by lockToken in Redis.
   * 3. The document version currently stored in KV matches expectedBaseVersion.
   *
   * Throws Error with code 'LOCK_LOST' (409) if lock ownership was lost or expired.
   * Throws Error with code 'VERSION_CONFLICT' (409) if document version in KV changed.
   * Throws Error with code 'DOCUMENT_MISSING' (409) if document is missing in KV.
   * Throws Error with code 'MALFORMED_STORED_SETTINGS' (502) if stored document is malformed.
   * Throws Error with code 'MISSING_LOCK_TOKEN' / 'INVALID_EXPECTED_VERSION' (400) on invalid arguments.
   * Throws KVStoreError (503) on network failure or KV outage.
   */
  async commitSettingsAtomic(settingsKey, lockKey, newDoc, lockToken, expectedBaseVersion) {
    if (!isSharedKVConfigured()) {
      return false;
    }

    if (!lockToken || typeof lockToken !== 'string' || !lockToken.trim()) {
      const err = new Error('A valid, non-empty lock token is strictly required to commit settings.');
      err.status = 400;
      err.code = 'MISSING_LOCK_TOKEN';
      throw err;
    }

    if (
      expectedBaseVersion === undefined ||
      expectedBaseVersion === null ||
      typeof expectedBaseVersion !== 'number' ||
      !Number.isInteger(expectedBaseVersion) ||
      expectedBaseVersion < 0
    ) {
      const err = new Error('A valid numeric integer expectedBaseVersion is strictly required to commit settings.');
      err.status = 400;
      err.code = 'INVALID_EXPECTED_VERSION';
      throw err;
    }

    const serialized = typeof newDoc === 'object' ? JSON.stringify(newDoc) : String(newDoc);
    const verStr = String(expectedBaseVersion);

    const res = await executeKVPost([
      'EVAL',
      ATOMIC_COMMIT_SETTINGS_LUA,
      2,
      settingsKey,
      lockKey,
      serialized,
      lockToken.trim(),
      verStr
    ]);

    if (res === 'LOCK_LOST') {
      const lockLostErr = new Error('Distributed lock ownership was lost before settings could be committed. Update aborted to prevent concurrent overwrite.');
      lockLostErr.status = 409;
      lockLostErr.code = 'LOCK_LOST';
      throw lockLostErr;
    }

    if (res === 'VERSION_CONFLICT') {
      const conflictErr = new Error('Settings conflict: Current authoritative version has changed since read. Update aborted to prevent overwriting concurrent changes.');
      conflictErr.status = 409;
      conflictErr.code = 'VERSION_CONFLICT';
      throw conflictErr;
    }

    if (res === 'DOCUMENT_MISSING') {
      const missingErr = new Error('Settings document was unexpectedly missing in authoritative store during commit.');
      missingErr.status = 409;
      missingErr.code = 'DOCUMENT_MISSING';
      throw missingErr;
    }

    if (res === 'MALFORMED_STORED_SETTINGS') {
      const malformedErr = new Error('Authoritative store contains malformed settings document or invalid version.');
      malformedErr.status = 502;
      malformedErr.code = 'MALFORMED_STORED_SETTINGS';
      throw malformedErr;
    }

    if (res === 'MISSING_LOCK_TOKEN') {
      const err = new Error('A valid, non-empty lock token is strictly required to commit settings.');
      err.status = 400;
      err.code = 'MISSING_LOCK_TOKEN';
      throw err;
    }

    if (res === 'INVALID_EXPECTED_VERSION') {
      const err = new Error('A valid numeric integer expectedBaseVersion is strictly required to commit settings.');
      err.status = 400;
      err.code = 'INVALID_EXPECTED_VERSION';
      throw err;
    }

    if (res !== 'OK') {
      const err = new Error(`Settings atomic commit failed with unexpected code: ${res}`);
      err.status = 502;
      err.code = 'KV_COMMIT_FAILED';
      throw err;
    }

    return true;
  },

  /**
   * Log warning once if running in serverless without shared KV configured
   */
  warnIfUnconfiguredServerless() {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (isServerless && !isSharedKVConfigured() && !hasWarnedMissingKV) {
      console.warn(
        '⚠️ [ARCHITECTURAL LIMITATION] Running on serverless without shared KV store (KV_REST_API_URL is unset).\n' +
        'Session revocation and dynamic settings will use container-local ephemeral storage and will not persist across cold starts.\n' +
        'To enable durable cross-instance persistence on Vercel, connect Vercel KV or Upstash Redis.'
      );
      hasWarnedMissingKV = true;
    }
  }
};
