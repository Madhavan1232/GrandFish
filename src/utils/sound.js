/**
 * Authentic Chess.com audio playback.
 * Uses the exact Chess.com sound assets stored in /sounds/.
 * Audio buffers/elements are preloaded and pooled for instant, zero-latency playback.
 */

// Cache of HTML5 Audio objects for zero-latency instant replay
const audioCache = {};

const SOUND_PATHS = {
  moveSelf: '/sounds/move-self.mp3',
  moveOpponent: '/sounds/move-opponent.mp3',
  capture: '/sounds/capture.mp3',
  check: '/sounds/move-check.mp3',
  castle: '/sounds/castle.mp3',
  promote: '/sounds/promote.mp3',
  gameStart: '/sounds/game-start.mp3',
  gameEnd: '/sounds/game-end.mp3',
  gameWin: '/sounds/game-win.mp3',
  gameLose: '/sounds/game-lose.mp3',
  gameDraw: '/sounds/game-draw.mp3',
  illegal: '/sounds/illegal.mp3',
  tenSeconds: '/sounds/tenseconds.mp3',
};

// Pre-create Audio instances
function getAudio(soundKey) {
  const path = SOUND_PATHS[soundKey];
  if (!path) return null;

  try {
    if (!audioCache[soundKey]) {
      audioCache[soundKey] = [];
    }
    // Find an idle audio element or create a new one for overlapping sounds
    const pool = audioCache[soundKey];
    let audio = pool.find((a) => a.paused || a.ended);
    if (!audio) {
      audio = new Audio(path);
      audio.preload = 'auto';
      pool.push(audio);
    }
    return audio;
  } catch {
    return null;
  }
}

function playSound(soundKey, volume = 0.8) {
  try {
    const audio = getAudio(soundKey);
    if (audio) {
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // Fallback if browser blocks unmuted playback before gesture
        });
      }
    }
  } catch {
    // Fail silently
  }
}

// Preload common sounds immediately
if (typeof window !== 'undefined') {
  ['moveSelf', 'moveOpponent', 'capture', 'check', 'castle', 'promote'].forEach((key) => {
    try {
      const a = new Audio(SOUND_PATHS[key]);
      a.preload = 'auto';
      audioCache[key] = [a];
    } catch {}
  });
}

/** Player's own piece move */
export function playMoveSound(isOpponent = false) {
  playSound(isOpponent ? 'moveOpponent' : 'moveSelf', 0.85);
}

/** Capture sound */
export function playCaptureSound() {
  playSound('capture', 0.9);
}

/** King in check sound */
export function playCheckSound() {
  playSound('check', 0.95);
}

/** Castling sound */
export function playCastleSound() {
  playSound('castle', 0.9);
}

/** Pawn promotion sound */
export function playPromoteSound() {
  playSound('promote', 0.9);
}

/** Game start sound */
export function playGameStartSound() {
  playSound('gameStart', 0.8);
}

/** Illegal move sound */
export function playIllegalSound() {
  playSound('illegal', 0.85);
}

/** Game over sound: win, loss, or draw */
export function playGameOverSound(isWin = true, isDraw = false) {
  if (isDraw) {
    playSound('gameDraw', 0.9);
  } else if (isWin) {
    playSound('gameWin', 0.95);
  } else {
    playSound('gameLose', 0.95);
  }
}
