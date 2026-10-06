import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { ConfettiCanvas } from './Confetti';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  scoreLabel: string;
  gameTitle: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
  onOpenLeaderboard?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewHighScore,
  scoreLabel,
  gameTitle,
  onPlayAgain,
  onBackToLobby,
  onOpenLeaderboard,
}) => {
  useEffect(() => {
    if (isNewHighScore) {
      sound.play('golden');
    }
  }, [isNewHighScore]);

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onPlayAgain();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBackToLobby();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain, onBackToLobby]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {isNewHighScore && <ConfettiCanvas />}

      <div className="relative w-full max-w-sm rounded-3xl bg-surface-card border-2 border-border-strong p-6 sm:p-7 shadow-2xl text-center">
        {/* Record Badge */}
        {isNewHighScore ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/40 mb-3 animate-bounce">
            <Sparkles size={14} />
            <span>NEW HIGH SCORE!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 text-xs text-text-muted mb-2">
            <Trophy size={14} />
            <span>Match Concluded</span>
          </div>
        )}

        <h3 className="text-xl font-bold text-text-primary mb-1">{gameTitle}</h3>
        <p className="text-xs text-text-muted mb-6">Great effort! Here is your final summary.</p>

        {/* Score comparison card */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-surface-secondary border border-border-strong">
          <div>
            <div className="text-xs font-medium text-text-muted mb-1">Final {scoreLabel}</div>
            <div className="text-3xl font-extrabold text-accent tabular-nums">{score}</div>
          </div>
          <div className="border-l border-border-strong pl-3">
            <div className="text-xs font-medium text-text-muted mb-1">All-Time High</div>
            <div className="text-3xl font-extrabold text-amber-500 tabular-nums">
              {Math.max(score, highScore)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              sound.play('click');
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Play Again</span>
            <span className="text-white/70 text-xs font-normal ml-1">(Enter)</span>
          </button>

          {onOpenLeaderboard && (
            <button
              onClick={() => {
                sound.play('click');
                onOpenLeaderboard();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-secondary text-amber-500 hover:text-amber-400 font-semibold text-sm hover:bg-surface-tertiary active:scale-[0.98] transition-colors border border-border-strong shadow-xs cursor-pointer"
            >
              <Trophy size={16} />
              <span>View Leaderboard</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.play('click');
              onBackToLobby();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-secondary text-text-primary font-semibold text-sm hover:bg-surface-tertiary active:scale-[0.98] transition-colors border border-border-strong shadow-xs cursor-pointer"
          >
            <Home size={16} />
            <span>Back to Lobby</span>
            <span className="text-text-muted text-xs font-normal ml-1">(Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
