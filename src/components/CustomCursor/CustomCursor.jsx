import React, { useEffect, useState, useRef } from 'react';
import './CustomCursor.css';

/**
 * CustomCursor
 * Follows mouse position on desktop screens with direct hardware-accelerated RAF tracking.
 * Avoids triggering React component tree re-renders on mousemove.
 * Changes visual state and text badge (VIEW / EXPLORE / PRIVATE / etc.) based on hovered element.
 * Disabled on touch/mobile devices.
 */
export default function CustomCursor({ cursorEnabled = true }) {
  const cursorRef = useRef(null);
  const [badgeText, setBadgeText] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize enabled strictly on fine hover-capable pointer environments + developer toggle
  const [deviceSupportsCursor, setDeviceSupportsCursor] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    }
    return false;
  });

  const enabled = deviceSupportsCursor && cursorEnabled !== false;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(pointer: fine) and (hover: hover)');
    const updateEnabled = () => setDeviceSupportsCursor(query.matches);

    query.addEventListener?.('change', updateEnabled);

    if (enabled) {
      document.body.classList.add('custom-cursor-active');
    } else {
      document.body.classList.remove('custom-cursor-active');
    }

    return () => {
      query.removeEventListener?.('change', updateEnabled);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let rafId = null;
    let hasMoved = false;

    const animateCursor = () => {
      // Smooth lerp tracking
      currentX += (targetX - currentX) * 0.45;
      currentY += (targetY - currentY) * 0.45;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      // Update ambient spotlight CSS variables smoothly
      document.documentElement.style.setProperty('--mouse-x', `${Math.round(targetX)}px`);
      document.documentElement.style.setProperty('--mouse-y', `${Math.round(targetY)}px`);

      rafId = requestAnimationFrame(animateCursor);
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        currentX = targetX;
        currentY = targetY;
        setIsVisible(true);
        rafId = requestAnimationFrame(animateCursor);
      }

      // Check contextual cursor attributes
      const target = e.target;
      const cursorAttr = target?.closest?.('[data-cursor]')?.getAttribute('data-cursor');
      const isInteractive = target?.closest?.('a, button, [role="button"], input, textarea');

      let nextBadge = '';
      if (cursorAttr) {
        const norm = cursorAttr.toLowerCase();
        if (norm === 'inspect') nextBadge = 'INSPECT';
        else if (norm === 'open') nextBadge = 'OPEN';
        else if (norm === 'interact') nextBadge = 'INTERACT';
        else if (norm === 'select') nextBadge = 'SELECT';
        else if (norm === 'explore') nextBadge = 'EXPLORE';
        else if (norm === 'view') nextBadge = 'VIEW';
        else if (norm === 'private') nextBadge = 'PRIVATE';
      }

      setBadgeText((prev) => (prev !== nextBadge ? nextBadge : prev));
      setIsHovering((prev) => {
        const nextHover = !!isInteractive || !!cursorAttr;
        return prev !== nextHover ? nextHover : prev;
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isBadge = badgeText !== '';

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${isHovering ? 'is-hovering' : ''} ${isBadge ? 'is-badge' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <div className="cursor-dot" />
      {isBadge && <span className="cursor-label">{badgeText}</span>}
    </div>
  );
}
