import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_PERFORMANCE_CONFIG,
  PERFORMANCE_MODES
} from '../../utils/performanceConfig';
import {
  checkAdminSession,
  loginAdmin,
  logoutAdmin,
  fetchAdminSettings,
  saveAdminSettings
} from '../../services/siteSettingsApi';
import './PrivateControlLayer.css';

const STORAGE_KEY = 'portfolio_private_workspace';

// Default initial workspace preferences
const DEFAULT_PREFERENCES = {
  theme: 'default',
  background: 'digital-web',
  glassIntensity: 'medium',
  accent: 'violet',
  digitalCore: true,
  particleDensity: 'medium',
  webBackground: true,
  organicNetwork: true,
  technicalLabels: true,
  glassReflection: true,
  mouseReactiveBg: true,
  core3dInteraction: true,
  coreAutonomous: true,
  skillHighlight: true,
  microInteractions: true,
  notes: 'Refining liquid glass depth & 3D raycasting performance\nExperiment with client-side WebGL shader refraction next',
  currentFocus: 'Web + AI Systems // Full-stack Architecture & ML',
  currentExperiment: 'Three.js Digital Glass Core',
  developerNote: 'Build first. Refine later. Keep the interface curious.',
  personalNotes: [
    { id: '1', text: 'Refining liquid glass depth & 3D raycasting performance', time: 'Initial' },
    { id: '2', text: 'Experiment with client-side WebGL shader refraction next', time: 'Initial' }
  ],
  debugMode: false,
  interactionLog: [
    { id: '0', timestamp: 'INITIAL', message: 'Private workspace system initialized' }
  ],
  ...DEFAULT_PERFORMANCE_CONFIG,
};

// Available standard themes
export const THEME_OPTIONS = [
  { key: 'default', label: 'Default / Night', desc: 'Curated deep navy & liquid muted violet (#6D5BA6).' },
  { key: 'technical', label: 'Technical', desc: 'Developer workstation atmosphere with deep cyan-slate accents.' },
  { key: 'nature', label: 'Nature', desc: 'Muted organic sage, moss tones, and soft natural glass.' },
  { key: 'minimal', label: 'Minimal', desc: 'Restrained platinum slate and reduced visual noise.' },
  { key: 'aurora', label: 'Aurora', desc: 'Atmospheric cosmic teal-magenta gradient lighting.' },
  { key: 'monochrome', label: 'Monochrome', desc: 'Stark high-contrast charcoal, pure silver & white.' }
];

// Available standard background effects
export const BACKGROUND_OPTIONS = [
  { key: 'digital-web', label: 'Digital Web', desc: 'Organic 2D network with connected nodes & packet pulses.' },
  { key: 'neural-flow', label: 'Neural Flow', desc: 'Abstract synaptic nodes with curved synaptic data paths.' },
  { key: 'data-stream', label: 'Data Stream', desc: 'Horizontal high-tech bus routes with traveling discrete packets.' },
  { key: 'organic-flow', label: 'Organic Flow', desc: 'Smooth procedural wave curves and floating ambient glow.' },
  { key: 'starfield', label: 'Starfield', desc: 'Multi-layered deep star parallax with gentle twinkle.' },
  { key: 'digital-code-flow', label: 'Digital Code Flow', desc: 'Sparse upward-drifting technical code tokens (<React />, API).' }
];

// Safe localStorage loader - supports both structured version 2 and flat keys
function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    const local = parsed.localSettings || {};
    const notesObj = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      ...local,
      notes: notesObj.notes || parsed.notes || parsed.content?.notes || DEFAULT_PREFERENCES.notes,
      currentFocus: notesObj.currentFocus || parsed.currentFocus || parsed.content?.currentFocus || DEFAULT_PREFERENCES.currentFocus,
      currentExperiment: notesObj.currentExperiment || parsed.currentExperiment || parsed.content?.currentExperiment || DEFAULT_PREFERENCES.currentExperiment,
      developerNote: notesObj.developerNote || parsed.developerNote || parsed.content?.developerNote || DEFAULT_PREFERENCES.developerNote,
      previewMode: Boolean(parsed.previewMode)
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

// Safe localStorage saver - writes structured schema (v2) while maintaining flat compatibility
function savePreferences(prefs, previewMode = false) {
  try {
    const structuredPayload = {
      version: 2,
      localSettings: {
        theme: prefs.theme || 'default',
        background: prefs.background || 'digital-web',
        performanceMode: prefs.performanceMode || 'BALANCED',
        threeEnabled: prefs.threeEnabled !== false,
        digitalCoreEnabled: prefs.digitalCoreEnabled !== false,
        particlesEnabled: prefs.particlesEnabled !== false,
        particleQuality: prefs.particleQuality || 'MEDIUM',
        particlesQuality: prefs.particleQuality || 'MEDIUM',
        glassEnabled: prefs.glassEnabled !== false,
        glassQuality: prefs.glassQuality || 'MEDIUM',
        backgroundEnabled: prefs.backgroundEnabled !== false,
        backgroundQuality: prefs.backgroundQuality || 'MEDIUM',
        scrollEffects: prefs.scrollEffectsEnabled !== false,
        mouseEffects: prefs.mouseEffectsEnabled !== false,
        customCursor: prefs.cursorEnabled !== false,
        animationQuality: prefs.animationQuality || 'MEDIUM',
        renderScale: prefs.renderScale || 'AUTO'
      },
      notes: {
        notes: prefs.notes || '',
        currentFocus: prefs.currentFocus || '',
        currentExperiment: prefs.currentExperiment || '',
        developerNote: prefs.developerNote || ''
      },
      previewMode: Boolean(previewMode !== undefined ? previewMode : prefs.previewMode),
      ...prefs
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(structuredPayload));
  } catch (err) {
    console.warn('Failed to save private workspace preferences:', err);
  }
}

