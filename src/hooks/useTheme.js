import { useState, useEffect } from 'react';

/**
 * useTheme
 * Simple hook to handle Day / Night theme toggle.
 * Saves preference in localStorage and sets data-theme attribute on <html>.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('shubham_portfolio_theme');
      if (saved === 'day' || saved === 'night') {
        return saved;
      }
    } catch {
      // In case localStorage is blocked
    }
    // Default to night theme
    return 'night';
  });

  useEffect(() => {
    // Apply theme to document root element
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('shubham_portfolio_theme', theme);
    } catch {
      // In case localStorage is blocked
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  };

  return { theme, toggleTheme, setTheme };
}

export default useTheme;
