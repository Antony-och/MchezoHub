import React, { useState, useEffect, useRef } from 'react';
import { GameDefinition } from '../types/game';
import { sound } from '../utils/audio';
import {
  ArrowLeft,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  RotateCcw,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { GameOverModal } from './GameOverModal';
import { PauseModal } from './PauseModal';
import { RulesModal } from './RulesModal';
import {
  getHighScore,
  saveScore,
  ThemeMode,
  setSavedTheme,
  recordLeaderboardEntry,
} from '../utils/storage';

interface GameShellProps {
  game: GameDefinition;
  gameComponent: React.ComponentType<{
    isPaused: boolean;
    soundMuted: boolean;
    onGameOver: (score: number) => void;
    onScoreChange: (score: number) => void;
    onRestartReady: (restartFn: () => void) => void;
  }>;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onBackToLobby: () => void;
  onOpenLeaderboard?: () => void;
}

export const GameShell: React.FC<GameShellProps> = ({
  game,
  gameComponent: GameComponent,
  currentTheme,
  onThemeChange,
  onBackToLobby,
  onOpenLeaderboard,
}) => {
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getHighScore(game.id));
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Restart callback provided by inner game
  const restartFnRef = useRef<(() => void) | null>(null);

  const handleRestartReady = (fn: () => void) => {
    restartFnRef.current = fn;
  };

  const restartCurrentGame = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setCurrentScore(0);
    if (restartFnRef.current) {
      restartFnRef.current();
    }
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    const isNewRecord = saveScore(game.id, score);
    setIsNewHighScore(isNewRecord);
    if (isNewRecord) {
      setHighScore(score);
    }
    // Automatically record persistent leaderboard entry in localStorage
    recordLeaderboardEntry(game.id, game.title, score, game.scoreLabel);
    setIsGameOver(true);
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const toggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    setSavedTheme(next);
    onThemeChange(next);
  };

  // Global game shell keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === 'p' || e.key === 'P') {
        if (!isGameOver) {
          setIsPaused((p) => !p);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isGameOver]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-primary selection:bg-accent/20">
      {/* Shared Game Header */}
      <header className="sticky top-0 z-30 w-full border-b border-border-subtle bg-canvas/90 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left Zone: Back Button & Game Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.play('click');
                onBackToLobby();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors border border-border-subtle text-xs font-semibold group cursor-pointer"
              title="Back to Lobby (Esc)"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Lobby</span>
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-text-primary leading-tight flex items-center gap-2">
                <span>{game.title}</span>
                <span className="text-[11px] font-normal text-text-muted hidden md:inline">
                  · {game.category}
                </span>
              </h1>
            </div>
          </div>

          {/* Center Zone: Score & High Score */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-secondary border border-border-subtle">
              <span className="text-[11px] text-text-muted">{game.scoreLabel}:</span>
              <span className="text-base sm:text-lg font-black text-accent tabular-nums">
                {currentScore}
              </span>
            </div>

            <button
              onClick={() => {
                sound.play('click');
                onOpenLeaderboard?.();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-secondary/70 hover:bg-surface-secondary border border-border-subtle text-xs cursor-pointer transition-colors"
              title="View Centralized Leaderboard"
            >
              <Trophy size={13} className="text-amber-500" />
              <span className="text-[11px] text-text-muted">Best:</span>
              <span className="font-bold text-amber-500 tabular-nums">{highScore}</span>
            </button>
          </div>

          {/* Right Zone: Pause, Sound, Leaderboard, Theme, Rules, Restart */}
          <div className="flex items-center gap-1 sm:gap-2">
            {onOpenLeaderboard && (
              <button
                onClick={() => {
                  sound.play('click');
                  onOpenLeaderboard();
                }}
                className="p-2 rounded-xl text-amber-500 hover:text-amber-400 hover:bg-surface-secondary transition-colors cursor-pointer"
                title="Leaderboard (Rankings)"
                aria-label="View Leaderboard"
              >
                <Trophy size={18} />
              </button>
            )}

            <button
              onClick={() => {
                sound.play('click');
                setIsPaused((p) => !p);
              }}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title={isPaused ? 'Resume Game (P)' : 'Pause Game (P)'}
              aria-label="Pause or Resume"
            >
              {isPaused ? <Play size={18} className="text-accent" /> : <Pause size={18} />}
            </button>

            <button
              onClick={() => {
                sound.play('click');
                restartCurrentGame();
              }}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Restart Game (R)"
              aria-label="Restart Game"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
              aria-label="Toggle Sound"
            >
              {isMuted ? <VolumeX size={18} className="text-rose-500" /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={() => {
                sound.play('click');
                setShowRules(true);
              }}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Rules and Controls"
              aria-label="How to play"
            >
              <HelpCircle size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
              aria-label="Toggle theme"
            >
              {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <GameComponent
          isPaused={isPaused}
          soundMuted={isMuted}
          onGameOver={handleGameOver}
          onScoreChange={setCurrentScore}
          onRestartReady={handleRestartReady}
        />
      </main>

      {/* Pause Modal Overlay */}
      {isPaused && (
        <PauseModal
          gameTitle={game.title}
          onResume={() => setIsPaused(false)}
          onRestart={restartCurrentGame}
          onBackToLobby={onBackToLobby}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          score={finalScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          scoreLabel={game.scoreLabel}
          gameTitle={game.title}
          onPlayAgain={restartCurrentGame}
          onBackToLobby={onBackToLobby}
          onOpenLeaderboard={onOpenLeaderboard}
        />
      )}

      {/* Rules Modal */}
      {showRules && <RulesModal game={game} onClose={() => setShowRules(false)} />}
    </div>
  );
};
