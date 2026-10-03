import { useState, useEffect } from 'react';

/**
 * useMousePosition
 * Tracks mouse position (pixel coordinates and normalized -1..1 coordinates)
 * Used for 3D rotation, background radial spotlight, and custom cursor.
 */
export function useMousePosition() {
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    normalizedX: 0, // -1 (left) to +1 (right)
    normalizedY: 0, // -1 (top) to +1 (bottom)
    isHovering: false,
    isVisible: false,
    cursorType: 'default', // 'default', 'pointer', 'view', 'explore'
  });

  useEffect(() => {
    // Only track on mouse-capable desktop environments (fine pointer + hover support)
    const isMouseCapable = typeof window !== 'undefined' && 
      window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    
    if (!isMouseCapable) return;

    let rafId = null;
    let latestEvent = null;

    const updatePosition = () => {
      if (!latestEvent) return;
      const { clientX, clientY, target } = latestEvent;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Check cursor data attribute on element under pointer
      const cursorAttr = target?.closest?.('[data-cursor]')?.getAttribute('data-cursor');
      const isInteractive = target?.closest?.('a, button, [role="button"], input, textarea');

      let type = 'default';
      if (cursorAttr) {
        type = cursorAttr.toLowerCase();
      } else if (isInteractive) {
        type = 'pointer';
      }

      setMouse({
        x: clientX,
        y: clientY,
        normalizedX: (clientX / width) * 2 - 1,
        normalizedY: -(clientY / height) * 2 + 1,
        isHovering: !!isInteractive || !!cursorAttr,
        isVisible: true,
        cursorType: type,
      });

      // Update CSS variables for radial mouse background glow
      document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);
      rafId = null;
    };

    const handleMouseMove = (e) => {
      latestEvent = {
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target,
      };

      if (!rafId) {
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    const handleMouseLeave = () => {
      setMouse((prev) => ({ ...prev, isVisible: false }));
    };

    const handleMouseEnter = () => {
      setMouse((prev) => ({ ...prev, isVisible: true }));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return mouse;
}

export default useMousePosition;
