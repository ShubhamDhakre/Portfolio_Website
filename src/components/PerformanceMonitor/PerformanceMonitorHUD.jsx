import React, { useState, useEffect, memo } from 'react';
import './PerformanceMonitorHUD.css';

import { DEFAULT_DEV_PERFORMANCE } from '../../utils/performanceConfig';

/**
 * PerformanceMonitorHUD
 * Developer-only floating telemetry HUD.
 * Renders based on global.devPerformance.visible (or local preview override).
 * Calculates live FPS, frame times, device DPR, quality levels & viewport.
 * Individual rows are conditionally rendered based on global/local devPerformance settings.
 */
function PerformanceMonitorHUD({ perfSettings = {}, devPerformance, onClose }) {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.6);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const devPerfConfig = devPerformance || perfSettings.devPerformance || DEFAULT_DEV_PERFORMANCE;

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId;

    const loop = (now) => {
      frameCount++;
      const elapsed = now - lastTime;
      if (elapsed >= 500) {
        const currentFps = Math.round((frameCount * 1000) / elapsed);
        const currentFrameTime = Math.round((elapsed / frameCount) * 10) / 10;
        setFps(currentFps);
        setFrameTime(currentFrameTime);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (devPerfConfig.visible === false) {
    return null;
  }

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1).toFixed(1) : '1.0';

  const fpsClass = fps >= 50 ? 'perf-fps-good' : fps >= 30 ? 'perf-fps-med' : 'perf-fps-low';

  return (
    <aside className="perf-monitor-overlay" aria-label="Developer Performance Monitor">
      <div className="perf-hud-header">
        <span className="perf-hud-title">DEV // PERFORMANCE</span>
        {onClose && (
          <button
            type="button"
            className="perf-hud-close"
            onClick={onClose}
            title="Close Performance Monitor"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {devPerfConfig.showFPS !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">FPS</span>
          <span className={`perf-hud-val perf-fps-badge ${fpsClass}`}>{fps} FPS</span>
        </div>
      )}

      {devPerfConfig.showFrameTime !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">FRAME TIME</span>
          <span className="perf-hud-val">{frameTime} ms</span>
        </div>
      )}

      {devPerfConfig.showDPR !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">DEVICE DPR</span>
          <span className="perf-hud-val">{dpr}x</span>
        </div>
      )}

      {devPerfConfig.showMode !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">MODE</span>
          <span className="perf-hud-val" style={{ color: 'var(--accent-highlight)' }}>
            {perfSettings.performanceMode || perfSettings.perfMode || 'AUTO'}
          </span>
        </div>
      )}

      {devPerfConfig.showDigitalCore !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">3D DIGITAL CORE</span>
          <span className="perf-hud-val" style={{ color: perfSettings.threeEnabled !== false ? '#10b981' : '#ef4444' }}>
            {perfSettings.threeEnabled !== false ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>
      )}

      {devPerfConfig.showParticles !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">PARTICLES</span>
          <span className="perf-hud-val">
            {perfSettings.particlesEnabled !== false ? (perfSettings.particleQuality || 'AUTO') : 'OFF'}
          </span>
        </div>
      )}

      {devPerfConfig.showGlassBlur !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">GLASS BLUR</span>
          <span className="perf-hud-val">
            {perfSettings.glassEnabled !== false ? (perfSettings.glassQuality || 'AUTO') : 'FLAT'}
          </span>
        </div>
      )}

      {devPerfConfig.showScrollFX !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">SCROLL FX</span>
          <span className="perf-hud-val">
            {perfSettings.scrollEffectsEnabled !== false ? 'ON' : 'OFF'}
          </span>
        </div>
      )}

      {devPerfConfig.showViewport !== false && (
        <div className="perf-hud-row">
          <span className="perf-hud-key">VIEWPORT</span>
          <span className="perf-hud-val">{viewport.w} × {viewport.h}</span>
        </div>
      )}
    </aside>
  );
}

export default memo(PerformanceMonitorHUD);
