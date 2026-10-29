import React from 'react';

/**
 * FIDE Article 3.7.e & 4.4.d: Pawn Promotion Selector.
 * Allows player to choose Queen, Rook, Bishop, or Knight.
 */
const PROMOTION_PIECES = [
  { type: 'q', name: 'Queen', img: '/pieces/neo/wq.png', value: '+9' },
  { type: 'n', name: 'Knight', img: '/pieces/neo/wn.png', value: '+3' },
  { type: 'r', name: 'Rook', img: '/pieces/neo/wr.png', value: '+5' },
  { type: 'b', name: 'Bishop', img: '/pieces/neo/wb.png', value: '+3' },
];

export default function PromotionModal({ onSelect, onCancel, targetSquare }) {
  return (
    <div className="promotion-overlay" onClick={onCancel}>
      <div className="promotion-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="promotion-header">
          <span className="promotion-title">Promote Pawn to:</span>
          <span className="promotion-square">{targetSquare?.toUpperCase()}</span>
        </div>
        <div className="promotion-options">
          {PROMOTION_PIECES.map(({ type, name, img, value }) => (
            <button
              key={type}
              className="promotion-option-btn"
              onClick={() => onSelect(type)}
              title={`Promote to ${name}`}
            >
              <img src={img} alt={name} className="promotion-piece-img" />
              <span className="promotion-piece-name">{name}</span>
              <span className="promotion-piece-val">{value}</span>
            </button>
          ))}
        </div>
        <button className="promotion-cancel-btn" onClick={onCancel}>
          Cancel Move
        </button>
      </div>
    </div>
  );
}
