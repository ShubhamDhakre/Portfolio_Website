import React, { useState, useEffect, memo } from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './Navbar.css';

/**
 * Navbar
 * Floating dark glass application navbar.
 * Optimized with native IntersectionObserver active-section tracking
 * to eliminate expensive getBoundingClientRect() scroll calculations.
 */
function Navbar({
  isScrolled,
  theme,
  toggleTheme,
  onEasterEggTrigger,
  systemStatus = 'READY'
}) {
  const [clickCount, setClickCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Easter egg counter on </> symbol
  const handleCodeIconClick = (e) => {
    e.preventDefault();
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 5) {
      if (onEasterEggTrigger) onEasterEggTrigger();
      setClickCount(0);
    }
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Synchronize active section with IntersectionObserver (zero scroll lag)
  useEffect(() => {
    const sectionIds = ['hero', 'about', 'skills', 'projects', 'experiments', 'contact'];
    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

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
        threshold: 0.05,
      }
    );

    elements.forEach((el) => observer.observe(el));

    const handleResize = () => {
      if (window.innerWidth >= 960) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header className={`navbar-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <nav className="navbar-container" aria-label="Main Navigation">
        {/* Brand & Developer Workspace Label */}
        <div className="navbar-brand">
          <button
            type="button"
            className="navbar-easter-trigger"
            onClick={handleCodeIconClick}
            title="Interactive system key"
            aria-label="Developer system console key"
          >
            &lt;/&gt;
          </button>
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, 'hero')}
            className="navbar-brand-name"
          >
            SHUBHAM
          </a>
          <span className="navbar-workspace-badge" aria-hidden="true">
            /workspace
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links" role="menubar">
          <li role="none">
            <a
              href="#about"
              role="menuitem"
              className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'about')}
            >
              <span className="nav-route-prefix">/</span>about
            </a>
          </li>
          <li role="none">
            <a
              href="#skills"
              role="menuitem"
              className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'skills')}
            >
              <span className="nav-route-prefix">/</span>skills
            </a>
          </li>
          <li role="none">
            <a
              href="#projects"
              role="menuitem"
              className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'projects')}
            >
              <span className="nav-route-prefix">/</span>work
            </a>
          </li>
          <li role="none">
            <a
              href="#experiments"
              role="menuitem"
              className={`nav-link ${activeSection === 'experiments' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'experiments')}
            >
              <span className="nav-route-prefix">/</span>lab
            </a>
          </li>
          <li role="none">
            <a
              href="#contact"
              role="menuitem"
              className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'contact')}
            >
              <span className="nav-route-prefix">/</span>contact
            </a>
          </li>
        </ul>

        {/* Right Action: AI System State Badge & Theme Toggle */}
        <div className="navbar-actions">
          <div className="navbar-system-status" title="Active Interface State">
            <span className="sys-status-indicator" />
            <span className="sys-status-text">SYS.{systemStatus}</span>
          </div>

          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" role="menu">
          <a
            href="#about"
            role="menuitem"
            className="mobile-link"
            onClick={(e) => handleNavClick(e, 'about')}
          >
            /about // Background &amp; Mindset
          </a>
          <a
            href="#skills"
            role="menuitem"
            className="mobile-link"
            onClick={(e) => handleNavClick(e, 'skills')}
          >
            /skills // Tech Constellation
          </a>
          <a
            href="#projects"
            role="menuitem"
            className="mobile-link"
            onClick={(e) => handleNavClick(e, 'projects')}
          >
            /work // Selected Applications
          </a>
          <a
            href="#experiments"
            role="menuitem"
            className="mobile-link"
            onClick={(e) => handleNavClick(e, 'experiments')}
          >
            /lab // Technical Sandboxes
          </a>
          <a
            href="#contact"
            role="menuitem"
            className="mobile-link"
            onClick={(e) => handleNavClick(e, 'contact')}
          >
            /contact // Reach Out
          </a>
        </div>
      )}
    </header>
  );
}

export default memo(Navbar);

