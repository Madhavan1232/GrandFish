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
 * Professional Game Over Modal — Chess.com / Lichess standard
 * Sleek card, player matchup duel, crisp SVG vector icons, zero emojis.
 */
export default function GameOverModal({ result, onNewGame, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const primaryBtn = modalRef.current?.querySelector('.gom-btn-primary');
    if (primaryBtn) {
      setTimeout(() => primaryBtn.focus(), 80);
    }
  }, []);

  if (!result) return null;

  const isWin  = result.winner === 'w';
  const isDraw = result.winner === 'draw';
  const isLoss = !isWin && !isDraw;

  const whiteScore = isWin ? '1' : isDraw ? '½' : '0';
  const blackScore = isWin ? '0' : isDraw ? '½' : '1';

  const titleText = isWin ? 'You Won!' : isLoss ? 'Game Over' : 'Game Drawn';
  const statusTheme = isWin ? 'win' : isLoss ? 'loss' : 'draw';

  return (
    <div className="gom-overlay" role="dialog" aria-modal="true" aria-label="Game result">
      <div className="gom-backdrop" onClick={onClose} />
      <div className={`gom-modal gom-modal--${statusTheme}`} ref={modalRef}>
        {/* Top Dismiss Button */}
        <button
          className="gom-close-btn"
          onClick={onClose}
          title="Review Board"
          aria-label="Close dialog"
        >
          <CloseIcon size={16} />
        </button>

        {/* ── Header: Result Icon & Clean Title ── */}
        <div className="gom-header">
          <div className={`gom-icon-halo gom-icon-halo--${statusTheme}`}>
            {isWin && <TrophyIcon size={28} className="gom-svg-icon" />}
            {isLoss && <SwordsIcon size={28} className="gom-svg-icon" />}
            {isDraw && <HandshakeIcon size={28} className="gom-svg-icon" />}
          </div>
          <h2 className={`gom-headline gom-headline--${statusTheme}`}>{titleText}</h2>
          <p className="gom-subtitle">{result.reason}</p>
        </div>

        {/* ── Player Matchup Duel Card ── */}
        <div className="gom-duel-card">
          {/* User (White) */}
          <div className={`gom-player-card ${isWin ? 'winner' : ''}`}>
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
            <div className={`gom-player-score ${isWin ? 'score-win' : ''}`}>
              {whiteScore}
            </div>
          </div>

          <div className="gom-duel-divider">
            <span className="gom-duel-vs">vs</span>
          </div>

          {/* Stockfish Bot (Black) */}
          <div className={`gom-player-card ${isLoss ? 'winner' : ''}`}>
            <div className="gom-player-avatar-wrap">
              <img
                src="/images/stockfish.png"
                alt="Stockfish Bot"
                className="gom-player-avatar"
              />
              <span className="gom-piece-indicator black-piece-indicator" title="Black" />
            </div>
            <div className="gom-player-meta">
              <span className="gom-player-name">Stockfish</span>
              <span className="gom-player-sub">Black</span>
            </div>
            <div className={`gom-player-score ${isLoss ? 'score-win' : ''}`}>
              {blackScore}
            </div>
          </div>
        </div>

        {/* ── Match Info Meta Bar ── */}
        <div className="gom-meta-strip">
          <div className="gom-meta-item">
            <span className="gom-meta-label">Total Moves</span>
            <span className="gom-meta-val">{result.totalMoves}</span>
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
              {isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw'}
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
            <RefreshIcon size={16} />
            <span>Rematch</span>
          </button>
          <button
            className="gom-btn gom-btn-secondary"
            onClick={onClose}
            title="Review the board position"
          >
            <EyeIcon size={16} />
            <span>Review Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}
