import React from 'react';

export const TIME_CONTROLS = [
  { id: '3m', label: '3 min', timeMs: 3 * 60 * 1000, incrementMs: 0, type: 'Blitz' },
  { id: '5m', label: '5 min', timeMs: 5 * 60 * 1000, incrementMs: 0, type: 'Blitz' },
  { id: '10m', label: '10 min', timeMs: 10 * 60 * 1000, incrementMs: 0, type: 'Rapid' },
  { id: '15|10', label: '15 | 10', timeMs: 15 * 60 * 1000, incrementMs: 10 * 1000, type: 'Rapid' },
  { id: 'unlimited', label: '∞', timeMs: null, incrementMs: 0, type: 'Casual' },
];

export default function TimeControlSelector({ current, onChange, disabled }) {
  return (
    <div className="time-control-group">
      <span className="control-section-label">Time Control</span>
      <div className="time-control-pills">
        {TIME_CONTROLS.map((tc) => (
          <button
            key={tc.id}
            className={`time-pill ${current.id === tc.id ? 'active' : ''}`}
            onClick={() => onChange(tc)}
            disabled={disabled}
            title={`${tc.type} (${tc.label})`}
          >
            {tc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
