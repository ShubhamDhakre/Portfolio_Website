import React from 'react';
import './Footer.css';

/**
 * Footer
 * Minimal, technical workspace footer.
 * Displays copyright, tech stack, git-branch badge, and back-to-top control.
 */
function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-copyright">
            © 2026 Shubham Dhakre
          </p>
          <span className="footer-branch-pill">
            <span className="branch-dot" />
            branch: main
          </span>
        </div>

        <p className="footer-tech">
          Built with React, JavaScript, CSS &amp; Three.js.
        </p>

        <button
          type="button"
          className="footer-top-btn"
          onClick={scrollToTop}
          title="Scroll back to top"
          aria-label="Back to top"
        >
          <span>Top</span>
          <span className="top-arrow">↑</span>
        </button>
      </div>
    </footer>
  );
}

export default React.memo(Footer);

