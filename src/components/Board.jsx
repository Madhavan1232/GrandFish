import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useStockfish } from '../hooks/useStockfish';
import { getBasicBotMove } from '../utils/basicBot';
import { NEO_PIECES } from './ChessPieces';
import CapturedPieces from './CapturedPieces';
import ChessClock from './ChessClock';
import PromotionModal from './PromotionModal';
import GameOverModal from './GameOverModal';
import SettingsDropdown from './SettingsDropdown';
import { Cog, TrianglesCenterlineDashedHorizontal } from 'lucide-react';
import {
  RefreshIcon,
} from './Icons';
import { TIME_CONTROLS } from './TimeControlSelector';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playCastleSound,
  playPromoteSound,
  playGameOverSound,
} from '../utils/sound';

// Piece values and starting counts for material advantage & captured pieces calculation
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const STARTING_PIECES = { p: 8, n: 2, b: 2, r: 2, q: 1 };

function computeCapturedPieces(gameInstance) {
  if (!gameInstance) {
    return { capturedByWhite: [], capturedByBlack: [], whiteAdvantage: 0, blackAdvantage: 0 };
  }

  // 1. Primary: calculate accurately from full move history
  const historyMoves = gameInstance.history({ verbose: true });
  if (historyMoves && historyMoves.length > 0) {
    const capturedByWhite = [];
    const capturedByBlack = [];

    historyMoves.forEach((move) => {
      if (move.captured) {
        if (move.color === 'w') {
          capturedByWhite.push({ type: move.captured, color: 'b' });
        } else {
          capturedByBlack.push({ type: move.captured, color: 'w' });
        }
      }
    });

    const whiteScore = capturedByWhite.reduce((s, p) => s + (PIECE_VALUE[p.type] || 0), 0);
    const blackScore = capturedByBlack.reduce((s, p) => s + (PIECE_VALUE[p.type] || 0), 0);

    return {
      capturedByWhite,
      capturedByBlack,
      whiteAdvantage: Math.max(0, whiteScore - blackScore),
      blackAdvantage: Math.max(0, blackScore - whiteScore),
    };
  }

  // 2. Fallback: calculate from board state (missing pieces from initial 16)
  const currentCount = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  try {
    gameInstance.board().flat().forEach((sq) => {
      if (sq && sq.type !== 'k' && currentCount[sq.color]) {
        currentCount[sq.color][sq.type] = (currentCount[sq.color][sq.type] || 0) + 1;
      }
    });
  } catch {}

  const capturedByWhite = [];
  const capturedByBlack = [];

  ['q', 'r', 'b', 'n', 'p'].forEach((type) => {
    // Missing black pieces = captured by White
    const missingB = Math.max(0, (STARTING_PIECES[type] || 0) - (currentCount.b[type] || 0));
    for (let i = 0; i < missingB; i++) {
      capturedByWhite.push({ type, color: 'b' });
    }
    // Missing white pieces = captured by Black
    const missingW = Math.max(0, (STARTING_PIECES[type] || 0) - (currentCount.w[type] || 0));
    for (let i = 0; i < missingW; i++) {
      capturedByBlack.push({ type, color: 'w' });
    }
  });

  const whiteScore = capturedByWhite.reduce((s, p) => s + (PIECE_VALUE[p.type] || 0), 0);
  const blackScore = capturedByBlack.reduce((s, p) => s + (PIECE_VALUE[p.type] || 0), 0);

  return {
    capturedByWhite,
    capturedByBlack,
    whiteAdvantage: Math.max(0, whiteScore - blackScore),
    blackAdvantage: Math.max(0, blackScore - whiteScore),
  };
}

