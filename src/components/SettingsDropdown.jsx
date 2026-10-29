import React, { useEffect, useRef } from 'react';
import { TIME_CONTROLS } from './TimeControlSelector';
import { Cog } from 'lucide-react';
import {
  CloseIcon,
} from './Icons';

export default function SettingsDropdown({
  isOpen,
  onClose,
  skillLevel,
  onDifficultyChange,
  timeControl,
  onTimeControlChange,
  showLegalDots,
  onToggleLegalDots,
  soundEnabled,
  onToggleSound,
}) {
  const dropdownRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to capture outside clicks */}
      <div className="settings-backdrop" onClick={onClose} />

      <div
        className="settings-dropdown-menu"
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Settings Menu"
      >
        {/* Header */}
        <div className="settings-dropdown-header">
          <div className="settings-dropdown-title">
            <Cog size={17} className="settings-title-icon" />
            <span>Settings</span>
          </div>
          <button
            className="settings-dropdown-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close settings"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="settings-dropdown-scroll">
          {/* Section: Bot Difficulty */}
          <div className="settings-section">
            <span className="settings-section-title">Bot Difficulty</span>
            <div className="settings-grid-options">
              {[
                { label: 'Basic', level: 0, depth: 1 },
                { label: 'Beginner', level: 1, depth: 4 },
                { label: 'Intermediate', level: 8, depth: 8 },
                { label: 'Advanced', level: 15, depth: 14 },
                { label: 'Master', level: 20, depth: 20 },
              ].map((diff) => (
                <button
                  key={diff.level}
                  className={`settings-opt-pill ${skillLevel === diff.level ? 'active' : ''}`}
                  onClick={() => onDifficultyChange(diff.level, diff.depth)}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Time Control */}
          <div className="settings-section">
            <span className="settings-section-title">Time Control</span>
            <div className="settings-grid-options">
              {TIME_CONTROLS.map((tc) => (
                <button
                  key={tc.id}
                  className={`settings-opt-pill ${timeControl.id === tc.id ? 'active' : ''}`}
                  onClick={() => onTimeControlChange(tc)}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Toggles */}
          <div className="settings-section toggles-section">
            <div className="settings-toggle-row">
              <span className="toggle-label">Sound Effects</span>
              <button
                className={`toggle-switch ${soundEnabled ? 'on' : ''}`}
                onClick={onToggleSound}
                aria-label="Toggle sound effects"
              >
                <div className="toggle-slider" />
              </button>
            </div>

            <div className="settings-toggle-row">
              <span className="toggle-label">Show Legal Move Dots</span>
              <button
                className={`toggle-switch ${showLegalDots ? 'on' : ''}`}
                onClick={onToggleLegalDots}
                aria-label="Toggle legal move dots"
              >
                <div className="toggle-slider" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
