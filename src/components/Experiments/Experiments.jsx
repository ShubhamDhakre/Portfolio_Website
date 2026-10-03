import React, { useState } from 'react';
import './Experiments.css';

/**
 * Lab / Experiments
 * Interactive developer sandbox demonstrating technical experiments:
 * 01 Interactive Glass UI
 * 02 Three.js Digital Core
 * 03 Mouse Reactive Background
 * 04 Interactive Skill Constellation
 * 05 Theme System
 * 06 AI Interview Analysis Concept
 */
function Experiments({ onStateChange }) {
  const [activeExp, setActiveExp] = useState(0);

  // Exp 01: Glass Tilt
  const [glassTilt, setGlassTilt] = useState({ x: 0, y: 0 });

  // Exp 02: Core Shader Mode
  const [coreMode, setCoreMode] = useState('wireframe');

  // Exp 03: Mouse Spotlight Radius & Opacity
  const [spotlightRadius, setSpotlightRadius] = useState(650);

  // Exp 06: AI Speech Simulator
  const [speechWpm, setSpeechWpm] = useState(136);
  const [fillerCount, setFillerCount] = useState(2);
  const [audioLevel, setAudioLevel] = useState(68);

  const handleGlassMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 22;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -22;
    setGlassTilt({ x, y });
  };

  const handleGlassMouseLeave = () => {
    setGlassTilt({ x: 0, y: 0 });
  };

  const handleSelectExp = (index) => {
    setActiveExp(index);
    if (onStateChange) onStateChange(`LAB.EXP_0${index + 1}`);
  };

  const experimentsList = [
    {
      id: "exp-1",
      number: "01",
      title: "Interactive Glass UI",
      concept: "Dynamic 3D perspective tilt and specular highlight calculation using mouse coordinates relative to element bounding box.",
      tags: ["CSS 3D", "Perspective", "Glassmorphism"],
      status: "ACTIVE",
    },
    {
      id: "exp-2",
      number: "02",
      title: "Three.js Digital Core",
      concept: "Procedural wireframe geometries, opacity buffers, and multi-axis rotational velocity vectors without heavyweight libraries.",
      tags: ["Three.js", "WebGL", "Math"],
      status: "ACTIVE",
    },
    {
      id: "exp-3",
      number: "03",
      title: "Mouse Reactive Background",
      concept: "Dynamic radial spotlight gradient synchronized with window pointer coordinates across an ambient digital grid.",
      tags: ["CSS Variables", "Pointer Events", "Ambient Lighting"],
      status: "ACTIVE",
    },
    {
      id: "exp-4",
      number: "04",
      title: "Interactive Skill Constellation",
      concept: "Procedural SVG graph linking skills as interconnected vertices with hover proximity highlighting and bidirectional edge analysis.",
      tags: ["SVG Network", "Graph Theory", "UI/UX"],
      status: "ACTIVE",
    },
    {
      id: "exp-5",
      number: "05",
      title: "Theme System",
      concept: "Centralized CSS custom property token architecture synchronized across WebGL canvases and DOM nodes with localStorage persistence.",
      tags: ["CSS Tokens", "localStorage", "Zero-Dependency"],
      status: "ACTIVE",
    },
    {
      id: "exp-6",
      number: "06",
      title: "AI Interview Analysis Concept",
      concept: "Simulating speech pacing metrics (WPM), voice volume variance, and lexical filler detection for the AI Interview Coach.",
      tags: ["Audio Processing", "AI/ML Concept", "Pacing"],
      status: "EXPERIMENTAL",
    }
  ];

  return (
    <section id="experiments" className="experiments-section">
      <div className="section-header">
        <span className="section-route-tag">/lab</span>
        <span className="section-number">04</span>
        <h2 className="section-title">LAB / EXPERIMENTS</h2>
        <div className="section-divider" />
        <span className="section-component-pill">&lt;LabSandbox /&gt;</span>
      </div>

      <div className="experiments-intro">
        <p className="experiments-intro-text">
          A dedicated space for technical experiments, prototypes, and proof-of-concepts exploring WebGL, math, audio pacing metrics, and glass physics. Select an experiment to interact with its live sandbox.
        </p>
      </div>

      <div className="experiments-layout">
        {/* Left Column: Experiment Selector Cards */}
        <div className="experiments-selector">
          {experimentsList.map((exp, index) => {
            const isSelected = activeExp === index;
            return (
              <div
                key={exp.id}
                className={`exp-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectExp(index)}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
              >
                <div className="exp-card-top">
                  <span className="exp-number">EXPERIMENT_{exp.number}</span>
                  <span className="exp-status-indicator">STATUS: {exp.status}</span>
                </div>
                <h3 className="exp-title">{exp.title}</h3>
                <p className="exp-concept-snippet">{exp.concept}</p>
                <div className="exp-tags">
                  {exp.tags.map((t) => (
                    <span key={t} className="exp-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Interactive Sandbox Stage */}
        <div className="experiments-stage">
          <div className="stage-glass-panel">
            <div className="stage-header">
              <span className="stage-terminal-tag">
                LIVE SANDBOX // EXPERIMENT_{experimentsList[activeExp].number} // STATUS: {experimentsList[activeExp].status}
              </span>
              <span className="stage-title">{experimentsList[activeExp].title}</span>
            </div>

            <div className="stage-viewport">
              {/* Sandbox 01: Reactive Glass Tilt */}
              {activeExp === 0 && (
                <div className="sandbox-tilt-container">
                  <div
                    className="tilt-glass-card"
                    onMouseMove={handleGlassMouseMove}
                    onMouseLeave={handleGlassMouseLeave}
                    style={{
                      transform: `perspective(800px) rotateX(${glassTilt.y}deg) rotateY(${glassTilt.x}deg)`,
                    }}
                  >
                    <div className="tilt-glare" />
                    <span className="tilt-icon">✨</span>
                    <h4>Move Your Cursor Over This Panel</h4>
                    <p>Real-time CSS 3D tilt calculation based on cursor delta from card center.</p>
                    <div className="tilt-data">
                      <span>rotX: {glassTilt.y.toFixed(1)}°</span>
                      <span>rotY: {glassTilt.x.toFixed(1)}°</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sandbox 02: Three.js Digital Core */}
              {activeExp === 1 && (
                <div className="sandbox-core-container">
                  <div className="core-visualizer">
                    <div className={`core-mockup mode-${coreMode}`}>
                      <div className="core-ring r1" />
                      <div className="core-ring r2" />
                      <div className="core-center" />
                    </div>
                  </div>
                  <div className="sandbox-controls">
                    <span className="controls-label">Toggle Procedural Mode:</span>
                    <div className="btn-group">
                      <button
                        type="button"
                        className={`sandbox-btn ${coreMode === 'wireframe' ? 'active' : ''}`}
                        onClick={() => setCoreMode('wireframe')}
                      >
                        Wireframe Core
                      </button>
                      <button
                        type="button"
                        className={`sandbox-btn ${coreMode === 'pulsing' ? 'active' : ''}`}
                        onClick={() => setCoreMode('pulsing')}
                      >
                        Pulse Orbit
                      </button>
                      <button
                        type="button"
                        className={`sandbox-btn ${coreMode === 'hyper' ? 'active' : ''}`}
                        onClick={() => setCoreMode('hyper')}
                      >
                        High Velocity
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sandbox 03: Mouse Reactive Background */}
              {activeExp === 2 && (
                <div className="sandbox-spotlight-container">
                  <div className="spotlight-demo-area">
                    <div className="spotlight-reticle">
                      <span className="reticle-label">POINTER COORD TRACKER</span>
                      <p className="reticle-info">
                        Updates <code>--mouse-x</code> and <code>--mouse-y</code> CSS variables smoothly in real time.
                      </p>
                    </div>
                  </div>
                  <div className="spotlight-controls">
                    <span className="controls-label">Spotlight Radius ({spotlightRadius}px):</span>
                    <input
                      type="range"
                      min="350"
                      max="900"
                      value={spotlightRadius}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSpotlightRadius(val);
                        document.documentElement.style.setProperty('--spotlight-size', `${val}px`);
                      }}
                      className="sandbox-slider"
                    />
                  </div>
                </div>
              )}

              {/* Sandbox 04: Interactive Skill Constellation */}
              {activeExp === 3 && (
                <div className="sandbox-graph-container">
                  <div className="graph-stats-grid">
                    <div className="graph-stat-card">
                      <span className="stat-num">14</span>
                      <span className="stat-name">Active Skill Vertices</span>
                    </div>
                    <div className="graph-stat-card">
                      <span className="stat-num">24</span>
                      <span className="stat-name">Constellation Edges</span>
                    </div>
                    <div className="graph-stat-card">
                      <span className="stat-num">0</span>
                      <span className="stat-name">External Libraries</span>
                    </div>
                  </div>
                  <p className="sandbox-note">
                    Rendered purely via declarative SVG &amp; CSS with bidirectional hover highlighting and topological adjacency tracking.
                  </p>
                </div>
              )}

              {/* Sandbox 05: Theme System Matrix */}
              {activeExp === 4 && (
                <div className="sandbox-theme-container">
                  <div className="theme-matrix">
                    <div className="matrix-row">
                      <span className="matrix-key">--accent-primary</span>
                      <span className="matrix-swatch primary" />
                      <span className="matrix-val">#6D5BA6</span>
                    </div>
                    <div className="matrix-row">
                      <span className="matrix-key">--accent-secondary</span>
                      <span className="matrix-swatch secondary" />
                      <span className="matrix-val">#4A416B</span>
                    </div>
                    <div className="matrix-row">
                      <span className="matrix-key">--accent-soft</span>
                      <span className="matrix-swatch soft" />
                      <span className="matrix-val">#8B7BB8</span>
                    </div>
                    <div className="matrix-row">
                      <span className="matrix-key">--bg-primary</span>
                      <span className="matrix-val">#080B16 (Dark Workspace)</span>
                    </div>
                    <div className="matrix-row">
                      <span className="matrix-key">--glass-bg</span>
                      <span className="matrix-val">rgba(255, 255, 255, 0.04)</span>
                    </div>
                  </div>
                  <p className="sandbox-note">
                    Tokens dynamically cascade across WebGL renderers and CSS glass panels without page refresh.
                  </p>
                </div>
              )}

              {/* Sandbox 06: AI Interview Analysis Concept */}
              {activeExp === 5 && (
                <div className="sandbox-ai-container">
                  <div className="ai-metrics-panel">
                    <div className="metric-box">
                      <span className="metric-label">Speaking Pacing (WPM)</span>
                      <div className="metric-value-row">
                        <span className="metric-value">{speechWpm}</span>
                        <span className="metric-status">
                          {speechWpm < 120 ? 'Too Slow' : speechWpm > 160 ? 'Fast' : 'Optimal Pacing'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="200"
                        value={speechWpm}
                        onChange={(e) => setSpeechWpm(Number(e.target.value))}
                        className="sandbox-slider"
                      />
                    </div>

                    <div className="metric-box">
                      <span className="metric-label">Filler Words Detected ("um", "like")</span>
                      <div className="metric-value-row">
                        <span className="metric-value">{fillerCount}</span>
                        <button
                          type="button"
                          className="mini-counter-btn"
                          onClick={() => setFillerCount(fillerCount + 1)}
                        >
                          + Simulate Filler
                        </button>
                        <button
                          type="button"
                          className="mini-counter-btn"
                          onClick={() => setFillerCount(0)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="metric-box">
                      <span className="metric-label">Simulated Audio Level</span>
                      <div className="audio-meter-bar">
                        <div
                          className="audio-meter-fill"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        className="sandbox-btn"
                        style={{ marginTop: '10px' }}
                        onClick={() => setAudioLevel(Math.floor(30 + Math.random() * 60))}
                      >
                        Sample Microphone Volume
                      </button>
                    </div>
                  </div>
                  <p className="sandbox-note">
                    Concept prototype demonstrating audio processing indicators for the AI Interview Coach project.
                  </p>
                </div>
              )}
            </div>

            <div className="stage-footer">
              <span className="stage-footer-text">
                {experimentsList[activeExp].concept}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(Experiments);

