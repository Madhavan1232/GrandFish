import React, { useMemo } from 'react';
import {
  ChessQueen,
  ChessRook,
  ChessBishop,
  ChessKnight,
  ChessPawn,
} from 'lucide-react';

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const PIECE_NAMES = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen' };
const PIECE_ORDER = ['q', 'r', 'b', 'n', 'p'];

const LUCIDE_CHESS_ICONS = {
  q: ChessQueen,
  r: ChessRook,
  b: ChessBishop,
  n: ChessKnight,
  p: ChessPawn,
};

/**
 * CapturedPieces - Displays captured pieces using lucide-react chess icons.
 * @param {Object[]} captured - Array of piece objects {type, color}
 * @param {string} by - 'w' or 'b' (who did the capturing)
 * @param {number} advantage - material advantage (positive = this side is ahead)
 */
function CapturedPieces({ captured = [], by = 'w', advantage = 0 }) {
  // Sort captured pieces by value (highest first, like chess.com)
  const sorted = useMemo(() => {
    if (!captured || captured.length === 0) return [];
    return [...captured].sort(
      (a, b) => (PIECE_VALUE[b.type] || 0) - (PIECE_VALUE[a.type] || 0)
    );
  }, [captured]);

  // If nothing captured and no advantage, don't render an empty container
  if ((!captured || captured.length === 0) && advantage <= 0) {
    return null;
  }

  // The color of pieces displayed = the color of pieces that were captured
  // If 'w' captures, it captures Black's pieces (color 'b')
  const capturedColor = by === 'w' ? 'b' : 'w';

  return (
    <div className="captured-pieces" role="region" aria-label="Captured pieces">
      <div className="captured-icons">
        {PIECE_ORDER.map((type) => {
          const count = sorted.filter((p) => p.type === type).length;
          if (count === 0) return null;
          const PieceIcon = LUCIDE_CHESS_ICONS[type];
          if (!PieceIcon) return null;
          const pieceLabel = `${count} ${PIECE_NAMES[type]}${count > 1 ? 's' : ''}`;
          return (
            <div
              key={type}
              className="captured-piece-stack"
              title={pieceLabel}
            >
              {Array.from({ length: count }).map((_, i) => (
                <PieceIcon
                  key={`${type}-${i}`}
                  size={16}
                  className={`captured-lucide-icon captured-lucide-icon--${capturedColor}`}
                  style={{
                    marginLeft: i > 0 ? '-7px' : '0',
                    zIndex: i + 1,
                  }}
                  aria-label={`${capturedColor === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[type]}`}
                />
              ))}
            </div>
          );
        })}
      </div>
      {advantage > 0 && (
        <span className="material-advantage" title={`+${advantage} material advantage`}>
          +{advantage}
        </span>
      )}
    </div>
  );
}

export default React.memo(CapturedPieces);
