import { useState, useEffect } from 'react';

/**
 * usePointerCapability
 * Accurately detects pointer input characteristics using matchMedia:
 * - isFinePointer: true if mouse/trackpad (pointer: fine)
 * - canHover: true if device supports hover (hover: hover)
 * - isTouchOnly: true if mobile/tablet touch device (pointer: coarse or hover: none)
 * - isMouseEnvironment: true if desktop fine pointer with hover support
 * - prefersReducedMotion: true if user prefers minimal motion
 */
export function usePointerCapability() {
  const [capability, setCapability] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return {
        isFinePointer: true,
        canHover: true,
        isTouchOnly: false,
        isMouseEnvironment: true,
        prefersReducedMotion: false,
      };
    }

    const finePointerMatch = window.matchMedia('(pointer: fine)').matches;
    const hoverMatch = window.matchMedia('(hover: hover)').matches;
    const reducedMotionMatch = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      isFinePointer: finePointerMatch,
      canHover: hoverMatch,
      isTouchOnly: !finePointerMatch || !hoverMatch,
      isMouseEnvironment: finePointerMatch && hoverMatch,
      prefersReducedMotion: reducedMotionMatch,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const fineQuery = window.matchMedia('(pointer: fine)');
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateCapability = () => {
      const finePointerMatch = fineQuery.matches;
      const hoverMatch = hoverQuery.matches;
      const reducedMotionMatch = motionQuery.matches;

      setCapability({
        isFinePointer: finePointerMatch,
        canHover: hoverMatch,
        isTouchOnly: !finePointerMatch || !hoverMatch,
        isMouseEnvironment: finePointerMatch && hoverMatch,
        prefersReducedMotion: reducedMotionMatch,
      });
    };

    fineQuery.addEventListener?.('change', updateCapability);
    hoverQuery.addEventListener?.('change', updateCapability);
    motionQuery.addEventListener?.('change', updateCapability);

    return () => {
      fineQuery.removeEventListener?.('change', updateCapability);
      hoverQuery.removeEventListener?.('change', updateCapability);
      motionQuery.removeEventListener?.('change', updateCapability);
    };
  }, []);

  return capability;
}

export default usePointerCapability;
