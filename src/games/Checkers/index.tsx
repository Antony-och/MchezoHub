import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { Bot, Users, RotateCcw, Award, Palette, Check } from 'lucide-react';

type CheckerColor = 'r' | 'b'; // r = Player 1, b = Player 2 or AI

interface CheckerPiece {
  color: CheckerColor;
  isKing: boolean;
}

type Board = (CheckerPiece | null)[][];
type Position = { r: number; c: number };
type AIDifficulty = 'easy' | 'medium' | 'hard';
type Mode = 'ai' | 'pvp';

export type CheckersBoardThemeId =
  | 'wood'
  | 'green'
  | 'ocean'
  | 'charcoal'
  | 'walnut'
  | 'cherry'
  | 'obsidian'
  | 'marble';

export interface CheckersBoardTheme {
  id: CheckersBoardThemeId;
  name: string;
  light: string;
  dark: string;
  border: string;
}

export const CHECKERS_BOARD_THEMES: Record<CheckersBoardThemeId, CheckersBoardTheme> = {
  wood: {
    id: 'wood',
    name: 'Classic Wood',
    light: '#eedca5',
    dark: '#b88762',
    border: '#2b1d12',
  },
  green: {
    id: 'green',
    name: 'Tournament Green',
    light: '#eeeed2',
    dark: '#769656',
    border: '#2c3e1e',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    light: '#dee3e6',
    dark: '#5a829e',
    border: '#1e303d',
  },
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal Dark',
    light: '#e2e8f0',
    dark: '#475569',
    border: '#0f172a',
  },
  walnut: {
    id: 'walnut',
    name: 'Autumn Walnut',
    light: '#f0d9b5',
    dark: '#8b4513',
    border: '#3e1d09',
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Blossom',
    light: '#fce7f3',
    dark: '#db2777',
    border: '#831843',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    light: '#334155',
    dark: '#0f172a',
    border: '#020617',
  },
  marble: {
    id: 'marble',
    name: 'Royal Marble',
    light: '#f8fafc',
    dark: '#2563eb',
    border: '#1e3a8a',
  },
};

export type CheckerPieceThemeId =
  | 'classic'
  | 'ivoryEbony'
  | 'woodcraft'
  | 'neon'
  | 'goldOnyx'
  | 'emerald';

export interface CheckerPieceThemeConfig {
  id: CheckerPieceThemeId;
  name: string;
  desc: string;
  p1Gradient: { from: string; to: string };
  p1Border: string;
  p1Ring: string;
  p1Center: string;
  p2Gradient: { from: string; to: string };
  p2Border: string;
  p2Ring: string;
  p2Center: string;
  crownColor: string;
  crownAccent: string;
  p1Dot: string;
  p2Dot: string;
}

