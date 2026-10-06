import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { RotateCcw, Undo2, Award, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type Grid = number[][];

// High-contrast authentic 2048 color palette
const TILE_STYLES: Record<number, { bg: string; text: string; shadow?: string }> = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#ffffff', shadow: 'rgba(242, 177, 121, 0.4)' },
  16: { bg: '#f59563', text: '#ffffff', shadow: 'rgba(245, 149, 99, 0.4)' },
  32: { bg: '#f67c5f', text: '#ffffff', shadow: 'rgba(246, 124, 95, 0.4)' },
  64: { bg: '#f65e3b', text: '#ffffff', shadow: 'rgba(246, 94, 59, 0.5)' },
  128: { bg: '#edcf72', text: '#ffffff', shadow: 'rgba(237, 207, 114, 0.5)' },
  256: { bg: '#edcc61', text: '#ffffff', shadow: 'rgba(237, 204, 97, 0.6)' },
  512: { bg: '#edc850', text: '#ffffff', shadow: 'rgba(237, 200, 80, 0.7)' },
  1024: { bg: '#edc53f', text: '#ffffff', shadow: 'rgba(237, 197, 63, 0.8)' },
  2048: { bg: '#edc22e', text: '#ffffff', shadow: 'rgba(237, 194, 46, 0.9)' },
  4096: { bg: '#3c3a32', text: '#ffffff', shadow: 'rgba(60, 58, 50, 0.8)' },
};

function getEmptyCells(g: Grid): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (g[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

function spawnRandomTile(g: Grid): Grid {
  const empty = getEmptyCells(g);
  if (empty.length === 0) return g;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  const val = Math.random() < 0.9 ? 2 : 4;
  const next = g.map((row) => [...row]);
  next[r][c] = val;
  return next;
}

function createInitialGrid(): Grid {
  let g: Grid = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  g = spawnRandomTile(g);
  g = spawnRandomTile(g);
  return g;
}

function canMove(g: Grid): boolean {
  if (getEmptyCells(g).length > 0) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = g[r][c];
      if (r < 3 && g[r + 1][c] === val) return true;
      if (c < 3 && g[r][c + 1] === val) return true;
    }
  }
  return false;
}

function slideLine(line: number[]): { newLine: number[]; points: number; merged: boolean } {
  const filtered = line.filter((v) => v !== 0);
  const newLine: number[] = [];
  let points = 0;
  let merged = false;

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const combined = filtered[i] * 2;
      newLine.push(combined);
      points += combined;
      merged = true;
      i++;
    } else {
      newLine.push(filtered[i]);
    }
  }

  while (newLine.length < 4) {
    newLine.push(0);
  }

  return { newLine, points, merged };
}

