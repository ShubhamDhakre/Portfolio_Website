import React from 'react';
import './ThemeToggle.css';

/**
 * ThemeToggle
 * Toggles between ☀️ Day mode and 🌙 Night mode.
 * Accessible with clear aria-label and smooth glass switch effect.
 */
export default function ThemeToggle({ theme, toggleTheme }) {
  const isNight = theme !== 'day';

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={`Switch to ${isNight ? 'Day' : 'Night'} mode`}
      title={`Switch to ${isNight ? 'Day' : 'Night'} mode`}
      type="button"
    >
      <span className="theme-toggle-track">
        <span className={`theme-toggle-thumb ${isNight ? 'night' : 'day'}`}>
          {isNight ? '🌙' : '☀️'}
        </span>
      </span>
      <span className="theme-toggle-text">
        {isNight ? 'Night' : 'Day'}
      </span>
    </button>
  );
}
