import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { Bot, Users, RotateCcw, Award, ShieldAlert, Palette, Check } from 'lucide-react';

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Board = (Piece | null)[][];
type Position = { r: number; c: number };
type AIDifficulty = 'easy' | 'medium' | 'hard';
type Mode = 'ai' | 'pvp';

export type BoardThemeId = 'wood' | 'green' | 'ocean' | 'charcoal' | 'walnut' | 'cherry';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  light: string;
  dark: string;
  border: string;
  highlight: string;
}

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  wood: {
    id: 'wood',
    name: 'Classic Wood',
    light: '#eedca5',
    dark: '#b88762',
    border: '#2b1d12',
    highlight: 'rgba(186, 202, 68, 0.75)',
  },
  green: {
    id: 'green',
    name: 'Tournament Green',
    light: '#eeeed2',
    dark: '#769656',
    border: '#2c3e1e',
    highlight: 'rgba(247, 247, 105, 0.7)',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    light: '#dee3e6',
    dark: '#5a829e',
    border: '#1e303d',
    highlight: 'rgba(100, 181, 246, 0.65)',
  },
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal Dark',
    light: '#e2e8f0',
    dark: '#475569',
    border: '#0f172a',
    highlight: 'rgba(245, 158, 11, 0.65)',
  },
  walnut: {
    id: 'walnut',
    name: 'Autumn Walnut',
    light: '#f0d9b5',
    dark: '#8b4513',
    border: '#3e1d09',
    highlight: 'rgba(251, 191, 36, 0.7)',
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Blossom',
    light: '#fce7f3',
    dark: '#db2777',
    border: '#831843',
    highlight: 'rgba(253, 224, 71, 0.7)',
  },
};

export type PieceThemeId = 'staunton' | 'minimalist' | 'woodcraft' | 'neon' | 'crystal';

export interface PieceThemeConfig {
  id: PieceThemeId;
  name: string;
  desc: string;
  whiteFill: string;
  whiteStroke: string;
  whiteAccent: string;
  blackFill: string;
  blackStroke: string;
  blackAccent: string;
}

export const PIECE_THEMES: Record<PieceThemeId, PieceThemeConfig> = {
  staunton: {
    id: 'staunton',
    name: 'Classic Staunton',
    desc: 'Tournament-grade vector master pieces',
    whiteFill: '#ffffff',
    whiteStroke: '#0f172a',
    whiteAccent: '#334155',
    blackFill: '#111827',
    blackStroke: '#030712',
    blackAccent: '#94a3b8',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Modern Bauhaus',
    desc: 'Clean monoline porcelain & slate',
    whiteFill: '#f8fafc',
    whiteStroke: '#334155',
    whiteAccent: '#475569',
    blackFill: '#1e293b',
    blackStroke: '#0f172a',
    blackAccent: '#cbd5e1',
  },
  woodcraft: {
    id: 'woodcraft',
    name: 'Carved Wood',
    desc: 'Birch ivory & rich dark mahogany',
    whiteFill: '#fef3c7',
    whiteStroke: '#78350f',
    whiteAccent: '#92400e',
    blackFill: '#3d1602',
    blackStroke: '#1c0a00',
    blackAccent: '#f59e0b',
  },
  neon: {
    id: 'neon',
    name: 'Arcade Cyber',
    desc: 'Luminous cyan & crimson neon',
    whiteFill: '#06b6d4',
    whiteStroke: '#ecfeff',
    whiteAccent: '#ffffff',
    blackFill: '#e11d48',
    blackStroke: '#ffe4e6',
    blackAccent: '#ffffff',
  },
  crystal: {
    id: 'crystal',
    name: 'Frosted Crystal',
    desc: 'Glacial ice & smoky obsidian',
    whiteFill: '#e0f2fe',
    whiteStroke: '#0284c7',
    whiteAccent: '#38bdf8',
    blackFill: '#0f172a',
    blackStroke: '#38bdf8',
    blackAccent: '#7dd3fc',
  },
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function createInitialBoard(): Board {
  const b: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Black pieces (row 0, 1)
  const backRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: backRow[c], color: 'b' };
    b[1][c] = { type: 'p', color: 'b' };
  }

  // White pieces (row 6, 7)
  for (let c = 0; c < 8; c++) {
    b[6][c] = { type: 'p', color: 'w' };
    b[7][c] = { type: backRow[c], color: 'w' };
  }

  return b;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getPieceMoves(board: Board, r: number, c: number): Position[] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: Position[] = [];
  const { type, color } = piece;
  const oppColor: PieceColor = color === 'w' ? 'b' : 'w';

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    // 1 step forward
    if (inBounds(r + dir, c) && board[r + dir][c] === null) {
      moves.push({ r: r + dir, c });
      // 2 steps from initial square
      if (r === startRow && board[r + 2 * dir][c] === null) {
        moves.push({ r: r + 2 * dir, c });
      }
    }

    // Diagonal captures
    [-1, 1].forEach((dc) => {
      const nr = r + dir;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.color === oppColor) {
        moves.push({ r: nr, c: nc });
      }
    });
  } else if (type === 'n') {
    const jumps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    jumps.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.color !== color) {
        moves.push({ r: nr, c: nc });
      }
    });
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const dirs: [number, number][] = [];
    if (type === 'b' || type === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (type === 'r' || type === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    dirs.forEach(([dr, dc]) => {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (!inBounds(nr, nc)) break;
        if (board[nr][nc] === null) {
          moves.push({ r: nr, c: nc });
        } else {
          if (board[nr][nc]?.color === oppColor) {
            moves.push({ r: nr, c: nc });
          }
          break;
        }
        step++;
      }
    });
  } else if (type === 'k') {
    const dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
    dirs.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.color !== color) {
        moves.push({ r: nr, c: nc });
      }
    });
  }

  return moves;
}

