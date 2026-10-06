import React, { useState, useEffect } from 'react';
import { GAMES } from './data/games';
import { GameComponentProps } from './types/game';
import { Lobby } from './components/Lobby';
import { GameShell } from './components/GameShell';
import { DevGuideModal } from './components/DevGuideModal';
import { TicTacToeGame } from './games/TicTacToe';
import { SnakeGame } from './games/Snake';
import { MemoryMatchGame } from './games/MemoryMatch';
import { Game2048 } from './games/Game2048';
import { WhackAMoleGame } from './games/WhackAMole';
import { ConnectFourGame } from './games/ConnectFour';
import { ChessGame } from './games/Chess';
import { CheckersGame } from './games/Checkers';
import { HangmanGame } from './games/Hangman';
import { SolitaireGame } from './games/Solitaire';
import { RockPaperScissorsGame } from './games/RockPaperScissors';
import { getSavedTheme, setSavedTheme, recordRecentGame, ThemeMode } from './utils/storage';
import { sound } from './utils/audio';

const GAME_COMPONENTS: Record<string, React.ComponentType<GameComponentProps>> = {
  tictactoe: TicTacToeGame,
  snake: SnakeGame,
  memory: MemoryMatchGame,
  '2048': Game2048,
  whackamole: WhackAMoleGame,
  connectfour: ConnectFourGame,
  chess: ChessGame,
  checkers: CheckersGame,
  hangman: HangmanGame,
  solitaire: SolitaireGame,
  rps: RockPaperScissorsGame,
};

export default function App() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => getSavedTheme());
  const [isDevGuideOpen, setIsDevGuideOpen] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Initialize theme on mount
  useEffect(() => {
    setSavedTheme(theme);
  }, [theme]);

  const handleSelectGame = (gameId: string) => {
    recordRecentGame(gameId);
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGameId(gameId);
      setIsTransitioning(false);
    }, 120);
  };

  const handleBackToLobby = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveGameId(null);
      setIsTransitioning(false);
    }, 120);
  };

  const activeGame = GAMES.find((g) => g.id === activeGameId);
  const ActiveGameComponent = activeGameId ? GAME_COMPONENTS[activeGameId] : null;

  return (
    <div className="min-h-screen bg-canvas text-primary">
      {/* Loading & Transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-xs flex items-center justify-center animate-pulse pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      )}

      {/* Main View Router */}
      {activeGame && ActiveGameComponent ? (
        <GameShell
          game={activeGame}
          gameComponent={ActiveGameComponent}
          currentTheme={theme}
          onThemeChange={setTheme}
          onBackToLobby={handleBackToLobby}
        />
      ) : (
        <Lobby
          games={GAMES}
          onSelectGame={handleSelectGame}
          currentTheme={theme}
          onThemeChange={setTheme}
          onOpenDevGuide={() => setIsDevGuideOpen(true)}
        />
      )}

      {/* Developer Guide Modal */}
      {isDevGuideOpen && <DevGuideModal onClose={() => setIsDevGuideOpen(false)} />}
    </div>
  );
}
