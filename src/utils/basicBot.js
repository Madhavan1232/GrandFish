import { Chess } from 'chess.js';

/**
 * Simulates a sub-300 Elo beginner chess bot (comparable to Chess.com's Martin @ 250 Elo).
 *
 * Characteristics of <300 Elo play:
 * 1. High blunder rate (~28%): frequently moves pieces into attacked squares without defense.
 * 2. Frequent flank and edge pawn pushes (a3/a4/a5/a6, h3/h4/h5/h6, b-pawns, g-pawns, f-pawns).
 * 3. Awkward piece hops (knights to rim like Na6, Nh6, Na3, Nh3).
 * 4. Checks whenever possible ("patzer sees a check, patzer gives a check").
 * 5. Simple 1-move captures when visually obvious (~15%).
 * 6. Plays Stockfish's top suggested move only ~12-15% of the time.
 *
 * All moves are strictly guaranteed to be legal chess moves.
 */
export function getBasicBotMove(gameInstance, stockfishMoveStr = '') {
  if (!gameInstance) return null;

  const legalMoves = gameInstance.moves({ verbose: true });
  if (!legalMoves || legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  // 1. Small chance (12%) to play Stockfish's suggested move
  if (stockfishMoveStr && Math.random() < 0.12) {
    const from = stockfishMoveStr.slice(0, 2);
    const to = stockfishMoveStr.slice(2, 4);
    const promo = stockfishMoveStr[4];
    const sfMove = legalMoves.find(
      (m) => m.from === from && m.to === to && (!promo || m.promotion === promo)
    );
    if (sfMove) return sfMove;
  }

  const turn = gameInstance.turn();
  const opponentColor = turn === 'w' ? 'b' : 'w';

  // 2. Categorize legal moves into beginner buckets
  const blunders = [];
  const flankPawns = [];
  const checks = [];
  const captures = [];
  const edgeKnights = [];
  const otherMoves = [];

  for (const m of legalMoves) {
    let clone;
    try {
      clone = new Chess(gameInstance.fen());
      clone.move(m);
    } catch {
      otherMoves.push(m);
      continue;
    }

    // Check if the move delivers check
    if (clone.inCheck()) {
      checks.push(m);
    }

    // Check if the move is a capture
    if (m.captured) {
      captures.push(m);
    }

    // Flank pawn pushes (a, b, f, g, h files)
    if (m.piece === 'p' && (m.to.startsWith('a') || m.to.startsWith('b') || m.to.startsWith('f') || m.to.startsWith('g') || m.to.startsWith('h'))) {
      flankPawns.push(m);
    }

    // Edge knights (Na3, Nh3, Na6, Nh6)
    if (m.piece === 'n' && (m.to.includes('a') || m.to.includes('h'))) {
      edgeKnights.push(m);
    }

    // Blunders: moving into a square attacked by the opponent
    if (clone.isAttacked(m.to, opponentColor)) {
      blunders.push(m);
    } else {
      otherMoves.push(m);
    }
  }

  // 3. Assemble weighted candidate pool matching < 300 Elo playstyle
  const pool = [];

  // ~28% Blunders
  if (blunders.length > 0) {
    for (let i = 0; i < 28; i++) {
      pool.push(blunders[Math.floor(Math.random() * blunders.length)]);
    }
  }

  // ~24% Flank pawn pushes
  if (flankPawns.length > 0) {
    for (let i = 0; i < 24; i++) {
      pool.push(flankPawns[Math.floor(Math.random() * flankPawns.length)]);
    }
  }

  // ~16% Quirky checks or rim knights
  const quirks = [...checks, ...edgeKnights];
  if (quirks.length > 0) {
    for (let i = 0; i < 16; i++) {
      pool.push(quirks[Math.floor(Math.random() * quirks.length)]);
    }
  }

  // ~18% Simple captures
  if (captures.length > 0) {
    for (let i = 0; i < 18; i++) {
      pool.push(captures[Math.floor(Math.random() * captures.length)]);
    }
  }

  // ~14% Other legal moves
  if (otherMoves.length > 0) {
    for (let i = 0; i < 14; i++) {
      pool.push(otherMoves[Math.floor(Math.random() * otherMoves.length)]);
    }
  }

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Fallback: pick any random legal move
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}
