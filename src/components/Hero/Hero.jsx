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

            <div className="hero-social-chips">
              <a
                href="https://github.com/shubhamdhakre"
                target="_blank"
                rel="noreferrer"
                className="social-chip"
                title="GitHub Profile"
                aria-label="GitHub"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                <span>GitHub</span>
              </a>
              <a
                href="https://linkedin.com/in/shubhamdhakre"
                target="_blank"
                rel="noreferrer"
                className="social-chip"
                title="LinkedIn Profile"
                aria-label="LinkedIn"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                <span>LinkedIn</span>
              </a>
            </div>
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

