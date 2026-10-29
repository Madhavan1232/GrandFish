import React, { useEffect, useRef } from 'react';
import {
  TrophyIcon,
  SwordsIcon,
  HandshakeIcon,
  RefreshIcon,
  EyeIcon,
  CloseIcon,
} from './Icons';

/**
 * Format the end reason into a concise, professional chess subtitle
 * e.g. "by checkmate", "on time", "by stalemate"
 */
function formatReason(reason, winner) {
  if (!reason) {
    return winner === 'w' ? 'by checkmate' : winner === 'b' ? 'by checkmate' : 'Game drawn';
  }
  const r = reason.toLowerCase();
  if (r.includes('checkmate')) return 'by checkmate';
  if (r.includes('flag fall') || r.includes('time')) return 'on time';
  if (r.includes('stalemate')) return 'by stalemate';
  if (r.includes('insufficient')) return 'by insufficient material';
  if (r.includes('threefold') || r.includes('repetition')) return 'by repetition';
  if (r.includes('50-move')) return 'by 50-move rule';
  if (r.includes('resig')) return 'by resignation';
  return reason;
}

/**
 * Professional Chess Game Victory / Game Over Modal — Production Quality
 * Charcoal dark theme, elegant green accents, tactile buttons, crisp SVG vector icons.
 */
export default function GameOverModal({ result, onNewGame, onClose }) {
  const modalRef = useRef(null);

  // Auto-focus primary Rematch button and support Esc to dismiss modal
  useEffect(() => {
    const primaryBtn = modalRef.current?.querySelector('.gom-btn-primary');
    if (primaryBtn) {
      setTimeout(() => primaryBtn.focus(), 60);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!result) return null;

  const isWin  = result.winner === 'w';
  const isDraw = result.winner === 'draw';
  const isLoss = !isWin && !isDraw;

  const whiteScore = isWin ? '1' : isDraw ? '½' : '0';
  const blackScore = isWin ? '0' : isDraw ? '½' : '1';

  const titleText = isWin ? 'You Won!' : isLoss ? 'Game Over' : 'Game Drawn';
  const statusTheme = isWin ? 'win' : isLoss ? 'loss' : 'draw';
  const statusLabel = isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw';
  const subtitleText = formatReason(result.reason, result.winner);

  return (
    <div className="gom-overlay" role="dialog" aria-modal="true" aria-label="Game result">
      <div className="gom-backdrop" onClick={onClose} />
      <div className={`gom-modal gom-modal--${statusTheme}`} ref={modalRef}>
        {/* Top Dismiss Button */}
        <button
          className="gom-close-btn"
          onClick={onClose}
          title="Review Board (Esc)"
          aria-label="Close dialog"
        >
          <CloseIcon size={16} />
        </button>

        {/* ── Header: Result Icon & Clean Title ── */}
        <div className="gom-header">
          <div className={`gom-icon-halo gom-icon-halo--${statusTheme}`}>
            {isWin && <TrophyIcon size={32} className="gom-svg-icon" />}
            {isLoss && <SwordsIcon size={30} className="gom-svg-icon" />}
            {isDraw && <HandshakeIcon size={30} className="gom-svg-icon" />}
          </div>
          <h2 className={`gom-headline gom-headline--${statusTheme}`}>{titleText}</h2>
          <p className="gom-subtitle">{subtitleText}</p>
        </div>

        {/* ── Player Matchup Duel Card ── */}
        <div className="gom-duel-card">
          {/* User (White) */}
          <div className={`gom-player-pod gom-player-left ${isWin ? 'is-winner' : ''}`}>
            <div className="gom-player-avatar-wrap">
              <img
                src="/images/user_avatar.png"
                alt="You"
                className="gom-player-avatar"
              />
              <span className="gom-piece-indicator white-piece-indicator" title="White" />
            </div>
            <div className="gom-player-meta">
              <span className="gom-player-name">You</span>
              <span className="gom-player-sub">White</span>
            </div>
          </div>

          {/* Center Match Score */}
          <div className="gom-duel-score-center">
            <span className={`gom-score-badge ${isWin ? 'score-win' : ''}`}>
              {whiteScore}
            </span>
            <span className="gom-duel-sep">-</span>
            <span className={`gom-score-badge ${isLoss ? 'score-win' : ''}`}>
              {blackScore}
            </span>
          </div>

          {/* Stockfish Bot (Black) */}
          <div className={`gom-player-pod gom-player-right ${isLoss ? 'is-winner' : ''}`}>
            <div className="gom-player-meta text-right">
              <span className="gom-player-name">Stockfish</span>
              <span className="gom-player-sub">Black</span>
            </div>
            <div className="gom-player-avatar-wrap">
              <img
                src="/images/stockfish.png"
                alt="Stockfish Bot"
                className="gom-player-avatar"
              />
              <span className="gom-piece-indicator black-piece-indicator" title="Black" />
            </div>
          </div>
        </div>

        {/* ── Match Info Meta Bar ── */}
        <div className="gom-meta-strip">
          <div className="gom-meta-item">
            <span className="gom-meta-label">Total Moves</span>
            <span className="gom-meta-val">{result.totalMoves || 0}</span>
          </div>
          <div className="gom-meta-sep" />
          <div className="gom-meta-item">
            <span className="gom-meta-label">Final Result</span>
            <span className="gom-meta-val">{whiteScore} - {blackScore}</span>
          </div>
          <div className="gom-meta-sep" />
          <div className="gom-meta-item">
            <span className="gom-meta-label">Status</span>
            <span className={`gom-meta-val gom-meta-status--${statusTheme}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Action Buttons (Clean vector icons, zero emojis) ── */}
        <div className="gom-actions">
          <button
            className="gom-btn gom-btn-primary"
            onClick={onNewGame}
            title="Start a new rematch"
          >
            <RefreshIcon size={18} />
            <span>Rematch</span>
          </button>
          <button
            className="gom-btn gom-btn-secondary"
            onClick={onClose}
            title="Review the board position"
          >
            <EyeIcon size={18} />
            <span>Review Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}
