import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export const DEFAULT_DEV_PERFORMANCE = {
  visible: true,
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

  if (errors.length > 0) {
    const err = new Error(`Validation failed: ${errors.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return sanitized;
}

/**
 * Read global site settings from JSON file
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
          saveSiteSettings(DEFAULT_SETTINGS, 'system_init');
        } catch {}
      }
      inMemorySettingsCache = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    const existingDevPerf = (parsed.global || parsed.settings || {})?.devPerformance;
    const globalBlock = {
      ...DEFAULT_GLOBAL,
      ...(parsed.global || parsed.settings || {}),
      devPerformance: {
        ...DEFAULT_DEV_PERFORMANCE,
        ...(existingDevPerf || {})
      }
    };
    const loadedDoc = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      global: globalBlock,
      settings: globalBlock,
      content: { ...DEFAULT_SETTINGS.content, ...(parsed.content || {}) },
      customThemes: Array.isArray(parsed.customThemes) ? parsed.customThemes : [],
      customBackgrounds: Array.isArray(parsed.customBackgrounds) ? parsed.customBackgrounds : []
    };
    inMemorySettingsCache = loadedDoc;
    return loadedDoc;
  } catch (err) {
    console.error('Failed to read site-settings.json, trying backup:', err);
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        const backupRaw = fs.readFileSync(BACKUP_FILE, 'utf8');
        return JSON.parse(backupRaw);
      } catch (backupErr) {
        console.error('Failed to read backup file as well:', backupErr);
      }
    }
    return DEFAULT_SETTINGS;
  }
}

/**
 * Atomically write global site settings to JSON file with backup and memory cache
 */
export function saveSiteSettings(updatedFields, updatedBy = 'admin') {
  const current = getSiteSettings();

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

  const newDoc = {
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

  inMemorySettingsCache = newDoc;
  const jsonString = JSON.stringify(newDoc, null, 2);

  // Write to filesystem with serverless fallback
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
  } catch (fsErr) {
    console.warn('[STORAGE] Could not write to disk (serverless read-only mode). Saved to memory cache:', fsErr.message);
  }

  return newDoc;
}
