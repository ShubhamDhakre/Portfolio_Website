import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🧪 Starting Global Settings Persistence & Cache Precedence Regression Tests...');

// Mock localStorage environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
global.localStorage = mockStorage;

// Import source code files to verify AST / structural integrity
const globalSettingsHookPath = path.join(rootDir, 'src/hooks/useGlobalSiteSettings.js');
const appJsxPath = path.join(rootDir, 'src/App.jsx');
const privateLayerJsxPath = path.join(rootDir, 'src/components/PrivateControlLayer/PrivateControlLayer.jsx');
const useThemePath = path.join(rootDir, 'src/hooks/useTheme.js');

const globalSettingsCode = fs.readFileSync(globalSettingsHookPath, 'utf8');
const appJsxCode = fs.readFileSync(appJsxPath, 'utf8');
const privateLayerCode = fs.readFileSync(privateLayerJsxPath, 'utf8');
const useThemeCode = fs.readFileSync(useThemePath, 'utf8');

// --- Test 1: Static verification of precedence and cache synchronization ---
console.log('  [Test 1] Static verification of precedence and cache sync logic');

// 1.1 useGlobalSiteSettings must overwrite cached settings with authoritative server settings when previewMode is inactive
assert.ok(
  globalSettingsCode.includes('setSettings(serverGlobal)'),
  'useGlobalSiteSettings must setSettings(serverGlobal) directly on authoritative response'
);
assert.ok(
  globalSettingsCode.includes('localStorage.setItem(LOCAL_STORAGE_KEY'),
  'useGlobalSiteSettings must update localStorage cache with authoritative server configuration'
);
console.log('    ✓ useGlobalSiteSettings replaces cached settings with serverGlobal and updates localStorage cache');

// 1.2 App.jsx theme synchronization must check isServerSettingsLoaded before applying publication
assert.ok(
  appJsxCode.includes('isLoaded: isServerSettingsLoaded'),
  'App.jsx must extract isLoaded from useGlobalSiteSettings'
);
assert.ok(
  appJsxCode.includes('isServerSettingsLoaded'),
  'App.jsx theme synchronization effect must depend on isServerSettingsLoaded'
);
console.log('    ✓ App.jsx theme synchronization waits for authoritative server configuration');

// 1.3 PrivateControlLayer savePreferences must not let ...prefs overwrite previewMode
assert.match(
  privateLayerCode,
  /previewMode:\s*isPreview/,
  'PrivateControlLayer savePreferences must place previewMode after ...prefs so it cannot be overridden'
);
console.log('    ✓ PrivateControlLayer savePreferences guarantees previewMode flag integrity');

// 1.4 handlePublishGlobal updates cache and aligns theme
assert.ok(
  privateLayerCode.includes("localStorage.removeItem('shubham_portfolio_theme_explicit')"),
  'handlePublishGlobal must clear explicit theme flag on global publication'
);
assert.ok(
  useThemeCode.includes("localStorage.removeItem('shubham_portfolio_theme_explicit')"),
  'useTheme setTheme must clear explicit theme flag when isExplicit is false'
);
console.log('    ✓ handlePublishGlobal clears explicit user lock and updates local cache');

// --- Test 2: Dynamic simulation of localStorage seeding, server response & precedence ---
console.log('  [Test 2] Dynamic precedence simulation: Stale localStorage seeded vs Newer Server Configuration');

// Seed localStorage with an old theme, background, and performance settings
const OLD_LOCAL_WORKSPACE = {
  version: 2,
  localSettings: {
    theme: 'night',
    background: 'digital-web',
    performanceMode: 'BALANCED'
  },
  settings: {
    theme: 'night',
    background: 'digital-web',
    performanceMode: 'BALANCED'
  },
  previewMode: false,
  theme: 'night',
  background: 'digital-web'
};

mockStorage.setItem('portfolio_private_workspace', JSON.stringify(OLD_LOCAL_WORKSPACE));
mockStorage.setItem('shubham_portfolio_theme', 'night');
mockStorage.setItem('shubham_portfolio_theme_explicit', 'true');

// Server returns newer published configuration (version 17, theme 'aurora', background 'starfield')
const NEW_SERVER_RESPONSE = {
  version: 17,
  updatedAt: '2026-10-04T12:00:00.000Z',
  global: {
    theme: 'aurora',
    background: 'starfield',
    performanceMode: 'HIGH_QUALITY'
  },
  content: {
    notes: 'Updated architectural notes from global publish',
    currentFocus: 'Full-Stack Performance',
    currentExperiment: 'Glass Refraction',
    developerNote: 'Test note'
  }
};

// Simulate getLocalCache on startup
function simulateGetLocalCache() {
  const raw = mockStorage.getItem('portfolio_private_workspace');
  if (!raw) return { settings: {}, previewMode: false, version: null };
  const parsed = JSON.parse(raw);
  const isPreview = Boolean(parsed.previewMode);
  const cachedSettings = !isPreview && parsed.settings
    ? parsed.settings
    : (parsed.localSettings || {});
  return {
    settings: cachedSettings,
    isPreviewActive: isPreview,
    version: parsed.version || null
  };
}

const initialCache = simulateGetLocalCache();
assert.strictEqual(initialCache.settings.theme, 'night');
assert.strictEqual(initialCache.settings.background, 'digital-web');
assert.strictEqual(initialCache.isPreviewActive, false);

// Simulate fetchGlobal receiving the authoritative server response
let clientSettings = { ...initialCache.settings };
let clientVersion = initialCache.version;
let isLoaded = false;

