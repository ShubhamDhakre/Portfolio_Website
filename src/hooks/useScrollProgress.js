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

/**
 * useIsScrolled
 * Extremely lightweight scroll detector for headers/navbars.
 * Updates state ONLY when crossing the specified scroll threshold (e.g., 30px),
 * preventing unnecessary React re-renders during continuous page scrolling.
 */
export function useIsScrolled(threshold = 30) {
  const [isScrolled, setIsScrolled] = useState(() => (typeof window !== 'undefined' ? window.scrollY > threshold : false));

  useEffect(() => {
    let rafId = null;

    const checkScroll = () => {
      const scrolled = window.scrollY > threshold;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
      rafId = null;
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(checkScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return isScrolled;
}

export default useScrollProgress;

