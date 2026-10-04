/**
 * performanceConfig.js
 * Centralized developer performance settings and presets for the Global Control Center.
 * Persisted in server/data/site-settings.json (Global) and localStorage (Local Cache).
 */

export const DEFAULT_DEV_PERFORMANCE = {
  visible: false, // Clean by default; toggleable via <SYS.DEV /> or Ctrl+K
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

export const DEFAULT_PERFORMANCE_CONFIG = {
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
  scrollEffectsEnabled: true,
  mouseEffectsEnabled: true,
  cursorEnabled: true,
  animationQuality: 'MEDIUM', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  renderScale: 'AUTO', // 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO'
  perfMonitorEnabled: false,
  devPerformance: { ...DEFAULT_DEV_PERFORMANCE },
};

export const PERFORMANCE_MODES = {
  EXTREME_SMOOTH: {
    key: 'EXTREME_SMOOTH',
    label: 'EXTREME SMOOTH',
    desc: 'Very low particles, minimal glass blur & low render scale for low-power mobile chips.',
    config: {
      performanceMode: 'EXTREME_SMOOTH',
      threeEnabled: true,
      threeInteraction: false,
      digitalCoreEnabled: true,
      particlesEnabled: true,
      particleQuality: 'LOW',
      glassEnabled: true,
      glassQuality: 'LOW',
      backgroundEnabled: true,
      backgroundQuality: 'LOW',
      scrollEffectsEnabled: false,
      mouseEffectsEnabled: false,
      cursorEnabled: false,
      animationQuality: 'LOW',
      renderScale: 'LOW',
    }
  },
  SMOOTH: {
    key: 'SMOOTH',
    label: 'SMOOTH',
    desc: 'Optimized particle count, medium glass, moderate render scale for high-refresh scrolling.',
    config: {
      performanceMode: 'SMOOTH',
      threeEnabled: true,
      threeInteraction: true,
      digitalCoreEnabled: true,
      particlesEnabled: true,
      particleQuality: 'LOW',
      glassEnabled: true,
      glassQuality: 'MEDIUM',
      backgroundEnabled: true,
      backgroundQuality: 'MEDIUM',
      scrollEffectsEnabled: true,
      mouseEffectsEnabled: true,
      cursorEnabled: true,
      animationQuality: 'MEDIUM',
      renderScale: 'MEDIUM',
    }
  },
  BALANCED: {
    key: 'BALANCED',
    label: 'BALANCED',
    desc: 'Default engineering mode. Balanced WebGL shader load, rich glass & smooth 60 FPS.',
    config: {
      performanceMode: 'BALANCED',
      threeEnabled: true,
      threeInteraction: true,
      digitalCoreEnabled: true,
      particlesEnabled: true,
      particleQuality: 'MEDIUM',
      glassEnabled: true,
      glassQuality: 'MEDIUM',
      backgroundEnabled: true,
      backgroundQuality: 'MEDIUM',
      scrollEffectsEnabled: true,
      mouseEffectsEnabled: true,
      cursorEnabled: true,
      animationQuality: 'MEDIUM',
      renderScale: 'AUTO',
    }
  },
  HIGH_QUALITY: {
    key: 'HIGH_QUALITY',
    label: 'HIGH QUALITY',
    desc: 'Full particle rings, higher glass blur depth, rich network background & full pointer FX.',
    config: {
      performanceMode: 'HIGH_QUALITY',
      threeEnabled: true,
      threeInteraction: true,
      digitalCoreEnabled: true,
      particlesEnabled: true,
      particleQuality: 'HIGH',
      glassEnabled: true,
      glassQuality: 'HIGH',
      backgroundEnabled: true,
      backgroundQuality: 'HIGH',
      scrollEffectsEnabled: true,
      mouseEffectsEnabled: true,
      cursorEnabled: true,
      animationQuality: 'HIGH',
      renderScale: 'HIGH',
    }
  },
  EXTREME_QUALITY: {
    key: 'EXTREME_QUALITY',
    label: 'EXTREME QUALITY',
    desc: 'Maximum desktop visual fidelity with highest render resolution & specular highlights.',
    config: {
      performanceMode: 'EXTREME_QUALITY',
      threeEnabled: true,
      threeInteraction: true,
      digitalCoreEnabled: true,
      particlesEnabled: true,
      particleQuality: 'HIGH',
      glassEnabled: true,
      glassQuality: 'HIGH',
      backgroundEnabled: true,
      backgroundQuality: 'HIGH',
      scrollEffectsEnabled: true,
      mouseEffectsEnabled: true,
      cursorEnabled: true,
      animationQuality: 'HIGH',
      renderScale: 'HIGH',
    }
  },
  AUTO: {
    key: 'AUTO',
    label: 'AUTO ADAPTIVE',
    desc: 'Dynamically adapts quality tier based on screen DPR, hardware tier, and frame timings.',
    config: {
      performanceMode: 'AUTO',
      threeEnabled: true,
      threeInteraction: true,
      digitalCoreEnabled: true,
      particlesEnabled: true,
      particleQuality: 'AUTO',
      glassEnabled: true,
      glassQuality: 'AUTO',
      backgroundEnabled: true,
      backgroundQuality: 'AUTO',
      scrollEffectsEnabled: true,
      mouseEffectsEnabled: true,
      cursorEnabled: true,
      animationQuality: 'AUTO',
      renderScale: 'AUTO',
    }
  }
};

export const PERFORMANCE_PRESETS = PERFORMANCE_MODES;
