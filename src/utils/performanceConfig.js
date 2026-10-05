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

export const DEFAULT_SCROLL_REVEAL = {
  enabled: true,
  style: '3d-circle', // '3d-circle' | '3d-fade' | 'fade-up' | 'subtle-scale'
  rotation: 30, // deg (0 to 45)
  scale: 0.8, // (0.5 to 0.98)
  perspective: 1400, // px (600 to 2500)
  blur: 8, // px (0 to 20)
  rangeEntry: 10, // % (0 to 30)
  rangeCover: 50, // % (25 to 80)
  duration: 700, // ms (200 to 2000) fallback for non-scroll-timeline
  staggerDelay: 80, // ms (0 to 250)
  distance: 24, // px (0 to 80)
  threshold: 0.1, // (0.0 to 0.5)
  replay: false, // boolean
};

export const DEFAULT_CONTACT_TILT = {
  enabled: true,
  maxRotationX: 12, // deg (2 to 30)
  maxRotationY: 12, // deg (2 to 30)
  perspective: 1000, // px (500 to 2500)
  speed: 400, // ms (100 to 1000)
  returnSpeed: 600, // ms (200 to 1500)
  hoverScale: 1.02, // (1.00 to 1.10)
  lighting: true, // boolean
  lightingIntensity: 0.35, // (0.1 to 0.8)
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
  scrollReveal: { ...DEFAULT_SCROLL_REVEAL },
  contactTilt: { ...DEFAULT_CONTACT_TILT },
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
