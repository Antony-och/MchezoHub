import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { Bot, Users, RotateCcw, Award, ChevronDown } from 'lucide-react';

const ROWS = 6;
const COLS = 7;

type Player = 'R' | 'Y'; // R = Red (Player 1), Y = Yellow (Player 2 or AI)
type BoardState = (Player | null)[][];
type AIDifficulty = 'easy' | 'medium' | 'hard';
type Mode = 'ai' | 'pvp';

interface WinningDisc {
  r: number;
  c: number;
}

export const ConnectFourGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [board, setBoard] = useState<BoardState>(() =>
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>('R');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningDiscs, setWinningDiscs] = useState<WinningDisc[]>([]);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [cumulativeScore, setCumulativeScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [stats, setStats] = useState({ redWins: 0, yellowWins: 0, ties: 0 });

  const isLockedRef = useRef(false);

  // Check 4-in-a-row
  const checkWin = useCallback((grid: BoardState): { winner: Player | 'draw'; line: WinningDisc[] } | null => {
    // 1. Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p && p === grid[r][c + 1] && p === grid[r][c + 2] && p === grid[r][c + 3]) {
          return {
            winner: p,
            line: [
              { r, c },
              { r, c: c + 1 },
              { r, c: c + 2 },
              { r, c: c + 3 },
            ],
          };
        }
      }
    }

    // 2. Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const p = grid[r][c];
        if (p && p === grid[r + 1][c] && p === grid[r + 2][c] && p === grid[r + 3][c]) {
          return {
            winner: p,
            line: [
              { r, c },
              { r: r + 1, c },
              { r: r + 2, c },
              { r: r + 3, c },
            ],
          };
        }
      }
    }

    // 3. Diagonal positive slope (down-right)
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p && p === grid[r + 1][c + 1] && p === grid[r + 2][c + 2] && p === grid[r + 3][c + 3]) {
          return {
            winner: p,
            line: [
              { r, c },
              { r: r + 1, c: c + 1 },
              { r: r + 2, c: c + 2 },
              { r: r + 3, c: c + 3 },
            ],
          };
        }
      }
    }

    // 4. Diagonal negative slope (up-right)
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const p = grid[r][c];
        if (p && p === grid[r - 1][c + 1] && p === grid[r - 2][c + 2] && p === grid[r - 3][c + 3]) {
          return {
            winner: p,
            line: [
              { r, c },
              { r: r - 1, c: c + 1 },
              { r: r - 2, c: c + 2 },
              { r: r - 3, c: c + 3 },
            ],
          };
        }
      }
    }

    // 5. Draw
    const isFull = grid.every((row) => row.every((cell) => cell !== null));
    if (isFull) {
      return { winner: 'draw', line: [] };
    }

    return null;
  }, []);

  const resetRound = useCallback(() => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null))
    );
    setCurrentPlayer('R');
    setWinner(null);
    setWinningDiscs([]);
    setIsAiThinking(false);
    isLockedRef.current = false;
  }, []);

  const fullReset = useCallback(() => {
    resetRound();
    setCumulativeScore(0);
    setStreak(0);
    setStats({ redWins: 0, yellowWins: 0, ties: 0 });
    onScoreChange(0);
  }, [resetRound, onScoreChange]);

  useEffect(() => {
    onRestartReady(fullReset);
  }, [onRestartReady, fullReset]);

  // Find lowest available row in column
  const getLowestEmptyRow = (grid: BoardState, col: number): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][col] === null) {
        return r;
      }
    }
    return -1;
  };

  // AI Evaluation Logic
  const getAiMove = (grid: BoardState, diff: AIDifficulty): number => {
    const validCols: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (grid[0][c] === null) validCols.push(c);
    }
    if (validCols.length === 0) return -1;

    // Easy AI: mostly random with 40% immediate win/block
    if (diff === 'easy' && Math.random() < 0.6) {
      return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // 1. Can AI (Y) win immediately?
    for (const c of validCols) {
      const r = getLowestEmptyRow(grid, c);
      grid[r][c] = 'Y';
      const outcome = checkWin(grid);
      grid[r][c] = null;
      if (outcome && outcome.winner === 'Y') {
        return c;
      }
    }

    // 2. Can Player (R) win on next move? Block them!
    for (const c of validCols) {
      const r = getLowestEmptyRow(grid, c);
      grid[r][c] = 'R';
      const outcome = checkWin(grid);
      grid[r][c] = null;
      if (outcome && outcome.winner === 'R') {
        return c;
      }
    }

    // Medium AI: prefer center columns and avoid setting up opponent
    if (diff === 'medium') {
      const preferred = [3, 2, 4, 1, 5, 0, 6].filter((c) => validCols.includes(c));
      return preferred[0] ?? validCols[0];
    }

    // Hard AI: Minimax heuristic
    let bestScore = -Infinity;
    let bestCol = validCols[0];

    const evaluateWindow = (window: (Player | null)[]): number => {
      let score = 0;
      const yCount = window.filter((p) => p === 'Y').length;
      const rCount = window.filter((p) => p === 'R').length;
      const emptyCount = window.filter((p) => p === null).length;

      if (yCount === 4) score += 100;
      else if (yCount === 3 && emptyCount === 1) score += 6;
      else if (yCount === 2 && emptyCount === 2) score += 2;

      if (rCount === 3 && emptyCount === 1) score -= 8;
      else if (rCount === 2 && emptyCount === 2) score -= 3;

      return score;
    };

    const scoreBoard = (b: BoardState): number => {
      let total = 0;

      // Center column preference
      const centerCol = Math.floor(COLS / 2);
      for (let r = 0; r < ROWS; r++) {
        if (b[r][centerCol] === 'Y') total += 4;
      }

      // Horizontal
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - 4; c++) {
          total += evaluateWindow([b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]]);
        }
      }

      // Vertical
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - 4; r++) {
          total += evaluateWindow([b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]]);
        }
      }

      return total;
    };

    for (const c of validCols) {
      const r = getLowestEmptyRow(grid, c);
      grid[r][c] = 'Y';
      const colScore = scoreBoard(grid);
      grid[r][c] = null;

      if (colScore > bestScore) {
        bestScore = colScore;
        bestCol = c;
      }
    }

    return bestCol;
  };

  const dropChecker = (col: number) => {
    if (isPaused || winner || isAiThinking || isLockedRef.current) return;

    const row = getLowestEmptyRow(board, col);
    if (row === -1) return; // Column is full

    sound.play('move');

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    const result = checkWin(newBoard);
    if (result) {
      handleGameEnd(result.winner, result.line);
      return;
    }

    // Switch turn
    if (mode === 'ai' && currentPlayer === 'R') {
      setCurrentPlayer('Y');
      setIsAiThinking(true);
      isLockedRef.current = true;

      setTimeout(() => {
        const aiCol = getAiMove(newBoard, difficulty);
        if (aiCol !== -1) {
          const aiRow = getLowestEmptyRow(newBoard, aiCol);
          if (aiRow !== -1) {
            sound.play('move');
            newBoard[aiRow][aiCol] = 'Y';
            setBoard([...newBoard]);

            const aiResult = checkWin(newBoard);
            if (aiResult) {
              handleGameEnd(aiResult.winner, aiResult.line);
            } else {
              setCurrentPlayer('R');
            }
          }
        }
        setIsAiThinking(false);
        isLockedRef.current = false;
      }, 500);
    } else {
      setCurrentPlayer(currentPlayer === 'R' ? 'Y' : 'R');
    }
  };

  const handleGameEnd = (gameWinner: Player | 'draw', line: WinningDisc[]) => {
    setWinner(gameWinner);
    setWinningDiscs(line);
    isLockedRef.current = false;

    if (gameWinner === 'draw') {
      sound.play('tick');
      setStats((s) => ({ ...s, ties: s.ties + 1 }));
    } else if (gameWinner === 'R') {
      sound.play('win');
      const pointMultiplier = difficulty === 'hard' ? 300 : difficulty === 'medium' ? 200 : 120;
      const roundScore = pointMultiplier + streak * 30;
      const newScore = cumulativeScore + roundScore;
      setCumulativeScore(newScore);
      setStreak((s) => s + 1);
      setStats((s) => ({ ...s, redWins: s.redWins + 1 }));
      onScoreChange(newScore);
    } else {
      sound.play('gameover');
      setStreak(0);
      setStats((s) => ({ ...s, yellowWins: s.yellowWins + 1 }));
    }
  };

  // Keyboard controls for 1-7 keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const colNum = parseInt(e.key, 10);
      if (colNum >= 1 && colNum <= 7) {
        e.preventDefault();
        dropChecker(colNum - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropChecker]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-xl mx-auto w-full select-none">
      {/* Mode selection & Difficulty bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 p-2 bg-surface-secondary rounded-xl border border-border-subtle">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMode('ai');
              resetRound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'ai'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'pvp'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={14} />
            <span>2 Players</span>
          </button>
        </div>

        {mode === 'ai' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-text-muted mr-1 hidden sm:inline">AI:</span>
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  resetRound();
                }}
                className={`px-2 py-1 text-xs font-medium capitalize rounded transition-colors cursor-pointer ${
                  difficulty === d
                    ? 'bg-surface-tertiary text-text-primary border border-border-strong'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Match Scoreboard */}
      <div className="grid grid-cols-3 gap-3 w-full mb-3 text-center max-w-[460px]">
        <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted mb-0.5 flex items-center justify-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs inline-block" />
            <span>Player Red</span>
          </div>
          <div className="text-base font-bold text-rose-500 tabular-nums">{stats.redWins}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted mb-0.5">Ties</div>
          <div className="text-base font-bold text-text-secondary tabular-nums">{stats.ties}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted mb-0.5 flex items-center justify-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs inline-block" />
            <span>{mode === 'ai' ? `Bot (${difficulty})` : 'Player Yellow'}</span>
          </div>
          <div className="text-base font-bold text-amber-500 tabular-nums">{stats.yellowWins}</div>
        </div>
      </div>

      {/* Status banner */}
      <div className="mb-2 text-center h-7 flex items-center justify-center">
        {winner ? (
          <div className="flex items-center gap-2 font-bold text-sm">
            {winner === 'draw' ? (
              <span className="text-text-secondary">Round Draw! Board full.</span>
            ) : (
              <span className={winner === 'R' ? 'text-rose-500' : 'text-amber-500'}>
                🎉 {winner === 'R' ? 'Red' : mode === 'ai' ? 'Bot' : 'Yellow'} Connected Four!
              </span>
            )}
          </div>
        ) : isAiThinking ? (
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Bot is planning move...
          </div>
        ) : (
          <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <span>Current Turn:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                currentPlayer === 'R'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  : 'bg-amber-400/15 text-amber-500 border border-amber-400/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentPlayer === 'R' ? 'bg-rose-500' : 'bg-amber-400'}`} />
              {currentPlayer === 'R' ? 'Red' : mode === 'ai' ? 'Bot (Yellow)' : 'Yellow'}
            </span>
          </div>
        )}
      </div>

      {/* Column Drop Indicator Arrow Buttons */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-full max-w-[460px] px-3.5 mb-1.5">
        {Array(COLS)
          .fill(null)
          .map((_, col) => {
            const isFull = board[0][col] !== null;
            const isHovered = hoveredCol === col;
            return (
              <button
                key={`indicator-${col}`}
                onClick={() => dropChecker(col)}
                disabled={isFull || !!winner || isAiThinking}
                onMouseEnter={() => setHoveredCol(col)}
                onMouseLeave={() => setHoveredCol(null)}
                className={`h-7 rounded-lg flex items-center justify-center transition-all ${
                  isFull || !!winner || isAiThinking
                    ? 'opacity-0 cursor-default'
                    : isHovered
                    ? 'bg-surface-secondary text-text-primary scale-110 shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title={`Drop in column ${col + 1} (Key ${col + 1})`}
              >
                <ChevronDown
                  size={18}
                  className={
                    isHovered
                      ? currentPlayer === 'R'
                        ? 'text-rose-500 animate-bounce'
                        : 'text-amber-400 animate-bounce'
                      : ''
                  }
                />
              </button>
            );
          })}
      </div>

      {/* Iconic Connect Four Vertical Board Rack */}
      <div className="relative w-full max-w-[460px]">
        {/* Blue Rack Grid with prominent border lines and slot cutouts */}
        <div className="relative rounded-3xl bg-blue-600 dark:bg-blue-700 border-4 border-blue-800 dark:border-blue-900 p-3 sm:p-4 shadow-2xl">
          <div className="grid grid-cols-7 grid-rows-6 gap-1.5 sm:gap-2.5 w-full aspect-[7/6]">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinningSlot = winningDiscs.some((d) => d.r === r && d.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => dropChecker(c)}
                    onMouseEnter={() => setHoveredCol(c)}
                    onMouseLeave={() => setHoveredCol(null)}
                    disabled={board[0][c] !== null || !!winner || isAiThinking}
                    className="relative aspect-square rounded-full flex items-center justify-center cursor-pointer select-none focus:outline-none"
                    aria-label={`Column ${c + 1}, row ${r + 1}`}
                  >
                    {/* Dark recessed cutout slot */}
                    <div className="absolute inset-0 rounded-full bg-[#081329] border-2 border-blue-900/80 shadow-inner overflow-hidden flex items-center justify-center">
                      {/* Checkers */}
                      {cell === 'R' && (
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-rose-300 shadow-md flex items-center justify-center animate-pop-in ${
                            isWinningSlot ? 'ring-4 ring-yellow-300 ring-offset-2 scale-105' : ''
                          }`}
                        >
                          <div className="w-1/2 h-1/2 rounded-full border-2 border-rose-300/40 opacity-70" />
                        </div>
                      )}

                      {cell === 'Y' && (
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-yellow-200 shadow-md flex items-center justify-center animate-pop-in ${
                            isWinningSlot ? 'ring-4 ring-rose-500 ring-offset-2 scale-105' : ''
                          }`}
                        >
                          <div className="w-1/2 h-1/2 rounded-full border-2 border-yellow-200/40 opacity-70" />
                        </div>
                      )}

                      {/* Ghost preview when column is hovered */}
                      {cell === null && hoveredCol === c && !winner && !isAiThinking && (
                        <div
                          className={`w-4/5 h-4/5 rounded-full border-2 border-dashed opacity-25 ${
                            currentPlayer === 'R' ? 'border-rose-400 bg-rose-500/20' : 'border-amber-300 bg-amber-400/20'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Board Feet / Legs */}
        <div className="flex justify-between px-6 -mt-2">
          <div className="w-8 sm:w-10 h-4 bg-blue-800 dark:bg-blue-950 rounded-b-xl shadow-md border-b-2 border-x-2 border-blue-900" />
          <div className="w-8 sm:w-10 h-4 bg-blue-800 dark:bg-blue-950 rounded-b-xl shadow-md border-b-2 border-x-2 border-blue-900" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={resetRound}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-subtle cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>New Round</span>
        </button>

        {cumulativeScore > 0 && (
          <button
            onClick={() => onGameOver(cumulativeScore)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
          >
            <Award size={14} />
            <span>Finish Match ({cumulativeScore} pts)</span>
          </button>
        )}
      </div>

      {/* Helper hotkey note */}
      <p className="text-[11px] text-text-muted mt-3 text-center">
        Tip: Tap columns directly or press keys <span className="font-semibold text-text-secondary">1 through 7</span> to drop checkers.
      </p>
    </div>
  );
};
