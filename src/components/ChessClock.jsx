import React from 'react';

/**
 * Format milliseconds into MM:SS or S.s (tenths of a second) when time < 10s.
 */
function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (totalSeconds < 10) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}`;
  }

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function ChessClock({ timeMs, isActive, isLowTime, label }) {
  if (timeMs === null || timeMs === undefined) {
    return null; // Unlimited time mode
  }

  const formatted = formatTime(timeMs);
  const isCritical = timeMs <= 30000 && timeMs > 0;
  const isExpired = timeMs <= 0;

  return (
    <div
      className={`chess-clock ${isActive ? 'active' : ''} ${
        isCritical ? 'low-time' : ''
      } ${isExpired ? 'expired' : ''}`}
      title={`${label} remaining time`}
    >
      <span className="clock-icon">⏱</span>
      <span className="clock-digits">{formatted}</span>
    </div>
  );
}
