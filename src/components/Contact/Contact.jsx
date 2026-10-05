import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_CONTACT_TILT } from '../../utils/performanceConfig';
import './Contact.css';

/**
 * Contact
 * Direct reach-out section with placeholders for Email, GitHub, and LinkedIn.
 * Features a one-click copy email micro-interaction and clean developer cues.
 * Strictly scoped 3D Glass Tilt interaction on the main Contact card.
 */
function Contact({ tiltSettings = DEFAULT_CONTACT_TILT }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Cursor-responsive 3D Glass Tilt interaction (strictly scoped to this card)
  useEffect(() => {
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card) return;

    const isEnabled = tiltSettings?.enabled !== false;
    const maxRotX = Math.min(Math.max(Number(tiltSettings?.maxRotationX) || 12, 1), 35);
    const maxRotY = Math.min(Math.max(Number(tiltSettings?.maxRotationY) || 12, 1), 35);
    const perspective = Math.min(Math.max(Number(tiltSettings?.perspective) || 1000, 300), 2500);
    const speed = Math.min(Math.max(Number(tiltSettings?.speed) || 400, 50), 2000);
    const returnSpeed = Math.min(Math.max(Number(tiltSettings?.returnSpeed) || 600, 100), 2500);
    const hoverScale = Math.min(Math.max(Number(tiltSettings?.hoverScale) || 1.02, 1.0), 1.15);
    const lighting = tiltSettings?.lighting !== false;
    const rawIntensity = tiltSettings?.lightingIntensity;
    const lightingIntensity = Math.min(Math.max(typeof rawIntensity === 'number' ? rawIntensity : (Number(rawIntensity) || 0.35), 0.0), 1.0);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!isEnabled || prefersReducedMotion || !canHover) {
      card.style.transform = '';
      card.style.transition = '';
      if (glare) glare.style.opacity = '0';
      return;
    }

    const onPointerEnter = () => {
      card.style.willChange = 'transform';
      card.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    };

    const onPointerMove = (e) => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const normX = (e.clientX - rect.left) / rect.width;
        const normY = (e.clientY - rect.top) / rect.height;
        const px = (normX - 0.5) * 2;
        const py = (normY - 0.5) * 2;
        const rotX = -py * maxRotX;
        const rotY = px * maxRotY;

        card.style.transform = `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${hoverScale}, ${hoverScale}, ${hoverScale})`;

        if (lighting && glare) {
          glare.style.opacity = String(lightingIntensity);
          glare.style.setProperty('--glare-x', `${(normX * 100).toFixed(1)}%`);
          glare.style.setProperty('--glare-y', `${(normY * 100).toFixed(1)}%`);
        }
      });
    };

    const onPointerLeave = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      card.style.transition = `transform ${returnSpeed}ms cubic-bezier(0.16, 1, 0.3, 1), border-color var(--transition-normal), box-shadow var(--transition-normal)`;
      card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      if (glare) {
        glare.style.opacity = '0';
      }
    };

    card.addEventListener('pointerenter', onPointerEnter);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerleave', onPointerLeave);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      card.removeEventListener('pointerenter', onPointerEnter);
      card.removeEventListener('pointermove', onPointerMove);
      card.removeEventListener('pointerleave', onPointerLeave);
      card.style.transform = '';
      card.style.transition = '';
      if (glare) glare.style.opacity = '0';
    };
  }, [tiltSettings]);

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

      <div className="contact-reveal-wrapper reveal-on-scroll">
        <div
          className={`contact-card contact-tilt-card ${tiltSettings?.enabled === false ? 'tilt-disabled' : ''}`}
          ref={cardRef}
        >
          <div className="contact-tilt-glare" ref={glareRef} />
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
      </div>
    </section>
  );
}

export default React.memo(Contact);