function findKing(board: Board, color: PieceColor): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        return { r, c };
      }
    }
  }
  return null;
}

function isKingInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const oppColor: PieceColor = color === 'w' ? 'b' : 'w';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === oppColor) {
        const moves = getPieceMoves(board, r, c);
        if (moves.some((m) => m.r === kingPos.r && m.c === kingPos.c)) {
          return true;
        }
      }
    }
  }
  return false;
}

function getLegalMoves(board: Board, r: number, c: number): Position[] {
  const piece = board[r][c];
  if (!piece) return [];
  const pseudoMoves = getPieceMoves(board, r, c);

  return pseudoMoves.filter((dest) => {
    const clone = board.map((row) => [...row]);
    clone[dest.r][dest.c] = clone[r][c];
    clone[r][c] = null;
    return !isKingInCheck(clone, piece.color);
  });
}

function hasAnyLegalMoves(board: Board, color: PieceColor): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color) {
        if (getLegalMoves(board, r, c).length > 0) return true;
      }
    }
  }
  return false;
}

// Tournament-grade Vector Chess Piece Component
const ChessPieceRenderer: React.FC<{
  type: PieceType;
  color: PieceColor;
  pieceTheme: PieceThemeId;
}> = ({ type, color, pieceTheme }) => {
  const isWhite = color === 'w';
  const config = PIECE_THEMES[pieceTheme] || PIECE_THEMES.staunton;

  const fill = isWhite ? config.whiteFill : config.blackFill;
  const stroke = isWhite ? config.whiteStroke : config.blackStroke;
  const accent = isWhite ? config.whiteAccent : config.blackAccent;

  return (
    <svg
      viewBox="0 0 45 45"
      className="w-full h-full p-0.5 select-none filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] transition-transform duration-100 hover:scale-105"
    >
      {/* PAWN */}
      {type === 'p' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Base Plinth */}
          <path d="M 10 39.5 L 35 39.5 L 34 36 L 11 36 Z" />
          {/* Waist & Flare */}
          <path d="M 14 36 C 15 31 18 26.5 18 21 L 27 21 C 27 26.5 30 31 31 36 Z" />
          {/* Collar Ring */}
          <path d="M 16.5 21 C 16.5 19 28.5 19 28.5 21 C 28.5 22.5 16.5 22.5 16.5 21 Z" />
          {/* Head Sphere */}
          <circle cx="22.5" cy="12" r="5" />
          {/* Highlight Specular Arc */}
          <path
            d="M 20.5 9 C 22 8 24.5 8 25.5 9"
            stroke={accent}
            strokeWidth="1.4"
            fill="none"
          />
          {/* Plinth Accent Line */}
          <line x1="12.5" y1="36.5" x2="32.5" y2="36.5" stroke={accent} strokeWidth="1.2" />
        </g>
      )}

      {/* ROOK */}
      {type === 'r' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Plinth Foundation */}
          <path d="M 9.5 40 L 35.5 40 L 34.5 36 L 10.5 36 Z" />
          {/* Torus Moulding */}
          <path d="M 12.5 36 L 32.5 36 L 31.5 32.5 L 13.5 32.5 Z" />
          {/* Castle Tower Body */}
          <path d="M 15 32.5 L 16 21 L 29 21 L 30 32.5 Z" />
          {/* Parapet Cornice */}
          <path d="M 12.5 21 L 32.5 21 L 33.5 17.5 L 11.5 17.5 Z" />
          {/* 4 Castle Battlements / Merlons */}
          <path d="M 11.5 17.5 L 11.5 11.5 L 15.5 11.5 L 15.5 14 L 19.5 14 L 19.5 11.5 L 25.5 11.5 L 25.5 14 L 29.5 14 L 29.5 11.5 L 33.5 11.5 L 33.5 17.5 Z" />
          {/* Architectural Masonry Accent Lines */}
          <line x1="14" y1="33" x2="31" y2="33" stroke={accent} strokeWidth="1.5" />
          <line x1="13.5" y1="21.5" x2="31.5" y2="21.5" stroke={accent} strokeWidth="1.5" />
          <line x1="22.5" y1="23" x2="22.5" y2="30" stroke={accent} strokeWidth="1.4" />
        </g>
      )}

      {/* KNIGHT */}
      {type === 'n' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Base Plinth */}
          <path d="M 9.5 40 L 35.5 40 L 34.5 36 L 10.5 36 Z" />
          {/* Equine Silhouette: Alert ear, mane ripples, snout, lower jaw & curved throat */}
          <path d="M 21.5 8.5 C 24 8.5 26.5 10.5 27.5 14 C 28.5 17.5 28 20.5 29 24.5 C 30 28.5 32.5 31.5 33 36 L 12 36 C 12 33 13 30 14.5 28 C 13 26.5 10.5 24 9.5 20 C 8.5 16 10.5 15 13.5 15.5 C 14 14 15.5 11.5 18 9.5 C 19.5 8.5 20.5 8.5 21.5 8.5 Z" />
          {/* Alert Ear */}
          <path d="M 21.5 8.5 L 23.5 13" stroke={stroke} strokeWidth="1.8" />
          {/* Almond Eye with Pupil */}
          <circle cx="16" cy="18" r="1.5" fill={accent} stroke={accent} />
          {/* Sculpted Nostril */}
          <circle cx="11.5" cy="20.5" r="0.8" fill={accent} stroke={accent} />
          {/* Mane Ridges */}
          <path
            d="M 25 14 C 27 16 28 20 28 24"
            stroke={accent}
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d="M 21 17 C 22.5 20 23.5 24 23.5 28"
            stroke={accent}
            strokeWidth="1.4"
            fill="none"
          />
        </g>
      )}

      {/* BISHOP */}
      {type === 'b' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Base Plinth */}
          <path d="M 10 40 L 35 40 L 34 36 L 11 36 Z" />
          {/* Torus Ring */}
          <path d="M 13 36 L 32 36 L 30.5 33 L 14.5 33 Z" />
          {/* Flared Pedestal */}
          <path d="M 15 33 C 15 31 16.5 29.5 17.5 28 L 27.5 28 C 28.5 29.5 30 31 30 33 Z" />
          {/* Mitre Vault Dome */}
          <path d="M 22.5 9.5 C 15.5 13 14.5 21.5 17.5 28 L 27.5 28 C 30.5 21.5 29.5 13 22.5 9.5 Z" />
          {/* Finial Ball Orb */}
          <circle cx="22.5" cy="7.5" r="2.2" />
          {/* Iconic Diagonal Mitre Cleft / Notch */}
          <path
            d="M 19 16.5 L 26.5 24"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Center Mitre Seam */}
          <line x1="22.5" y1="11.5" x2="22.5" y2="16.5" stroke={accent} strokeWidth="1.6" />
          {/* Base Accent */}
          <line x1="13.5" y1="36.5" x2="31.5" y2="36.5" stroke={accent} strokeWidth="1.4" />
        </g>
      )}

      {/* QUEEN */}
      {type === 'q' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Royal Plinth */}
          <path d="M 9 40.5 L 36 40.5 L 35 37 L 10 37 Z" />
          {/* Flared Robe Skirt */}
          <path d="M 11.5 37 C 12.5 35 14 33 15 32 L 30 32 C 31 33 32.5 35 33.5 37 Z" />
          {/* Royal Waist Band */}
          <path d="M 14.5 32 L 30.5 32 L 29.5 28 L 15.5 28 Z" />
          {/* 5-Point Regal Coronet with Elegant Cup */}
          <path d="M 9.5 15.5 L 14.5 28 L 30.5 28 L 35.5 15.5 L 29 20.5 L 22.5 11 L 16 20.5 Z" />
          {/* 5 Coronet Pearls / Spheres */}
          <circle cx="9.5" cy="14" r="1.9" />
          <circle cx="16" cy="10" r="1.9" />
          <circle cx="22.5" cy="8.5" r="2.2" />
          <circle cx="29" cy="10" r="1.9" />
          <circle cx="35.5" cy="14" r="1.9" />
          {/* Royal Sash & Jewel Accent */}
          <line x1="15.5" y1="28.5" x2="29.5" y2="28.5" stroke={accent} strokeWidth="1.6" />
          <line x1="12" y1="37.5" x2="33" y2="37.5" stroke={accent} strokeWidth="1.6" />
        </g>
      )}

      {/* KING */}
      {type === 'k' && (
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Plinth Base */}
          <path d="M 8.5 40.5 L 36.5 40.5 L 35.5 36.5 L 9.5 36.5 Z" />
          {/* Waist Band */}
          <path d="M 12 36.5 L 33 36.5 L 31.5 32.5 L 13.5 32.5 Z" />
          {/* Imperial Arched Dome Crown with Velvet Folds */}
          <path d="M 13 16 C 13 13 17 12 22.5 12 C 28 12 32 13 32 16 C 32 21 29 27 30 32.5 L 15 32.5 C 16 27 13 21 13 16 Z" />
          {/* Crown Orb at Cross Base */}
          <circle cx="22.5" cy="10" r="2" />
          {/* Imperial Heraldic Cross Finial */}
          <line
            x1="22.5"
            y1="3"
            x2="22.5"
            y2="10"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinecap="square"
          />
          <line
            x1="19"
            y1="6.5"
            x2="26"
            y2="6.5"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinecap="square"
          />
          {/* Velvet Crown Arch Accent */}
          <path
            d="M 15.5 19.5 C 18.5 22 26.5 22 29.5 19.5"
            stroke={accent}
            strokeWidth="1.8"
            fill="none"
          />
          {/* Base Rim Line */}
          <line x1="10.5" y1="37" x2="34.5" y2="37" stroke={accent} strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
};

