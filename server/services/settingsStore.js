import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kvStore, isSharedKVConfigured } from './kvStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'site-settings.json');
const BACKUP_FILE = path.join(DATA_DIR, 'site-settings.backup.json');
const TEMP_FILE = path.join(DATA_DIR, 'site-settings.tmp.json');

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const TMP_SETTINGS_FILE = path.join('/tmp', 'site-settings.json');
const TMP_TEMP_FILE = path.join('/tmp', 'site-settings.tmp.json');

let inMemorySettingsCache = null;
let lastKVSyncTime = 0;
const KV_CACHE_TTL_MS = 5000; // 5-second cache window for high concurrency while ensuring near-instant sync

export const DEFAULT_DEV_PERFORMANCE = {
  visible: false, // Default off for clean portfolio presentation
  showFPS: true,
  showFrameTime: true,
  showDPR: true,
  showMode: true,
  showDigitalCore: true,
  showParticles: true,
  showGlassBlur: true,
  showScrollFX: true,
  showViewport: true,
};

const DEFAULT_GLOBAL = {
  theme: 'default', // 'default' | 'technical' | 'nature' | 'minimal' | 'aurora' | 'monochrome' | 'custom'
  customThemeName: '',
  background: 'digital-web', // 'digital-web' | 'neural-flow' | 'data-stream' | 'organic-flow' | 'starfield' | 'digital-code-flow' | 'custom'
  customBackgroundName: '',
  performanceMode: 'BALANCED', // 'EXTREME_SMOOTH' | 'SMOOTH' | 'BALANCED' | 'HIGH_QUALITY' | 'EXTREME_QUALITY' | 'AUTO'
  threeEnabled: true,
  threeInteraction: true,
  digitalCoreEnabled: true,
  particlesEnabled: true,
  particleQuality: 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  glassEnabled: true,
  glassQuality: 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  backgroundEnabled: true,
  backgroundQuality: 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  scrollEffects: true,
  mouseEffects: true,
  customCursor: true,
  animationQuality: 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  renderScale: 'AUTO', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  devPerformance: { ...DEFAULT_DEV_PERFORMANCE },
};

const DEFAULT_SETTINGS = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
  global: { ...DEFAULT_GLOBAL },
  settings: { ...DEFAULT_GLOBAL },
  content: {
    notes: 'Refining liquid glass depth & 3D raycasting performance\nExperiment with client-side WebGL shader refraction next',
    currentFocus: 'Web + AI Systems // Full-stack Architecture & ML',
    currentExperiment: 'Three.js Digital Glass Core',
    developerNote: 'Build first. Refine later. Keep the interface curious.',
  },
  customThemes: [],
  customBackgrounds: []
};

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem in serverless, will use in-memory and /tmp
}

/**
 * Validate incoming settings payload to prevent arbitrary injection
 */
