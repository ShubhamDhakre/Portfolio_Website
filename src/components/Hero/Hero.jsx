import React from 'react';
import ThreeScene from '../ThreeScene/ThreeScene';
import './Hero.css';

/**
 * Hero
 * Main workspace entrance.
 * Communicates identity as a CSE Student & Tech Enthusiast exploring modern web architecture and applied AI.
 * Displays developer micro-meta, action buttons, and the interactive Three.js Digital Core.
 */
function Hero({
  theme,
  scrollProgress,
  onStateChange,
  onUnlockPrivateLayer,
  isPrivateModeActive = false,
  perfSettings = {}
}) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [isPillHovered, setIsPillHovered] = React.useState(false);

  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        {/* Left Column: Developer Identity & Intent */}
        <div className="hero-content">
          {/* System Interface Route & Status Pill (Curiosity Interactive) */}
          <div
            className="hero-status-pill"
            onMouseEnter={() => setIsPillHovered(true)}
            onMouseLeave={() => setIsPillHovered(false)}
            title="System Diagnostics: Curious & Active"
          >
            <span className="status-indicator-dot" />
            <span className="status-route-indicator">/home</span>
            <span className="status-indicator-divider">//</span>
            <span className="status-indicator-text">
              {isPillHovered ? 'SYSTEM CURIOUS // ENGAGED' : 'SYSTEM ONLINE • CURIOUS • BUILDING'}
            </span>
          </div>

          <h1 className="hero-title">
            SHUBHAM <br />
            <span className="hero-title-gradient">DHAKRE</span>
          </h1>

          <div className="hero-roles">
            <span className="hero-role-badge">CSE Student</span>
            <span className="hero-role-divider">//</span>
            <span className="hero-role-badge">Tech Enthusiast</span>
          </div>

          <p className="hero-description">
            Learning, building and experimenting with technology. Exploring modern web architecture, interactive interfaces, and applied AI/ML.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => scrollTo('projects')}
              data-cursor="pointer"
            >
              <span>Explore My Work</span>
              <span className="btn-arrow">→</span>
            </button>

            <button
              type="button"
              className="btn btn-glass"
              onClick={() => scrollTo('contact')}
              data-cursor="pointer"
            >
              <span>Let's Connect</span>
            </button>
          </div>

          {/* Developer System Micro-Meta */}
          <div className="hero-quick-meta">
            <div className="meta-item">
              <span className="meta-label">LOCATION:</span>
              <span className="meta-value">INDIA</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">FOCUS:</span>
              <span className="meta-value">WEB + AI SYSTEMS</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">MINDSET:</span>
              <span className="meta-value">HANDS-ON LEARNER</span>
            </div>
          </div>
        </div>

        {/* Right Column: Three.js Digital Core */}
        <div className="hero-visual">
          <div className="visual-wrapper">
            <ThreeScene
              theme={theme}
              scrollProgress={scrollProgress}
              onStateChange={onStateChange}
              onUnlockPrivateLayer={onUnlockPrivateLayer}
              isPrivateModeActive={isPrivateModeActive}
              perfSettings={perfSettings}
            />
          </div>
        </div>
      </div>

      {/* Subtle Scroll Down Prompt */}
      <div className="scroll-hint" onClick={() => scrollTo('about')}>
        <span className="scroll-hint-text">SCROLL TO DISCOVER</span>
        <span className="scroll-hint-bar" />
      </div>
    </section>
  );
}

export default React.memo(Hero);

