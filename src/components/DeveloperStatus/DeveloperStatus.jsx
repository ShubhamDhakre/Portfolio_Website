import React, { useState, useEffect, useCallback } from 'react';
import './DeveloperStatus.css';

/**
 * Curated collection of original developer thoughts and engineering reflections.
 */
const DEVELOPER_THOUGHTS = [
  "Build something you understand, not just something that works.",
  "Good code answers today's problem. Good thinking prepares for tomorrow's.",
  "Every bug is a small invitation to understand the system better.",
  "Frameworks change. The habit of learning should not.",
  "Write the code. Break the code. Understand why it broke.",
  "The interesting part of software is usually underneath the interface.",
  "Complex systems become clearer when you follow the data flow.",
  "Don't memorize the abstraction. Understand what is underneath it.",
  "A working solution is the beginning of understanding, not the end.",
  "Curiosity is a better debugging tool than guessing.",
  "Small experiments teach more than large assumptions.",
  "Readable code is communication with the developer who comes next.",
  "Learn the tool. Then learn what the tool is abstracting away.",
  "Build, observe, question, refine.",
  "Understanding the 'why' makes the 'how' obvious.",
  "Good interfaces reduce friction without hiding mental models.",
  "Sometimes the best way to learn a system is to build a minimal toy version.",
  "Technology moves quickly. Core fundamentals give you steady ground to stand on.",
  "Debugging is just another way of asking better questions.",
  "Every project leaves behind deeper intuition than when it started.",
  "Measure complexity by how hard it is to reason about, not line count.",
  "The cleanest abstractions emerge from writing concrete implementations first.",
  "Computers do exactly what you tell them; the challenge is discovering what you actually told them.",
  "Premature optimization is a distraction; clear architectural boundaries are durable.",
  "Stay curious about how the layers beneath your tools actually function."
];

/**
 * DeveloperStatus
 * Persistent, fixed bottom-right workspace utility panel.
 * Displays live browser date/time and random session developer reflections.
 */
function DeveloperStatus() {
  const [now, setNow] = useState(() => new Date());
  // Default collapsed on laptops and tablets (< 1280px) to maximize content reading area
  const [isCollapsed, setIsCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1280 : false));

  // Auto-collapse when resizing down to smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize random thought avoiding consecutive duplicate in session
  const [thoughtIndex, setThoughtIndex] = useState(() => {
    try {
      const stored = sessionStorage.getItem('developerThoughtIndex');
      const lastIndex = stored !== null ? parseInt(stored, 10) : NaN;
      let newIndex = Math.floor(Math.random() * DEVELOPER_THOUGHTS.length);
      if (!isNaN(lastIndex) && DEVELOPER_THOUGHTS.length > 1 && newIndex === lastIndex) {
        newIndex = (newIndex + 1) % DEVELOPER_THOUGHTS.length;
      }
      sessionStorage.setItem('developerThoughtIndex', newIndex.toString());
      return newIndex;
    } catch {
      return Math.floor(Math.random() * DEVELOPER_THOUGHTS.length);
    }
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = React.useRef(null);

  // Self-contained live clock interval and timer cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Format dynamic date
  const formattedDate = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(now).toUpperCase();
    } catch {
      return now.toDateString().toUpperCase();
    }
  }, [now]);

  // Format dynamic time & timezone
  const formattedTime = React.useMemo(() => {
    try {
      const timeStr = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);

      const tzStr = new Intl.DateTimeFormat(undefined, {
        timeZoneName: 'short'
      }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || '';

      return { timeStr, tzStr };
    } catch {
      return { timeStr: now.toTimeString().slice(0, 8), tzStr: '' };
    }
  }, [now]);

  // Handle request for a new random thought
  const handleNextThought = useCallback((e) => {
    e?.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setThoughtIndex((prev) => {
        let nextIndex = Math.floor(Math.random() * DEVELOPER_THOUGHTS.length);
        if (DEVELOPER_THOUGHTS.length > 1 && nextIndex === prev) {
          nextIndex = (nextIndex + 1) % DEVELOPER_THOUGHTS.length;
        }
        try {
          sessionStorage.setItem('developerThoughtIndex', nextIndex.toString());
        } catch {
          // ignore storage error
        }
        return nextIndex;
      });
      setIsTransitioning(false);
      transitionTimerRef.current = null;
    }, 180);
  }, [isTransitioning]);

  if (isCollapsed) {
    return (
      <aside 
        className="developer-status-fixed is-mini"
        onClick={() => setIsCollapsed(false)}
        role="region"
        aria-label="Developer Status Minimized"
      >
        <span className="status-live-dot" />
        <span className="mini-time">{formattedTime.timeStr}</span>
        <span className="mini-thought-tag">THOUGHT #{String(thoughtIndex + 1).padStart(2, '0')}</span>
        <button 
          type="button" 
          className="mini-expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
          title="Expand Developer Status"
          aria-label="Expand"
        >
          ↗
        </button>
      </aside>
    );
  }

  return (
    <aside 
      className="developer-status-fixed"
      role="region"
      aria-label="Persistent Developer Status"
    >
      {/* 1. Header with System Label & Collapse Toggle */}
      <div className="status-top-bar">
        <div className="status-meta-badge">
          <span className="status-live-dot" />
          <span className="status-system-label">SYSTEM // LOCAL TIME</span>
        </div>
        <button
          type="button"
          className="status-toggle-btn"
          onClick={() => setIsCollapsed(true)}
          title="Minimize to status pill"
          aria-label="Minimize"
        >
          −
        </button>
      </div>

      {/* 2. Live Time & Date Display */}
      <div className="status-clock-block">
        <div className="status-time-row">
          <span className="status-time-digits">{formattedTime.timeStr}</span>
          {formattedTime.tzStr && (
            <span className="status-tz-pill">{formattedTime.tzStr}</span>
          )}
        </div>
        <div className="status-date-label">{formattedDate}</div>
      </div>

      {/* 3. Subtle Horizontal Divider */}
      <div className="status-card-divider" aria-hidden="true" />

      {/* 4. Developer Thought Section */}
      <div className="status-thought-block">
        <div className="thought-meta-row">
          <span className="thought-section-label">
            DEVELOPER THOUGHT #{String(thoughtIndex + 1).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="thought-refresh-btn"
            onClick={handleNextThought}
            title="Select another reflection"
            aria-label="New Thought"
          >
            <span className="refresh-label">NEW THOUGHT</span>
            <span className="refresh-symbol">↻</span>
          </button>
        </div>

        <div className={`thought-quote-area ${isTransitioning ? 'thought-fade-out' : ''}`}>
          <p className="thought-quote-text">
            “{DEVELOPER_THOUGHTS[thoughtIndex]}”
          </p>
        </div>
      </div>
    </aside>
  );
}

export default React.memo(DeveloperStatus);