export function validateSettingsPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload format. Must be an object.');
  }

  const errors = [];
  const sanitized = {
    global: {},
    settings: {},
    content: {},
    customThemes: undefined,
    customBackgrounds: undefined
  };

  const allowedThemes = ['default', 'technical', 'nature', 'minimal', 'aurora', 'monochrome', 'custom', 'night', 'day'];
  const allowedBackgrounds = ['digital-web', 'neural-flow', 'data-stream', 'organic-flow', 'starfield', 'digital-code-flow', 'custom'];
  const allowedModes = ['EXTREME_SMOOTH', 'SMOOTH', 'BALANCED', 'HIGH_QUALITY', 'EXTREME_QUALITY', 'AUTO', 'HIGH', 'LOW'];
  const allowedQualities = ['LOW', 'MEDIUM', 'HIGH', 'AUTO'];

  // Accept fields from either payload.global or payload.settings
  const sourceSettings = payload.global || payload.settings || {};

  if (sourceSettings && typeof sourceSettings === 'object') {
    const s = sourceSettings;

    if (s.theme !== undefined) {
      const themeVal = String(s.theme).toLowerCase();
      if (allowedThemes.includes(themeVal)) sanitized.global.theme = themeVal;
      else errors.push(`Invalid theme: ${s.theme}`);
    }

    if (s.customThemeName !== undefined) {
      sanitized.global.customThemeName = String(s.customThemeName).slice(0, 100);
    }

    if (s.background !== undefined) {
      const bgVal = String(s.background).toLowerCase();
      if (allowedBackgrounds.includes(bgVal)) sanitized.global.background = bgVal;
      else errors.push(`Invalid background: ${s.background}`);
    }

    if (s.customBackgroundName !== undefined) {
      sanitized.global.customBackgroundName = String(s.customBackgroundName).slice(0, 100);
    }

    if (s.performanceMode !== undefined) {
      const mode = String(s.performanceMode).toUpperCase();
      if (allowedModes.includes(mode)) sanitized.global.performanceMode = mode;
      else errors.push(`Invalid performanceMode: ${s.performanceMode}`);
    }

    const booleanKeys = [
      'threeEnabled',
      'threeInteraction',
      'digitalCoreEnabled',
      'particlesEnabled',
      'glassEnabled',
      'backgroundEnabled',
      'scrollEffects',
      'mouseEffects',
      'customCursor',
      'scrollEffectsEnabled',
      'mouseEffectsEnabled',
      'cursorEnabled'
    ];

    for (const key of booleanKeys) {
      if (s[key] !== undefined) {
        sanitized.global[key] = Boolean(s[key]);
      }
    }

    const qualityKeys = ['particleQuality', 'particlesQuality', 'glassQuality', 'backgroundQuality', 'animationQuality', 'renderScale'];
    for (const key of qualityKeys) {
      if (s[key] !== undefined) {
        const val = String(s[key]).toUpperCase();
        if (allowedQualities.includes(val)) {
          const normKey = key === 'particlesQuality' ? 'particleQuality' : key;
          sanitized.global[normKey] = val;
        } else {
          errors.push(`Invalid quality level for ${key}: ${s[key]}`);
        }
      }
    }

    // DEV // PERFORMANCE global visibility and row controls
    if (s.devPerformance !== undefined) {
      if (typeof s.devPerformance === 'object' && s.devPerformance !== null) {
        const dp = s.devPerformance;
        sanitized.global.devPerformance = {
          visible: dp.visible !== undefined ? Boolean(dp.visible) : true,
          showFPS: dp.showFPS !== undefined ? Boolean(dp.showFPS) : true,
          showFrameTime: dp.showFrameTime !== undefined ? Boolean(dp.showFrameTime) : true,
          showDPR: dp.showDPR !== undefined ? Boolean(dp.showDPR) : true,
          showMode: dp.showMode !== undefined ? Boolean(dp.showMode) : true,
          showDigitalCore: dp.showDigitalCore !== undefined ? Boolean(dp.showDigitalCore) : true,
          showParticles: dp.showParticles !== undefined ? Boolean(dp.showParticles) : true,
          showGlassBlur: dp.showGlassBlur !== undefined ? Boolean(dp.showGlassBlur) : true,
          showScrollFX: dp.showScrollFX !== undefined ? Boolean(dp.showScrollFX) : true,
          showViewport: dp.showViewport !== undefined ? Boolean(dp.showViewport) : true,
        };
      } else {
        errors.push('devPerformance must be an object');
      }
    }

    // Mirror to settings for backwards compatibility
    sanitized.settings = { ...sanitized.global };
  }

  // Content validation
  if (payload.content && typeof payload.content === 'object') {
    const c = payload.content;
    const stringKeys = ['notes', 'currentFocus', 'currentExperiment', 'developerNote'];
    for (const key of stringKeys) {
      if (c[key] !== undefined) {
        if (typeof c[key] === 'string') {
          sanitized.content[key] = c[key].slice(0, 10000);
        } else {
          errors.push(`${key} must be a string`);
        }
      }
    }
  }

  // Custom themes array validation
  if (payload.customThemes !== undefined) {
    if (Array.isArray(payload.customThemes)) {
      sanitized.customThemes = payload.customThemes.slice(0, 20).map((t) => ({
        name: String(t.name || 'Custom Theme').slice(0, 50),
        bgColor: String(t.bgColor || '#080B16').slice(0, 30),
        primaryText: String(t.primaryText || '#F4F2F8').slice(0, 30),
        secondaryText: String(t.secondaryText || '#9A9AAF').slice(0, 30),
        mutedText: String(t.mutedText || '#6F7185').slice(0, 30),
        accent: String(t.accent || '#6D5BA6').slice(0, 30),
        secondaryAccent: String(t.secondaryAccent || '#4A416B').slice(0, 30),
        glassOpacity: Number(t.glassOpacity || 0.04),
        glassBorder: String(t.glassBorder || 'rgba(109, 91, 166, 0.22)').slice(0, 50),
        glowStrength: Number(t.glowStrength || 0.25),
        borderOpacity: Number(t.borderOpacity || 0.2),
        animationQuality: String(t.animationQuality || 'MEDIUM').slice(0, 20),
        particleStyle: String(t.particleStyle || 'MEDIUM').slice(0, 20),
        updatedAt: new Date().toISOString()
      }));
    } else {
      errors.push('customThemes must be an array');
    }
  }

  // Custom backgrounds array validation
  if (payload.customBackgrounds !== undefined) {
    if (Array.isArray(payload.customBackgrounds)) {
      sanitized.customBackgrounds = payload.customBackgrounds.slice(0, 20).map((b) => ({
        name: String(b.name || 'Custom Background').slice(0, 50),
        type: String(b.type || 'network').slice(0, 30),
        density: String(b.density || 'MEDIUM').slice(0, 20),
        movement: String(b.movement || 'NORMAL').slice(0, 20),
        connections: Boolean(b.connections !== false),
        labels: Boolean(b.labels !== false),
        opacity: Number(b.opacity ?? 0.35),
        glow: Boolean(b.glow !== false),
        nodeCount: Number(b.nodeCount || 24),
        animationQuality: String(b.animationQuality || 'MEDIUM').slice(0, 20),
        accent: String(b.accent || '#6D5BA6').slice(0, 30),
        enabled: Boolean(b.enabled !== false),
        updatedAt: new Date().toISOString()
      }));
    } else {
      errors.push('customBackgrounds must be an array');
    }
  }

  // Optimistic concurrency control: expectedVersion validation
  if (payload.expectedVersion !== undefined) {
    if (typeof payload.expectedVersion === 'number' && Number.isInteger(payload.expectedVersion)) {
      sanitized.expectedVersion = payload.expectedVersion;
    } else {
      errors.push('expectedVersion must be an integer');
    }
  }

  if (payload.requireVersionCheck !== undefined) {
    sanitized.requireVersionCheck = Boolean(payload.requireVersionCheck);
    if (sanitized.requireVersionCheck && sanitized.expectedVersion === undefined) {
      errors.push('expectedVersion is required when requireVersionCheck is true');
    }
  }

  if (errors.length > 0) {
    const err = new Error(`Validation failed: ${errors.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return sanitized;
}

/**
 * Helper to write serialized settings to disk atomically
 */
function writeSettingsToDisk(newDoc) {
  const jsonString = JSON.stringify(newDoc, null, 2);
  try {
    const targetTemp = IS_SERVERLESS ? TMP_TEMP_FILE : TEMP_FILE;
    const targetDest = IS_SERVERLESS ? TMP_SETTINGS_FILE : SETTINGS_FILE;

    fs.writeFileSync(targetTemp, jsonString, 'utf8');
    fs.renameSync(targetTemp, targetDest);

    if (!IS_SERVERLESS && fs.existsSync(SETTINGS_FILE)) {
      try {
        fs.copyFileSync(SETTINGS_FILE, BACKUP_FILE);
      } catch (bErr) {
        console.warn('Could not create backup of settings file:', bErr);
      }
    }
    return true;
  } catch (fsErr) {
    console.warn('[STORAGE] Could not write to disk (serverless read-only mode). Saved to memory cache:', fsErr.message);
    return false;
  }
}

/**
 * Validate authoritative settings document fetched from shared KV.
 * Fails closed if the document is malformed, not an object, an array,
 * or if it has an invalid or missing version.
 */
export function validateAuthoritativeSettingsDoc(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    const err = new Error('Authoritative settings document in shared KV is malformed.');
    err.status = 502;
    err.code = 'MALFORMED_STORED_SETTINGS';
    throw err;
  }

  if (
    doc.version === undefined ||
    doc.version === null ||
    typeof doc.version !== 'number' ||
    !Number.isInteger(doc.version) ||
    doc.version < 1
  ) {
    const err = new Error('Authoritative settings document in shared KV has an invalid or missing version.');
    err.status = 502;
    err.code = 'MALFORMED_STORED_SETTINGS';
    throw err;
  }

  if (doc.global !== undefined && (typeof doc.global !== 'object' || doc.global === null || Array.isArray(doc.global))) {
    const err = new Error('Authoritative settings document in shared KV has malformed global settings.');
    err.status = 502;
    err.code = 'MALFORMED_STORED_SETTINGS';
    throw err;
  }

  return true;
}

/**
 * Merge partial/raw settings payload with complete defaults
 */
function normalizeSettingsDoc(parsed) {
  const existingDevPerf = (parsed.global || parsed.settings || {})?.devPerformance;
  const globalBlock = {
    ...DEFAULT_GLOBAL,
    ...(parsed.global || parsed.settings || {}),
    devPerformance: {
      ...DEFAULT_DEV_PERFORMANCE,
      ...(existingDevPerf || {})
    }
  };
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    global: globalBlock,
    settings: globalBlock,
    content: { ...DEFAULT_SETTINGS.content, ...(parsed.content || {}) },
    customThemes: Array.isArray(parsed.customThemes) ? parsed.customThemes : [],
    customBackgrounds: Array.isArray(parsed.customBackgrounds) ? parsed.customBackgrounds : []
  };
}

/**
 * Synchronous read of global site settings from memory cache or local JSON file
 */
export function getSiteSettings() {
  if (inMemorySettingsCache) {
    return inMemorySettingsCache;
  }

  try {
    let raw = null;
    if (IS_SERVERLESS && fs.existsSync(TMP_SETTINGS_FILE)) {
      raw = fs.readFileSync(TMP_SETTINGS_FILE, 'utf8');
    } else if (fs.existsSync(SETTINGS_FILE)) {
      raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    }

    if (!raw) {
      if (!IS_SERVERLESS) {
        try {
          writeSettingsToDisk(DEFAULT_SETTINGS);
        } catch {}
      }
      inMemorySettingsCache = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    const loadedDoc = normalizeSettingsDoc(parsed);
    inMemorySettingsCache = loadedDoc;
    return loadedDoc;
  } catch (err) {
    console.error('Failed to read site-settings.json, trying backup:', err);
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const backupRaw = fs.readFileSync(BACKUP_FILE, 'utf8');
        return normalizeSettingsDoc(JSON.parse(backupRaw));
      } catch (backupErr) {
        console.error('Failed to read backup file as well:', backupErr);
      }
    }
    return DEFAULT_SETTINGS;
  }
}

/**
 * Invalidate in-memory cache to force next read to query authoritative store
 */
export function invalidateSettingsCache() {
  inMemorySettingsCache = null;
  lastKVSyncTime = 0;
}

/**
 * Asynchronous read of site settings, checking shared KV store for cross-instance updates in production
 */
export async function getSiteSettingsAsync(options = {}) {
  if (isSharedKVConfigured()) {
    const now = Date.now();
    const shouldFetchKV = options.forceRefresh || !inMemorySettingsCache || now - lastKVSyncTime > KV_CACHE_TTL_MS;
    // Query shared KV if forced, cache is empty, or cache window has expired
    if (shouldFetchKV) {
      try {
        const remote = await kvStore.get('site_settings');
        if (remote !== null) {
          validateAuthoritativeSettingsDoc(remote);
          const loadedDoc = normalizeSettingsDoc(remote);
          inMemorySettingsCache = loadedDoc;
          lastKVSyncTime = now;
          return loadedDoc;
        } else {
          // KV store is configured but key not yet initialized (first startup)
          // Use atomic initialization (SET NX) to prevent overwriting a concurrent successful write
          const initialDoc = getSiteSettings();
          await kvStore.set('site_settings', initialDoc, { nx: true });
          // Read authoritative value back in case a concurrent initialization or write won the race
          const authoritative = await kvStore.get('site_settings');
          if (authoritative === null) {
            const readErr = new Error('Failed to read back authoritative settings after initialization.');
            readErr.status = 503;
            readErr.code = 'KV_UNAVAILABLE';
            throw readErr;
          }
          validateAuthoritativeSettingsDoc(authoritative);
          const loadedDoc = normalizeSettingsDoc(authoritative);
          inMemorySettingsCache = loadedDoc;
          lastKVSyncTime = Date.now();
          return loadedDoc;
        }
      } catch (err) {
        if (err.code === 'MALFORMED_STORED_SETTINGS' || (err.status && err.code)) {
          throw err;
        }
        // Authoritative store failed. Fail closed: do not serve stale local defaults as authoritative!
        console.error('[SETTINGS CRITICAL] Authoritative KV settings read failed:', err.message);
        const storeErr = new Error('Authoritative settings store is temporarily unavailable. Please retry.');
        storeErr.status = 503;
        storeErr.code = 'KV_UNAVAILABLE';
        storeErr.originalError = err;
        throw storeErr;
      }
    }
    if (inMemorySettingsCache) {
      return inMemorySettingsCache;
    }
  } else {
    kvStore.warnIfUnconfiguredServerless();
  }

  return getSiteSettings();
}

/**
 * Prepare next version of settings document
 */
function buildNextSettingsDoc(current, updatedFields, updatedBy = 'admin') {
  const nextVersion = (current.version || 0) + 1;
  const nextUpdatedAt = new Date().toISOString();

  const currentDevPerf = current.global?.devPerformance || DEFAULT_DEV_PERFORMANCE;
  const incomingDevPerf = updatedFields.global?.devPerformance || updatedFields.settings?.devPerformance;
  const mergedDevPerf = incomingDevPerf !== undefined
    ? { ...currentDevPerf, ...incomingDevPerf }
    : currentDevPerf;

  const mergedGlobal = {
    ...current.global,
    ...(updatedFields.global || updatedFields.settings || {}),
    devPerformance: mergedDevPerf
  };

  return {
    version: nextVersion,
    updatedAt: nextUpdatedAt,
    updatedBy: updatedBy || 'admin',
    global: mergedGlobal,
    settings: mergedGlobal,
    content: {
      ...current.content,
      ...(updatedFields.content || {})
    },
    customThemes: updatedFields.customThemes !== undefined
      ? updatedFields.customThemes
      : (current.customThemes || []),
    customBackgrounds: updatedFields.customBackgrounds !== undefined
      ? updatedFields.customBackgrounds
      : (current.customBackgrounds || [])
  };
}

/**
 * Synchronous write of global site settings for local development and standalone mode.
 * In production when shared KV is configured, synchronous writes are disallowed to prevent
 * bypassing distributed lock ownership and atomic version fencing.
 */
export function saveSiteSettingsSync(updatedFields, updatedBy = 'admin') {
  if (isSharedKVConfigured()) {
    const err = new Error(
      'Synchronous settings persistence is not permitted when shared KV is configured. Use saveSiteSettings() to ensure distributed lock and atomic version fencing.'
    );
    err.status = 500;
    err.code = 'SYNC_PERSISTENCE_DISALLOWED';
    throw err;
  }

  const current = getSiteSettings();
  const newDoc = buildNextSettingsDoc(current, updatedFields, updatedBy);

  inMemorySettingsCache = newDoc;
  lastKVSyncTime = Date.now();
  writeSettingsToDisk(newDoc);

  return newDoc;
}

// In-process lock chain to serialize concurrent updates within the same process
let inProcessLock = Promise.resolve();

function withInProcessLock(fn) {
  const next = inProcessLock.then(fn, fn);
  inProcessLock = next.catch(() => {});
  return next;
}

/**
 * Atomically write global site settings with concurrency control:
 * 1. In-process mutex queue prevents simultaneous interleaved execution.
 * 2. Cross-instance distributed lock via Redis SET NX EX.
 * 3. Optimistic concurrency control (expectedVersion validation).
 * 4. Strict fail-closed persistence (does NOT report success unless shared KV write succeeds).
 */
export async function saveSiteSettings(updatedFields, updatedBy = 'admin') {
  return withInProcessLock(async () => {
    let lockToken = null;
    let lease = null;

    if (isSharedKVConfigured()) {
      try {
        lockToken = await kvStore.acquireLock('lock:site_settings', 4, 6, 50);
        // Start lease renewal heartbeat: automatically renews the lock every 1500ms
        // so long operations do not outlive their lock while still active
        lease = kvStore.createLockLease('lock:site_settings', lockToken, 4, 1500);
      } catch (lockErr) {
        if (lockErr.code === 'CONCURRENT_UPDATE_CONFLICT') {
          throw lockErr;
        }
        const writeErr = new Error('Failed to acquire lock: authoritative shared KV store is unavailable.');
        writeErr.status = 503;
        writeErr.code = 'KV_WRITE_FAILED';
        writeErr.originalError = lockErr;
        throw writeErr;
      }
    }

    try {
      // 1. Fetch authoritative current settings directly from KV (bypassing local 5s cache)
      const current = await getSiteSettingsAsync({ forceRefresh: true });
      const baseVersion = current.version;

      // 2. Concurrency check: optimistic locking if client provided expectedVersion
      if (typeof updatedFields.expectedVersion === 'number') {
        if (current.version !== updatedFields.expectedVersion) {
          const conflictErr = new Error(
            `Settings conflict: Current version is ${current.version}, but update was based on version ${updatedFields.expectedVersion}. Please reload latest settings before saving.`
          );
          conflictErr.status = 409;
          conflictErr.code = 'VERSION_CONFLICT';
          throw conflictErr;
        }
      }

      // Check if lease was lost during read or validation
      if (lease && lease.isLost()) {
        const lockLostErr = new Error('Distributed lock ownership was lost before settings could be committed. Update aborted to prevent concurrent overwrite.');
        lockLostErr.status = 409;
        lockLostErr.code = 'LOCK_LOST';
        throw lockLostErr;
      }

      // 3. Build new version document
      const newDoc = buildNextSettingsDoc(current, updatedFields, updatedBy);

      // 4. Persist to shared authoritative KV store with atomic compare-and-commit
      // Verifies BOTH lock ownership and that version in KV has not changed since read
      if (isSharedKVConfigured()) {
        if (lease && lease.isLost()) {
          const lockLostErr = new Error('Distributed lock ownership was lost before settings could be committed. Update aborted to prevent concurrent overwrite.');
          lockLostErr.status = 409;
          lockLostErr.code = 'LOCK_LOST';
          throw lockLostErr;
        }

        try {
          const writeSuccess = await kvStore.commitSettingsAtomic(
            'site_settings',
            'lock:site_settings',
            newDoc,
            lockToken,
            baseVersion
          );
          if (!writeSuccess) {
            const writeErr = new Error('Failed to persist settings to authoritative shared KV store.');
            writeErr.status = 503;
            writeErr.code = 'KV_WRITE_FAILED';
            throw writeErr;
          }
        } catch (err) {
          const preservedCodes = [
            'LOCK_LOST',
            'VERSION_CONFLICT',
            'DOCUMENT_MISSING',
            'MALFORMED_STORED_SETTINGS',
            'MISSING_LOCK_TOKEN',
            'INVALID_EXPECTED_VERSION'
          ];
          if (preservedCodes.includes(err.code)) {
            throw err;
          }
          console.error('[STORAGE CRITICAL] Authoritative KV write failed:', err.message);
          const writeErr = new Error('Failed to persist settings to authoritative shared KV store.');
          writeErr.status = 503;
          writeErr.code = 'KV_WRITE_FAILED';
          writeErr.originalError = err;
          throw writeErr;
        }
      }

      // 5. Update local memory and disk cache ONLY after shared write succeeds
      inMemorySettingsCache = newDoc;
      lastKVSyncTime = Date.now();
      writeSettingsToDisk(newDoc);

      return newDoc;
    } finally {
      if (lease) {
        lease.stop();
      }
      if (lockToken && isSharedKVConfigured()) {
        try {
          await kvStore.releaseLock('lock:site_settings', lockToken);
        } catch (releaseErr) {
          console.warn('[STORAGE] Failed to release lock:', releaseErr.message);
        }
      }
    }
  });
}
