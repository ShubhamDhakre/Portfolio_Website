import React, { useState, useEffect, useRef } from 'react';
import './EasterEggModal.css';

/**
 * EasterEggModal
 * Hidden developer terminal triggered by clicking `</>` 5 times (or Ctrl+K / Cmd+K).
 * Emulates a sleek dark glass developer console with interactive commands.
 */
export default function EasterEggModal({ isOpen, onClose, onOpenControlCenter }) {
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'system', text: 'SYSTEM OVERRIDE // AUTHORIZED DEVELOPER ACCESS' },
    { type: 'system', text: 'Type "help" for available diagnostic commands.' },
  ]);
  const inputRef = useRef(null);
  const terminalEndRef = useRef(null);

  // Focus input on open & listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal is rendered
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-scroll to bottom when new commands are output
  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    let response = '';
    if (cmd === 'whoami') {
      response = 'Shubham Dhakre — Computer Science student, tech explorer, builder.';
    } else if (cmd === 'status') {
      response = 'Still learning, actively building, exploring Web & AI.';
    } else if (cmd === 'curiosity') {
      response = '100% [████████████████████]';
    } else if (cmd === 'current_focus') {
      response = 'Web + AI // Full-stack architecture, Three.js & applied ML.';
    } else if (cmd === 'build') {
      response = 'In progress... Building interactive digital experiences.';
    } else if (cmd === 'admin' || cmd === 'control' || cmd === 'private') {
      if (onOpenControlCenter) {
        onOpenControlCenter();
        return;
      }
      response = 'Opening Private Control Center...';
    } else if (cmd === 'clear') {
      setHistory([]);
      setCommandInput('');
      return;
    } else if (cmd === 'exit') {
      onClose();
      return;
    } else if (cmd === 'help') {
      response = 'Commands: whoami, status, curiosity, current_focus, build, admin, clear, exit';
    } else {
      response = `Command not recognized: "${cmd}". Type "help" for options.`;
    }

    setHistory((prev) => [
      ...prev,
      { type: 'user', text: `> ${commandInput}` },
      { type: 'output', text: response },
    ]);
    setCommandInput('');
  };

  return (
    <div className="easter-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="easter-modal-console" onClick={(e) => e.stopPropagation()}>
        <div className="console-titlebar">
          <div className="console-traffic-lights">
            <button
              type="button"
              className="dot red"
              onClick={onClose}
              title="Close terminal"
              aria-label="Close terminal"
            />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="console-title">shubham-terminal // zsh</span>
          <button
            type="button"
            className="console-close-btn"
            onClick={onClose}
            aria-label="Close terminal"
          >
            ✕
          </button>
        </div>

        <div className="console-body">
          <div className="console-preset-block">
            <p className="console-line sys">SYSTEM OVERRIDE</p>
            <p className="console-line cmd">&gt; whoami</p>
            <p className="console-line out">Shubham Dhakre</p>
            <p className="console-line cmd">&gt; status</p>
            <p className="console-line out">Still learning.</p>
            <p className="console-line cmd">&gt; curiosity</p>
            <p className="console-line out">100%</p>
            <p className="console-line cmd">&gt; current_focus</p>
            <p className="console-line out">Web + AI</p>
            <p className="console-line cmd">&gt; build</p>
            <p className="console-line out">In progress...</p>
          </div>

          <div className="console-dynamic-history">
            {history.map((entry, index) => (
              <p key={index} className={`console-line ${entry.type}`}>
                {entry.text}
              </p>
            ))}
          </div>

          <form onSubmit={handleCommandSubmit} className="console-input-row">
            <span className="prompt-symbol">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="type a command (whoami, status, current_focus, exit)..."
              className="console-input"
              autoFocus
            />
          </form>
          <div ref={terminalEndRef} style={{ height: 1 }} />
        </div>
      </div>
    </div>
  );
}
