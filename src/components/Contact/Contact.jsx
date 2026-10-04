import React, { useState, useRef, useEffect } from 'react';
import './Contact.css';

/**
 * Contact
 * Direct reach-out section with placeholders for Email, GitHub, and LinkedIn.
 * Features a one-click copy email micro-interaction and clean developer cues.
 */
function Contact() {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const contactInfo = {
    email: "ssdhakre93@gmail.com", // Placeholder: replace with your actual email
    github: "https://github.com/shubhamdhakre",
    linkedin: "https://linkedin.com/in/shubhamdhakre",
  };

  const handleCopyEmail = () => {
    const textToCopy = contactInfo.email;
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopied(true);
          copyTimerRef.current = setTimeout(() => setCopied(false), 2200);
        })
        .catch(() => {
          fallbackCopy(textToCopy);
        });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Ignore if copy unsupported
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="section-header">
        <span className="section-route-tag">/contact</span>
        <span className="section-number">05</span>
        <h2 className="section-title">CONNECT</h2>
        <div className="section-divider" />
        <span className="section-component-pill">&lt;ContactInterface /&gt;</span>
      </div>

      <div className="contact-card">
        <div className="contact-badge">
          <span className="badge-dot" />
          COMMUNICATION // OPEN TO CONNECT
        </div>
        
        <h3 className="contact-heading">
          LET'S BUILD SOMETHING INTERESTING.
        </h3>

        <p className="contact-subtext">
          If you want to discuss a project, collaboration, internship opportunity, or just chat about technology and computer science, feel free to reach out.
        </p>

        <div className="contact-buttons-group">
          {/* Direct Email Action */}
          <a
            href={`mailto:${contactInfo.email}`}
            className="contact-btn contact-btn-primary"
            title="Send an email"
          >
            <span className="contact-btn-icon">✉</span>
            <span>Send Email</span>
          </a>

          {/* Copy Email Button */}
          <button
            type="button"
            className="contact-btn contact-btn-glass"
            onClick={handleCopyEmail}
            title="Copy email address to clipboard"
          >
            <span className="contact-btn-icon">{copied ? '✓' : '⧉'}</span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
          </button>

          {/* GitHub Profile */}
          <a
            href={contactInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn contact-btn-glass"
            title="Visit GitHub Profile"
          >
            <span className="contact-btn-icon">⚡</span>
            <span>GitHub</span>
            <span className="contact-btn-arrow">↗</span>
          </a>

          {/* LinkedIn Profile */}
          <a
            href={contactInfo.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn contact-btn-glass"
            title="Connect on LinkedIn"
          >
            <span className="contact-btn-icon">💼</span>
            <span>LinkedIn</span>
            <span className="contact-btn-arrow">↗</span>
          </a>
        </div>

        <div className="contact-meta-footer">
          <span className="meta-pill">Open for Discussions</span>
          <span className="meta-pill">Student Collaboration</span>
          <span className="meta-pill">Tech Exploration</span>
        </div>
      </div>
    </section>
  );
}

export default React.memo(Contact);