export const Game2048: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [grid, setGrid] = useState<Grid>(() => createInitialGrid());
  const [score, setScore] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [keepPlaying, setKeepPlaying] = useState<boolean>(false);
  const [prevGrid, setPrevGrid] = useState<Grid | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const initGame = useCallback(() => {
    const newGrid = createInitialGrid();
    setGrid(newGrid);
    setScore(0);
    setPrevGrid(null);
    setPrevScore(null);
    setHasWon(false);
    setKeepPlaying(false);
    onScoreChangeRef.current(0);
  }, []);

  // Register restart callback ONCE on mount
  useEffect(() => {
    onRestartReady(initGame);
  }, [onRestartReady, initGame]);

  const move = useCallback(
    (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
      if (isPaused) return;

      let hasChanged = false;
      let totalPoints = 0;
      let anyMerged = false;
      const nextGrid: Grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      if (direction === 'LEFT' || direction === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
          const row = grid[r];
          const lineToSlide = direction === 'LEFT' ? row : [...row].reverse();
          const { newLine, points, merged } = slideLine(lineToSlide);
          const finalLine = direction === 'LEFT' ? newLine : [...newLine].reverse();

          for (let c = 0; c < 4; c++) {
            nextGrid[r][c] = finalLine[c];
            if (nextGrid[r][c] !== grid[r][c]) hasChanged = true;
          }
          totalPoints += points;
          if (merged) anyMerged = true;
        }
      } else {
        for (let c = 0; c < 4; c++) {
          const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
          const lineToSlide = direction === 'UP' ? col : [...col].reverse();
          const { newLine, points, merged } = slideLine(lineToSlide);
          const finalLine = direction === 'UP' ? newLine : [...newLine].reverse();

          for (let r = 0; r < 4; r++) {
            nextGrid[r][c] = finalLine[r];
            if (nextGrid[r][c] !== grid[r][c]) hasChanged = true;
          }
          totalPoints += points;
          if (merged) anyMerged = true;
        }
      }

      if (hasChanged) {
        if (anyMerged) {
          sound.play('merge');
        } else {
          sound.play('move');
        }

        // Save undo state
        setPrevGrid(grid);
        setPrevScore(score);

        const newScore = score + totalPoints;
        const withNewTile = spawnRandomTile(nextGrid);

        setGrid(withNewTile);
        setScore(newScore);
        onScoreChangeRef.current(newScore);

        // Check 2048 milestone
        if (!hasWon && !keepPlaying) {
          const reached2048 = withNewTile.some((row) => row.some((val) => val === 2048));
          if (reached2048) {
            sound.play('win');
            setHasWon(true);
          }
        }

        // Check Game Over
        if (!canMove(withNewTile)) {
          sound.play('gameover');
          onGameOverRef.current(newScore);
        }
      }
    },
    [grid, score, isPaused, hasWon, keepPlaying]
  );

  const undoMove = () => {
    if (prevGrid && prevScore !== null) {
      sound.play('click');
      setGrid(prevGrid);
      setScore(prevScore);
      onScoreChangeRef.current(prevScore);
      setPrevGrid(null);
      setPrevScore(null);
    }
  };

  // Keyboard navigation supporting both e.key and e.code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || key === 'a') {
        e.preventDefault();
        move('LEFT');
      } else if (e.key === 'ArrowRight' || key === 'd') {
        e.preventDefault();
        move('RIGHT');
      } else if (e.key === 'ArrowUp' || key === 'w') {
        e.preventDefault();
        move('UP');
      } else if (e.key === 'ArrowDown' || key === 's') {
        e.preventDefault();
        move('DOWN');
      } else if (key === 'u') {
        undoMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        if (dx > 0) move('RIGHT');
        else move('LEFT');
      } else {
        if (dy > 0) move('DOWN');
        else move('UP');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-xl mx-auto w-full select-none">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 max-w-[390px]">
        <div className="flex items-center gap-2">
          <button
            onClick={undoMove}
            disabled={!prevGrid}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              prevGrid
                ? 'bg-surface-secondary text-text-primary border-border-strong hover:bg-surface-tertiary active:scale-95 shadow-xs'
                : 'opacity-40 cursor-not-allowed text-text-muted border-border-subtle bg-surface-secondary/40'
            }`}
            title="Undo last move (U)"
          >
            <Undo2 size={14} />
            <span>Undo</span>
          </button>

          <button
            onClick={initGame}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary border border-border-subtle hover:bg-surface-tertiary hover:border-border-strong active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-surface-card border-2 border-border-strong shadow-xs flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">Score:</span>
          <strong className="text-lg font-black text-amber-500 tabular-nums">{score}</strong>
        </div>
      </div>

      {/* Reached 2048 victory banner */}
      {hasWon && !keepPlaying && (
        <div className="w-full max-w-[390px] p-3 mb-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-600 dark:text-amber-400 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Award size={20} className="text-amber-500" />
            <span>🎉 2048 Tile Unlocked! Keep climbing?</span>
          </div>
          <button
            onClick={() => setKeepPlaying(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs cursor-pointer"
          >
            Continue
          </button>
        </div>
      )}

      {/* 4x4 Grid Board with prominent frame and clear divider lines */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
        className="relative p-3.5 sm:p-4 rounded-3xl bg-[#bbada0] dark:bg-[#1e293b] border-4 border-[#8f7a66] dark:border-[#334155] shadow-2xl max-w-[390px] w-full aspect-square flex flex-col justify-center"
      >
        {/* Background Grid Slot Track with clear dividing lines */}
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3 h-full w-full relative">
          {grid.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const tileStyle = TILE_STYLES[val] || {
                bg: '#3c3a32',
                text: '#ffffff',
                shadow: 'rgba(60, 58, 50, 0.8)',
              };

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`relative rounded-xl flex items-center justify-center font-extrabold text-2xl sm:text-3xl transition-all duration-150 select-none overflow-hidden ${
                    val === 0
                      ? 'bg-[#cdc1b4] dark:bg-[#0f172a]/70 border border-[#bba998] dark:border-[#1e293b] shadow-inner'
                      : 'border-2 border-black/10 dark:border-white/20'
                  }`}
                  style={{
                    backgroundColor: val === 0 ? undefined : tileStyle.bg,
                    color: val === 0 ? 'transparent' : tileStyle.text,
                    boxShadow:
                      val > 4 && tileStyle.shadow
                        ? `0 4px 14px ${tileStyle.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`
                        : val > 0
                        ? '0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                        : undefined,
                  }}
                >
                  {val > 0 && (
                    <span className="animate-pop-in tabular-nums leading-none tracking-tight">
                      {val}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* On-Screen Arrow Controls for Touch, Mouse, and Mobile Users */}
      <div className="mt-4 flex flex-col items-center gap-1.5 w-full max-w-[390px]">
        <button
          onClick={() => move('UP')}
          className="p-3 w-14 h-12 rounded-xl bg-surface-card hover:bg-surface-secondary active:scale-95 border-2 border-border-strong text-text-primary flex items-center justify-center shadow-sm cursor-pointer"
          aria-label="Slide Up"
        >
          <ArrowUp size={22} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => move('LEFT')}
            className="p-3 w-14 h-12 rounded-xl bg-surface-card hover:bg-surface-secondary active:scale-95 border-2 border-border-strong text-text-primary flex items-center justify-center shadow-sm cursor-pointer"
            aria-label="Slide Left"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            onClick={() => move('DOWN')}
            className="p-3 w-14 h-12 rounded-xl bg-surface-card hover:bg-surface-secondary active:scale-95 border-2 border-border-strong text-text-primary flex items-center justify-center shadow-sm cursor-pointer"
            aria-label="Slide Down"
          >
            <ArrowDown size={22} />
          </button>
          <button
            onClick={() => move('RIGHT')}
            className="p-3 w-14 h-12 rounded-xl bg-surface-card hover:bg-surface-secondary active:scale-95 border-2 border-border-strong text-text-primary flex items-center justify-center shadow-sm cursor-pointer"
            aria-label="Slide Right"
          >
            <ArrowRight size={22} />
          </button>
        </div>

        <p className="text-[11px] text-text-muted mt-2 text-center">
          Controls: Use <span className="font-semibold text-text-primary">Arrow Keys</span>, <span className="font-semibold text-text-primary">WASD</span>, on-screen buttons, or swipe.
        </p>
      </div>
    </div>
  );
};
