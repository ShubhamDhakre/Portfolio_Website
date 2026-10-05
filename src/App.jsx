import React, { useState, useEffect, useCallback, useRef } from 'react';
import useTheme from './hooks/useTheme';
import { useIsScrolled } from './hooks/useScrollProgress';

import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import DeveloperStatus from './components/DeveloperStatus/DeveloperStatus';
import WorkspaceHUD from './components/WorkspaceHUD/WorkspaceHUD';
import About from './components/About/About';
import Skills from './components/Skills/Skills';
import Projects from './components/Projects/Projects';
import Experiments from './components/Experiments/Experiments';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import CustomCursor from './components/CustomCursor/CustomCursor';
import WebSystemBackground from './components/WebSystemBackground/WebSystemBackground';
import PerformanceMonitorHUD from './components/PerformanceMonitor/PerformanceMonitorHUD';
import { useGlobalSiteSettings } from './hooks/useGlobalSiteSettings';
import { DEFAULT_DEV_PERFORMANCE, DEFAULT_SCROLL_REVEAL, DEFAULT_CONTACT_TILT } from './utils/performanceConfig';

// Lazy-load hidden Easter Egg console and Private Control Layer to keep initial bundle lean
const EasterEggModal = React.lazy(() => import('./components/EasterEgg/EasterEggModal'));
const PrivateControlLayer = React.lazy(() => import('./components/PrivateControlLayer/PrivateControlLayer'));

import './App.css';

/**
 * App
 * Main Digital Workspace Coordinator.
 * Manages theme, scroll, mouse-reactive ambient spotlight,
 * dynamic AI interface state transitions, developer shortcut listeners,
 * global server settings & hidden Password-Protected Global Control Center.
 */