export default function Board() {
  // Game & Board state
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [draggingSquare, setDraggingSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [markedSquares, setMarkedSquares] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLegalDots, setShowLegalDots] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Promotion modal
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // Time control & Clocks (FIDE Article 6)
  const [timeControl, setTimeControl] = useState(TIME_CONTROLS[2]); // 10 min
  const [whiteTimeMs, setWhiteTimeMs] = useState(10 * 60 * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState(10 * 60 * 1000);
  const [gameStarted, setGameStarted] = useState(false);

  // Bot difficulty
  const [skillLevel, setSkillLevelState] = useState(8); // Intermediate
  const [searchDepth, setSearchDepth] = useState(8);

  // Game over state
  const [gameOverResult, setGameOverResult] = useState(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Audio helper with opponent and game state awareness (matching Chess.com)
  const triggerAudio = useCallback((action, isWin = false, isDraw = false, isOpponent = false) => {
    if (!soundEnabledRef.current) return;
    switch (action) {
      case 'move':
        playMoveSound(isOpponent);
        break;
      case 'capture':
        playCaptureSound();
        break;
      case 'check':
        playCheckSound();
        break;
      case 'castle':
        playCastleSound();
        break;
      case 'promote':
        playPromoteSound();
        break;
      case 'gameover':
        playGameOverSound(isWin, isDraw);
        break;
      default:
        playMoveSound(isOpponent);
    }
  }, []);

  // Move execution
  const applyMove = useCallback(
    (moveObj) => {
      const currentGame = gameRef.current;
      if (currentGame.isGameOver()) return false;

      // Clone game preserving full move history (PGN) so captured pieces are never lost
      const newGame = new Chess();
      const currentPgn = currentGame.pgn();
      if (currentPgn) {
        try {
          newGame.loadPgn(currentPgn);
        } catch {
          newGame.load(currentGame.fen());
        }
      } else {
        newGame.load(currentGame.fen());
      }

      try {
        const result = newGame.move(moveObj);
        if (!result) return false;

        const isOpponent = result.color === 'b';
        gameRef.current = newGame;
        setGame(newGame);
        setFen(newGame.fen());
        setLastMove({ from: result.from, to: result.to });
        setGameStarted(true);
        setSelectedSquare(null);
        setLegalMoves([]);
        setMarkedSquares([]); // Clear any right-clicked red squares on move

        // Clock increment
        if (timeControl.incrementMs > 0) {
          if (result.color === 'w') {
            setWhiteTimeMs((t) => t + timeControl.incrementMs);
          } else {
            setBlackTimeMs((t) => t + timeControl.incrementMs);
          }
        }

        // Sound effects
        if (newGame.isGameOver()) {
          const isDraw = newGame.isDraw();
          const isWin = newGame.isCheckmate() && result.color === 'w';
          triggerAudio('gameover', isWin, isDraw, isOpponent);
        } else if (newGame.inCheck()) {
          triggerAudio('check');
        } else if (result.flags.includes('k') || result.flags.includes('q')) {
          triggerAudio('castle');
        } else if (result.captured) {
          triggerAudio('capture');
        } else if (result.promotion) {
          triggerAudio('promote');
        } else {
          triggerAudio('move', false, false, isOpponent);
        }

        // Game over checks
        if (newGame.isCheckmate()) {
          const winner = result.color;
          const res = {
            winner,
            reason: winner === 'w' ? 'Checkmate — You Won!' : 'Checkmate — Stockfish Bot Won!',
            fideRule: 'Article 5.1.a (Checkmate)',
            totalMoves: newGame.history().length,
          };
          setGameOverResult(res);
          setShowGameOverModal(true);
        } else if (newGame.isStalemate()) {
          const res = {
            winner: 'draw',
            reason: 'Drawn by Stalemate',
            fideRule: 'Article 5.2.a (Stalemate)',
            totalMoves: newGame.history().length,
          };
          setGameOverResult(res);
          setShowGameOverModal(true);
        } else if (newGame.isInsufficientMaterial()) {
          const res = {
            winner: 'draw',
            reason: 'Drawn by Insufficient Material',
            fideRule: 'Article 5.2.b (Dead Position)',
            totalMoves: newGame.history().length,
          };
          setGameOverResult(res);
          setShowGameOverModal(true);
        } else if (newGame.isThreefoldRepetition()) {
          const res = {
            winner: 'draw',
            reason: 'Drawn by Threefold Repetition',
            fideRule: 'Article 9.2 (Threefold Repetition)',
            totalMoves: newGame.history().length,
          };
          setGameOverResult(res);
          setShowGameOverModal(true);
        } else if (newGame.isDraw()) {
          const res = {
            winner: 'draw',
            reason: 'Drawn by 50-Move Rule',
            fideRule: 'Article 9.3 (50-Move Rule)',
            totalMoves: newGame.history().length,
          };
          setGameOverResult(res);
          setShowGameOverModal(true);
        }

        return true;
      } catch {
        return false;
      }
    },
    [timeControl, triggerAudio]
  );

  // Stockfish callbacks
  const handleBestMove = useCallback(
    (moveStr) => {
      setIsThinking(false);
      let chosenMove;

      if (skillLevel === 0) {
        // "Basic" bot difficulty: simulates a player under 300 Elo (Chess.com Martin @ 250 Elo)
        const basicMove = getBasicBotMove(gameRef.current, moveStr);
        if (basicMove) {
          chosenMove = {
            from: basicMove.from,
            to: basicMove.to,
            promotion: basicMove.promotion || 'q',
          };
        }
      }

      if (!chosenMove) {
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.length === 5 ? moveStr[4] : 'q';
        chosenMove = { from, to, promotion };
      }

      applyMove(chosenMove);
    },
    [applyMove, skillLevel]
  );

  const { getBestMove, setSkillLevel, newGame: resetEngine } = useStockfish(handleBestMove);

  const triggerStockfish = useCallback(
    (currentFen) => {
      setIsThinking(true);
      const thinkDelay = skillLevel === 0 ? 300 : 350;
      setTimeout(() => {
        getBestMove(currentFen, searchDepth);
      }, thinkDelay);
    },
    [getBestMove, searchDepth, skillLevel]
  );

  // Clock countdown timer
  useEffect(() => {
    if (!gameStarted || !timeControl.timeMs || gameOverResult) return;

    const interval = setInterval(() => {
      const currentTurn = gameRef.current.turn();
      if (gameRef.current.isGameOver()) return;

      if (currentTurn === 'w') {
        setWhiteTimeMs((prev) => {
          if (prev <= 100) {
            clearInterval(interval);
            const isBlackInsufficient = gameRef.current.isInsufficientMaterial();
            const res = isBlackInsufficient
              ? {
                  winner: 'draw',
                  reason: 'Time Out — Draw (Insufficient Material)',
                  fideRule: 'Article 6.9 (Flag Fall with Insufficient Material)',
                  totalMoves: gameRef.current.history().length,
                }
              : {
                  winner: 'b',
                  reason: 'You lost on time (Flag Fall)',
                  fideRule: 'Article 6.9 (Flag Fall)',
                  totalMoves: gameRef.current.history().length,
                };
            setGameOverResult(res);
            setShowGameOverModal(true);
            triggerAudio('gameover', false);
            return 0;
          }
          return prev - 100;
        });
      } else {
        setBlackTimeMs((prev) => {
          if (prev <= 100) {
            clearInterval(interval);
            const isWhiteInsufficient = gameRef.current.isInsufficientMaterial();
            const res = isWhiteInsufficient
              ? {
                  winner: 'draw',
                  reason: 'Time Out — Draw (Insufficient Material)',
                  fideRule: 'Article 6.9 (Flag Fall with Insufficient Material)',
                  totalMoves: gameRef.current.history().length,
                }
              : {
                  winner: 'w',
                  reason: 'Stockfish Bot lost on time (Flag Fall)',
                  fideRule: 'Article 6.9 (Flag Fall)',
                  totalMoves: gameRef.current.history().length,
                };
            setGameOverResult(res);
            setShowGameOverModal(true);
            triggerAudio('gameover', true);
            return 0;
          }
          return prev - 100;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, timeControl, gameOverResult, triggerAudio]);

  // Piece drag restriction
  const canDragPiece = useCallback(
    ({ piece }) => {
      const currentGame = gameRef.current;
      if (currentGame.turn() !== 'w' || currentGame.isGameOver() || isThinking || gameOverResult) {
        return false;
      }
      return piece?.pieceType?.[0] === 'w';
    },
    [isThinking, gameOverResult]
  );

  // Piece drop
  const onDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }) => {
      setDraggingSquare(null);
      if (!targetSquare) return false;
      const currentGame = gameRef.current;
      if (currentGame.turn() !== 'w' || currentGame.isGameOver() || isThinking || gameOverResult) {
        return false;
      }

      const pieceColor = piece?.pieceType?.[0];
      const pieceType = piece?.pieceType?.[1];

      const isPromotion =
        pieceColor === 'w' &&
        pieceType === 'P' &&
        sourceSquare[1] === '7' &&
        targetSquare[1] === '8';

      if (isPromotion) {
        const legal = currentGame
          .moves({ square: sourceSquare, verbose: true })
          .some((m) => m.to === targetSquare);

        if (!legal) return false;

        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return false;
      }

      const success = applyMove({
        from: sourceSquare,
        to: targetSquare,
      });

      if (success) {
        setSelectedSquare(null);
        setLegalMoves([]);
        const newFen = gameRef.current.fen();
        if (!gameRef.current.isGameOver()) {
          triggerStockfish(newFen);
        }
      }

      return success;
    },
    [isThinking, gameOverResult, applyMove, triggerStockfish]
  );

  // Piece drag start: highlight original square in yellow & compute legal moves
  const onPieceDrag = useCallback(
    ({ square }) => {
      if (!square) return;
      const currentGame = gameRef.current;
      setDraggingSquare(square);
      setSelectedSquare(square);
      if (
        currentGame.turn() === 'w' &&
        !currentGame.isGameOver() &&
        !isThinking &&
        !gameOverResult
      ) {
        const moves = currentGame.moves({ square, verbose: true }).map((m) => m.to);
        setLegalMoves(moves);
      }
    },
    [isThinking, gameOverResult]
  );

  // Piece drag cancelled
  const onPieceDragCancel = useCallback(() => {
    setDraggingSquare(null);
  }, []);

  // Mouse down on square: immediately turn original square yellow
  const onSquareMouseDown = useCallback(
    ({ piece, square }) => {
      if (!square) return;
      const currentGame = gameRef.current;
      const p = piece || currentGame.get(square);
      if (
        p &&
        (p.color === 'w' || p.pieceType?.[0] === 'w') &&
        currentGame.turn() === 'w' &&
        !currentGame.isGameOver() &&
        !isThinking &&
        !gameOverResult
      ) {
        setDraggingSquare(square);
        setSelectedSquare(square);
        const moves = currentGame.moves({ square, verbose: true }).map((m) => m.to);
        setLegalMoves(moves);
      }
    },
    [isThinking, gameOverResult]
  );

  // Square / Piece click: clicking any piece turns background yellow (matching reference image)
  const onSquareClick = useCallback(
    ({ square }) => {
      if (!square) return;
      const currentGame = gameRef.current;
      const clickedPiece = currentGame.get(square);

      if (selectedSquare) {
        // Clicking same square toggles off
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        // Check if destination is a legal move
        if (legalMoves.includes(square)) {
          const movingPiece = currentGame.get(selectedSquare);
          const isPromotion =
            movingPiece?.type === 'p' && movingPiece?.color === 'w' && square[1] === '8';

          if (isPromotion) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }

          const success = applyMove({
            from: selectedSquare,
            to: square,
          });

          setSelectedSquare(null);
          setLegalMoves([]);

          if (success && !gameRef.current.isGameOver()) {
            triggerStockfish(gameRef.current.fen());
          }
          return;
        }

        // If clicking another piece on the board:
        if (clickedPiece) {
          if (
            clickedPiece.color === 'w' &&
            currentGame.turn() === 'w' &&
            !currentGame.isGameOver() &&
            !isThinking &&
            !gameOverResult
          ) {
            const moves = currentGame.moves({ square, verbose: true }).map((m) => m.to);
            setSelectedSquare(square);
            setLegalMoves(moves);
          } else {
            // Clicking opponent's piece or piece when not movable: highlight yellow, no moves
            setSelectedSquare(square);
            setLegalMoves([]);
          }
          return;
        }

        // Clicked an empty square that is not a legal move: deselect
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // No square previously selected
      if (clickedPiece) {
        if (
          clickedPiece.color === 'w' &&
          currentGame.turn() === 'w' &&
          !currentGame.isGameOver() &&
          !isThinking &&
          !gameOverResult
        ) {
          const moves = currentGame.moves({ square, verbose: true }).map((m) => m.to);
          setSelectedSquare(square);
          setLegalMoves(moves);
        } else {
          // Clicking any piece on board highlights yellow as in attached image
          setSelectedSquare(square);
          setLegalMoves([]);
        }
      }
    },
    [selectedSquare, legalMoves, isThinking, gameOverResult, applyMove, triggerStockfish]
  );

  // Right-click: toggle light red highlight on square; re-clicking returns to default
  const onSquareRightClick = useCallback(({ square }) => {
    if (!square) return;
    setMarkedSquares((prev) =>
      prev.includes(square) ? prev.filter((s) => s !== square) : [...prev, square]
    );
    // If the right-clicked square was currently selected in yellow, clear selection so red is visible
    setSelectedSquare((prev) => (prev === square ? null : prev));
  }, []);

  // Promotion choice
  const handlePromotionSelect = useCallback(
    (promoPiece) => {
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);

      const success = applyMove({ from, to, promotion: promoPiece });
      if (success && !gameRef.current.isGameOver()) {
        triggerStockfish(gameRef.current.fen());
      }
    },
    [pendingPromotion, applyMove, triggerStockfish]
  );

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  // Toolbar Action: Flip Board
  const handleFlipBoard = useCallback(() => {
    setBoardOrientation((curr) => (curr === 'white' ? 'black' : 'white'));
  }, []);

  // New Game
  const startNewGame = useCallback(
    (customTimeControl = timeControl) => {
      resetEngine();
      const fresh = new Chess();
      gameRef.current = fresh;
      setGame(fresh);
      setFen(fresh.fen());
      setSelectedSquare(null);
      setDraggingSquare(null);
      setLegalMoves([]);
      setMarkedSquares([]);
      setLastMove(null);
      setIsThinking(false);
      setGameOverResult(null);
      setShowGameOverModal(false);
      setPendingPromotion(null);

      const initialTime = customTimeControl.timeMs;
      setWhiteTimeMs(initialTime);
      setBlackTimeMs(initialTime);
      setGameStarted(false);
    },
    [resetEngine, timeControl]
  );

  const handleDifficultyChange = useCallback(
    (level, depth) => {
      setSkillLevelState(level);
      setSearchDepth(depth);
      setSkillLevel(level);
      startNewGame();
    },
    [setSkillLevel, startNewGame]
  );

  const handleTimeControlChange = useCallback(
    (tc) => {
      setTimeControl(tc);
      startNewGame(tc);
    },
    [startNewGame]
  );

  useEffect(() => {
    setSkillLevel(skillLevel);
  }, [skillLevel, setSkillLevel]);

  // Derived captured pieces
  const { capturedByWhite, capturedByBlack, whiteAdvantage, blackAdvantage } =
    useMemo(() => computeCapturedPieces(game), [game]);

  // Square styles (wood theme highlights)
  const squareStyles = useMemo(() => {
    const styles = {};

    // 1. Last move highlight (subtle warm yellow overlay)
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(235, 197, 61, 0.42)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(235, 197, 61, 0.42)' };
    }

    // 2. Right-clicked squares highlight (light red overlay)
    markedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(235, 97, 80, 0.8)' };
    });

    // 3. Selected square or dragging square highlight (warm golden yellow)
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(235, 197, 61, 0.8)' };
    }
    if (draggingSquare) {
      styles[draggingSquare] = { backgroundColor: 'rgba(235, 197, 61, 0.8)' };
    }

    // 4. Legal move dots & capture rings
    if (showLegalDots) {
      legalMoves.forEach((sq) => {
        const pieceOnSquare = game.get(sq);
        const existingBg = styles[sq]?.backgroundColor;
        if (pieceOnSquare) {
          styles[sq] = {
            ...(existingBg ? { backgroundColor: existingBg } : {}),
            backgroundImage:
              'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.32) 55%)',
            borderRadius: '50%',
            cursor: 'pointer',
          };
        } else {
          styles[sq] = {
            ...(existingBg ? { backgroundColor: existingBg } : {}),
            backgroundImage:
              'radial-gradient(circle, rgba(0, 0, 0, 0.28) 25%, transparent 25%)',
            cursor: 'pointer',
          };
        }
      });
    }

    // 5. In-check king glow
    if (game.inCheck()) {
      const currentTurn = game.turn();
      const board = game.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === 'k' && p.color === currentTurn) {
            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            styles[`${file}${rank}`] = {
              background:
                'radial-gradient(ellipse at center, rgba(235, 50, 35, 0.85) 0%, rgba(200, 30, 30, 0.45) 50%, transparent 72%)',
            };
          }
        }
      }
    }

    return styles;
  }, [selectedSquare, draggingSquare, legalMoves, game, lastMove, markedSquares, showLegalDots]);

  // Board background style (Chess.com Walnut Wood)
  const boardBgStyle = useMemo(
    () => ({
      backgroundImage: "url('/boards/walnut.png')",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      borderRadius: '3px',
    }),
    []
  );

  return (
    <div className="chesscom-app">
      {/* Main Chess Arena (Centered, Big Board) */}
      <main className="chesscom-main-arena">
        <div className="board-container-wrapper">
          {/* Top Player Row: Stockfish Bot */}
          <div className="arena-player-row top-row">
            <div className="player-identity">
              <div className="avatar-box opponent-avatar">
                <img
                  src="/images/stockfish.png"
                  alt="Stockfish Logo"
                  className="avatar-img stockfish-avatar-img"
                />
              </div>
              <div className="player-details">
                <span className="player-display-name">Stockfish Bot</span>
                <CapturedPieces captured={capturedByBlack} by="b" advantage={blackAdvantage} />
              </div>
            </div>

            <div className="player-right-group">
              <ChessClock
                timeMs={blackTimeMs}
                isActive={gameStarted && game.turn() === 'b' && !gameOverResult}
                label="Stockfish Bot"
              />
            </div>
          </div>

          {/* Chessboard Row + Right Vertical Toolbar */}
          <div className="chessboard-and-toolbar">
            <div className="main-board-frame" onContextMenu={(e) => e.preventDefault()}>
              <Chessboard
                options={{
                  id: 'chesscom-large-board',
                  position: fen,
                  boardOrientation,
                  pieces: NEO_PIECES,
                  onPieceDrop: onDrop,
                  onPieceDrag,
                  onPieceDragCancel,
                  onSquareMouseDown,
                  onPieceClick: ({ square }) => onSquareClick({ square }),
                  onSquareClick: onSquareClick,
                  onSquareRightClick: onSquareRightClick,
                  allowDrawingArrows: false,
                  canDragPiece,
                  squareStyles,
                  boardStyle: boardBgStyle,
                  darkSquareStyle: { backgroundColor: 'transparent' },
                  lightSquareStyle: { backgroundColor: 'transparent' },
                  dropSquareStyle: {
                    boxShadow: 'inset 0px 0px 0px 2.5px #ffffff',
                  },
                  draggingPieceStyle: {
                    transform: 'scale(1.22)',
                    filter:
                      'drop-shadow(0 14px 18px rgba(0, 0, 0, 0.45)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                    transition: 'none',
                  },
                  draggingPieceGhostStyle: {
                    opacity: 0,
                    visibility: 'hidden',
                  },
                  animationDurationInMs: 200,
                  allowDragging: !gameOverResult,
                  showNotation: true,
                  numericNotationStyle: {
                    fontSize: '11px',
                    fontWeight: 700,
                    opacity: 0.85,
                  },
                  alphaNotationStyle: {
                    fontSize: '11px',
                    fontWeight: 700,
                    opacity: 0.85,
                  },
                  darkSquareNotationStyle: { color: '#b58863' },
                  lightSquareNotationStyle: { color: '#734823' },
                }}
              />

              {/* FIDE Article 3.7.e Promotion Modal */}
              {pendingPromotion && (
                <PromotionModal
                  targetSquare={pendingPromotion.to}
                  onSelect={handlePromotionSelect}
                  onCancel={handlePromotionCancel}
                />
              )}
            </div>

            {/* Vertical Action Toolbar (Clean Vector SVGs matching Chess.com, No Emojis) */}
            <div className="board-side-toolbar">
              <div className="settings-btn-anchor">
                <button
                  className={`toolbar-btn ${isSettingsOpen ? 'active' : ''}`}
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  title="Settings"
                  aria-label="Settings"
                  aria-expanded={isSettingsOpen}
                >
                  <Cog size={20} />
                </button>

                {/* Dropdown Menu Anchored to Settings Button */}
                <SettingsDropdown
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                  skillLevel={skillLevel}
                  onDifficultyChange={handleDifficultyChange}
                  timeControl={timeControl}
                  onTimeControlChange={handleTimeControlChange}
                  showLegalDots={showLegalDots}
                  onToggleLegalDots={() => setShowLegalDots((d) => !d)}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled((s) => !s)}
                />
              </div>

              <button
                className="toolbar-btn"
                onClick={handleFlipBoard}
                title="Flip Board"
                aria-label="Flip Board"
              >
                <TrianglesCenterlineDashedHorizontal size={20} />
              </button>

              <button
                className="toolbar-btn"
                onClick={() => startNewGame()}
                title="Reset Game"
                aria-label="Reset Game"
              >
                <RefreshIcon size={19} />
              </button>
            </div>
          </div>

          {/* Bottom Player Row: You */}
          <div className="arena-player-row bottom-row">
            <div className="player-identity">
              <div className="avatar-box user-avatar">
                <img
                  src="/images/user_avatar.png"
                  alt="User Avatar"
                  className="avatar-img user-avatar-img"
                />
              </div>
              <div className="player-details">
                <div className="user-name-line">
                  <span className="player-display-name">You</span>
                </div>
                <CapturedPieces captured={capturedByWhite} by="w" advantage={whiteAdvantage} />
              </div>
            </div>

            <div className="player-right-group">
              <ChessClock
                timeMs={whiteTimeMs}
                isActive={gameStarted && game.turn() === 'w' && !gameOverResult}
                label="You"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Game Over Dialog */}
      {showGameOverModal && (
        <GameOverModal
          result={gameOverResult}
          onNewGame={() => startNewGame()}
          onClose={() => setShowGameOverModal(false)}
        />
      )}
    </div>
  );
}