export const CHECKER_PIECE_THEMES: Record<CheckerPieceThemeId, CheckerPieceThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Ruby & Coal',
    desc: 'Tournament draughts with gold crowns',
    p1Gradient: { from: '#f43f5e', to: '#be123c' },
    p1Border: '#9f1239',
    p1Ring: '#fecdd3',
    p1Center: '#9f1239',
    p2Gradient: { from: '#292524', to: '#0c0a09' },
    p2Border: '#1c1917',
    p2Ring: '#78716c',
    p2Center: '#1c1917',
    crownColor: '#fbbf24',
    crownAccent: '#b45309',
    p1Dot: '#f43f5e',
    p2Dot: '#1c1917',
  },
  ivoryEbony: {
    id: 'ivoryEbony',
    name: 'Ivory & Ebony',
    desc: 'Porcelain white and deep obsidian',
    p1Gradient: { from: '#ffffff', to: '#e2e8f0' },
    p1Border: '#cbd5e1',
    p1Ring: '#94a3b8',
    p1Center: '#f1f5f9',
    p2Gradient: { from: '#18181b', to: '#09090b' },
    p2Border: '#27272a',
    p2Ring: '#52525b',
    p2Center: '#18181b',
    crownColor: '#f59e0b',
    crownAccent: '#92400e',
    p1Dot: '#f8fafc',
    p2Dot: '#09090b',
  },
  woodcraft: {
    id: 'woodcraft',
    name: 'Carved Woodcraft',
    desc: 'Turned birch maple & dark walnut',
    p1Gradient: { from: '#fef3c7', to: '#fde68a' },
    p1Border: '#d97706',
    p1Ring: '#b45309',
    p1Center: '#f59e0b',
    p2Gradient: { from: '#451a03', to: '#290e02' },
    p2Border: '#78350f',
    p2Ring: '#92400e',
    p2Center: '#3d1602',
    crownColor: '#fbbf24',
    crownAccent: '#78350f',
    p1Dot: '#fde68a',
    p2Dot: '#451a03',
  },
  neon: {
    id: 'neon',
    name: 'Arcade Cyber Neon',
    desc: 'Electric cyan and vivid crimson laser',
    p1Gradient: { from: '#22d3ee', to: '#0284c7' },
    p1Border: '#38bdf8',
    p1Ring: '#e0f2fe',
    p1Center: '#0369a1',
    p2Gradient: { from: '#f43f5e', to: '#be123c' },
    p2Border: '#fb7185',
    p2Ring: '#ffe4e6',
    p2Center: '#9f1239',
    crownColor: '#fef08a',
    crownAccent: '#ffffff',
    p1Dot: '#06b6d4',
    p2Dot: '#f43f5e',
  },
  goldOnyx: {
    id: 'goldOnyx',
    name: 'Royal Gold & Onyx',
    desc: 'Lustrous polished gold and jet onyx',
    p1Gradient: { from: '#fbbf24', to: '#b45309' },
    p1Border: '#78350f',
    p1Ring: '#fef3c7',
    p1Center: '#92400e',
    p2Gradient: { from: '#171717', to: '#0a0a0a' },
    p2Border: '#404040',
    p2Ring: '#737373',
    p2Center: '#262626',
    crownColor: '#fef08a',
    crownAccent: '#b45309',
    p1Dot: '#f59e0b',
    p2Dot: '#171717',
  },
  emerald: {
    id: 'emerald',
    name: 'Imperial Jade & Quartz',
    desc: 'Luminous jadeite and deep smoky quartz',
    p1Gradient: { from: '#34d399', to: '#047857' },
    p1Border: '#065f46',
    p1Ring: '#a7f3d0',
    p1Center: '#064e3b',
    p2Gradient: { from: '#334155', to: '#0f172a' },
    p2Border: '#1e293b',
    p2Ring: '#94a3b8',
    p2Center: '#1e293b',
    crownColor: '#fbbf24',
    crownAccent: '#d97706',
    p1Dot: '#10b981',
    p2Dot: '#0f172a',
  },
};

