import { useState, useEffect, useCallback } from 'react';

export const VALID_THEMES = ['night', 'day', 'technical', 'nature', 'minimal', 'aurora', 'monochrome', 'default'];

/**
 * useTheme
 * Manages theme selection (Day, Night, and developer presets).
 * Saves preference in localStorage and sets data-theme attribute on <html>.
 * Respects precedence between global site settings and explicit user preference.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('shubham_portfolio_theme');
      if (saved && VALID_THEMES.includes(saved)) {
        return saved;
      }
    } catch {
      // In case localStorage is blocked
    }
    // Default to night theme
    return 'night';
  });

  const [isExplicitlySelected, setIsExplicitlySelected] = useState(() => {
    try {
      return Boolean(localStorage.getItem('shubham_portfolio_theme_explicit'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 'default' theme corresponds to 'night' dark workspace palette in CSS
    const effectiveTheme = theme === 'default' ? 'night' : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    try {
      localStorage.setItem('shubham_portfolio_theme', theme);
    } catch {
      // In case localStorage is blocked
    }
  }, [theme]);

  const setTheme = useCallback((newTheme, isExplicit = true) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
      if (isExplicit) {
        setIsExplicitlySelected(true);
        try {
          localStorage.setItem('shubham_portfolio_theme_explicit', 'true');
        } catch {}
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'day' ? 'night' : 'day';
      setIsExplicitlySelected(true);
      try {
        localStorage.setItem('shubham_portfolio_theme_explicit', 'true');
      } catch {}
      return next;
    });
  }, []);

  return { theme, toggleTheme, setTheme, isExplicitlySelected };
}

export default useTheme;

