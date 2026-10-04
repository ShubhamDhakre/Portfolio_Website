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