// Tournament Vector Draughts Checker Piece Component
const CheckerPieceRenderer: React.FC<{
  color: CheckerColor;
  isKing: boolean;
  pieceTheme: CheckerPieceThemeId;
}> = ({ color, isKing, pieceTheme }) => {
  const config = CHECKER_PIECE_THEMES[pieceTheme] || CHECKER_PIECE_THEMES.classic;
  const isP1 = color === 'r';
  const grad = isP1 ? config.p1Gradient : config.p2Gradient;
  const border = isP1 ? config.p1Border : config.p2Border;
  const ring = isP1 ? config.p1Ring : config.p2Ring;
  const center = isP1 ? config.p1Center : config.p2Center;

  const gradId = `checker-grad-${pieceTheme}-${color}`;

  return (
    <svg
      viewBox="0 0 44 44"
      className="w-full h-full p-1 select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform duration-100 hover:scale-105"
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={grad.from} />
          <stop offset="100%" stopColor={grad.to} />
        </radialGradient>
      </defs>

      {/* 3D Stacked Lower Base when Crowned King */}
      {isKing && (
        <g opacity="0.65">
          <ellipse cx="22" cy="26" rx="18" ry="16" fill="#000000" opacity="0.4" />
          <ellipse cx="22" cy="25" rx="17.5" ry="15" fill={grad.to} stroke={border} strokeWidth="1" />
        </g>
      )}

      {/* Main Outer Raised Draughts Rim */}
      <circle
        cx="22"
        cy={isKing ? 20 : 22}
        r="17.5"
        fill={`url(#${gradId})`}
        stroke={border}
        strokeWidth="1.6"
      />

      {/* Outer Concentric Recessed Groove */}
      <circle
        cx="22"
        cy={isKing ? 20 : 22}
        r="14"
        fill="none"
        stroke={ring}
        strokeWidth="1.2"
        opacity="0.8"
      />

      {/* Inner Stepped Concentric Ridge */}
      <circle
        cx="22"
        cy={isKing ? 20 : 22}
        r="11"
        fill="none"
        stroke={border}
        strokeWidth="1"
        opacity="0.65"
      />

      {/* Center Medallion Disc */}
      <circle
        cx="22"
        cy={isKing ? 20 : 22}
        r="8"
        fill={center}
        stroke={ring}
        strokeWidth="1"
      />

      {/* Top Edge Specular Lighting Arc */}
      <path
        d={isKing ? 'M 9 14 A 15 15 0 0 1 31 10' : 'M 9 16 A 15 15 0 0 1 31 12'}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ornate Royal Crown when King */}
      {isKing ? (
        <g
          transform="translate(10.5, 7.5) scale(0.52)"
          fill={config.crownColor}
          stroke={config.crownAccent}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        >
          {/* Imperial Crown Base Band */}
          <rect x="7" y="27" width="30" height="4" rx="2" fill={config.crownAccent} />
          {/* Jewels on Band */}
          <circle cx="12" cy="29" r="1.2" fill="#ffffff" stroke="none" />
          <circle cx="22" cy="29" r="1.4" fill="#ffffff" stroke="none" />
          <circle cx="32" cy="29" r="1.2" fill="#ffffff" stroke="none" />
          {/* 3 Regal Peaks */}
          <path d="M 8 27 L 9 15 L 16 21 L 22 9 L 28 21 L 35 15 L 36 27 Z" />
          {/* 3 Pearls on Peak Tips */}
          <circle cx="9" cy="14" r="2.2" fill="#ffffff" stroke={config.crownAccent} strokeWidth="1" />
          <circle cx="22" cy="8" r="2.6" fill="#ffffff" stroke={config.crownAccent} strokeWidth="1" />
          <circle cx="35" cy="14" r="2.2" fill="#ffffff" stroke={config.crownAccent} strokeWidth="1" />
        </g>
      ) : (
        /* Tactile Debossed Pattern for Standard Checker */
        <circle
          cx="22"
          cy="22"
          r="2.8"
          fill={ring}
          opacity="0.85"
        />
      )}
    </svg>
  );
};

interface MoveOption {
  to: Position;
  isJump: boolean;
  jumpedPos?: Position;
}

function createInitialBoard(): Board {
  const b: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) {
          b[r][c] = { color: 'b', isKing: false };
        } else if (r > 4) {
          b[r][c] = { color: 'r', isKing: false };
        }
      }
    }
  }

  return b;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getCheckerMoves(board: Board, r: number, c: number): MoveOption[] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: MoveOption[] = [];
  const { color, isKing } = piece;
  const oppColor: CheckerColor = color === 'r' ? 'b' : 'r';

  const stepDirs: [number, number][] = [];
  if (color === 'r' || isKing) {
    stepDirs.push([-1, -1], [-1, 1]);
  }
  if (color === 'b' || isKing) {
    stepDirs.push([1, -1], [1, 1]);
  }

  stepDirs.forEach(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc] === null) {
      moves.push({ to: { r: nr, c: nc }, isJump: false });
    }
  });

  const jumpDirs: [number, number][] = isKing
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : color === 'r'
    ? [[-1, -1], [-1, 1]]
    : [[1, -1], [1, 1]];

  jumpDirs.forEach(([dr, dc]) => {
    const jumpedR = r + dr;
    const jumpedC = c + dc;
    const landR = r + 2 * dr;
    const landC = c + 2 * dc;

    if (
      inBounds(landR, landC) &&
      board[jumpedR][jumpedC]?.color === oppColor &&
      board[landR][landC] === null
    ) {
      moves.push({
        to: { r: landR, c: landC },
        isJump: true,
        jumpedPos: { r: jumpedR, c: jumpedC },
      });
    }
  });

  return moves;
}

function getAllJumps(board: Board, color: CheckerColor): { from: Position; moves: MoveOption[] }[] {
  const jumps: { from: Position; moves: MoveOption[] }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color) {
        const pieceJumps = getCheckerMoves(board, r, c).filter((m) => m.isJump);
        if (pieceJumps.length > 0) {
          jumps.push({ from: { r, c }, moves: pieceJumps });
        }
      }
    }
  }
  return jumps;
}

