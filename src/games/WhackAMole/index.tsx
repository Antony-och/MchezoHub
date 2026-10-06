import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { Timer, Zap, RotateCcw, Crown, AlertTriangle } from 'lucide-react';

type MoleType = 'normal' | 'golden' | 'trap';

interface HoleState {
  id: number;
  active: boolean;
  type: MoleType;
  isHit: boolean;
}

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

const TOTAL_TIME = 30; // 30 seconds round

export const WhackAMoleGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [holes, setHoles] = useState<HoleState[]>(() =>
    Array(9)
      .fill(null)
      .map((_, i) => ({ id: i, active: false, type: 'normal', isHit: false }))
  );
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(true);

  const scoreRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(TOTAL_TIME);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    timeLeftRef.current = TOTAL_TIME;
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setCombo(0);
    setFloatingScores([]);
    setIsRoundActive(true);
    setHoles(
      Array(9)
        .fill(null)
        .map((_, i) => ({ id: i, active: false, type: 'normal', isHit: false }))
    );
    onScoreChange(0);
  }, [onScoreChange]);

  useEffect(() => {
    onRestartReady(resetGame);
  }, [onRestartReady, resetGame]);

  // Round Countdown Timer
  useEffect(() => {
    if (!isRoundActive || isPaused) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 5 && timeLeftRef.current > 0) {
        sound.play('tick');
      }

      if (timeLeftRef.current <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
        setIsRoundActive(false);

        // Hide all moles
        setHoles((prev) => prev.map((h) => ({ ...h, active: false, isHit: false })));

        sound.play('win');
        setTimeout(() => {
          onGameOver(scoreRef.current);
        }, 500);
      }
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isRoundActive, isPaused, onGameOver]);

  // Mole Spawning Engine
  useEffect(() => {
    if (!isRoundActive || isPaused) {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      return;
    }

    const spawnMole = () => {
      // Pick random inactive hole
      setHoles((prev) => {
        const inactiveHoles = prev.filter((h) => !h.active);
        if (inactiveHoles.length === 0) return prev;

        const targetHole = inactiveHoles[Math.floor(Math.random() * inactiveHoles.length)];

        // Decide type
        const roll = Math.random();
        let type: MoleType = 'normal';
        if (roll < 0.22) {
          type = 'golden'; // 22% golden
        } else if (roll < 0.42) {
          type = 'trap'; // 20% trap
        }

        // Auto-hide mole after stay duration
        const stayDuration = type === 'golden' ? 700 : type === 'trap' ? 1200 : 950;

        setTimeout(() => {
          setHoles((current) =>
            current.map((h) => (h.id === targetHole.id ? { ...h, active: false, isHit: false } : h))
          );
        }, stayDuration);

        return prev.map((h) =>
          h.id === targetHole.id ? { ...h, active: true, type, isHit: false } : h
        );
      });

      // Schedule next spawn (dynamic interval)
      const nextDelay = Math.random() * 450 + 400;
      spawnTimerRef.current = setTimeout(spawnMole, nextDelay);
    };

    spawnTimerRef.current = setTimeout(spawnMole, 400);

    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, [isRoundActive, isPaused]);

  // Handle Hole Click / Whack
  const handleHoleClick = (e: React.MouseEvent, holeId: number) => {
    if (!isRoundActive || isPaused) return;

    const hole = holes.find((h) => h.id === holeId);
    if (!hole || !hole.active || hole.isHit) {
      // Whacked empty hole
      sound.play('miss');
      setCombo(0);
      return;
    }

    // Coordinates for floating text
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Mark as hit
    setHoles((prev) =>
      prev.map((h) => (h.id === holeId ? { ...h, isHit: true } : h))
    );

    let pointsEarned = 0;
    let scoreText = '';
    let textColor = '#22c55e';

    if (hole.type === 'normal') {
      sound.play('whack');
      const multiplier = combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
      pointsEarned = 10 * multiplier;
      setCombo((c) => c + 1);
      scoreText = multiplier > 1 ? `+${pointsEarned} (${multiplier}x)` : `+${pointsEarned}`;
      textColor = '#10b981';
    } else if (hole.type === 'golden') {
      sound.play('golden');
      const multiplier = combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
      pointsEarned = 30 * multiplier;
      setCombo((c) => c + 1);
      scoreText = multiplier > 1 ? `+${pointsEarned} (GOLD x${multiplier})` : `+${pointsEarned} GOLD`;
      textColor = '#f59e0b';
    } else if (hole.type === 'trap') {
      sound.play('miss');
      pointsEarned = -15;
      setCombo(0);
      scoreText = '-15 OUCH!';
      textColor = '#ef4444';
    }

    const newTotal = Math.max(0, scoreRef.current + pointsEarned);
    scoreRef.current = newTotal;
    setScore(newTotal);
    onScoreChange(newTotal);

    // Add floating score animation
    const floatingId = Date.now() + Math.random();
    setFloatingScores((prev) => [
      ...prev,
      { id: floatingId, text: scoreText, x: clickX, y: clickY, color: textColor },
    ]);

    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== floatingId));
    }, 800);

    // Hide mole immediately after hit
    setTimeout(() => {
      setHoles((prev) =>
        prev.map((h) => (h.id === holeId ? { ...h, active: false, isHit: false } : h))
      );
    }, 200);
  };

  const timePercent = (timeLeft / TOTAL_TIME) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-xl mx-auto w-full select-none cursor-mallet">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between gap-3 mb-3 max-w-[420px]">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Timer size={14} className={timeLeft <= 5 ? 'text-rose-500 animate-pulse' : ''} />
          <span className="tabular-nums font-semibold text-text-primary text-sm">
            {timeLeft}s
          </span>
        </div>

        {/* Combo Badge */}
        <div className="flex items-center gap-1">
          {combo >= 3 && (
            <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-bounce">
              <Zap size={12} />
              <span>{combo >= 6 ? '3X COMBO' : '2X COMBO'} ({combo})</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-xs text-text-muted mr-1">Score:</span>
          <strong className="text-lg font-bold text-rose-500 tabular-nums">{score}</strong>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full max-w-[420px] h-1.5 bg-surface-secondary rounded-full overflow-hidden mb-4 border border-border-subtle">
        <div
          className={`h-full transition-all duration-300 ${
            timeLeft <= 5 ? 'bg-rose-500' : 'bg-accent'
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* 3x3 Carnival Burrow Grid */}
      <div className="relative p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-md max-w-[420px] w-full aspect-square">
        <div className="grid grid-cols-3 gap-3.5 h-full w-full">
          {holes.map((hole) => (
            <div
              key={hole.id}
              onClick={(e) => handleHoleClick(e, hole.id)}
              className="relative rounded-2xl bg-surface-secondary border border-border-subtle overflow-hidden flex items-end justify-center cursor-pointer transition-transform active:scale-95 group shadow-inner"
            >
              {/* Hole shadow rim */}
              <div className="absolute inset-x-2 bottom-2 h-10 rounded-full bg-[#1e1713]/80 border-t-2 border-stone-800 pointer-events-none" />

              {/* Mole character surfacing */}
              <div
                className={`relative z-10 flex flex-col items-center transition-all duration-150 transform ${
                  hole.active
                    ? hole.isHit
                      ? 'translate-y-4 scale-90 opacity-60'
                      : 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-24 scale-75 opacity-0'
                }`}
              >
                {/* Golden King Mole */}
                {hole.type === 'golden' && (
                  <div className="w-16 h-18 rounded-t-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 flex flex-col items-center pt-2 shadow-lg">
                    <Crown size={14} className="text-yellow-100 mb-0.5" />
                    <div className="flex gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    </div>
                    <div className="w-3 h-2 bg-yellow-200 rounded-full border border-amber-700" />
                  </div>
                )}

                {/* Normal Brown Mole */}
                {hole.type === 'normal' && (
                  <div className="w-16 h-18 rounded-t-full bg-gradient-to-b from-stone-600 to-stone-800 border-2 border-stone-500 flex flex-col items-center pt-3 shadow-md">
                    <div className="flex gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-black rounded-full ring-1 ring-white/50" />
                      <div className="w-1.5 h-1.5 bg-black rounded-full ring-1 ring-white/50" />
                    </div>
                    <div className="w-3.5 h-2.5 bg-rose-400 rounded-full border border-stone-700" />
                    <div className="flex gap-1 mt-1">
                      <div className="w-1 h-1.5 bg-white rounded-t-sm" />
                      <div className="w-1 h-1.5 bg-white rounded-t-sm" />
                    </div>
                  </div>
                )}

                {/* Trap Cactus / Bomb */}
                {hole.type === 'trap' && (
                  <div className="w-16 h-18 rounded-t-full bg-gradient-to-b from-red-600 to-red-800 border-2 border-red-400 flex flex-col items-center pt-2.5 shadow-md">
                    <AlertTriangle size={15} className="text-yellow-300 mb-0.5 animate-pulse" />
                    <div className="flex gap-2 mb-1">
                      <span className="text-[10px] font-black text-white">X</span>
                      <span className="text-[10px] font-black text-white">X</span>
                    </div>
                    <div className="text-[9px] font-bold text-yellow-300 tracking-wider">
                      TRAP
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Hit Text */}
              {floatingScores.map((item) => (
                <div
                  key={item.id}
                  className="absolute pointer-events-none text-xs font-black animate-score-float z-30"
                  style={{
                    left: item.x,
                    top: item.y - 15,
                    color: item.color,
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Restart & Legend */}
      <div className="w-full max-w-[420px] flex items-center justify-between mt-4">
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-secondary text-text-primary border border-border-subtle hover:bg-surface-tertiary transition-colors"
        >
          <RotateCcw size={13} />
          <span>Restart Round</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-600" /> Mole (+10)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> King (+30)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" /> Trap (-15)
          </span>
        </div>
      </div>
    </div>
  );
};