export default function App() {
  const { theme, toggleTheme, setTheme, isExplicitlySelected } = useTheme();
  const isScrolled = useIsScrolled(30);

  // Synchronized Global Site Settings & Dual-Storage Content
  const {
    settings: perfSettings,
    setSettings: setPerfSettings,
    content: globalContent,
    version: globalVersion,
    updatedAt: globalUpdatedAt,
    isLoaded: isServerSettingsLoaded,
    refreshGlobalSettings
  } = useGlobalSiteSettings();

  // Synchronize published global theme to useTheme adhering to precedence rules:
  // 1. Local Preview active -> strictly isolated, never overwritten by global
  // 2. Explicit user toggle -> preserved during session unless a new global configuration is published
  // 3. Published server global theme -> applied to visitor display and HTML data-theme attribute
  const lastAppliedGlobalVersionRef = useRef(null);

  useEffect(() => {
    const serverTheme = perfSettings?.theme;
    if (!serverTheme) return;

    // Check if local preview mode is active on this browser
    let isPreview = false;
    try {
      const raw = localStorage.getItem('portfolio_private_workspace');
      if (raw) {
        const parsed = JSON.parse(raw);
        isPreview = Boolean(parsed.previewMode);
      }
    } catch {}

    if (isPreview) return;

    // Once authoritative server configuration is loaded:
    // If a new publication version is detected or visitor has not explicitly selected a personal theme
    if (isServerSettingsLoaded) {
      const isNewPublication = globalVersion && lastAppliedGlobalVersionRef.current !== globalVersion;
      if (isNewPublication || !isExplicitlySelected) {
        lastAppliedGlobalVersionRef.current = globalVersion;
        setTheme(serverTheme, false);
      }
    }
  }, [perfSettings?.theme, globalVersion, setTheme, isExplicitlySelected, isServerSettingsLoaded]);

  // Hidden developer console state (Navbar trigger / Ctrl+K)
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);

  // Hidden Private Control Layer workspace state
  const [isPrivateLayerOpen, setIsPrivateLayerOpen] = useState(false);
  const [customFocus, setCustomFocus] = useState(null);

  // Dynamic AI interface state engine: 'READY' | 'EXPLORING' | 'CORE_ACTIVE' | 'BUILDING'
  const [systemStatus, setSystemStatus] = useState('READY');
  const statusTimerRef = useRef(null);

  const handleStateChange = useCallback((newStatus) => {
    setSystemStatus(newStatus);
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    // Smoothly return to READY after 4 seconds of idle
    statusTimerRef.current = setTimeout(() => {
      setSystemStatus((current) => (current === newStatus ? 'READY' : current));
      statusTimerRef.current = null;
    }, 4000);
  }, []);

  const handleEasterEggTrigger = useCallback(() => {
    setIsEasterEggOpen(true);
  }, []);

  const handleUnlockPrivateLayer = useCallback(() => {
    setIsPrivateLayerOpen(true);
  }, []);

  // Keyboard shortcut listener: Ctrl+K / Cmd+K or backtick (`) to open developer console
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsEasterEggOpen((prev) => !prev);
      } else if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setIsEasterEggOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Scroll Reveal Animation Engine
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const srConfig = perfSettings?.scrollReveal || DEFAULT_SCROLL_REVEAL;
    const isEnabled = srConfig.enabled !== false && perfSettings?.scrollEffectsEnabled !== false;
    const style = srConfig.style || '3d-circle';
    const duration = Number(srConfig.duration) || 700;
    const staggerDelay = Number(srConfig.staggerDelay) || 80;
    const distance = Number(srConfig.distance) || 24;
    const rotation = typeof srConfig.rotation === 'number' ? srConfig.rotation : (Number(srConfig.rotation) || 30);
    const scale = typeof srConfig.scale === 'number' ? srConfig.scale : (Number(srConfig.scale) || 0.8);
    const perspective = typeof srConfig.perspective === 'number' ? srConfig.perspective : (Number(srConfig.perspective) || 1400);
    const blur = typeof srConfig.blur === 'number' ? srConfig.blur : (!isNaN(Number(srConfig.blur)) ? Number(srConfig.blur) : 8);
    const rangeEntry = typeof srConfig.rangeEntry === 'number' ? srConfig.rangeEntry : (Number(srConfig.rangeEntry) || 10);
    const rangeCover = typeof srConfig.rangeCover === 'number' ? srConfig.rangeCover : (Number(srConfig.rangeCover) || 50);
    const threshold = Math.min(Math.max(Number(srConfig.threshold) || 0.1, 0.0), 1.0);
    const replay = Boolean(srConfig.replay);

    root.style.setProperty('--reveal-duration', `${duration}ms`);
    root.style.setProperty('--reveal-distance', `${distance}px`);
    root.style.setProperty('--reveal-stagger-delay', `${staggerDelay}ms`);
    root.style.setProperty('--reveal-rotation', `${rotation}deg`);
    root.style.setProperty('--reveal-scale', `${scale}`);
    root.style.setProperty('--reveal-perspective', `${perspective}px`);
    root.style.setProperty('--reveal-blur', `${blur}px`);
    root.style.setProperty('--reveal-range-entry', `${rangeEntry}%`);
    root.style.setProperty('--reveal-range-cover', `${rangeCover}%`);
    root.setAttribute('data-reveal-style', style);
    root.setAttribute('data-reveal-replay', String(replay));

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isEnabled || prefersReducedMotion) {
      body.classList.add('scroll-reveal-disabled');
      const elements = document.querySelectorAll('.scroll-reveal, .reveal-on-scroll');
      elements.forEach((el) => {
        el.classList.add('is-revealed');
        el.classList.add('has-revealed');
      });
      return;
    }

    body.classList.remove('scroll-reveal-disabled');

    const supportsScrollTimeline = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline', 'view()');

    if (supportsScrollTimeline) {
      const revealElements = document.querySelectorAll('.scroll-reveal, .reveal-on-scroll');
      revealElements.forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observerCallback = (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          entry.target.classList.add('has-revealed');
          if (!replay) {
            obs.unobserve(entry.target);
          }
        } else if (replay) {
          entry.target.classList.remove('is-revealed');
          entry.target.classList.remove('has-revealed');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold,
    });

    const revealElements = document.querySelectorAll('.scroll-reveal, .reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [
    perfSettings?.scrollReveal,
    perfSettings?.scrollReveal?.enabled,
    perfSettings?.scrollReveal?.style,
    perfSettings?.scrollReveal?.duration,
    perfSettings?.scrollReveal?.staggerDelay,
    perfSettings?.scrollReveal?.distance,
    perfSettings?.scrollReveal?.rotation,
    perfSettings?.scrollReveal?.scale,
    perfSettings?.scrollReveal?.perspective,
    perfSettings?.scrollReveal?.blur,
    perfSettings?.scrollReveal?.rangeEntry,
    perfSettings?.scrollReveal?.rangeCover,
    perfSettings?.scrollReveal?.threshold,
    perfSettings?.scrollReveal?.replay,
    perfSettings?.scrollEffectsEnabled,
  ]);

  // Performance Styles Synchronization (Glass quality, Scroll FX, Animations, Mouse FX)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // 1. Glass Quality / Material Pipeline
    const glassQuality = perfSettings.glassQuality || 'AUTO';
    const glassEnabled = perfSettings.glassEnabled !== false;

    if (!glassEnabled || glassQuality === 'LOW') {
      root.style.setProperty('--glass-blur', '4px');
      root.style.setProperty('--glass-saturate', '115%');
      body.classList.add('perf-glass-low');
    } else if (glassQuality === 'HIGH') {
      root.style.setProperty('--glass-blur', '26px');
      root.style.setProperty('--glass-saturate', '190%');
      body.classList.remove('perf-glass-low');
    } else {
      root.style.setProperty('--glass-blur', '16px');
      root.style.setProperty('--glass-saturate', '150%');
      body.classList.remove('perf-glass-low');
    }

    // 2. Scroll Parallax & Visual Transforms (normal page scrolling remains 100% active)
    if (perfSettings.scrollEffectsEnabled === false) {
      body.classList.add('perf-disable-scroll-fx');
    } else {
      body.classList.remove('perf-disable-scroll-fx');
    }

    // 3. Animation Quality
    if (perfSettings.animationQuality === 'LOW') {
      body.classList.add('perf-anim-low');
    } else {
      body.classList.remove('perf-anim-low');
    }
  }, [perfSettings.glassQuality, perfSettings.glassEnabled, perfSettings.scrollEffectsEnabled, perfSettings.animationQuality]);

  return (
    <div className="app-layout">
      {/* Desktop Custom Cursor with Developer Override */}
      <CustomCursor cursorEnabled={perfSettings.cursorEnabled !== false} />

      {/* Mouse Reactive Radial Ambient Spotlight Layer */}
      {perfSettings.mouseEffectsEnabled !== false && (
        <div className="mouse-spotlight-layer" aria-hidden="true" />
      )}

      {/* Organic Digital Web System Network & Architecture Background */}
      <WebSystemBackground theme={theme} perfSettings={perfSettings} />

      {/* Floating Dark Glass Application Navbar */}
      <Navbar
        isScrolled={isScrolled}
        theme={theme}
        toggleTheme={toggleTheme}
        onEasterEggTrigger={handleEasterEggTrigger}
        systemStatus={systemStatus}
      />

      {/* Persistent Fixed Bottom-Left Session Uptime & Contextual Focus HUD */}
      <WorkspaceHUD
        customFocus={customFocus || globalContent?.currentFocus}
      />

      {/* Persistent Fixed Bottom-Right Developer Workspace Status HUD */}
      <DeveloperStatus />

      {/* Main Digital Workspace Sections */}
      <main id="main-content">
        <Hero
          theme={theme}
          onStateChange={handleStateChange}
          onUnlockPrivateLayer={handleUnlockPrivateLayer}
          isPrivateModeActive={isPrivateLayerOpen}
          perfSettings={perfSettings}
        />

        <div className="section-container">
          <About onStateChange={handleStateChange} />
        </div>

        <div className="section-container">
          <Skills onStateChange={handleStateChange} />
        </div>

        <div className="section-container">
          <Projects onStateChange={handleStateChange} />
        </div>

        <div className="section-container">
          <Experiments onStateChange={handleStateChange} />
        </div>

        <div className="section-container">
          <Contact tiltSettings={perfSettings?.contactTilt || DEFAULT_CONTACT_TILT} />
        </div>
      </main>

      {/* Technical Footer */}
      <Footer />

      {/* Hidden Developer Console Easter Egg */}
      {isEasterEggOpen && (
        <React.Suspense fallback={null}>
          <EasterEggModal
            isOpen={isEasterEggOpen}
            onClose={() => setIsEasterEggOpen(false)}
            onOpenControlCenter={() => {
              setIsEasterEggOpen(false);
              setIsPrivateLayerOpen(true);
            }}
          />
        </React.Suspense>
      )}

      {/* Secret Password-Protected Global Control Center */}
      {isPrivateLayerOpen && (
        <React.Suspense fallback={null}>
          <PrivateControlLayer
            isOpen={isPrivateLayerOpen}
            onClose={() => setIsPrivateLayerOpen(false)}
            onOpen={() => setIsPrivateLayerOpen(true)}
            theme={theme}
            setTheme={setTheme}
            toggleTheme={toggleTheme}
            onFocusChange={setCustomFocus}
            onPrefsChange={setPerfSettings}
            globalSettings={perfSettings}
            globalContent={globalContent}
            globalVersion={globalVersion}
            globalUpdatedAt={globalUpdatedAt}
            refreshGlobalSettings={refreshGlobalSettings}
          />
        </React.Suspense>
      )}

      {/* Developer Live Performance & Telemetry HUD Overlay */}
      {(perfSettings.devPerformance?.visible ?? DEFAULT_DEV_PERFORMANCE.visible) && (
        <PerformanceMonitorHUD
          perfSettings={perfSettings}
          devPerformance={perfSettings.devPerformance || DEFAULT_DEV_PERFORMANCE}
          onClose={() => setPerfSettings((prev) => ({
            ...prev,
            devPerformance: {
              ...(prev.devPerformance || DEFAULT_DEV_PERFORMANCE),
              visible: false
            },
            perfMonitorEnabled: false
          }))}
        />
      )}
    </div>
  );
}
