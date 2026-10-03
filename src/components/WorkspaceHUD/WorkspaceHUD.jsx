import React, { useState, useEffect } from 'react';
import './WorkspaceHUD.css';

/**
 * Contextual metadata based on active section
 */
const SECTION_METADATA = {
  hero: {
    route: '/workspace',
    focus: 'CSE STUDENT // TECH ENTHUSIAST',
    tag: 'SYS.READY'
  },
  about: {
    route: '/about',
    focus: 'SYSTEM ARCHITECTURE & FLOW',
    tag: 'LEARNING & ENGINEERING'
  },
  skills: {
    route: '/skills',
    focus: 'CONSTELLATION & RELATIONSHIPS',
    tag: 'TECH GRAPH'
  },
  projects: {
    route: '/work',
    focus: 'APPLIED WEB & AI SOFTWARE',
    tag: 'EXPERIMENTS'
  },
  experiments: {
    route: '/lab',
    focus: 'INTERACTIVE THREE.JS & VISION',
    tag: 'PLAYGROUND'
  },
  contact: {
    route: '/contact',
    focus: 'OPEN COLLABORATION & INQUIRIES',
    tag: 'CONNECT'
  }
};

/**
 * WorkspaceHUD
 * Subtle, persistent bottom-left developer workspace indicator.
 * Displays session uptime counter, living heartbeat, and contextual section focus.
 */
function WorkspaceHUD({ activeSection = 'hero', customFocus = null }) {
  // Session uptime counter (seconds since page load)
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isHeartbeatActive, setIsHeartbeatActive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format seconds into HH:MM:SS
  const formatUptime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentMeta = SECTION_METADATA[activeSection] || SECTION_METADATA.hero;
  const displayFocus = (activeSection === 'hero' && customFocus) ? customFocus.toUpperCase() : currentMeta.focus;

  return (
    <aside className="workspace-hud" aria-label="Session and Context Status">
      <div className="hud-pill">
        {/* Heartbeat Status Dot */}
        <div className="hud-heartbeat-group">
          <span className={`hud-heartbeat-dot ${isHeartbeatActive ? 'is-active' : ''}`} />
          <span className="hud-uptime-label">SESSION</span>
          <span className="hud-uptime-value">{formatUptime(secondsElapsed)}</span>
        </div>

        <div className="hud-divider" aria-hidden="true" />

        {/* Contextual Now Exploring & Focus */}
        <div className="hud-context-group">
          <span className="hud-exploring-tag">{currentMeta.route}</span>
          <span className="hud-focus-label">{displayFocus}</span>
        </div>
      </div>
    </aside>
  );
}

export default React.memo(WorkspaceHUD);
