import React, { useEffect } from 'react';
import { X, BookOpen, Keyboard } from 'lucide-react';
import { GameDefinition } from '../types/game';
import { sound } from '../utils/audio';

interface RulesModalProps {
  game: GameDefinition;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ game, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-surface-card border-2 border-border-strong p-6 sm:p-7 shadow-2xl">
        <button
          onClick={() => {
            sound.play('click');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-accent">
          <BookOpen size={20} />
          <h3 className="text-lg font-bold text-text-primary">How to Play: {game.title}</h3>
        </div>

        <p className="text-xs text-text-muted mb-4">{game.description}</p>

        {/* Rules List */}
        <div className="mb-5">
          <div className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Game Rules
          </div>
          <ul className="space-y-2 text-xs text-text-secondary">
            {game.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-surface-secondary text-text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-border-strong">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Controls Guide */}
        <div className="mb-6">
          <div className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Keyboard size={14} />
            <span>Controls & Shortcuts</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {game.controls.map((ctrl, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary text-xs border border-border-subtle"
              >
                <kbd className="px-2 py-0.5 rounded-md bg-surface-card border border-border-strong font-mono text-[11px] text-text-primary shadow-xs font-bold">
                  {ctrl.key}
                </kbd>
                <span className="text-text-secondary font-medium">{ctrl.action}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            sound.play('click');
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors shadow-sm cursor-pointer"
        >
          Got It, Let's Play
        </button>
      </div>
    </div>
  );
};
