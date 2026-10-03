import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPublicSiteSettings } from '../services/siteSettingsApi';
import { DEFAULT_PERFORMANCE_CONFIG } from '../utils/performanceConfig';

const LOCAL_STORAGE_KEY = 'portfolio_private_workspace';

// Default content fallback
const DEFAULT_CONTENT = {
  notes: 'Refining liquid glass depth & 3D raycasting performance\nExperiment with client-side WebGL shader refraction next',
  currentFocus: 'Web + AI Systems // Full-stack Architecture & ML',
  currentExperiment: 'Three.js Digital Glass Core',
  developerNote: 'Build first. Refine later. Keep the interface curious.',
};

/**
 * Load initial local storage cache
 */
function getLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { settings: DEFAULT_PERFORMANCE_CONFIG, content: DEFAULT_CONTENT, isPreviewActive: false };
    const parsed = JSON.parse(raw);
    const local = parsed.localSettings || {};
    const notesObj = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
    const isPreview = Boolean(parsed.previewMode);
    return {
      settings: { ...DEFAULT_PERFORMANCE_CONFIG, ...parsed, ...local },
      content: { ...DEFAULT_CONTENT, ...(parsed.content || {}), ...notesObj },
      isPreviewActive: isPreview
    };
  } catch {
    return { settings: DEFAULT_PERFORMANCE_CONFIG, content: DEFAULT_CONTENT, isPreviewActive: false };
  }
}

/**
 * useGlobalSiteSettings
 * Custom hook to load and synchronize global website configuration and content.
 * Follows the Settings Priority Hierarchy:
 * GLOBAL SETTINGS -> LOCAL OVERRIDE / PREVIEW (when previewMode is active) -> ACTUAL DISPLAY
 */
export function useGlobalSiteSettings() {
  const cache = getLocalCache();
  const [settings, setSettings] = useState(() => cache.settings);
  const [content, setContent] = useState(() => cache.content);
  const [version, setVersion] = useState(1);
  const [updatedAt, setUpdatedAt] = useState(() => new Date().toISOString());
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverContent, setServerContent] = useState(null);
  const [serverGlobalSettings, setServerGlobalSettings] = useState(null);

  // Fetch server configuration on startup
  const fetchGlobal = useCallback(async () => {
    const data = await fetchPublicSiteSettings();
    if (data) {
      const serverGlobal = data.global || data.settings || {};
      setServerGlobalSettings(serverGlobal);

      const latestCache = getLocalCache();
      // If preview mode is NOT active, adopt server global settings
      if (!latestCache.isPreviewActive) {
        if (serverGlobal && typeof serverGlobal === 'object') {
          setSettings((prev) => ({ ...prev, ...serverGlobal }));
        }
        if (data.content && typeof data.content === 'object') {
          setServerContent(data.content);
          setContent((prev) => ({ ...prev, ...data.content }));
        }
      } else {
        // Preview mode is active locally - retain local overrides for this device only
        if (data.content && typeof data.content === 'object') {
          setServerContent(data.content);
        }
      }

      if (data.version !== undefined) setVersion(data.version);
      if (data.updatedAt) setUpdatedAt(data.updatedAt);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchGlobal();

    // Refresh every 60 seconds
    const interval = setInterval(fetchGlobal, 60000);
    return () => clearInterval(interval);
  }, [fetchGlobal]);

  return {
    settings,
    setSettings,
    content,
    setContent,
    serverContent,
    serverGlobalSettings,
    version,
    updatedAt,
    isLoaded,
    refreshGlobalSettings: fetchGlobal
  };
}

