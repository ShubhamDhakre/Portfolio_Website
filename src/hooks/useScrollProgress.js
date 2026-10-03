import { useState, useEffect, useRef } from 'react';

/**
 * useScrollProgress
 * High-performance scroll tracking.
 * Uses requestAnimationFrame throttling and threshold detection to prevent
 * excessive React component re-renders during active page scrolling.
 */
export function useScrollProgress() {
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    progress: 0,
    isScrolled: false,
  });

  const lastStateRef = useRef(scrollState);

  useEffect(() => {
    let rafId = null;

    const updateScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const rawProgress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
      // Quantize progress to 2 decimal places to avoid micro-renders
      const progress = Math.round(rawProgress * 100) / 100;
      const isScrolled = scrollY > 30;

      const last = lastStateRef.current;
      if (last.isScrolled !== isScrolled || Math.abs(last.progress - progress) >= 0.02) {
        const next = { scrollY, progress, isScrolled };
        lastStateRef.current = next;
        setScrollState(next);
      }
      rafId = null;
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return scrollState;
}

export default useScrollProgress;