export default function PrivateControlLayer({
  isOpen,
  onClose,
  onOpen,
  theme,
  setTheme,
  toggleTheme,
  onFocusChange,
  onPrefsChange,
  globalSettings,
  globalContent,
  globalVersion = 1,
  globalUpdatedAt,
  refreshGlobalSettings
}) {
  const [prefs, setPrefs] = useState(loadPreferences);
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'themes' | 'backgrounds' | 'notes' | 'environment' | 'console' | 'system' | 'log'

  // Target Scope: 'GLOBAL' (All Visitors) vs 'LOCAL' (This Browser Only)
  const [scopeMode, setScopeMode] = useState('GLOBAL');

  // Server Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Global Sync, Custom Studios & Conflict State
  const [serverVersion, setServerVersion] = useState(globalVersion || 1);
  const [serverUpdatedAt, setServerUpdatedAt] = useState(globalUpdatedAt || new Date().toISOString());
  const [customThemes, setCustomThemes] = useState([]);
  const [customBackgrounds, setCustomBackgrounds] = useState([]);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [serverContentCache, setServerContentCache] = useState(null);

  // Local Preview State
  const [isPreviewActive, setIsPreviewActive] = useState(() => Boolean(prefs.previewMode));
  const [previewSnapshot, setPreviewSnapshot] = useState(null);

  // Global Publish Modal State
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);

  // Custom Theme Creator Form State
  const [showCustomThemeCreator, setShowCustomThemeCreator] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeBg, setNewThemeBg] = useState('#080B16');
  const [newThemePrimary, setNewThemePrimary] = useState('#F4F2F8');
  const [newThemeSecondary, setNewThemeSecondary] = useState('#9A9AAF');
  const [newThemeAccent, setNewThemeAccent] = useState('#6D5BA6');
  const [newThemeSecondaryAccent, setNewThemeSecondaryAccent] = useState('#4A416B');
  const [newThemeGlassOpacity, setNewThemeGlassOpacity] = useState(0.04);
  const [newThemeGlow, setNewThemeGlow] = useState(0.25);

  // Custom Background Creator Form State
  const [showCustomBgCreator, setShowCustomBgCreator] = useState(false);
  const [newBgName, setNewBgName] = useState('');
  const [newBgType, setNewBgType] = useState('neural-flow');
  const [newBgDensity, setNewBgDensity] = useState('MEDIUM');
  const [newBgSpeed, setNewBgSpeed] = useState('NORMAL');
  const [newBgConnections, setNewBgConnections] = useState(true);
  const [newBgLabels, setNewBgLabels] = useState(true);
  const [newBgOpacity, setNewBgOpacity] = useState(35);
  const [newBgAccent, setNewBgAccent] = useState('#6D5BA6');

  // UI state
  const [accessNotice, setAccessNotice] = useState(null);
  const [showResetPerfConfirm, setShowResetPerfConfirm] = useState(false);

  // Telemetry & Uptime
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [currentMode, setCurrentMode] = useState('EXPLORING');
  const [fps, setFps] = useState(60);
  const [webglStatus, setWebglStatus] = useState('CHECKING...');
  const [pointerType, setPointerType] = useState('MOUSE / FINE');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'sys', text: 'AUTHENTICATED // GLOBAL CONTROL CENTER v3.2' },
    { type: 'sys', text: 'Type "help" for commands, "preview" to inspect locally, or "publish" to apply globally.' }
  ]);
  const terminalEndRef = useRef(null);

  // Check active server session on mount
  const verifySession = useCallback(async () => {
    setIsCheckingAuth(true);
    const res = await checkAdminSession();
    setIsAuthenticated(Boolean(res.authenticated));
    setIsCheckingAuth(false);

    if (res.authenticated) {
      try {
        const serverData = await fetchAdminSettings();
        if (serverData) {
          if (serverData.version) setServerVersion(serverData.version);
          if (serverData.updatedAt) setServerUpdatedAt(serverData.updatedAt);
          if (serverData.customThemes) setCustomThemes(serverData.customThemes);
          if (serverData.customBackgrounds) setCustomBackgrounds(serverData.customBackgrounds);
          if (serverData.content) {
            setServerContentCache(serverData.content);
            const localNotes = prefs.notes || '';
            const serverNotes = serverData.content.notes || '';
            if (localNotes && serverNotes && localNotes !== serverNotes) {
              setHasConflict(true);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch admin settings:', err.message);
      }
    }
  }, [prefs.notes]);

  useEffect(() => {
    if (isOpen) {
      verifySession();
    }
  }, [isOpen, verifySession]);

  const logInteraction = useCallback((message) => {
    setInteractionCount((c) => c + 1);
    const timeStr = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());

    setPrefs((prev) => {
      const updatedLog = [
        { id: Date.now().toString(), timestamp: timeStr, message },
        ...(prev.interactionLog || []).slice(0, 9)
      ];
      const next = { ...prev, interactionLog: updatedLog };
      savePreferences(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (onPrefsChange) {
      onPrefsChange(prefs);
    }
  }, [prefs, onPrefsChange]);

  const updatePref = (key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePreferences(next);
      return next;
    });
    logInteraction(`Updated ${key} -> ${JSON.stringify(value)}`);
  };

  const showToast = (text, type = 'info', duration = 3000) => {
    setStatusNotification({ text, type });
    setTimeout(() => {
      setStatusNotification(null);
    }, duration);
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passwordInput) return;

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await loginAdmin(passwordInput);
      if (res.authenticated) {
        setIsAuthenticated(true);
        setPasswordInput('');
        setLoginError('');
        logInteraction('Admin authenticated successfully');
        showToast('SESSION ESTABLISHED // GLOBAL ACCESS GRANTED', 'success');

        const serverData = await fetchAdminSettings();
        if (serverData) {
          if (serverData.version) setServerVersion(serverData.version);
          if (serverData.updatedAt) setServerUpdatedAt(serverData.updatedAt);
          if (serverData.customThemes) setCustomThemes(serverData.customThemes);
          if (serverData.customBackgrounds) setCustomBackgrounds(serverData.customBackgrounds);
          if (serverData.settings || serverData.global) {
            setPrefs((prev) => {
              const merged = { ...prev, ...(serverData.global || serverData.settings) };
              savePreferences(merged);
              return merged;
            });
          }
        }
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials.');
      logInteraction('Admin authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setPasswordInput('');
    setIsPreviewActive(false);
    logInteraction('Admin session ended');
    showToast('SESSION TERMINATED', 'info');
  };

  // Local Preview Mode Handlers
  const handleStartPreview = () => {
    setPreviewSnapshot({ ...prefs });
    setIsPreviewActive(true);
    savePreferences(prefs, true);
    showToast('PREVIEW MODE ACTIVE // LOCAL ONLY', 'info', 4000);
    logInteraction('Activated local preview mode');
  };

  const handleKeepLocal = () => {
    savePreferences(prefs, true);
    setIsPreviewActive(true);
    showToast('LOCAL SETTINGS PRESERVED (THIS BROWSER ONLY)', 'success', 3500);
    logInteraction('Preserved local preview settings in localStorage');
  };

  const handleExitPreview = () => {
    const baseGlobal = globalSettings || {};
    const fallbackTheme = baseGlobal.theme || 'default';
    const fallbackBg = baseGlobal.background || 'digital-web';
    const fallbackMode = baseGlobal.performanceMode || 'BALANCED';

    setPrefs((prev) => {
      const restored = {
        ...prev,
        ...baseGlobal,
        theme: fallbackTheme,
        background: fallbackBg,
        performanceMode: fallbackMode,
        previewMode: false
      };
      savePreferences(restored, false);
      return restored;
    });

    if (setTheme) setTheme(fallbackTheme);
    setIsPreviewActive(false);
    setPreviewSnapshot(null);
    showToast('EXITED PREVIEW // RESTORED GLOBAL SETTINGS', 'info', 3000);
    logInteraction('Exited preview mode - restored global visitor settings');
  };

  // Performance Mode Applicator (Scope-Aware)
  const handleSelectMode = (modeKey) => {
    const modeObj = PERFORMANCE_MODES[modeKey];
    if (!modeObj) return;

    if (scopeMode === 'LOCAL') {
      if (!isPreviewActive && !previewSnapshot) {
        setPreviewSnapshot({ ...prefs });
      }
      setIsPreviewActive(true);
      setPrefs((prev) => {
        const next = { ...prev, ...modeObj.config, previewMode: true };
        savePreferences(next, true);
        return next;
      });
      showToast(`LOCAL PREVIEW: Mode "${modeObj.label}" (This browser only)`, 'info');
      logInteraction(`Local preview mode: ${modeObj.label}`);
    } else {
      setPrefs((prev) => {
        const next = { ...prev, ...modeObj.config };
        savePreferences(next, isPreviewActive);
        return next;
      });
      showToast(`GLOBAL STAGING: Mode "${modeObj.label}" ready to publish`, 'info');
      logInteraction(`Staged global mode: ${modeObj.label}`);
    }
  };

  // Theme Selector Handler (Scope-Aware)
  const handleSelectTheme = (themeKey) => {
    if (scopeMode === 'LOCAL') {
      if (!isPreviewActive && !previewSnapshot) {
        setPreviewSnapshot({ ...prefs });
      }
      setIsPreviewActive(true);
      updatePref('theme', themeKey);
      if (setTheme) setTheme(themeKey);
      savePreferences({ ...prefs, theme: themeKey }, true);
      showToast(`LOCAL PREVIEW: Theme "${themeKey}" (This browser only)`, 'info');
      logInteraction(`Local preview theme: ${themeKey}`);
    } else {
      updatePref('theme', themeKey);
      if (setTheme) setTheme(themeKey);
      showToast(`GLOBAL STAGING: Theme "${themeKey}" ready to publish`, 'info');
      logInteraction(`Staged global theme: ${themeKey}`);
    }
  };

  // Background Selector Handler (Scope-Aware)
  const handleSelectBackground = (bgKey) => {
    if (scopeMode === 'LOCAL') {
      if (!isPreviewActive && !previewSnapshot) {
        setPreviewSnapshot({ ...prefs });
      }
      setIsPreviewActive(true);
      updatePref('background', bgKey);
      savePreferences({ ...prefs, background: bgKey }, true);
      showToast(`LOCAL PREVIEW: Background "${bgKey}" (This browser only)`, 'info');
      logInteraction(`Local preview background: ${bgKey}`);
    } else {
      updatePref('background', bgKey);
      showToast(`GLOBAL STAGING: Background "${bgKey}" ready to publish`, 'info');
      logInteraction(`Staged global background: ${bgKey}`);
    }
  };

  // Save Custom Theme
  const handleSaveCustomTheme = (e) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    const themeItem = {
      name: newThemeName.trim(),
      bgColor: newThemeBg,
      primaryText: newThemePrimary,
      secondaryText: newThemeSecondary,
      mutedText: '#6F7185',
      accent: newThemeAccent,
      secondaryAccent: newThemeSecondaryAccent,
      glassOpacity: Number(newThemeGlassOpacity),
      glassBorder: `rgba(109, 91, 166, 0.22)`,
      glowStrength: Number(newThemeGlow),
      borderOpacity: 0.2,
      animationQuality: 'MEDIUM',
      particleStyle: 'MEDIUM'
    };

    const updatedThemes = [themeItem, ...customThemes];
    setCustomThemes(updatedThemes);
    setShowCustomThemeCreator(false);
    setNewThemeName('');
    showToast(`CUSTOM THEME "${themeItem.name}" SAVED`, 'success');
    logInteraction(`Created custom theme: ${themeItem.name}`);
  };

  // Save Custom Background
  const handleSaveCustomBackground = (e) => {
    e.preventDefault();
    if (!newBgName.trim()) return;

    const bgItem = {
      name: newBgName.trim(),
      type: newBgType,
      density: newBgDensity,
      movement: newBgSpeed,
      connections: Boolean(newBgConnections),
      labels: Boolean(newBgLabels),
      opacity: Number(newBgOpacity) / 100,
      glow: true,
      nodeCount: newBgDensity === 'HIGH' ? 36 : newBgDensity === 'LOW' ? 12 : 24,
      animationQuality: 'MEDIUM',
      accent: newBgAccent,
      enabled: true
    };

    const updatedBgs = [bgItem, ...customBackgrounds];
    setCustomBackgrounds(updatedBgs);
    setShowCustomBgCreator(false);
    setNewBgName('');
    showToast(`CUSTOM BACKGROUND "${bgItem.name}" SAVED`, 'success');
    logInteraction(`Created custom background: ${bgItem.name}`);
  };

  // Save Local Notes / Settings
  const handleSaveLocal = () => {
    savePreferences(prefs, isPreviewActive);
    showToast('LOCAL WORKSPACE SAVED TO LOCALSTORAGE', 'success');
    logInteraction('Saved workspace to localStorage');
  };

  // Publish Global Settings to Server JSON
  const handlePublishGlobal = async () => {
    setIsSavingGlobal(true);
    setShowPublishConfirmModal(false);

    try {
      const payload = {
        global: {
          theme: prefs.theme || 'default',
          background: prefs.background || 'digital-web',
          performanceMode: prefs.performanceMode || 'BALANCED',
          threeEnabled: prefs.threeEnabled !== false,
          threeInteraction: prefs.threeInteraction !== false,
          digitalCoreEnabled: prefs.digitalCore !== false && prefs.digitalCoreEnabled !== false,
          particlesEnabled: prefs.particlesEnabled !== false,
          particleQuality: prefs.particleQuality || 'MEDIUM',
          glassEnabled: prefs.glassEnabled !== false,
          glassQuality: prefs.glassQuality || 'MEDIUM',
          backgroundEnabled: prefs.backgroundEnabled !== false,
          backgroundQuality: prefs.backgroundQuality || 'MEDIUM',
          scrollEffects: prefs.scrollEffectsEnabled !== false,
          mouseEffects: prefs.mouseEffectsEnabled !== false,
          customCursor: prefs.cursorEnabled !== false,
          animationQuality: prefs.animationQuality || 'MEDIUM',
          renderScale: prefs.renderScale || 'AUTO',
        },
        content: {
          notes: prefs.notes || '',
          currentFocus: prefs.currentFocus || '',
          currentExperiment: prefs.currentExperiment || '',
          developerNote: prefs.developerNote || '',
        },
        customThemes,
        customBackgrounds
      };

      const result = await saveAdminSettings(payload);
      if (result.success && result.data) {
        setServerVersion(result.data.version);
        setServerUpdatedAt(result.data.updatedAt);
        setHasConflict(false);
        setIsPreviewActive(false);

        savePreferences(prefs);

        if (refreshGlobalSettings) {
          refreshGlobalSettings();
        }

        showToast(`GLOBAL SETTINGS PUBLISHED // VERSION v${result.data.version}`, 'success');
        logInteraction(`Published global configuration v${result.data.version}`);
      }
    } catch (err) {
      showToast(err.message || 'CONFIGURATION SAVE FAILED', 'error', 4500);
      logInteraction(`Save global settings failed: ${err.message}`);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // Refresh Global Config from Server
  const handleRefreshGlobal = async () => {
    try {
      const data = await fetchAdminSettings();
      if (data) {
        if (data.version) setServerVersion(data.version);
        if (data.updatedAt) setServerUpdatedAt(data.updatedAt);
        if (data.customThemes) setCustomThemes(data.customThemes);
        if (data.customBackgrounds) setCustomBackgrounds(data.customBackgrounds);
        if (data.global || data.settings) {
          setPrefs((prev) => {
            const next = { ...prev, ...(data.global || data.settings) };
            savePreferences(next);
            return next;
          });
        }
        if (data.content) {
          setServerContentCache(data.content);
          setPrefs((prev) => {
            const next = {
              ...prev,
              notes: data.content.notes ?? prev.notes,
              currentFocus: data.content.currentFocus ?? prev.currentFocus,
              currentExperiment: data.content.currentExperiment ?? prev.currentExperiment,
              developerNote: data.content.developerNote ?? prev.developerNote,
            };
            savePreferences(next);
            return next;
          });
          setHasConflict(false);
        }
        showToast('REFRESHED FROM GLOBAL SERVER CONFIG', 'success');
        logInteraction('Refreshed settings from global server JSON');
      }
    } catch (err) {
      showToast('FAILED TO REFRESH SERVER CONFIG', 'error');
    }
  };

  // Conflict Resolvers
  const handleUseLocalContent = () => {
    setHasConflict(false);
    showToast('RETAINED LOCAL NOTE CHANGES', 'info');
  };

  const handleUseServerContent = () => {
    if (serverContentCache) {
      setPrefs((prev) => {
        const next = {
          ...prev,
          notes: serverContentCache.notes || '',
          currentFocus: serverContentCache.currentFocus || '',
          currentExperiment: serverContentCache.currentExperiment || '',
          developerNote: serverContentCache.developerNote || '',
        };
        savePreferences(next);
        return next;
      });
      setHasConflict(false);
      showToast('OVERWROTE LOCAL CACHE WITH SERVER CONTENT', 'success');
    }
  };

  // One-Click Bottleneck Diagnostic Mode Toggle
  const handleOneClickTest = (testType) => {
    setPrefs((prev) => {
      let next = { ...prev };
      if (testType === 'three') {
        next.threeEnabled = !prev.threeEnabled;
        logInteraction(`Test Mode: Three.js -> ${next.threeEnabled ? 'ON' : 'OFF'}`);
      } else if (testType === 'particles') {
        next.particlesEnabled = !prev.particlesEnabled;
        logInteraction(`Test Mode: Particles -> ${next.particlesEnabled ? 'ON' : 'OFF'}`);
      } else if (testType === 'glass') {
        next.glassQuality = prev.glassQuality === 'LOW' ? 'HIGH' : 'LOW';
        logInteraction(`Test Mode: Glass Quality -> ${next.glassQuality}`);
      } else if (testType === 'scroll') {
        next.scrollEffectsEnabled = !prev.scrollEffectsEnabled;
        logInteraction(`Test Mode: Scroll FX -> ${next.scrollEffectsEnabled ? 'ON' : 'OFF'}`);
      } else if (testType === 'mouse') {
        next.mouseEffectsEnabled = !prev.mouseEffectsEnabled;
        logInteraction(`Test Mode: Mouse FX -> ${next.mouseEffectsEnabled ? 'ON' : 'OFF'}`);
      } else if (testType === 'all') {
        const isMinimal = !prev.threeEnabled && !prev.particlesEnabled && !prev.scrollEffectsEnabled;
        if (isMinimal) {
          next.threeEnabled = true;
          next.particlesEnabled = true;
          next.glassQuality = 'AUTO';
          next.backgroundEnabled = true;
          next.scrollEffectsEnabled = true;
          next.mouseEffectsEnabled = true;
          logInteraction('Test Mode: Restored All Visual Effects');
        } else {
          next.threeEnabled = false;
          next.particlesEnabled = false;
          next.glassQuality = 'LOW';
          next.backgroundEnabled = false;
          next.scrollEffectsEnabled = false;
          next.mouseEffectsEnabled = false;
          logInteraction('Test Mode: Disabled All FX (FPS Baseline)');
        }
      }
      savePreferences(next);
      return next;
    });
  };

  const handleResetPerformance = () => {
    handleSelectMode('BALANCED');
    setShowResetPerfConfirm(false);
    showToast('RESET TO DEFAULT BALANCED PERFORMANCE', 'info');
  };

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return '--:--:--';
    }
  };

  const formatUptime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Secret Access Triggers
  const triggerAccess = useCallback((source = 'SHORTCUT') => {
    setAccessNotice({ phase: 'init', text: 'GLOBAL CONTROL ACCESS INITIALIZING...' });
    setTimeout(() => {
      setAccessNotice({ phase: 'ready', text: 'GLOBAL CONTROL READY' });
      setTimeout(() => {
        setAccessNotice(null);
        onOpen();
        logInteraction(`Triggered control center via ${source}`);
      }, 450);
    }, 450);
  }, [onOpen, logInteraction]);

  useEffect(() => {
    const konamiSequence = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    let konamiIndex = 0;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          triggerAccess('KEYBOARD SHORTCUT');
        }
        return;
      }

      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      if (e.key.toLowerCase() === konamiSequence[konamiIndex].toLowerCase() || e.key === konamiSequence[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiSequence.length) {
          konamiIndex = 0;
          triggerAccess('KONAMI KEY SEQUENCE');
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerAccess]);

  const hotspotClicksRef = useRef([]);
  const handleCornerClick = () => {
    const now = Date.now();
    hotspotClicksRef.current = hotspotClicksRef.current.filter((t) => now - t < 2000);
    hotspotClicksRef.current.push(now);

    if (hotspotClicksRef.current.length >= 5) {
      hotspotClicksRef.current = [];
      triggerAccess('CORNER HOTSPOT');
    }
  };

  useEffect(() => {
    if (onFocusChange && prefs.currentFocus) {
      onFocusChange(prefs.currentFocus);
    }
  }, [prefs.currentFocus, onFocusChange]);

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let response = '';
    if (cmd === 'whoami') {
      response = 'Shubham Dhakre — Computer Science student, tech explorer & full-stack builder.';
    } else if (cmd === 'focus') {
      response = `Current Focus: "${prefs.currentFocus}"`;
    } else if (cmd === 'status') {
      response = `SCOPE: ALL VISITORS | THEME: ${prefs.theme} | BG: ${prefs.background} | MODE: ${prefs.performanceMode || 'BALANCED'} | VER: v${serverVersion}`;
    } else if (cmd === 'save') {
      setShowPublishConfirmModal(true);
      response = 'Opening global publish confirmation...';
    } else if (cmd === 'preview') {
      handleStartPreview();
      response = 'Local preview mode activated.';
    } else if (cmd === 'logout') {
      handleLogout();
      response = 'Logging out of admin session...';
    } else if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'exit' || cmd === 'close') {
      onClose();
      return;
    } else if (cmd === 'help') {
      response = 'Commands: whoami, focus, status, preview, save, logout, clear, close';
    } else {
      response = `Command not recognized: "${cmd}". Type "help" for options.`;
    }

    setTerminalHistory((prev) => [
      ...prev,
      { type: 'cmd', text: `> ${terminalInput}` },
      { type: 'out', text: response }
    ]);
    setTerminalInput('');
    logInteraction(`Terminal exec: ${cmd}`);
  };

  useEffect(() => {
    if (activeTab === 'console') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, activeTab]);

  return (
    <>
      {/* Secret Corner Hotspot */}
      <button
        type="button"
        className="secret-corner-hotspot"
        onClick={handleCornerClick}
        aria-hidden="true"
        tabIndex={-1}
        title=""
      />

      {/* Access Toast Notification */}
      {accessNotice && (
        <div className={`private-access-toast phase-${accessNotice.phase}`} role="status" aria-live="polite">
          <span className={`toast-dot ${accessNotice.phase === 'ready' ? 'ready' : ''}`} />
          <span>{accessNotice.text}</span>
        </div>
      )}

      {/* Status Feedback Toast */}
      {statusNotification && (
        <div className={`global-status-toast type-${statusNotification.type}`} role="status" aria-live="polite">
          <span className="status-toast-dot" />
          <span>{statusNotification.text}</span>
        </div>
      )}

      {/* Sticky Local Preview Header Bar */}
      {isPreviewActive && (
        <aside className="preview-sticky-bar" role="status" aria-label="Local Preview Mode">
          <div className="preview-indicator">
            <span className="preview-pulse-dot" />
            <span className="preview-title">PREVIEW MODE // LOCAL ONLY</span>
            <span className="preview-meta">Theme: {prefs.theme} | BG: {prefs.background} | Mode: {prefs.performanceMode}</span>
          </div>
          <div className="preview-actions">
            <button type="button" className="btn-keep-local" onClick={handleKeepLocal}>
              KEEP LOCAL
            </button>
            <button type="button" className="btn-exit-preview" onClick={handleExitPreview}>
              EXIT PREVIEW
            </button>
            <button type="button" className="btn-preview-apply-global" onClick={() => setShowPublishConfirmModal(true)}>
              PUBLISH GLOBALLY
            </button>
          </div>
        </aside>
      )}

      {/* Floating Live Debug HUD Overlay */}
      {prefs.debugMode && (
        <aside className="private-debug-hud" aria-label="Developer Debug HUD">
          <div className="debug-hud-title">
            <span>DEBUG // TELEMETRY</span>
            <button
              type="button"
              className="note-delete-btn"
              onClick={() => updatePref('debugMode', false)}
              title="Close Debug HUD"
            >
              ✕
            </button>
          </div>
          <div className="debug-row"><span>FPS</span><span>{fps}</span></div>
          <div className="debug-row"><span>THEME</span><span>{prefs.theme?.toUpperCase()}</span></div>
          <div className="debug-row"><span>BG</span><span>{prefs.background?.toUpperCase()}</span></div>
          <div className="debug-row"><span>GLOBAL VER</span><span>v{serverVersion}</span></div>
          <div className="debug-row"><span>MODE</span><span>{prefs.performanceMode || 'BALANCED'}</span></div>
          <div className="debug-row"><span>AUTH</span><span>{isAuthenticated ? 'ADMIN' : 'UNAUTH'}</span></div>
        </aside>
      )}

      {/* Global Publish Confirmation Modal */}
      {showPublishConfirmModal && (
        <div className="publish-confirm-overlay" role="dialog" aria-modal="true">
          <div className="publish-confirm-modal">
            <div className="publish-modal-header">
              <span className="publish-badge">GLOBAL PUBLISH</span>
              <h3>CONFIRM GLOBAL SITE CONFIGURATION</h3>
              <p className="publish-subtext">The following settings will be written to server JSON and applied to ALL visitors.</p>
            </div>

            <div className="publish-summary-card">
              <div className="summary-row"><span>THEME</span><strong>{prefs.theme?.toUpperCase()}</strong></div>
              <div className="summary-row"><span>BACKGROUND</span><strong>{prefs.background?.toUpperCase()}</strong></div>
              <div className="summary-row"><span>PERFORMANCE</span><strong>{prefs.performanceMode || 'BALANCED'}</strong></div>
              <div className="summary-row"><span>PARTICLES</span><strong>{prefs.particleQuality || 'MEDIUM'} ({prefs.particlesEnabled !== false ? 'ON' : 'OFF'})</strong></div>
              <div className="summary-row"><span>GLASS</span><strong>{prefs.glassQuality || 'MEDIUM'} ({prefs.glassEnabled !== false ? 'ON' : 'OFF'})</strong></div>
              <div className="summary-row"><span>SCOPE</span><strong style={{ color: '#8b5cf6' }}>ALL VISITORS</strong></div>
              <div className="summary-row"><span>VERSION</span><strong>v{serverVersion + 1}</strong></div>
            </div>

            <div className="publish-modal-actions">
              <button
                type="button"
                className="btn-cancel-publish"
                onClick={() => setShowPublishConfirmModal(false)}
                disabled={isSavingGlobal}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="btn-confirm-publish"
                onClick={handlePublishGlobal}
                disabled={isSavingGlobal}
              >
                {isSavingGlobal ? 'PUBLISHING...' : '⚡ PUBLISH GLOBALLY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal Overlay */}
      {isOpen && (
        <div
          className="private-workspace-overlay"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Global Control Center"
        >
          <div
            className="private-workspace-panel"
            onClick={(e) => e.stopPropagation()}
            data-cursor="private"
          >
            {/* Header Bar */}
            <div className="private-panel-header">
              <div className="header-identity">
                <span className="header-badge">PRIVATE / GLOBAL SYSTEM CONTROL</span>
                <div className="header-title-group">
                  <h2>GLOBAL CONTROL CENTER</h2>
                </div>
              </div>

              <div className="header-meta">
                <div className="system-status-indicator">
                  <span className={`system-dot ${isAuthenticated ? 'live' : 'locked'}`} />
                  <span>
                    {isAuthenticated ? `ADMIN LIVE // v${serverVersion}` : 'AUTHENTICATION REQUIRED'}
                  </span>
                </div>
                <button
                  type="button"
                  className="header-close-btn"
                  onClick={onClose}
                  title="Close Workspace (Esc)"
                  aria-label="Close"
                >
                  ESC // CLOSE
                </button>
              </div>
            </div>

            {/* UNHEALTHY / UNAUTHENTICATED STATE: LOGIN SCREEN */}
            {!isAuthenticated ? (
              <div className="auth-prompt-container">
                <div className="auth-card">
                  <div className="auth-header">
                    <span className="auth-lock-icon">🔒</span>
                    <h3>SHUBHAM-CORE AUTHENTICATION</h3>
                    <p className="auth-desc">
                      Enter developer password to access global performance controls and website configuration.
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="auth-form">
                    <div className="field-group">
                      <label className="field-label" htmlFor="admin-pass-input">DEVELOPER PASSWORD</label>
                      <div className="password-input-wrap">
                        <input
                          id="admin-pass-input"
                          type={showPassword ? 'text' : 'password'}
                          className="field-input password-field"
                          placeholder="Enter admin password..."
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          autoFocus
                          disabled={loginLoading}
                        />
                        <button
                          type="button"
                          className="toggle-pass-visibility-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="auth-error-banner" role="alert">
                        <span className="error-icon">✕</span>
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="auth-actions-row">
                      <button
                        type="submit"
                        className="btn-auth-submit"
                        disabled={loginLoading || !passwordInput}
                      >
                        {loginLoading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & UNLOCK'}
                      </button>
                    </div>
                  </form>

                  <div className="auth-footer-notice">
                    <span>SECURITY: SERVER-SIDE HASH VERIFICATION • HTTPONLY SESSIONS</span>
                  </div>
                </div>
              </div>
            ) : (
              /* AUTHENTICATED STATE: FULL GLOBAL CONTROL CENTER */
              <>
                {/* Global Status Banner (Section 02) */}
                <div className="global-status-banner">
                  <div className="status-badge-group">
                    <div className="status-live-indicator">
                      <span className="status-live-dot" />
                      <span className="status-live-text">GLOBAL PERFORMANCE CONTROL</span>
                    </div>
                    <span className="status-scope-pill">SCOPE: ALL VISITORS</span>
                  </div>

                  <div className="global-meta-strip">
                    <div className="meta-pill">
                      <span className="meta-k">STATUS</span>
                      <span className="meta-v live">● LIVE</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-k">THEME</span>
                      <span className="meta-v highlight">{prefs.theme?.toUpperCase()}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-k">BG</span>
                      <span className="meta-v highlight">{prefs.background?.toUpperCase()}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-k">MODE</span>
                      <span className="meta-v">{prefs.performanceMode || 'BALANCED'}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-k">VER</span>
                      <span className="meta-v">v{serverVersion}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-k">LAST SAVED</span>
                      <span className="meta-v">{formatTime(serverUpdatedAt)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-header-logout"
                      onClick={handleLogout}
                      title="End Admin Session"
                    >
                      ⏻ LOGOUT
                    </button>
                  </div>
                </div>

                {/* Conflict Notice */}
                {hasConflict && (
                  <div className="conflict-alert-bar" role="alert">
                    <div className="conflict-info">
                      <span className="conflict-tag">LOCAL CHANGES DETECTED</span>
                      <span className="conflict-text">Local notes differ from current server JSON configuration.</span>
                    </div>
                    <div className="conflict-actions">
                      <button type="button" className="btn-conflict-use-local" onClick={handleUseLocalContent}>
                        USE LOCAL
                      </button>
                      <button type="button" className="btn-conflict-use-server" onClick={handleUseServerContent}>
                        USE SERVER
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation Tabs */}
                <div className="private-panel-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'performance'}
                    className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('performance'); setCurrentMode('BENCHMARKING'); }}
                  >
                    ⚡ Global Performance
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'themes'}
                    className={`tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('themes'); setCurrentMode('THEMING'); }}
                  >
                    🎨 Global Themes
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'backgrounds'}
                    className={`tab-btn ${activeTab === 'backgrounds' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('backgrounds'); setCurrentMode('BACKGROUNDS'); }}
                  >
                    🌌 Global Backgrounds
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'notes'}
                    className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('notes'); setCurrentMode('EDITING'); }}
                  >
                    📝 Content & Notes
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'console'}
                    className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('console'); setCurrentMode('INTERACTING'); }}
                  >
                    💻 Developer Console
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'system'}
                    className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('system'); setCurrentMode('READING'); }}
                  >
                    📊 Diagnostics & Metrics
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'log'}
                    className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('log'); setCurrentMode('READING'); }}
                  >
                    📜 Interaction Log
                  </button>
                </div>

                {/* Panel Content Body */}
                <div className="private-panel-content">
                  {/* TAB 1: GLOBAL PERFORMANCE & SUBSYSTEMS */}
                  {activeTab === 'performance' && (
                    <>
                      {/* Scope Selector Box */}
                      <div className="scope-selector-card">
                        <div className="scope-header-row">
                          <div className="scope-title-wrap">
                            <span className="scope-tag">TARGET SCOPE</span>
                            <span className="scope-heading">Performance Configuration Scope</span>
                          </div>
                          <div className="scope-segmented-control">
                            <button
                              type="button"
                              className={`scope-pill-btn ${scopeMode === 'LOCAL' ? 'active' : ''}`}
                              onClick={() => {
                                setScopeMode('LOCAL');
                                showToast('SCOPE: LOCAL ONLY (This Browser)', 'info');
                              }}
                            >
                              ○ LOCAL ONLY
                            </button>
                            <button
                              type="button"
                              className={`scope-pill-btn ${scopeMode === 'GLOBAL' ? 'active' : ''}`}
                              onClick={() => {
                                setScopeMode('GLOBAL');
                                showToast('SCOPE: GLOBAL (All Visitors)', 'info');
                              }}
                            >
                              ● GLOBAL (ALL VISITORS)
                            </button>
                          </div>
                        </div>
                        <p className="scope-hint-text">
                          {scopeMode === 'LOCAL'
                            ? '⚡ LOCAL MODE: Mode changes preview immediately in this browser without affecting other visitors.'
                            : '🌐 GLOBAL MODE: Mode changes stage globally. Click PUBLISH GLOBALLY to update server JSON for all visitors.'}
                        </p>
                      </div>

                      <div className="private-section-card perf-highlight-card">
                        <div className="card-heading">
                          <span className="card-title">03 / PERFORMANCE MODES ({scopeMode === 'LOCAL' ? 'LOCAL PREVIEW' : 'GLOBAL PRESET'})</span>
                          <span className="card-subtext">Active Mode: {prefs.performanceMode || 'BALANCED'}</span>
                        </div>

                        <div className="modes-segmented-grid">
                          {Object.values(PERFORMANCE_MODES).map((mode) => (
                            <button
                              key={mode.key}
                              type="button"
                              className={`mode-card-btn ${prefs.performanceMode === mode.key ? 'active' : ''}`}
                              onClick={() => handleSelectMode(mode.key)}
                            >
                              <span className="mode-btn-title">{mode.label}</span>
                              <span className="mode-btn-desc">{mode.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="private-section-card">
                        <div className="card-heading">
                          <span className="card-title">04 & 05 / SUBSYSTEM CONTROLS & MANUAL OVERRIDES</span>
                          <span className="card-subtext">Granular switches across 3D, Particles, Glass & Inputs</span>
                        </div>

                        <div className="controls-grid">
                          {/* Three.js Engine */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Three.js WebGL Engine</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.threeEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('threeEnabled', prefs.threeEnabled === false)}
                              >
                                {prefs.threeEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <span className="control-desc">Toggles WebGL 3D rendering pipeline for baseline GPU testing.</span>
                          </div>

                          {/* Digital Core Interaction */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Digital Core Interaction</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.threeInteraction !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('threeInteraction', prefs.threeInteraction === false)}
                              >
                                {prefs.threeInteraction !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <span className="control-desc">Separates 3D rendering cost from pointer raycast computations.</span>
                          </div>

                          {/* Three.js Render Scale / DPR */}
                          <div className="control-item">
                            <span className="control-label">Three.js Render Scale (DPR)</span>
                            <div className="segmented-btn-group">
                              {['AUTO', 'HIGH', 'MEDIUM', 'LOW'].map((scale) => (
                                <button
                                  key={scale}
                                  type="button"
                                  className={`segmented-btn ${prefs.renderScale === scale ? 'active' : ''}`}
                                  onClick={() => updatePref('renderScale', scale)}
                                >
                                  {scale}
                                </button>
                              ))}
                            </div>
                            <span className="control-desc">Controls effective WebGL buffer resolution for mobile testing.</span>
                          </div>

                          {/* Particle System */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Particle System</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.particlesEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('particlesEnabled', prefs.particlesEnabled === false)}
                              >
                                {prefs.particlesEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <div className="segmented-btn-group" style={{ marginTop: '8px' }}>
                              {['AUTO', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  className={`segmented-btn ${prefs.particleQuality === lvl ? 'active' : ''}`}
                                  onClick={() => updatePref('particleQuality', lvl)}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                            <span className="control-desc">Torus ring point count (450 vs 220 vs 80 points).</span>
                          </div>

                          {/* Glass Effects */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Glass Material Pipeline</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.glassEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('glassEnabled', prefs.glassEnabled === false)}
                              >
                                {prefs.glassEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <div className="segmented-btn-group" style={{ marginTop: '8px' }}>
                              {['AUTO', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  className={`segmented-btn ${prefs.glassQuality === lvl ? 'active' : ''}`}
                                  onClick={() => updatePref('glassQuality', lvl)}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                            <span className="control-desc">Backdrop-filter blur depth (26px vs 16px vs 4px).</span>
                          </div>

                          {/* Web Background */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Web System Background</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.backgroundEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('backgroundEnabled', prefs.backgroundEnabled === false)}
                              >
                                {prefs.backgroundEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <div className="segmented-btn-group" style={{ marginTop: '8px' }}>
                              {['AUTO', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  className={`segmented-btn ${prefs.backgroundQuality === lvl ? 'active' : ''}`}
                                  onClick={() => updatePref('backgroundQuality', lvl)}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                            <span className="control-desc">HTML5 2D canvas network and environmental graphics.</span>
                          </div>

                          {/* Scroll Effects */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Scroll Parallax & Visual FX</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.scrollEffectsEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('scrollEffectsEnabled', prefs.scrollEffectsEnabled === false)}
                              >
                                {prefs.scrollEffectsEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <span className="control-desc">Normal page scrolling ALWAYS remains functional when OFF.</span>
                          </div>

                          {/* Mouse Effects */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Mouse Reactive Spotlight</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.mouseEffectsEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('mouseEffectsEnabled', prefs.mouseEffectsEnabled === false)}
                              >
                                {prefs.mouseEffectsEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <span className="control-desc">Ambient spotlight & pointer attraction. Clicking is unaffected.</span>
                          </div>

                          {/* Custom Cursor */}
                          <div className="control-item">
                            <div className="control-header-row">
                              <span className="control-label">Custom Desktop Cursor</span>
                              <button
                                type="button"
                                className={`toggle-pill-btn ${prefs.cursorEnabled !== false ? 'on' : 'off'}`}
                                onClick={() => updatePref('cursorEnabled', prefs.cursorEnabled === false)}
                              >
                                {prefs.cursorEnabled !== false ? '● ON' : '○ OFF'}
                              </button>
                            </div>
                            <span className="control-desc">When OFF, uses default browser cursor. Disabled on touch.</span>
                          </div>

                          {/* Animation Quality */}
                          <div className="control-item">
                            <span className="control-label">Nonessential Animation Quality</span>
                            <div className="segmented-btn-group">
                              {['AUTO', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  className={`segmented-btn ${prefs.animationQuality === lvl ? 'active' : ''}`}
                                  onClick={() => updatePref('animationQuality', lvl)}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                            <span className="control-desc">Subtly adjusts micro-animations and pulsing frequencies.</span>
                          </div>
                        </div>
                      </div>

                      {/* One-Click Bottleneck Tests */}
                      <div className="private-section-card">
                        <div className="card-heading">
                          <span className="card-title">ONE-CLICK BOTTLENECK TESTS</span>
                          <span className="card-subtext">Toggle individual subsystems to measure frame rate deltas</span>
                        </div>

                        <div className="quick-test-actions-grid">
                          <button
                            type="button"
                            className={`test-action-btn ${!prefs.threeEnabled ? 'test-active' : ''}`}
                            onClick={() => handleOneClickTest('three')}
                          >
                            <span className="test-btn-tag">3D CORE</span>
                            <span className="test-btn-label">TEST THREE.JS [{prefs.threeEnabled ? 'ON' : 'OFF'}]</span>
                          </button>

                          <button
                            type="button"
                            className={`test-action-btn ${!prefs.particlesEnabled ? 'test-active' : ''}`}
                            onClick={() => handleOneClickTest('particles')}
                          >
                            <span className="test-btn-tag">POINTS</span>
                            <span className="test-btn-label">TEST PARTICLES [{prefs.particlesEnabled ? 'ON' : 'OFF'}]</span>
                          </button>

                          <button
                            type="button"
                            className={`test-action-btn ${prefs.glassQuality === 'LOW' ? 'test-active' : ''}`}
                            onClick={() => handleOneClickTest('glass')}
                          >
                            <span className="test-btn-tag">BLUR</span>
                            <span className="test-btn-label">TEST GLASS [{prefs.glassQuality || 'AUTO'}]</span>
                          </button>

                          <button
                            type="button"
                            className={`test-action-btn ${!prefs.scrollEffectsEnabled ? 'test-active' : ''}`}
                            onClick={() => handleOneClickTest('scroll')}
                          >
                            <span className="test-btn-tag">TRANSFORM</span>
                            <span className="test-btn-label">TEST SCROLL FX [{prefs.scrollEffectsEnabled ? 'ON' : 'OFF'}]</span>
                          </button>

                          <button
                            type="button"
                            className={`test-action-btn ${!prefs.mouseEffectsEnabled ? 'test-active' : ''}`}
                            onClick={() => handleOneClickTest('mouse')}
                          >
                            <span className="test-btn-tag">POINTER</span>
                            <span className="test-btn-label">TEST MOUSE FX [{prefs.mouseEffectsEnabled ? 'ON' : 'OFF'}]</span>
                          </button>

                          <button
                            type="button"
                            className={`test-action-btn test-all-btn ${(!prefs.threeEnabled && !prefs.particlesEnabled) ? 'test-active' : ''}`}
                            onClick={() => handleOneClickTest('all')}
                          >
                            <span className="test-btn-tag">BASELINE</span>
                            <span className="test-btn-label">TEST ALL EFFECTS</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 2: GLOBAL THEMES & CUSTOM THEME STUDIO */}
                  {activeTab === 'themes' && (
                    <>
                      {/* Scope Selector Box */}
                      <div className="scope-selector-card">
                        <div className="scope-header-row">
                          <div className="scope-title-wrap">
                            <span className="scope-tag">TARGET SCOPE</span>
                            <span className="scope-heading">Theme Configuration Scope</span>
                          </div>
                          <div className="scope-segmented-control">
                            <button
                              type="button"
                              className={`scope-pill-btn ${scopeMode === 'LOCAL' ? 'active' : ''}`}
                              onClick={() => {
                                setScopeMode('LOCAL');
                                showToast('SCOPE: LOCAL ONLY (This Browser)', 'info');
                              }}
                            >
                              ○ LOCAL ONLY
                            </button>
                            <button
                              type="button"
                              className={`scope-pill-btn ${scopeMode === 'GLOBAL' ? 'active' : ''}`}
                              onClick={() => {
                                setScopeMode('GLOBAL');
                                showToast('SCOPE: GLOBAL (All Visitors)', 'info');
                              }}
                            >
                              ● GLOBAL (ALL VISITORS)
                            </button>
                          </div>
                        </div>
                        <p className="scope-hint-text">
                          {scopeMode === 'LOCAL'
                            ? '⚡ LOCAL MODE: Theme changes preview immediately on this device without affecting any other visitors.'
                            : '🌐 GLOBAL MODE: Theme changes stage globally. Click PUBLISH GLOBALLY to deploy to all visitors.'}
                        </p>
                      </div>

                      <div className="private-section-card">
                        <div className="card-heading">
                          <span className="card-title">09 / THEMES ({scopeMode === 'LOCAL' ? 'LOCAL PREVIEW' : 'GLOBAL PALETTE'})</span>
                          <span className="card-subtext">Active Theme: {prefs.theme?.toUpperCase()}</span>
                        </div>

                        <div className="themes-palette-grid">
                          {THEME_OPTIONS.map((t) => (
                            <button
                              key={t.key}
                              type="button"
                              className={`theme-card-btn ${prefs.theme === t.key ? 'active' : ''}`}
                              onClick={() => handleSelectTheme(t.key)}
                            >
                              <div className="theme-card-header">
                                <span className="theme-title">{t.label}</span>
                                {prefs.theme === t.key && <span className="active-tag">ACTIVE</span>}
                              </div>
                              <p className="theme-desc">{t.desc}</p>
                            </button>
                          ))}

                          {customThemes.map((ct, idx) => (
                            <button
                              key={`custom-${idx}`}
                              type="button"
                              className={`theme-card-btn ${prefs.theme === `custom-${ct.name}` ? 'active' : ''}`}
                              onClick={() => handleSelectTheme(`custom-${ct.name}`)}
                            >
                              <div className="theme-card-header">
                                <span className="theme-title">{ct.name}</span>
                                <span className="custom-tag">CUSTOM</span>
                              </div>
                              <p className="theme-desc">Accent: {ct.accent} | Bg: {ct.bgColor}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Theme Studio */}
                      <div className="private-section-card">
                        <div className="card-heading">
                          <span className="card-title">10 / CUSTOM THEME STUDIO</span>
                          <button
                            type="button"
                            className="btn-toggle-creator"
                            onClick={() => setShowCustomThemeCreator(!showCustomThemeCreator)}
                          >
                            {showCustomThemeCreator ? '▲ HIDE CREATOR' : '+ CREATE CUSTOM THEME'}
                          </button>
                        </div>

                        {showCustomThemeCreator && (
                          <form onSubmit={handleSaveCustomTheme} className="creator-form">
                            <div className="creator-grid">
                              <div className="field-group">
                                <label className="field-label" htmlFor="ct-name">THEME NAME</label>
                                <input
                                  id="ct-name"
                                  type="text"
                                  className="field-input"
                                  placeholder="e.g. Cyber Violet Studio"
                                  value={newThemeName}
                                  onChange={(e) => setNewThemeName(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="ct-bg">BACKGROUND COLOR</label>
                                <input
                                  id="ct-bg"
                                  type="text"
                                  className="field-input"
                                  value={newThemeBg}
                                  onChange={(e) => setNewThemeBg(e.target.value)}
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="ct-accent">ACCENT COLOR</label>
                                <input
                                  id="ct-accent"
                                  type="text"
                                  className="field-input"
                                  value={newThemeAccent}
                                  onChange={(e) => setNewThemeAccent(e.target.value)}
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="ct-sec-accent">SECONDARY ACCENT</label>
                                <input
                                  id="ct-sec-accent"
                                  type="text"
                                  className="field-input"
                                  value={newThemeSecondaryAccent}
                                  onChange={(e) => setNewThemeSecondaryAccent(e.target.value)}
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="ct-primary">PRIMARY TEXT</label>
                                <input
                                  id="ct-primary"
                                  type="text"
                                  className="field-input"
                                  value={newThemePrimary}
                                  onChange={(e) => setNewThemePrimary(e.target.value)}
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="ct-secondary">SECONDARY TEXT</label>
                                <input
                                  id="ct-secondary"
                                  type="text"
                                  className="field-input"
                                  value={newThemeSecondary}
                                  onChange={(e) => setNewThemeSecondary(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="creator-actions">
                              <button type="submit" className="btn-save-creator">
                                💾 SAVE CUSTOM THEME
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </>
                  )}

                  {/* TAB 3: GLOBAL BACKGROUNDS & CUSTOM BG STUDIO */}
                  {activeTab === 'backgrounds' && (
                    <>
                      {/* Scope Selector Box */}
                      <div className="scope-selector-card">
                        <div className="scope-header-row">
                          <div className="scope-title-wrap">
                            <span className="scope-tag">TARGET SCOPE</span>
                            <span className="scope-heading">Background Configuration Scope</span>
                          </div>
                          <div className="scope-segmented-control">
                            <button
                              type="button"
                              className={`scope-pill-btn ${scopeMode === 'LOCAL' ? 'active' : ''}`}
                              onClick={() => {
                                setScopeMode('LOCAL');
                                showToast('SCOPE: LOCAL ONLY (This Browser)', 'info');
                              }}
                            >
                              ○ LOCAL ONLY
                            </button>
                            <button
                              type="button"
                              className={`scope-pill-btn ${scopeMode === 'GLOBAL' ? 'active' : ''}`}
                              onClick={() => {
                                setScopeMode('GLOBAL');
                                showToast('SCOPE: GLOBAL (All Visitors)', 'info');
                              }}
                            >
                              ● GLOBAL (ALL VISITORS)
                            </button>
                          </div>
                        </div>
                        <p className="scope-hint-text">
                          {scopeMode === 'LOCAL'
                            ? '⚡ LOCAL MODE: Background changes preview immediately on this device without affecting any other visitors.'
                            : '🌐 GLOBAL MODE: Background changes stage globally. Click PUBLISH GLOBALLY to deploy to all visitors.'}
                        </p>
                      </div>

                      <div className="private-section-card">
                        <div className="card-heading">
                          <span className="card-title">11 / BACKGROUNDS ({scopeMode === 'LOCAL' ? 'LOCAL PREVIEW' : 'GLOBAL PALETTE'})</span>
                          <span className="card-subtext">Active: {prefs.background?.toUpperCase()}</span>
                        </div>

                        <div className="themes-palette-grid">
                          {BACKGROUND_OPTIONS.map((bg) => (
                            <button
                              key={bg.key}
                              type="button"
                              className={`theme-card-btn ${prefs.background === bg.key ? 'active' : ''}`}
                              onClick={() => handleSelectBackground(bg.key)}
                            >
                              <div className="theme-card-header">
                                <span className="theme-title">{bg.label}</span>
                                {prefs.background === bg.key && <span className="active-tag">ACTIVE</span>}
                              </div>
                              <p className="theme-desc">{bg.desc}</p>
                            </button>
                          ))}

                          {customBackgrounds.map((cb, idx) => (
                            <button
                              key={`custom-bg-${idx}`}
                              type="button"
                              className={`theme-card-btn ${prefs.background === `custom-${cb.name}` ? 'active' : ''}`}
                              onClick={() => handleSelectBackground(`custom-${cb.name}`)}
                            >
                              <div className="theme-card-header">
                                <span className="theme-title">{cb.name}</span>
                                <span className="custom-tag">CUSTOM</span>
                              </div>
                              <p className="theme-desc">Type: {cb.type} | Density: {cb.density}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Background Creator */}
                      <div className="private-section-card">
                        <div className="card-heading">
                          <span className="card-title">12 / CUSTOM BACKGROUND CREATOR</span>
                          <button
                            type="button"
                            className="btn-toggle-creator"
                            onClick={() => setShowCustomBgCreator(!showCustomBgCreator)}
                          >
                            {showCustomBgCreator ? '▲ HIDE CREATOR' : '+ CREATE CUSTOM BACKGROUND'}
                          </button>
                        </div>

                        {showCustomBgCreator && (
                          <form onSubmit={handleSaveCustomBackground} className="creator-form">
                            <div className="creator-grid">
                              <div className="field-group">
                                <label className="field-label" htmlFor="cbg-name">BACKGROUND NAME</label>
                                <input
                                  id="cbg-name"
                                  type="text"
                                  className="field-input"
                                  placeholder="e.g. Synaptic Cyber Flow"
                                  value={newBgName}
                                  onChange={(e) => setNewBgName(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="cbg-type">GRAPHICS TYPE</label>
                                <select
                                  id="cbg-type"
                                  className="field-input"
                                  value={newBgType}
                                  onChange={(e) => setNewBgType(e.target.value)}
                                >
                                  <option value="neural-flow">Neural Synapse Network</option>
                                  <option value="data-stream">Directional Data Stream</option>
                                  <option value="organic-flow">Organic Wave Curve</option>
                                  <option value="starfield">Deep Parallax Starfield</option>
                                  <option value="digital-code-flow">Digital Code Fragment Drift</option>
                                </select>
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="cbg-density">PARTICLE DENSITY</label>
                                <select
                                  id="cbg-density"
                                  className="field-input"
                                  value={newBgDensity}
                                  onChange={(e) => setNewBgDensity(e.target.value)}
                                >
                                  <option value="HIGH">High (Rich Density)</option>
                                  <option value="MEDIUM">Medium (Balanced)</option>
                                  <option value="LOW">Low (Battery Saver)</option>
                                </select>
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="cbg-speed">MOVEMENT SPEED</label>
                                <select
                                  id="cbg-speed"
                                  className="field-input"
                                  value={newBgSpeed}
                                  onChange={(e) => setNewBgSpeed(e.target.value)}
                                >
                                  <option value="SLOW">Slow (Serene Flow)</option>
                                  <option value="NORMAL">Normal</option>
                                  <option value="FAST">Fast (Dynamic Stream)</option>
                                </select>
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="cbg-opacity">OPACITY ({newBgOpacity}%)</label>
                                <input
                                  id="cbg-opacity"
                                  type="range"
                                  min="10"
                                  max="100"
                                  className="field-input"
                                  value={newBgOpacity}
                                  onChange={(e) => setNewBgOpacity(e.target.value)}
                                />
                              </div>

                              <div className="field-group">
                                <label className="field-label" htmlFor="cbg-accent">ACCENT COLOR</label>
                                <input
                                  id="cbg-accent"
                                  type="text"
                                  className="field-input"
                                  value={newBgAccent}
                                  onChange={(e) => setNewBgAccent(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="creator-actions">
                              <button type="submit" className="btn-save-creator">
                                💾 SAVE CUSTOM BACKGROUND
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </>
                  )}

                  {/* TAB 4: CONTENT & NOTES (DUAL STORAGE) */}
                  {activeTab === 'notes' && (
                    <div className="private-section-card">
                      <div className="card-heading">
                        <span className="card-title">06 / PRIVATE & GLOBAL CONTENT (SYNCHRONIZED)</span>
                        <span className="card-subtext">Dual-layer storage: Local Cache + Global Server JSON</span>
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="ctrl-notes-textarea">
                          PRIVATE DEVELOPMENT NOTES (GLOBAL & LOCAL)
                        </label>
                        <textarea
                          id="ctrl-notes-textarea"
                          className="field-textarea"
                          style={{ minHeight: '140px', fontFamily: 'var(--font-mono)' }}
                          value={prefs.notes || ''}
                          onChange={(e) => updatePref('notes', e.target.value)}
                          placeholder="Type development notes, ideas, architectural milestones..."
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="ctrl-focus-input">CURRENT FOCUS (DISPLAYED IN HUD)</label>
                        <input
                          id="ctrl-focus-input"
                          type="text"
                          className="field-input"
                          value={prefs.currentFocus || ''}
                          onChange={(e) => updatePref('currentFocus', e.target.value)}
                          placeholder="e.g. Web + AI Systems // Full-stack Architecture & ML"
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="ctrl-exp-input">CURRENT EXPERIMENT</label>
                        <input
                          id="ctrl-exp-input"
                          type="text"
                          className="field-input"
                          value={prefs.currentExperiment || ''}
                          onChange={(e) => updatePref('currentExperiment', e.target.value)}
                          placeholder="e.g. Three.js Digital Glass Core Refraction"
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="ctrl-devnote-input">DEVELOPER THOUGHT / REFLECTION</label>
                        <textarea
                          id="ctrl-devnote-input"
                          className="field-textarea"
                          value={prefs.developerNote || ''}
                          onChange={(e) => updatePref('developerNote', e.target.value)}
                          placeholder="e.g. Build first. Refine later. Keep the interface curious."
                        />
                      </div>

                      <div className="notes-dual-action-bar">
                        <div className="dual-action-info">
                          <span className="dual-storage-tag">DUAL STORAGE CONTROLS</span>
                          <span className="dual-storage-desc">Save locally to browser or publish globally to server JSON.</span>
                        </div>
                        <div className="dual-btn-group">
                          <button
                            type="button"
                            className="btn-save-local"
                            onClick={handleSaveLocal}
                          >
                            💾 SAVE LOCAL
                          </button>
                          <button
                            type="button"
                            className="btn-publish-global"
                            onClick={() => setShowPublishConfirmModal(true)}
                            disabled={isSavingGlobal}
                          >
                            {isSavingGlobal ? 'PUBLISHING...' : '⚡ PUBLISH GLOBAL'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: DEVELOPER CONSOLE */}
                  {activeTab === 'console' && (
                    <div className="private-section-card">
                      <div className="card-heading">
                        <span className="card-title">HIDDEN DEVELOPER TERMINAL</span>
                        <span className="card-subtext">shubham-core // zsh (authenticated)</span>
                      </div>

                      <div className="private-terminal-box">
                        {terminalHistory.map((item, idx) => (
                          <div key={idx} className={`terminal-line ${item.type}`}>
                            {item.text}
                          </div>
                        ))}
                        <form onSubmit={handleTerminalSubmit} className="terminal-form">
                          <span className="terminal-prompt">&gt;</span>
                          <input
                            type="text"
                            className="terminal-input"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            placeholder="type 'help', 'status', 'preview', 'save', 'logout', 'clear'..."
                            autoFocus
                          />
                        </form>
                        <div ref={terminalEndRef} />
                      </div>
                    </div>
                  )}

                  {/* TAB 6: DIAGNOSTICS & METRICS */}
                  {activeTab === 'system' && (
                    <div className="private-section-card">
                      <div className="card-heading">
                        <span className="card-title">07 / SYSTEM ARCHITECTURE & TELEMETRY</span>
                        <span className="card-subtext">Real-time Verified Performance Metrics</span>
                      </div>

                      <div className="diag-grid">
                        <div className="diag-item">
                          <span className="diag-key">PORTFOLIO CORE</span>
                          <span className="diag-val" style={{ color: '#10b981' }}>ONLINE</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">GLOBAL VERSION</span>
                          <span className="diag-val">v{serverVersion}</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">GLOBAL SCOPE</span>
                          <span className="diag-val" style={{ color: '#8b5cf6' }}>ALL VISITORS</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">THEME</span>
                          <span className="diag-val">{prefs.theme?.toUpperCase()}</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">BACKGROUND</span>
                          <span className="diag-val">{prefs.background?.toUpperCase()}</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">ACTIVE MODE</span>
                          <span className="diag-val">{prefs.performanceMode || 'BALANCED'}</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">LIVE RENDERING FPS</span>
                          <span className="diag-val">{fps} FPS</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">WEBGL CONTEXT</span>
                          <span className="diag-val">{webglStatus}</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">SESSION UPTIME</span>
                          <span className="diag-val">{formatUptime(sessionSeconds)}</span>
                        </div>
                        <div className="diag-item">
                          <span className="diag-key">TOTAL INTERACTIONS</span>
                          <span className="diag-val">{interactionCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 7: INTERACTION LOG */}
                  {activeTab === 'log' && (
                    <div className="private-section-card">
                      <div className="card-heading">
                        <span className="card-title">SESSION INTERACTION LOG</span>
                        <span className="card-subtext">Recent system events (local session)</span>
                      </div>

                      <div className="log-stream">
                        {(prefs.interactionLog || []).map((entry) => (
                          <div key={entry.id} className="log-entry">
                            <span className="log-timestamp">{entry.timestamp}</span>
                            <span className="log-message">{entry.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 08: Global Actions Footer */}
                <div className="private-panel-footer">
                  <div className="footer-actions-left">
                    <button
                      type="button"
                      className="btn-footer-action"
                      onClick={handleRefreshGlobal}
                      title="Fetch latest server configuration"
                    >
                      ⟳ Refresh Global Config
                    </button>

                    <button
                      type="button"
                      className={`btn-footer-action ${isPreviewActive ? 'preview-active' : ''}`}
                      onClick={isPreviewActive ? handleExitPreview : handleStartPreview}
                      title="Preview theme & background locally before publishing"
                    >
                      {isPreviewActive ? '✕ Exit Preview' : '👁️ Preview Locally'}
                    </button>

                    <button
                      type="button"
                      className="btn-footer-action"
                      onClick={handleSaveLocal}
                      title="Save to browser localStorage"
                    >
                      💾 Save Local
                    </button>

                    {!showResetPerfConfirm ? (
                      <button
                        type="button"
                        className="btn-danger-ghost"
                        onClick={() => setShowResetPerfConfirm(true)}
                      >
                        Reset to Balanced
                      </button>
                    ) : (
                      <div className="reset-confirm-bar">
                        <span className="reset-confirm-text">RESET ALL TO BALANCED?</span>
                        <button
                          type="button"
                          className="btn-confirm-yes"
                          onClick={handleResetPerformance}
                        >
                          CONFIRM
                        </button>
                        <button
                          type="button"
                          className="btn-confirm-cancel"
                          onClick={() => setShowResetPerfConfirm(false)}
                        >
                          CANCEL
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="footer-actions-right">
                    <button
                      type="button"
                      className="btn-footer-publish"
                      onClick={() => setShowPublishConfirmModal(true)}
                      disabled={isSavingGlobal}
                    >
                      {isSavingGlobal ? 'PUBLISHING...' : '⚡ APPLY TO ALL VISITORS'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