export const ChessGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [inCheck, setInCheck] = useState<boolean>(false);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [stats, setStats] = useState({ whiteWins: 0, blackWins: 0, ties: 0 });
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Themes states
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(() => {
    try {
      const saved = localStorage.getItem('mchezohub_chess_board_theme');
      if (saved && saved in BOARD_THEMES) return saved as BoardThemeId;
    } catch {}
    return 'wood';
  });

  const [pieceTheme, setPieceTheme] = useState<PieceThemeId>(() => {
    try {
      const saved = localStorage.getItem('mchezohub_chess_piece_theme');
      if (saved && saved in PIECE_THEMES) return saved as PieceThemeId;
    } catch {}
    return 'staunton';
  });

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'board' | 'pieces'>('board');

  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const resetRound = useCallback(() => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedPos(null);
    setLegalMoves([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setInCheck(false);
    setWinner(null);
    setIsAiThinking(false);
  }, []);

  const fullReset = useCallback(() => {
    resetRound();
    setScore(0);
    setStreak(0);
    setStats({ whiteWins: 0, blackWins: 0, ties: 0 });
    onScoreChangeRef.current(0);
  }, [resetRound]);

  useEffect(() => {
    onRestartReady(fullReset);
  }, [onRestartReady, fullReset]);

  const handleBoardThemeChange = (newTheme: BoardThemeId) => {
    sound.play('click');
    setBoardTheme(newTheme);
    try {
      localStorage.setItem('mchezohub_chess_board_theme', newTheme);
    } catch {}
  };

  const handlePieceThemeChange = (newTheme: PieceThemeId) => {
    sound.play('click');
    setPieceTheme(newTheme);
    try {
      localStorage.setItem('mchezohub_chess_piece_theme', newTheme);
    } catch {}
  };

  const executeMove = (from: Position, to: Position, currentBoard: Board) => {
    const movingPiece = currentBoard[from.r][from.c];
    if (!movingPiece) return currentBoard;

    const targetPiece = currentBoard[to.r][to.c];
    if (targetPiece) {
      sound.play('whack');
      if (targetPiece.color === 'w') {
        setCapturedWhite((prev) => [...prev, targetPiece.type]);
      } else {
        setCapturedBlack((prev) => [...prev, targetPiece.type]);
      }
    } else {
      sound.play('move');
    }

    const nextBoard = currentBoard.map((row) => [...row]);
    if (movingPiece.type === 'p' && (to.r === 0 || to.r === 7)) {
      nextBoard[to.r][to.c] = { type: 'q', color: movingPiece.color };
    } else {
      nextBoard[to.r][to.c] = movingPiece;
    }
    nextBoard[from.r][from.c] = null;

    return nextBoard;
  };

  const handleCellClick = (r: number, c: number) => {
    if (isPaused || winner || isAiThinking) return;

    const piece = board[r][c];
    if (piece && piece.color === turn) {
      setSelectedPos({ r, c });
      const moves = getLegalMoves(board, r, c);
      setLegalMoves(moves);
      return;
    }

    if (selectedPos) {
      const isLegal = legalMoves.some((m) => m.r === r && m.c === c);
      if (isLegal) {
        const nextBoard = executeMove(selectedPos, { r, c }, board);
        setBoard(nextBoard);
        setSelectedPos(null);
        setLegalMoves([]);

        const nextTurn = turn === 'w' ? 'b' : 'w';
        const checked = isKingInCheck(nextBoard, nextTurn);
        setInCheck(checked);

        if (!hasAnyLegalMoves(nextBoard, nextTurn)) {
          if (checked) {
            handleVictory(turn);
          } else {
            handleDraw();
          }
          return;
        }

        setTurn(nextTurn);

        if (mode === 'ai' && nextTurn === 'b') {
          triggerAiMove(nextBoard);
        }
      } else {
        setSelectedPos(null);
        setLegalMoves([]);
      }
    }
  };

  const triggerAiMove = (currentBoard: Board) => {
    setIsAiThinking(true);

    setTimeout(() => {
      interface AllMove {
        from: Position;
        to: Position;
        score: number;
      }
      const allMoves: AllMove[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c]?.color === 'b') {
            const moves = getLegalMoves(currentBoard, r, c);
            moves.forEach((to) => {
              const moving = currentBoard[r][c]!;
              const target = currentBoard[to.r][to.c];
              let moveScore = 0;

              if (target) {
                moveScore += PIECE_VALUES[target.type] * 10 - PIECE_VALUES[moving.type];
              }
              if (to.r >= 3 && to.r <= 4 && to.c >= 3 && to.c <= 4) {
                moveScore += 25;
              }
              if (moving.type === 'p') {
                moveScore += to.r * 5;
              }

              // Threat detection & tactical evaluation
              const tempBoard = currentBoard.map((row) => [...row]);
              tempBoard[to.r][to.c] = moving;
              tempBoard[r][c] = null;

              if (isKingInCheck(tempBoard, 'w')) {
                moveScore += 45;
                if (!hasAnyLegalMoves(tempBoard, 'w')) {
                  moveScore += 50000;
                }
              }

              let squareAttacked = false;
              for (let wr = 0; wr < 8; wr++) {
                for (let wc = 0; wc < 8; wc++) {
                  if (tempBoard[wr][wc]?.color === 'w') {
                    const wMoves = getPieceMoves(tempBoard, wr, wc);
                    if (wMoves.some((m) => m.r === to.r && m.c === to.c)) {
                      squareAttacked = true;
                      break;
                    }
                  }
                }
                if (squareAttacked) break;
              }

              if (squareAttacked) {
                moveScore -= PIECE_VALUES[moving.type] * 0.8;
              }

              allMoves.push({ from: { r, c }, to, score: moveScore });
            });
          }
        }
      }

      if (allMoves.length === 0) {
        setIsAiThinking(false);
        return;
      }

      allMoves.sort((a, b) => b.score - a.score);

      let chosenMove = allMoves[0];
      if (difficulty === 'easy' && Math.random() < 0.6) {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      } else if (difficulty === 'medium' && Math.random() < 0.3) {
        const topSlice = allMoves.slice(0, Math.min(3, allMoves.length));
        chosenMove = topSlice[Math.floor(Math.random() * topSlice.length)];
      }

      const nextBoard = executeMove(chosenMove.from, chosenMove.to, currentBoard);
      setBoard(nextBoard);

      const checked = isKingInCheck(nextBoard, 'w');
      setInCheck(checked);

      if (!hasAnyLegalMoves(nextBoard, 'w')) {
        if (checked) {
          handleVictory('b');
        } else {
          handleDraw();
        }
      } else {
        setTurn('w');
      }

      setIsAiThinking(false);
    }, 550);
  };

  const handleVictory = (winningColor: PieceColor) => {
    setWinner(winningColor);
    if (winningColor === 'w') {
      sound.play('win');
      const pointMultiplier = difficulty === 'hard' ? 400 : difficulty === 'medium' ? 250 : 150;
      const roundScore = pointMultiplier + streak * 40;
      const newScore = score + roundScore;
      setScore(newScore);
      setStreak((s) => s + 1);
      setStats((s) => ({ ...s, whiteWins: s.whiteWins + 1 }));
      onScoreChangeRef.current(newScore);
    } else {
      sound.play('gameover');
      setStreak(0);
      setStats((s) => ({ ...s, blackWins: s.blackWins + 1 }));
    }
  };

  const handleDraw = () => {
    sound.play('tick');
    setWinner('draw');
    setStats((s) => ({ ...s, ties: s.ties + 1 }));
  };

  const activeBoardTheme = BOARD_THEMES[boardTheme];
  const activePieceTheme = PIECE_THEMES[pieceTheme];

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-3 max-w-lg mx-auto w-full select-none">
      {/* Top HUD Controls Bar with Multi-Theme Dropdown */}
      <div className="w-full flex items-center justify-between gap-2 mb-2.5 p-1.5 bg-surface-secondary/70 rounded-2xl border border-border-subtle max-w-[432px]">
        {/* Mode Toggles */}
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

        {/* Right Side: Difficulty & Theme Selector Dropdown */}
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

          {/* Theme Hub Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-surface-card text-text-primary hover:bg-surface-secondary border border-border-strong shadow-xs transition-colors cursor-pointer"
              title="Board & Piece Themes"
              aria-label="Customize chess board and pieces themes"
            >
              <Palette size={13} className="text-accent" />
              <div className="flex items-center gap-1">
                {/* Board swatch preview */}
                <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-black/20 flex shadow-2xs">
                  <span className="w-1/2 h-full" style={{ backgroundColor: activeBoardTheme.light }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: activeBoardTheme.dark }} />
                </div>
                {/* Piece preview badge */}
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-2xs"
                  style={{ backgroundColor: activePieceTheme.whiteFill }}
                />
              </div>
            </button>

            {/* Dropdown Menu Popover with Board & Pieces Tabs */}
            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-surface-card border-2 border-border-strong shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Category Tabs: Board vs Pieces */}
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
                      Pieces
                    </button>
                  </div>

                  {/* Tab 1: Board Themes */}
                  {activeTab === 'board' && (
                    <div className="space-y-1">
                      {Object.values(BOARD_THEMES).map((t) => (
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

                  {/* Tab 2: Piece Themes */}
                  {activeTab === 'pieces' && (
                    <div className="space-y-1">
                      {Object.values(PIECE_THEMES).map((p) => (
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
                            {/* Two-piece circular preview */}
                            <div className="flex items-center -space-x-1">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-2xs z-10"
                                style={{ backgroundColor: p.whiteFill }}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-2xs"
                                style={{ backgroundColor: p.blackFill }}
                              />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-semibold leading-tight">{p.name}</span>
                              <span className="text-[10px] text-text-muted leading-none">
                                {p.desc}
                              </span>
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

      {/* Turn & Status Header */}
      <div className="w-full flex items-center justify-between mb-2 max-w-[432px] px-1">
        <div className="flex items-center gap-2">
          {winner ? (
            <span className="text-xs font-bold text-accent flex items-center gap-1.5">
              🏆 {winner === 'draw' ? 'Stalemate' : `${winner === 'w' ? 'White' : 'Black'} Won!`}
            </span>
          ) : inCheck ? (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 text-xs font-bold flex items-center gap-1 animate-pulse">
              <ShieldAlert size={13} />
              <span>Check</span>
            </span>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <span
                className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                  turn === 'w' ? 'bg-white border-slate-400' : 'bg-slate-900 border-slate-600'
                }`}
              />
              <span>{turn === 'w' ? 'White to move' : mode === 'ai' ? 'Bot thinking...' : 'Black to move'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
          <span>W: <strong className="text-text-primary">{stats.whiteWins}</strong></span>
          <span>·</span>
          <span>B: <strong className="text-text-primary">{stats.blackWins}</strong></span>
        </div>
      </div>

      {/* 8x8 Chessboard Styled with Active Board & Piece Themes */}
      <div
        className="relative w-full max-w-[432px] aspect-square rounded-lg overflow-hidden border-2 shadow-2xl flex flex-col justify-center transition-colors duration-200"
        style={{ borderColor: activeBoardTheme.border, backgroundColor: activeBoardTheme.border }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full relative">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const isLegal = legalMoves.some((m) => m.r === r && m.c === c);
              const isTargetEnemy = cell !== null && cell.color !== turn;

              // Corner coordinate indicators
              const showRank = c === 0;
              const showFile = r === 7;
              const fileLetter = String.fromCharCode(97 + c);
              const rankNumber = 8 - r;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!!winner || isAiThinking}
                  style={{
                    backgroundColor: isLight ? activeBoardTheme.light : activeBoardTheme.dark,
                  }}
                  className="relative flex items-center justify-center select-none focus:outline-none transition-colors"
                  aria-label={`Square ${fileLetter}${rankNumber}`}
                >
                  {/* Highlight overlay for selected square */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{ backgroundColor: activeBoardTheme.highlight }}
                    />
                  )}

                  {/* Rank number (top-left of left-edge squares) */}
                  {showRank && (
                    <span
                      style={{ color: isLight ? activeBoardTheme.dark : activeBoardTheme.light }}
                      className="absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-bold pointer-events-none select-none leading-none z-10"
                    >
                      {rankNumber}
                    </span>
                  )}

                  {/* File letter (bottom-right of bottom-edge squares) */}
                  {showFile && (
                    <span
                      style={{ color: isLight ? activeBoardTheme.dark : activeBoardTheme.light }}
                      className="absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-bold pointer-events-none select-none leading-none z-10"
                    >
                      {fileLetter}
                    </span>
                  )}

                  {/* Vector Piece rendered in Active Piece Theme */}
                  {cell && (
                    <div className="w-full h-full relative z-20">
                      <ChessPieceRenderer
                        type={cell.type}
                        color={cell.color}
                        pieceTheme={pieceTheme}
                      />
                    </div>
                  )}

                  {/* Legal move indicator (center dot or capture ring) */}
                  {isLegal && (
                    <div
                      className={`absolute pointer-events-none z-30 ${
                        isTargetEnemy
                          ? 'w-full h-full border-4 border-black/25 rounded-none'
                          : 'w-3.5 h-3.5 rounded-full bg-black/25'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Captured Pieces Bar */}
      <div className="w-full max-w-[432px] flex items-center justify-between mt-2.5 px-1 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <span>White took:</span>
          <span className="font-semibold text-text-primary">{capturedBlack.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Black took:</span>
          <span className="font-semibold text-text-primary">{capturedWhite.length}</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={resetRound}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-subtle cursor-pointer shadow-xs"
        >
          <RotateCcw size={13} />
          <span>Reset Board</span>
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
