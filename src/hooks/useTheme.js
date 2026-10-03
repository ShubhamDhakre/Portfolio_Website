import { useState, useEffect } from 'react';

const VALID_THEMES = ['night', 'day', 'technical', 'nature', 'minimal', 'aurora', 'monochrome', 'default'];

/**
 * useTheme
 * Manages theme selection (Day, Night, and developer presets).
 * Saves preference in localStorage and sets data-theme attribute on <html>.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'day' ? 'night' : 'day'));
  };

  return { theme, toggleTheme, setTheme };
}

export default useTheme;
