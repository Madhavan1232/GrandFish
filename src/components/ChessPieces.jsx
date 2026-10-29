import React from 'react';

/**
 * Chess.com Neo Piece Set.
 * Uses high-resolution Neo piece graphics matching Chess.com.
 */
export const NEO_PIECES = {
  wP: (props) => (
    <img
      src="/pieces/neo/wp.png"
      alt="White Pawn"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  wN: (props) => (
    <img
      src="/pieces/neo/wn.png"
      alt="White Knight"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  wB: (props) => (
    <img
      src="/pieces/neo/wb.png"
      alt="White Bishop"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  wR: (props) => (
    <img
      src="/pieces/neo/wr.png"
      alt="White Rook"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  wQ: (props) => (
    <img
      src="/pieces/neo/wq.png"
      alt="White Queen"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  wK: (props) => (
    <img
      src="/pieces/neo/wk.png"
      alt="White King"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  bP: (props) => (
    <img
      src="/pieces/neo/bp.png"
      alt="Black Pawn"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  bN: (props) => (
    <img
      src="/pieces/neo/bn.png"
      alt="Black Knight"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  bB: (props) => (
    <img
      src="/pieces/neo/bb.png"
      alt="Black Bishop"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  bR: (props) => (
    <img
      src="/pieces/neo/br.png"
      alt="Black Rook"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  bQ: (props) => (
    <img
      src="/pieces/neo/bq.png"
      alt="Black Queen"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
  bK: (props) => (
    <img
      src="/pieces/neo/bk.png"
      alt="Black King"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...props?.svgStyle }}
    />
  ),
};
