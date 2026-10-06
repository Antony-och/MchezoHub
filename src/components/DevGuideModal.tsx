import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, Layers } from 'lucide-react';
import { sound } from '../utils/audio';

interface DevGuideModalProps {
  onClose: () => void;
}

export const DevGuideModal: React.FC<DevGuideModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    sound.play('click');
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const step1Code = `// 1. In src/data/games.ts: Add your game metadata
{
  id: 'flappy',
  title: 'Flappy Bird',
  tagline: 'Flap through pipes in a classic obstacle flight',
  description: 'Tap or press Space to flap upward and navigate through challenging green pipes.',
  category: 'Arcade',
  thumbnail: '/src/assets/images/thumb_flappy.jpg',
  accentColor: '#10b981',
  scoreLabel: 'Pipes Cleared',
  controls: [
    { key: 'Space / Click', action: 'Flap wings' },
  ],
  rules: [
    'Tap to gain altitude, gravity pulls you down.',
    'Each pipe pair safely cleared grants 1 point.',
    'Hitting the ground or pipes results in game over.',
  ],
}`;

  const step2Code = `// 2. In src/games/Flappy/index.tsx: Create the game component
import React, { useState, useEffect } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';

export const FlappyGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [score, setScore] = useState(0);

  const resetGame = () => {
    setScore(0);
    onScoreChange(0);
  };

  useEffect(() => {
    // Provide restart callback to GameShell
    onRestartReady(resetGame);
  }, [onRestartReady]);

  const handlePointEarned = () => {
    sound.play('score');
    const newScore = score + 1;
    setScore(newScore);
    onScoreChange(newScore);
  };

  const handleCrash = () => {
    sound.play('gameover');
    onGameOver(score);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Your Canvas or DOM elements */}
    </div>
  );
};`;

  const step3Code = `// 3. In src/App.tsx: Register in GAME_COMPONENTS map
import { FlappyGame } from './games/Flappy';

const GAME_COMPONENTS: Record<string, React.ComponentType<GameComponentProps>> = {
  tictactoe: TicTacToeGame,
  snake: SnakeGame,
  memory: MemoryMatchGame,
  '2048': Game2048,
  whackamole: WhackAMoleGame,
  flappy: FlappyGame, // <--- Added!
};`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-card border border-border-subtle p-6 sm:p-8 shadow-2xl">
        <button
          onClick={() => {
            sound.play('click');
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 text-accent mb-2">
          <Code2 size={24} />
          <h2 className="text-xl font-bold text-text-primary">How to Add a New Mini-Game</h2>
        </div>

        <p className="text-xs text-text-muted mb-6 leading-relaxed">
          GameHub is architected with a decoupled plugin model. Any mini-game (Canvas API, SVG, or DOM-based) can be plugged in by following 3 clean steps:
        </p>

        {/* Step 1 */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Define Game Metadata (src/data/games.ts)</span>
            </h3>
            <button
              onClick={() => copyToClipboard(step1Code, 'step1')}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent"
            >
              {copiedSection === 'step1' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedSection === 'step1' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-surface-secondary border border-border-subtle font-mono text-[11px] text-text-secondary overflow-x-auto">
            {step1Code}
          </pre>
        </div>

        {/* Step 2 */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Implement Component (src/games/YourGame/index.tsx)</span>
            </h3>
            <button
              onClick={() => copyToClipboard(step2Code, 'step2')}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent"
            >
              {copiedSection === 'step2' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedSection === 'step2' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-surface-secondary border border-border-subtle font-mono text-[11px] text-text-secondary overflow-x-auto">
            {step2Code}
          </pre>
        </div>

        {/* Step 3 */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Register Component (src/App.tsx)</span>
            </h3>
            <button
              onClick={() => copyToClipboard(step3Code, 'step3')}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent"
            >
              {copiedSection === 'step3' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedSection === 'step3' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-surface-secondary border border-border-subtle font-mono text-[11px] text-text-secondary overflow-x-auto">
            {step3Code}
          </pre>
        </div>

        <button
          onClick={() => {
            sound.play('click');
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors shadow-sm"
        >
          Close Guide
        </button>
      </div>
    </div>
  );
};
