import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage Stockfish Web Worker communication via UCI protocol.
 * The stockfish-19-lite-single.js is a self-contained web worker that communicates
 * via postMessage/onmessage, just like the UCI protocol.
 *
 * @param {Function} onBestMove - Callback invoked with the bestmove string (e.g. "e7e5")
 */
export function useStockfish(onBestMove, onEvaluation) {
  const workerRef = useRef(null);
  const onBestMoveRef = useRef(onBestMove);
  const onEvaluationRef = useRef(onEvaluation);
  const isReadyRef = useRef(false);
  const pendingCommandsRef = useRef([]);

  // Keep callback refs current without recreating worker
  useEffect(() => {
    onBestMoveRef.current = onBestMove;
  }, [onBestMove]);

  useEffect(() => {
    onEvaluationRef.current = onEvaluation;
  }, [onEvaluation]);

  // Initialize worker once on mount
  useEffect(() => {
    const workerUrl = `${process.env.PUBLIC_URL}/stockfish/stockfish.js`;

    let worker;
    try {
      worker = new Worker(workerUrl);
    } catch (err) {
      console.error('Failed to create Stockfish worker:', err);
      return;
    }

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = typeof event.data === 'string' ? event.data : '';
      if (!message) return;

      // Engine is ready
      if (message === 'readyok') {
        isReadyRef.current = true;
        // Flush any pending commands
        pendingCommandsRef.current.forEach((cmd) => worker.postMessage(cmd));
        pendingCommandsRef.current = [];
      }

      // Parse info evaluation score (score cp or score mate)
      if (message.startsWith('info') && message.includes('score')) {
        const mateMatch = message.match(/score mate (-?\d+)/);
        const cpMatch = message.match(/score cp (-?\d+)/);
        if (mateMatch && onEvaluationRef.current) {
          onEvaluationRef.current({ type: 'mate', value: parseInt(mateMatch[1], 10) });
        } else if (cpMatch && onEvaluationRef.current) {
          onEvaluationRef.current({ type: 'cp', value: parseInt(cpMatch[1], 10) });
        }
      }

      // Parse bestmove response
      if (message.startsWith('bestmove')) {
        const parts = message.split(' ');
        const move = parts[1];
        if (move && move !== '(none)') {
          onBestMoveRef.current(move);
        }
      }
    };

    worker.onerror = (err) => {
      console.error('Stockfish worker error:', err);
    };

    // Boot UCI protocol
    worker.postMessage('uci');
    worker.postMessage('isready');

    return () => {
      worker.terminate();
      workerRef.current = null;
      isReadyRef.current = false;
    };
  }, []);

  /**
   * Send a raw UCI command to the engine.
   */
  const sendCommand = useCallback((cmd) => {
    if (!workerRef.current) return;
    if (!isReadyRef.current) {
      pendingCommandsRef.current.push(cmd);
      return;
    }
    workerRef.current.postMessage(cmd);
  }, []);

  /**
   * Set Stockfish Skill Level (0-20).
   */
  const setSkillLevel = useCallback((level) => {
    sendCommand(`setoption name Skill Level value ${level}`);
    // For very low levels, also limit ELO
    if (level === 0) {
      sendCommand('setoption name UCI_LimitStrength value true');
      sendCommand('setoption name UCI_Elo value 600');
    } else if (level <= 3) {
      sendCommand('setoption name UCI_LimitStrength value true');
      sendCommand('setoption name UCI_Elo value 800');
    } else if (level <= 8) {
      sendCommand('setoption name UCI_LimitStrength value true');
      sendCommand(`setoption name UCI_Elo value ${800 + level * 80}`);
    } else {
      sendCommand('setoption name UCI_LimitStrength value false');
    }
  }, [sendCommand]);

  /**
   * Ask Stockfish for the best move given a FEN position.
   * @param {string} fen - Current board FEN
   * @param {number} depth - Search depth
   */
  const getBestMove = useCallback((fen, depth = 10) => {
    if (!workerRef.current) return;
    sendCommand('stop');
    sendCommand(`position fen ${fen}`);
    sendCommand(`go depth ${depth}`);
  }, [sendCommand]);

  /**
   * Tell engine to start a new game.
   */
  const newGame = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage('ucinewgame');
    workerRef.current.postMessage('isready');
    isReadyRef.current = false;
  }, []);

  return { getBestMove, setSkillLevel, newGame };
}