export const CheckersGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<CheckerColor>('r');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [winner, setWinner] = useState<CheckerColor | 'draw' | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [stats, setStats] = useState({ redWins: 0, blackWins: 0, ties: 0 });
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Theme states
  const [boardTheme, setBoardTheme] = useState<CheckersBoardThemeId>(() => {
    try {
      const saved = localStorage.getItem('mchezohub_checkers_board_theme');
      if (saved && saved in CHECKERS_BOARD_THEMES) return saved as CheckersBoardThemeId;
    } catch {}
    return 'wood';
  });

  const [pieceTheme, setPieceTheme] = useState<CheckerPieceThemeId>(() => {
    try {
      const saved = localStorage.getItem('mchezohub_checkers_piece_theme');
      if (saved && saved in CHECKER_PIECE_THEMES) return saved as CheckerPieceThemeId;
    } catch {}
    return 'classic';
  });

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'board' | 'pieces'>('board');

  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const resetRound = useCallback(() => {
    setBoard(createInitialBoard());
    setTurn('r');
    setSelectedPos(null);
    setValidMoves([]);
    setWinner(null);
    setIsAiThinking(false);
  }, []);

  const fullReset = useCallback(() => {
    resetRound();
    setScore(0);
    setStreak(0);
    setStats({ redWins: 0, blackWins: 0, ties: 0 });
    onScoreChangeRef.current(0);
  }, [resetRound]);

  useEffect(() => {
    onRestartReady(fullReset);
  }, [onRestartReady, fullReset]);

  const handleBoardThemeChange = (newTheme: CheckersBoardThemeId) => {
    sound.play('click');
    setBoardTheme(newTheme);
    try {
      localStorage.setItem('mchezohub_checkers_board_theme', newTheme);
    } catch {}
  };

  const handlePieceThemeChange = (newTheme: CheckerPieceThemeId) => {
    sound.play('click');
    setPieceTheme(newTheme);
    try {
      localStorage.setItem('mchezohub_checkers_piece_theme', newTheme);
    } catch {}
  };

  const redCount = board.flat().filter((p) => p?.color === 'r').length;
  const blackCount = board.flat().filter((p) => p?.color === 'b').length;

  const handleCellClick = (r: number, c: number) => {
    if (isPaused || winner || isAiThinking) return;

    const allJumps = getAllJumps(board, turn);
    const hasMandatoryJumps = allJumps.length > 0;

    const cell = board[r][c];

    if (cell && cell.color === turn) {
      if (hasMandatoryJumps) {
        const pieceCanJump = allJumps.some((j) => j.from.r === r && j.from.c === c);
        if (!pieceCanJump) {
          sound.play('tick');
          return;
        }
      }

      setSelectedPos({ r, c });
      const moves = getCheckerMoves(board, r, c);
      setValidMoves(hasMandatoryJumps ? moves.filter((m) => m.isJump) : moves);
      return;
    }

    if (selectedPos) {
      const chosenMove = validMoves.find((m) => m.to.r === r && m.to.c === c);
      if (chosenMove) {
        executeMove(selectedPos, chosenMove);
      } else {
        setSelectedPos(null);
        setValidMoves([]);
      }
    }
  };

  const executeMove = (from: Position, moveOpt: MoveOption) => {
    const nextBoard = board.map((row) => [...row]);
    const piece = nextBoard[from.r][from.c]!;
    nextBoard[from.r][from.c] = null;

    let becomesKing = piece.isKing;
    if (piece.color === 'r' && moveOpt.to.r === 0) becomesKing = true;
    if (piece.color === 'b' && moveOpt.to.r === 7) becomesKing = true;

    const crownedThisTurn = !piece.isKing && becomesKing;

    if (crownedThisTurn) {
      sound.play('golden');
    } else if (moveOpt.isJump) {
      sound.play('whack');
    } else {
      sound.play('move');
    }

    nextBoard[moveOpt.to.r][moveOpt.to.c] = {
      color: piece.color,
      isKing: becomesKing,
    };

    if (moveOpt.isJump && moveOpt.jumpedPos) {
      nextBoard[moveOpt.jumpedPos.r][moveOpt.jumpedPos.c] = null;
    }

    if (moveOpt.isJump && !crownedThisTurn) {
      const followUpJumps = getCheckerMoves(nextBoard, moveOpt.to.r, moveOpt.to.c).filter(
        (m) => m.isJump
      );
      if (followUpJumps.length > 0) {
        setBoard(nextBoard);
        setSelectedPos(moveOpt.to);
        setValidMoves(followUpJumps);
        return;
      }
    }

    setBoard(nextBoard);
    setSelectedPos(null);
    setValidMoves([]);

    const nextTurn = turn === 'r' ? 'b' : 'r';

    const oppPieces = nextBoard.flat().filter((p) => p?.color === nextTurn);
    let hasLegalMoves = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (nextBoard[r][c]?.color === nextTurn) {
          if (getCheckerMoves(nextBoard, r, c).length > 0) {
            hasLegalMoves = true;
            break;
          }
        }
      }
      if (hasLegalMoves) break;
    }

    if (oppPieces.length === 0 || !hasLegalMoves) {
      handleVictory(turn);
      return;
    }

    setTurn(nextTurn);

    if (mode === 'ai' && nextTurn === 'b') {
      triggerAiMove(nextBoard);
    }
  };

  const triggerAiMove = (currentBoard: Board) => {
    setIsAiThinking(true);

    setTimeout(() => {
      interface CandidateMove {
        from: Position;
        opt: MoveOption;
      }
      const jumps: CandidateMove[] = [];
      const regularMoves: CandidateMove[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c]?.color === 'b') {
            const moves = getCheckerMoves(currentBoard, r, c);
            moves.forEach((opt) => {
              if (opt.isJump) jumps.push({ from: { r, c }, opt });
              else regularMoves.push({ from: { r, c }, opt });
            });
          }
        }
      }

      const available = jumps.length > 0 ? jumps : regularMoves;

      if (available.length === 0) {
        setIsAiThinking(false);
        handleVictory('r');
        return;
      }

      let selected = available[0];
      if (difficulty === 'easy') {
        selected = available[Math.floor(Math.random() * available.length)];
      } else {
        available.sort((a, b) => {
          let scoreA = a.opt.isJump ? 50 : 0;
          let scoreB = b.opt.isJump ? 50 : 0;
          scoreA += a.opt.to.r * 2;
          scoreB += b.opt.to.r * 2;
          return scoreB - scoreA;
        });
        selected = available[0];
      }

      const nextBoard = currentBoard.map((row) => [...row]);
      const piece = nextBoard[selected.from.r][selected.from.c]!;
      nextBoard[selected.from.r][selected.from.c] = null;

      let becomesKing = piece.isKing;
      if (selected.opt.to.r === 7) becomesKing = true;
      const crownedThisTurn = !piece.isKing && becomesKing;

      nextBoard[selected.opt.to.r][selected.opt.to.c] = {
        color: 'b',
        isKing: becomesKing,
      };

      if (crownedThisTurn) {
        sound.play('golden');
      } else if (selected.opt.isJump && selected.opt.jumpedPos) {
        nextBoard[selected.opt.jumpedPos.r][selected.opt.jumpedPos.c] = null;
        sound.play('whack');
      } else {
        sound.play('move');
      }

      setBoard(nextBoard);

      const playerPieces = nextBoard.flat().filter((p) => p?.color === 'r');
      let playerHasMoves = false;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (nextBoard[r][c]?.color === 'r') {
            if (getCheckerMoves(nextBoard, r, c).length > 0) {
              playerHasMoves = true;
              break;
            }
          }
        }
        if (playerHasMoves) break;
      }

      if (playerPieces.length === 0 || !playerHasMoves) {
        handleVictory('b');
      } else {
        setTurn('r');
      }

      setIsAiThinking(false);
    }, 550);
  };

  const handleVictory = (winningColor: CheckerColor) => {
    setWinner(winningColor);
    if (winningColor === 'r') {
      sound.play('win');
      const pointMultiplier = difficulty === 'hard' ? 350 : difficulty === 'medium' ? 220 : 130;
      const roundScore = pointMultiplier + streak * 30;
      const newScore = score + roundScore;
      setScore(newScore);
      setStreak((s) => s + 1);
      setStats((s) => ({ ...s, redWins: s.redWins + 1 }));
      onScoreChangeRef.current(newScore);
    } else {
      sound.play('gameover');
      setStreak(0);
      setStats((s) => ({ ...s, blackWins: s.blackWins + 1 }));
    }
  };

  const activeBoardTheme = CHECKERS_BOARD_THEMES[boardTheme];
  const activePieceTheme = CHECKER_PIECE_THEMES[pieceTheme];

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-3 max-w-lg mx-auto w-full select-none">
      {/* Top HUD: Mode & Themes dropdown */}
      <div className="w-full flex items-center justify-between gap-2 mb-2.5 p-1.5 bg-surface-secondary/70 rounded-2xl border border-border-subtle max-w-[432px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMode('ai');
              resetRound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'ai'
                ? 'bg-surface-card text-text-primary shadow-xs border border-border-strong'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Bot size={14} />
            <span>vs AI</span>
          </button>
          <button
            onClick={() => {
              setMode('pvp');
              resetRound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'pvp'
                ? 'bg-surface-card text-text-primary shadow-xs border border-border-strong'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users size={14} />
            <span>2P Local</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {mode === 'ai' && (
            <div className="flex items-center gap-1 text-xs">
              {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    resetRound();
                  }}
                  className={`px-2 py-0.5 text-[11px] font-semibold capitalize rounded-lg transition-colors cursor-pointer ${
                    difficulty === d
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-surface-card text-text-primary hover:bg-surface-secondary border border-border-strong shadow-xs transition-colors cursor-pointer"
              title="Board & Checkers Themes"
              aria-label="Customize board and checkers pieces themes"
            >
              <Palette size={13} className="text-accent" />
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-black/20 flex shadow-2xs">
                  <span className="w-1/2 h-full" style={{ backgroundColor: activeBoardTheme.light }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: activeBoardTheme.dark }} />
                </div>
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-2xs"
                  style={{ backgroundColor: activePieceTheme.p1Dot }}
                />
              </div>
            </button>

            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-surface-card border-2 border-border-strong shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-surface-secondary rounded-xl mb-2">
                    <button
                      onClick={() => setActiveTab('board')}
                      className={`py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        activeTab === 'board'
                          ? 'bg-surface-card text-text-primary shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Board
                    </button>
                    <button
                      onClick={() => setActiveTab('pieces')}
                      className={`py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        activeTab === 'pieces'
                          ? 'bg-surface-card text-text-primary shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Checkers
                    </button>
                  </div>

                  {activeTab === 'board' && (
                    <div className="space-y-1">
                      {Object.values(CHECKERS_BOARD_THEMES).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleBoardThemeChange(t.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                            boardTheme === t.id
                              ? 'bg-accent/10 text-accent font-bold'
                              : 'text-text-primary hover:bg-surface-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-md overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/20 shadow-2xs"
                              style={{ borderColor: t.border }}
                            >
                              <span style={{ backgroundColor: t.light }} />
                              <span style={{ backgroundColor: t.dark }} />
                              <span style={{ backgroundColor: t.dark }} />
                              <span style={{ backgroundColor: t.light }} />
                            </div>
                            <span className="truncate">{t.name}</span>
                          </div>

                          {boardTheme === t.id && <Check size={13} className="text-accent" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeTab === 'pieces' && (
                    <div className="space-y-1">
                      {Object.values(CHECKER_PIECE_THEMES).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handlePieceThemeChange(p.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                            pieceTheme === p.id
                              ? 'bg-accent/10 text-accent font-bold'
                              : 'text-text-primary hover:bg-surface-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-1">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-2xs z-10"
                                style={{ backgroundColor: p.p1Dot }}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-2xs"
                                style={{ backgroundColor: p.p2Dot }}
                              />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-semibold leading-tight">{p.name}</span>
                              <span className="text-[10px] text-text-muted leading-none">{p.desc}</span>
                            </div>
                          </div>

                          {pieceTheme === p.id && <Check size={13} className="text-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Match Scoreboard */}
      <div className="grid grid-cols-3 gap-2.5 w-full mb-2.5 text-center max-w-[432px]">
        <div className="p-2 rounded-xl bg-surface-card border border-border-strong shadow-xs">
          <div className="text-[10px] text-text-muted mb-0.5 flex items-center justify-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs"
              style={{ backgroundColor: activePieceTheme.p1Dot }}
            />
            <span>Player 1</span>
          </div>
          <div className="text-sm font-bold text-text-primary tabular-nums">
            {stats.redWins} <span className="text-[10px] font-normal text-text-muted">({redCount})</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-surface-card border border-border-strong shadow-xs">
          <div className="text-[10px] text-text-muted mb-0.5">Ties</div>
          <div className="text-sm font-bold text-text-secondary tabular-nums">{stats.ties}</div>
        </div>

        <div className="p-2 rounded-xl bg-surface-card border border-border-strong shadow-xs">
          <div className="text-[10px] text-text-muted mb-0.5 flex items-center justify-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs"
              style={{ backgroundColor: activePieceTheme.p2Dot }}
            />
            <span>{mode === 'ai' ? `Bot (${difficulty})` : 'Player 2'}</span>
          </div>
          <div className="text-sm font-bold text-text-primary tabular-nums">
            {stats.blackWins} <span className="text-[10px] font-normal text-text-muted">({blackCount})</span>
          </div>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="mb-2 text-center h-6 flex items-center justify-center gap-2">
        {winner ? (
          <div className="flex items-center gap-2 font-bold text-xs">
            <span className="text-accent">
              🎉 {winner === 'r' ? 'Player 1' : mode === 'ai' ? 'Bot' : 'Player 2'} Won!
            </span>
          </div>
        ) : isAiThinking ? (
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
            Bot is calculating draughts jump...
          </div>
        ) : (
          <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <span>Turn:</span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-surface-secondary text-text-primary border border-border-strong flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: turn === 'r' ? activePieceTheme.p1Dot : activePieceTheme.p2Dot }}
              />
              {turn === 'r' ? 'Player 1' : mode === 'ai' ? 'Bot' : 'Player 2'}
            </span>
          </div>
        )}
      </div>

      {/* 8x8 Checkers Board */}
      <div
        className="relative w-full max-w-[432px] aspect-square rounded-lg overflow-hidden border-2 shadow-2xl flex flex-col justify-center transition-colors duration-200"
        style={{ borderColor: activeBoardTheme.border, backgroundColor: activeBoardTheme.border }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full relative">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const moveOption = validMoves.find((m) => m.to.r === r && m.to.c === c);

              // Board coordinate indicators
              const showRank = c === 0;
              const showFile = r === 7;
              const fileLetter = String.fromCharCode(97 + c);
              const rankNumber = 8 - r;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isDark || !!winner || isAiThinking}
                  style={{
                    backgroundColor: isDark ? activeBoardTheme.dark : activeBoardTheme.light,
                  }}
                  className={`relative flex items-center justify-center select-none focus:outline-none transition-colors ${
                    isDark ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  aria-label={`Square ${fileLetter}${rankNumber}`}
                >
                  {/* Selected square highlight */}
                  {isSelected && (
                    <div className="absolute inset-0 z-10 pointer-events-none bg-amber-400/40 ring-4 ring-amber-400 ring-inset" />
                  )}

                  {/* Rank coordinate */}
                  {showRank && (
                    <span
                      style={{ color: isDark ? activeBoardTheme.light : activeBoardTheme.dark }}
                      className="absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-bold pointer-events-none select-none leading-none z-10 opacity-75"
                    >
                      {rankNumber}
                    </span>
                  )}

                  {/* File coordinate */}
                  {showFile && (
                    <span
                      style={{ color: isDark ? activeBoardTheme.light : activeBoardTheme.dark }}
                      className="absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-bold pointer-events-none select-none leading-none z-10 opacity-75"
                    >
                      {fileLetter}
                    </span>
                  )}

                  {/* Vector Checker piece */}
                  {cell && (
                    <div
                      className={`w-full h-full relative z-20 flex items-center justify-center transition-transform ${
                        isSelected ? 'scale-110' : ''
                      }`}
                    >
                      <CheckerPieceRenderer
                        color={cell.color}
                        isKing={cell.isKing}
                        pieceTheme={pieceTheme}
                      />
                    </div>
                  )}

                  {/* Valid move target indicator */}
                  {moveOption && (
                    <div
                      className={`absolute pointer-events-none z-30 ${
                        moveOption.isJump
                          ? 'w-full h-full border-4 border-emerald-400 animate-pulse'
                          : 'w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white/80 shadow-xs'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={resetRound}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-subtle shadow-xs cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>New Match</span>
        </button>

        {score > 0 && (
          <button
            onClick={() => onGameOverRef.current(score)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-xs cursor-pointer"
          >
            <Award size={13} />
            <span>Finish ({score} pts)</span>
          </button>
        )}
      </div>
    </div>
  );
};
