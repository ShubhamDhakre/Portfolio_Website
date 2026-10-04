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

    if (query.addEventListener) {
      query.addEventListener('change', updateEnabled);
    } else if (query.addListener) {
      query.addListener(updateEnabled);
    }

    return () => {
      if (query.removeEventListener) {
        query.removeEventListener('change', updateEnabled);
      } else if (query.removeListener) {
        query.removeListener(updateEnabled);
      }
    };
  }, []);

  // Manage body class for native cursor hiding only when custom cursor is enabled AND visible
  useEffect(() => {
    if (enabled && isVisible) {
      document.body.classList.add('custom-cursor-active');
    } else {
      document.body.classList.remove('custom-cursor-active');
    }

    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, [enabled, isVisible]);

  useEffect(() => {
    if (!enabled) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let rafId = null;
    let lastCssX = -9999;
    let lastCssY = -9999;
    let hasMoved = false;
    let isPointerInViewport = false;
    let lastBadge = '';
    let lastHover = false;

    const animateCursor = () => {
      // Smooth lerp tracking
      currentX += (targetX - currentX) * 0.45;
      currentY += (targetY - currentY) * 0.45;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      // Coalesce ambient spotlight CSS variables smoothly in RAF instead of raw mouse event
      const roundX = Math.round(targetX);
      const roundY = Math.round(targetY);
      if (roundX !== lastCssX || roundY !== lastCssY) {
        lastCssX = roundX;
        lastCssY = roundY;
        document.documentElement.style.setProperty('--mouse-x', `${roundX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${roundY}px`);
      }

      rafId = requestAnimationFrame(animateCursor);
    };

    const startLoop = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(animateCursor);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        currentX = targetX;
        currentY = targetY;
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
      }

      if (!isPointerInViewport) {
        isPointerInViewport = true;
        setIsVisible(true);
        startLoop();
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

      if (nextBadge !== lastBadge) {
        lastBadge = nextBadge;
        setBadgeText(nextBadge);
      }

      const nextHover = !!isInteractive || !!cursorAttr;
      if (nextHover !== lastHover) {
        lastHover = nextHover;
        setIsHovering(nextHover);
      }
    };

    const handleMouseLeave = () => {
      isPointerInViewport = false;
      stopLoop();
      setIsVisible(false);
      document.body.classList.remove('custom-cursor-active');
    };

    const handleMouseEnter = () => {
      if (hasMoved) {
        isPointerInViewport = true;
        setIsVisible(true);
        startLoop();
      }
    };

    const handleWindowBlur = () => {
      isPointerInViewport = false;
      stopLoop();
      setIsVisible(false);
      document.body.classList.remove('custom-cursor-active');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPointerInViewport = false;
        stopLoop();
        setIsVisible(false);
        document.body.classList.remove('custom-cursor-active');
      }
    };

    const handleWindowMouseOut = (e) => {
      // If relatedTarget is null/undefined, pointer left the window
      if (!e.relatedTarget && !e.toElement) {
        handleMouseLeave();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleWindowMouseOut);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleWindowMouseOut);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopLoop();
      setIsVisible(false);
      document.body.classList.remove('custom-cursor-active');
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
