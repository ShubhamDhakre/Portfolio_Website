import React, { useState, useEffect, useCallback, useRef } from 'react';
import useTheme from './hooks/useTheme';
import useScrollProgress from './hooks/useScrollProgress';

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
import { DEFAULT_DEV_PERFORMANCE } from './utils/performanceConfig';

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
  const { progress, isScrolled } = useScrollProgress();

  // Synchronized Global Site Settings & Dual-Storage Content
  const {
    settings: perfSettings,
    setSettings: setPerfSettings,
    content: globalContent,
    version: globalVersion,
    updatedAt: globalUpdatedAt,
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

    // If globalVersion updated (admin published new settings), or visitor has default/initial selection:
    const isNewPublication = globalVersion && lastAppliedGlobalVersionRef.current !== globalVersion;
    if (isNewPublication || !isExplicitlySelected) {
      lastAppliedGlobalVersionRef.current = globalVersion;
      setTheme(serverTheme, false);
    }
  }, [perfSettings?.theme, globalVersion, setTheme, isExplicitlySelected]);

  // Hidden developer console state (Navbar trigger / Ctrl+K)
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);

  // Hidden Private Control Layer workspace state
  const [isPrivateLayerOpen, setIsPrivateLayerOpen] = useState(false);
  const [customFocus, setCustomFocus] = useState(null);

  // Active section tracking for WorkspaceHUD
  const [activeSection, setActiveSection] = useState('hero');

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

  // Section Observer to update activeSection for WorkspaceHUD
  useEffect(() => {
    const sectionIds = ['hero', 'about', 'skills', 'projects', 'experiments', 'contact'];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0.1,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  // IntersectionObserver for scroll-reveal effects
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.08,
    });

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

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
        onEasterEggTrigger={() => setIsEasterEggOpen(true)}
        systemStatus={systemStatus}
      />

      {/* Persistent Fixed Bottom-Left Session Uptime & Contextual Focus HUD */}
      <WorkspaceHUD
        activeSection={activeSection}
        customFocus={customFocus || globalContent?.currentFocus}
      />

      {/* Persistent Fixed Bottom-Right Developer Workspace Status HUD */}
      <DeveloperStatus />

      {/* Main Digital Workspace Sections */}
      <main id="main-content">
        <Hero
          theme={theme}
          scrollProgress={progress}
          onStateChange={handleStateChange}
          onUnlockPrivateLayer={() => setIsPrivateLayerOpen(true)}
          isPrivateModeActive={isPrivateLayerOpen}
          perfSettings={perfSettings}
        />

        <div className="scroll-reveal">
          <About onStateChange={handleStateChange} />
        </div>

        <div className="scroll-reveal">
          <Skills onStateChange={handleStateChange} />
        </div>

        <div className="scroll-reveal">
          <Projects onStateChange={handleStateChange} />
        </div>

        <div className="scroll-reveal">
          <Experiments onStateChange={handleStateChange} />
        </div>

        <div className="scroll-reveal">
          <Contact />
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
