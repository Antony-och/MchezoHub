import React, { useEffect } from 'react';
import { Play, RotateCcw, Home, Pause } from 'lucide-react';
import { sound } from '../utils/audio';

interface PauseModalProps {
  gameTitle: string;
  onResume: () => void;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  gameTitle,
  onResume,
  onRestart,
  onBackToLobby,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Escape') {
        e.preventDefault();
        onResume();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume, onRestart]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-surface-card border-2 border-border-strong p-6 sm:p-7 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-3 text-accent border border-border-strong">
          <Pause size={24} />
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-1">Game Paused</h3>
        <p className="text-xs text-text-muted mb-6">{gameTitle} is currently paused.</p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              sound.play('click');
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <Play size={16} />
            <span>Resume Game</span>
            <span className="text-white/70 text-xs font-normal ml-1">(Space / Esc)</span>
          </button>

          <button
            onClick={() => {
              sound.play('click');
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-secondary text-text-primary font-semibold text-sm hover:bg-surface-tertiary active:scale-[0.98] transition-colors border border-border-strong shadow-xs cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Restart Game</span>
            <span className="text-text-muted text-xs font-normal ml-1">(R)</span>
          </button>

          <button
            onClick={() => {
              sound.play('click');
              onBackToLobby();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-secondary text-text-primary font-semibold text-sm hover:bg-surface-tertiary active:scale-[0.98] transition-colors border border-border-strong shadow-xs cursor-pointer"
          >
            <Home size={16} />
            <span>Back to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
