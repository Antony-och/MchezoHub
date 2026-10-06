import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { Shield, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type WallMode = 'solid' | 'wrap';
type SpeedMode = 'zen' | 'normal' | 'fast';

const GRID_SIZE = 22; // 22 x 22 cells
const CELL_SIZE = 20; // 440 x 440 base dimensions

export const SnakeGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [wallMode, setWallMode] = useState<WallMode>('wrap');
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal');
  const [score, setScore] = useState<number>(0);
  const [length, setLength] = useState<number>(3);
  const [goldenTimer, setGoldenTimer] = useState<number>(0);

  // Mutable game refs for 60fps loop & tick handling
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const dirRef = useRef<Direction>('RIGHT');
  const inputQueueRef = useRef<Direction[]>([]);
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const goldenFoodRef = useRef<Point | null>(null);
  const goldenTicksRef = useRef<number>(0);
  const isAliveRef = useRef<boolean>(true);
  const lastTickTimeRef = useRef<number>(0);
  const currentScoreRef = useRef<number>(0);

  // Speed intervals (ms)
  const speedInterval = speedMode === 'zen' ? 140 : speedMode === 'fast' ? 75 : 105;

  const spawnFood = (isGolden = false): Point => {
    let newPt: Point;
    let collision = true;
    while (collision) {
      newPt = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      collision = snakeRef.current.some((seg) => seg.x === newPt.x && seg.y === newPt.y);
      if (!isGolden && goldenFoodRef.current && goldenFoodRef.current.x === newPt.x && goldenFoodRef.current.y === newPt.y) {
        collision = true;
      }
    }
    return newPt!;
  };

  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = 'RIGHT';
    inputQueueRef.current = [];
    foodRef.current = { x: 16, y: 10 };
    goldenFoodRef.current = null;
    goldenTicksRef.current = 0;
    isAliveRef.current = true;
    currentScoreRef.current = 0;
    setScore(0);
    setLength(3);
    setGoldenTimer(0);
    onScoreChange(0);
  }, [onScoreChange]);

  useEffect(() => {
    onRestartReady(resetGame);
  }, [onRestartReady, resetGame]);

  const changeDirection = useCallback((newDir: Direction) => {
    const queue = inputQueueRef.current;
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : dirRef.current;

    const isOpposite =
      (newDir === 'UP' && lastDir === 'DOWN') ||
      (newDir === 'DOWN' && lastDir === 'UP') ||
      (newDir === 'LEFT' && lastDir === 'RIGHT') ||
      (newDir === 'RIGHT' && lastDir === 'LEFT');

    if (!isOpposite && newDir !== lastDir && queue.length < 2) {
      queue.push(newDir);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Main Canvas Render & Game Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (!isAliveRef.current || isPaused) return;

      if (inputQueueRef.current.length > 0) {
        dirRef.current = inputQueueRef.current.shift()!;
      }
      const head = { ...snakeRef.current[0] };

      switch (dirRef.current) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check boundary conditions
      if (wallMode === 'wrap') {
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;
      } else {
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          isAliveRef.current = false;
          sound.play('gameover');
          onGameOver(currentScoreRef.current);
          return;
        }
      }

      // Check if eating food this tick
      const isEating =
        (head.x === foodRef.current.x && head.y === foodRef.current.y) ||
        (goldenFoodRef.current && head.x === goldenFoodRef.current.x && head.y === goldenFoodRef.current.y);

      // Check self-collision (vacating tail segment is not a collision unless eating)
      const segmentsToCheck = isEating
        ? snakeRef.current
        : snakeRef.current.slice(0, -1);

      const hitSelf = segmentsToCheck.some((seg) => seg.x === head.x && seg.y === head.y);
      if (hitSelf) {
        isAliveRef.current = false;
        sound.play('gameover');
        onGameOver(currentScoreRef.current);
        return;
      }

      // Move snake
      snakeRef.current.unshift(head);

      // Check food consumption
      let ate = false;
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        ate = true;
        sound.play('eat');
        const added = speedMode === 'fast' ? 15 : 10;
        currentScoreRef.current += added;
        setScore(currentScoreRef.current);
        setLength(snakeRef.current.length);
        onScoreChange(currentScoreRef.current);
        foodRef.current = spawnFood();

        // Chance to spawn golden apple (25% chance if none active)
        if (!goldenFoodRef.current && Math.random() < 0.28) {
          goldenFoodRef.current = spawnFood(true);
          goldenTicksRef.current = 65; // ~7 seconds
        }
      } else if (
        goldenFoodRef.current &&
        head.x === goldenFoodRef.current.x &&
        head.y === goldenFoodRef.current.y
      ) {
        ate = true;
        sound.play('golden');
        currentScoreRef.current += 50;
        setScore(currentScoreRef.current);
        setLength(snakeRef.current.length);
        onScoreChange(currentScoreRef.current);
        goldenFoodRef.current = null;
        goldenTicksRef.current = 0;
        setGoldenTimer(0);
      }

      if (!ate) {
        snakeRef.current.pop();
      }

      // Decrement golden apple timer
      if (goldenFoodRef.current) {
        goldenTicksRef.current -= 1;
        setGoldenTimer(Math.max(0, Math.ceil(goldenTicksRef.current / 8)));
        if (goldenTicksRef.current <= 0) {
          goldenFoodRef.current = null;
          setGoldenTimer(0);
        }
      }
    };

    const render = (time: number) => {
      if (time - lastTickTimeRef.current >= speedInterval) {
        lastTickTimeRef.current = time;
        tick();
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const cellPx = w / GRID_SIZE;

          // Clear background
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(0, 0, w, h);

          // Crisp grid lines pattern
          ctx.strokeStyle = '#223049';
          ctx.lineWidth = 1;
          for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellPx, 0);
            ctx.lineTo(i * cellPx, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellPx);
            ctx.lineTo(w, i * cellPx);
            ctx.stroke();
          }

          // Arena border line
          ctx.strokeStyle = wallMode === 'solid' ? '#ef4444' : '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, w - 2, h - 2);

          // Draw standard food (Apple)
          const fx = foodRef.current.x * cellPx + cellPx / 2;
          const fy = foodRef.current.y * cellPx + cellPx / 2;
          const radius = cellPx * 0.42;

          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(fx, fy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Leaf
          ctx.fillStyle = '#22c55e';
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(fx + 2, fy - radius * 0.9, radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw golden food if active
          if (goldenFoodRef.current) {
            const gx = goldenFoodRef.current.x * cellPx + cellPx / 2;
            const gy = goldenFoodRef.current.y * cellPx + cellPx / 2;
            ctx.save();
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(gx, gy, radius * 1.15, 0, Math.PI * 2);
            ctx.fill();

            // Shimmer center
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(gx - 2, gy - 2, radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw Snake body
          const snake = snakeRef.current;
          snake.forEach((seg, i) => {
            const x = seg.x * cellPx;
            const y = seg.y * cellPx;
            const isHead = i === 0;

            ctx.save();
            if (isHead) {
              ctx.fillStyle = '#10b981';
              ctx.shadowColor = '#10b981';
              ctx.shadowBlur = 10;
              // Rounded head
              ctx.beginPath();
              ctx.roundRect(x + 1, y + 1, cellPx - 2, cellPx - 2, 7);
              ctx.fill();

              // Snake Eyes
              ctx.fillStyle = '#0f172a';
              ctx.shadowBlur = 0;
              const eyeOffset = 4;
              let eye1X = x + eyeOffset;
              let eye1Y = y + eyeOffset;
              let eye2X = x + cellPx - eyeOffset - 3;
              let eye2Y = y + eyeOffset;

              if (dirRef.current === 'DOWN') {
                eye1Y = y + cellPx - eyeOffset - 3;
                eye2Y = y + cellPx - eyeOffset - 3;
              } else if (dirRef.current === 'LEFT') {
                eye1X = x + eyeOffset;
                eye2X = x + eyeOffset;
                eye2Y = y + cellPx - eyeOffset - 3;
              } else if (dirRef.current === 'RIGHT') {
                eye1X = x + cellPx - eyeOffset - 3;
                eye2X = x + cellPx - eyeOffset - 3;
                eye2Y = y + cellPx - eyeOffset - 3;
              }

              ctx.fillRect(eye1X, eye1Y, 3, 3);
              ctx.fillRect(eye2X, eye2Y, 3, 3);
            } else {
              // Body gradient
              const colorRatio = 1 - (i / snake.length) * 0.35;
              ctx.fillStyle = `rgb(${Math.floor(16 * colorRatio)}, ${Math.floor(185 * colorRatio)}, ${Math.floor(129 * colorRatio)})`;
              ctx.beginPath();
              ctx.roundRect(x + 2, y + 2, cellPx - 4, cellPx - 4, 4);
              ctx.fill();
            }
            ctx.restore();
          });
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, wallMode, speedInterval, onGameOver, onScoreChange]);

  return (
    <div className="flex flex-col items-center justify-center p-2 max-w-xl mx-auto w-full">
      {/* Mode settings */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 p-2 bg-surface-secondary rounded-xl border border-border-subtle">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Boundary:</span>
          <button
            onClick={() => setWallMode(wallMode === 'wrap' ? 'solid' : 'wrap')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium border transition-colors ${
              wallMode === 'wrap'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}
          >
            <Shield size={12} />
            <span>{wallMode === 'wrap' ? 'Wrap Portal' : 'Solid Wall'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-muted mr-1">Speed:</span>
          {(['zen', 'normal', 'fast'] as SpeedMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMode(s)}
              className={`px-2 py-1 text-xs font-medium capitalize rounded transition-colors ${
                speedMode === s
                  ? 'bg-surface-tertiary text-text-primary border border-border-strong'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Snake HUD indicators */}
      <div className="flex items-center justify-between w-full max-w-[440px] px-2 mb-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-text-muted">
            Length: <strong className="text-text-primary tabular-nums">{length}</strong>
          </span>
          <span className="text-text-muted">
            Score: <strong className="text-emerald-500 tabular-nums">{score}</strong>
          </span>
        </div>

        {goldenTimer > 0 && (
          <div className="flex items-center gap-1 text-amber-500 font-semibold animate-pulse">
            <Sparkles size={13} />
            <span>Golden Fruit ({goldenTimer}s)</span>
          </div>
        )}
      </div>

      {/* Canvas container */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border-subtle bg-[#0b0f19] max-w-[440px] w-full aspect-square">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="w-full h-full block"
        />
      </div>

      {/* Virtual D-Pad for Mobile Touch Controls */}
      <div className="grid grid-cols-3 gap-2 mt-4 w-44 sm:hidden">
        <div></div>
        <button
          onClick={() => changeDirection('UP')}
          className="p-3 bg-surface-secondary active:bg-surface-tertiary border border-border-subtle rounded-xl flex items-center justify-center text-text-primary shadow-sm"
          aria-label="Up"
        >
          <ArrowUp size={20} />
        </button>
        <div></div>

        <button
          onClick={() => changeDirection('LEFT')}
          className="p-3 bg-surface-secondary active:bg-surface-tertiary border border-border-subtle rounded-xl flex items-center justify-center text-text-primary shadow-sm"
          aria-label="Left"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => changeDirection('DOWN')}
          className="p-3 bg-surface-secondary active:bg-surface-tertiary border border-border-subtle rounded-xl flex items-center justify-center text-text-primary shadow-sm"
          aria-label="Down"
        >
          <ArrowDown size={20} />
        </button>
        <button
          onClick={() => changeDirection('RIGHT')}
          className="p-3 bg-surface-secondary active:bg-surface-tertiary border border-border-subtle rounded-xl flex items-center justify-center text-text-primary shadow-sm"
          aria-label="Right"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
