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
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [hasResume, setHasResume] = useState(false);

  // Probe for actual resume PDF in public/ without corrupting downloads
  useEffect(() => {
    fetch('/resume.pdf', { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') || '';
        if (res.ok && type.includes('pdf')) {
          setHasResume(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleResumeClick = (e) => {
    if (!hasResume) {
      e.preventDefault();
      fetch('/resume.pdf', { method: 'HEAD' })
        .then((res) => {
          const type = res.headers.get('content-type') || '';
          if (res.ok && type.includes('pdf')) {
            setHasResume(true);
            const downloadLink = document.createElement('a');
            downloadLink.href = '/resume.pdf';
            downloadLink.download = 'Shubham_Dhakre_Resume.pdf';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } else {
            console.warn('[Navbar] Resume PDF not found at /resume.pdf. Please add your resume PDF to public/resume.pdf.');
          }
        })
        .catch(() => {
          console.warn('[Navbar] Unable to check resume PDF status.');
        });
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
            window.dispatchEvent(new CustomEvent('sectionchange', { detail: entry.target.id }));
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
          <a
            href="/resume.pdf"
            download="Shubham_Dhakre_Resume.pdf"
            className="navbar-resume-btn"
            aria-label="Download resume"
            title="Download resume"
            onClick={handleResumeClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="navbar-resume-icon"
              aria-hidden="true"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M12 18v-6" />
              <path d="m9 15 3 3 3-3" />
            </svg>
          </a>
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

        {/* Right Actions: Theme Toggle & Mobile Menu */}
        <div className="navbar-actions">
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