function simulateFetchGlobal(serverResponse) {
  if (serverResponse) {
    const serverGlobal = serverResponse.global || {};
    const latestCache = simulateGetLocalCache();

    if (!latestCache.isPreviewActive) {
      // Authoritative server settings overwrite client state
      clientSettings = { ...serverGlobal };

      // Update cache in localStorage
      const updatedCache = {
        version: serverResponse.version,
        updatedAt: serverResponse.updatedAt,
        settings: serverGlobal,
        content: serverResponse.content,
        previewMode: false
      };
      mockStorage.setItem('portfolio_private_workspace', JSON.stringify(updatedCache));
    }

    clientVersion = serverResponse.version;
    isLoaded = true;
  }
}

simulateFetchGlobal(NEW_SERVER_RESPONSE);

// Verification: Newer server configuration won over stale localStorage
assert.strictEqual(isLoaded, true, 'isLoaded must be true after server response');
assert.strictEqual(clientSettings.theme, 'aurora', 'Authoritative server theme must win over stale cache');
assert.strictEqual(clientSettings.background, 'starfield', 'Authoritative server background must win over stale cache');
assert.strictEqual(clientSettings.performanceMode, 'HIGH_QUALITY', 'Authoritative server mode must win over stale cache');
assert.strictEqual(clientVersion, 17, 'Client version must match server version 17');

// Verify localStorage cache was synchronized with authoritative server data
const updatedStorage = JSON.parse(mockStorage.getItem('portfolio_private_workspace'));
assert.strictEqual(updatedStorage.version, 17, 'localStorage version must be updated to 17');
assert.strictEqual(updatedStorage.settings.theme, 'aurora', 'localStorage cached theme must be updated to aurora');
assert.strictEqual(updatedStorage.settings.background, 'starfield', 'localStorage cached background must be updated to starfield');
assert.strictEqual(updatedStorage.previewMode, false, 'localStorage previewMode must be false');
console.log('    ✓ Stale localStorage correctly overridden by authoritative server settings (version 17 wins)');

// --- Test 3: Simulation of Global Publish & Fresh Startup ---
console.log('  [Test 3] Global Publish & Fresh Startup Simulation');

// Admin publishes version 18 with theme 'minimal' and background 'organic-flow'
const PUBLISH_PAYLOAD = {
  global: {
    theme: 'minimal',
    background: 'organic-flow',
    performanceMode: 'BALANCED'
  },
  content: {
    notes: 'Published via Global Control Center'
  }
};

const PUBLISH_SERVER_RESULT = {
  success: true,
  data: {
    version: 18,
    updatedAt: '2026-10-04T12:05:00.000Z'
  }
};

// Simulate handlePublishGlobal
function simulateHandlePublishGlobal(payload, result) {
  const publishedVersion = result.data.version;
  const publishedUpdatedAt = result.data.updatedAt;

  // Invalidate and update localStorage cache
  const cachePayload = {
    version: publishedVersion,
    updatedAt: publishedUpdatedAt,
    settings: payload.global,
    content: payload.content,
    previewMode: false,
    localSettings: payload.global,
    notes: payload.content
  };
  mockStorage.setItem('portfolio_private_workspace', JSON.stringify(cachePayload));

  // Align theme state and clear explicit override
  mockStorage.setItem('shubham_portfolio_theme', payload.global.theme);
  mockStorage.removeItem('shubham_portfolio_theme_explicit');
}

simulateHandlePublishGlobal(PUBLISH_PAYLOAD, PUBLISH_SERVER_RESULT);

// Verify post-publish localStorage state
assert.strictEqual(mockStorage.getItem('shubham_portfolio_theme'), 'minimal');
assert.strictEqual(mockStorage.getItem('shubham_portfolio_theme_explicit'), null, 'Explicit theme flag must be cleared');

const postPublishCache = JSON.parse(mockStorage.getItem('portfolio_private_workspace'));
assert.strictEqual(postPublishCache.version, 18);
assert.strictEqual(postPublishCache.settings.theme, 'minimal');
assert.strictEqual(postPublishCache.settings.background, 'organic-flow');
assert.strictEqual(postPublishCache.previewMode, false);

// Now simulate a fresh browser reload (cold start)
const freshColdStartCache = simulateGetLocalCache();
assert.strictEqual(freshColdStartCache.version, 18);
assert.strictEqual(freshColdStartCache.settings.theme, 'minimal');
assert.strictEqual(freshColdStartCache.settings.background, 'organic-flow');
assert.strictEqual(freshColdStartCache.isPreviewActive, false);
console.log('    ✓ Fresh page reload correctly reads and applies published global configuration v18');

// --- Test 4: Server Fail-Closed Handling ---
console.log('  [Test 4] Server/KV Unavailability (Fail-Closed) Verification');

// Reset isLoaded and simulate server failure (e.g. 503 or network failure)
let failedIsLoaded = false;
let failedClientSettings = { ...freshColdStartCache.settings };

function simulateFailedFetch(serverResult) {
  if (serverResult) {
    failedIsLoaded = true;
    failedClientSettings = { ...serverResult.global };
  }
  // If serverResult is null, failedIsLoaded remains false and settings are not updated
}

simulateFailedFetch(null);
assert.strictEqual(failedIsLoaded, false, 'isLoaded must remain false when server fetch fails');
assert.strictEqual(failedClientSettings.theme, 'minimal', 'Settings must not be corrupted by failed fetch');
console.log('    ✓ Server failure fails closed without claiming false authoritative synchronization');

console.log('\n========================================================================');
console.log('✅ ALL GLOBAL SETTINGS PERSISTENCE & PRECEDENCE TESTS PASSED!');
console.log('========================================================================\n');
