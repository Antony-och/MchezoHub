export type GameCategory = 'Arcade' | 'Puzzle' | 'Classic' | 'Action' | 'Word' | 'Card';

export interface GameDefinition {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: GameCategory;
  thumbnail: string;
  accentColor: string;
  scoreLabel: string;
  controls: {
    key: string;
    action: string;
  }[];
  rules: string[];
}

export interface GameComponentProps {
  isPaused: boolean;
  soundMuted: boolean;
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
  onRestartReady: (restartFn: () => void) => void;
}
