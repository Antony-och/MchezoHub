# MchezoHub — Cheza. Enjoy. Repeat.

MchezoHub is a modern, single-page browser game hub featuring instant mini-games in one place with no downloads or external backend dependencies.

---

## 🎮 Included Mini-Games

1. **Tic-Tac-Toe** (`src/games/TicTacToe`)
   - 3x3 tactical duel against smart AI (Easy, Medium, Unbeatable Minimax) or 2-player local pass-and-play.
   - Dynamic win-line highlights, streak multiplier scoring, and round scoreboard.

2. **Snake Arena** (`src/games/Snake`)
   - High-performance action arcade game rendered via HTML5 **Canvas API**.
   - Features standard apples (+10 pts) and rare timed Golden Starfruits (+50 pts).
   - Solid wall vs Wrap-around portal boundary options, speed levels, and touch virtual D-pad.

3. **Memory Match** (`src/games/MemoryMatch`)
   - Spatial recall challenge with 3D CSS card-flip perspective effects.
   - Theme decks (Arcade, Nature, Tech), 3 grid sizes (12, 16, 20 cards), and combo multiplier chains.

4. **2048** (`src/games/Game2048`)
   - Classic sliding power-of-two puzzle with smooth merge animations.
   - Arrow keys / WASD + touch swipe gestures, single-step move undo, and post-2048 endless mode.

5. **Whack-a-Mole** (`src/games/WhackAMole`)
   - 30-second reflex carnival game with popping holes, custom mallet cursor, and floating score numbers.
   - Brown moles (+10), speedy King Moles (+30), and prickly Cactus traps (-15 with combo reset).

6. **Connect Four** (`src/games/ConnectFour`)
   - 7x6 vertical blue rack duel with circular cutout slots and column drop physics.
   - Single-player vs AI (Easy, Medium, Hard heuristic) and 2-Player Local Pass & Play (Red vs. Yellow).
   - Dynamic 4-in-a-row detection in all directions (horizontal, vertical, diagonal) with winning disc highlight rings.
   - Keyboard column hotkeys (keys 1 through 7) and mouse/touch drop indicators.

7. **Chess** (`src/games/Chess`)
   - Complete 8x8 chessboard with rank/file coordinates, legal move path calculator, and pawn promotions to Queen.
   - Smart AI Bot (Easy, Medium, Hard with material evaluation) and 2-Player Pass-and-Play.
   - Check and checkmate detection with alert indicators and captured pieces trays.

8. **Checkers** (`src/games/Checkers`)
   - Traditional 8x8 draughts played on dark squares with Red vs. Black circular checkers.
   - Single diagonal steps, multi-jump captures, and crowned Kings that move both forward and backward.
   - Single-player vs AI and 2-player local pass-and-play.

9. **Hangman** (`src/games/Hangman`)
   - Classic word mystery game featuring Categories (Animals, Countries, Tech, Science), hint system, and streak bonuses.
   - Dynamic SVG gallows rendering with 6 allowable mistakes, letter buttons, and keyboard typing support.

10. **Solitaire** (`src/games/Solitaire`)
   - Full 52-card Klondike Solitaire with 7 tableau columns, 4 suit foundations, and stock/waste drawing.
   - Double-click auto-foundation send, undo moves, moves and score tracking.

11. **Rock Paper Scissors** (`src/games/RockPaperScissors`)
   - High-speed hand clash vs an adaptive AI that tracks player tendencies.
   - Animated 3-2-1 clash countdown, streak multipliers, and keyboard shortcuts (`1`, `2`, `3`).

---

## 🛠️ Shared Systems

- **Zero-Dependency Synthesizer (`src/utils/audio.ts`)**: Pure browser Web Audio API oscillator synthesis for move, eat, golden bonus, whack, match, victory fanfare, and game-over sounds with global mute state.
- **Persistent LocalStorage Engine (`src/utils/storage.ts`)**: Tracks all-time high scores, total plays, and recently played game ordering across browser sessions.
- **Shared Game Shell (`src/components/GameShell.tsx`)**: Unified header with score tracking, live high scores, pause modal, audio mute toggle, light/dark theme switch, and rules reference.
- **Game-Over & Victory Celebration (`src/components/GameOverModal.tsx`, `src/components/Confetti.tsx`)**: Record-breaking confetti bursts, score comparisons, and instant single-key replay (`Enter`).
- **CSS Variable Theming (`src/index.css`)**: Clean light and dark modes toggled seamlessly using CSS variables (`--bg-canvas`, `--surface-card`, `--accent`, etc.).

---

## 🚀 How to Add a New Mini-Game

GameHub features a decoupled, modular game architecture. Adding any new 2D or Canvas mini-game requires just 3 straightforward steps:

### Step 1: Register the Game Definition

Open `src/data/games.ts` and add your game metadata to the `GAMES` array:

```typescript
import { GameDefinition } from '../types/game';

export const GAMES: GameDefinition[] = [
  // ... existing games
  {
    id: 'flappy',
    title: 'Flappy Bird',
    tagline: 'Flap through pipes in a classic obstacle flight',
    description: 'Tap or press Space to flap upward and navigate through challenging obstacles.',
    category: 'Arcade',
    thumbnail: '/src/assets/images/thumb_flappy.jpg',
    accentColor: '#10b981',
    scoreLabel: 'Pipes',
    controls: [
      { key: 'Space / Click', action: 'Flap wings upward' },
    ],
    rules: [
      'Tap to flap upward; gravity pulls you downward.',
      'Each obstacle safely cleared grants +1 point.',
      'Colliding with an obstacle or the ground ends the round.',
    ],
  },
];
```

### Step 2: Implement the Game Component

Create your game component in `src/games/YourGame/index.tsx`. It must accept `GameComponentProps`:

```typescript
import React, { useState, useEffect } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';

export const FlappyGame: React.FC<GameComponentProps> = ({
  isPaused,
  soundMuted,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [score, setScore] = useState<number>(0);

  const resetGame = () => {
    setScore(0);
    onScoreChange(0);
  };

  useEffect(() => {
    // Provide restart callback to the shared GameShell
    onRestartReady(resetGame);
  }, [onRestartReady]);

  const handlePointScored = () => {
    sound.play('score');
    const newScore = score + 1;
    setScore(newScore);
    onScoreChange(newScore);
  };

  const handleCrash = () => {
    sound.play('gameover');
    onGameOver(score); // Triggers the Game Over modal
  };

  return (
    <div className="flex flex-col items-center">
      {/* Render Canvas API or reactive DOM elements here */}
    </div>
  );
};
```

#### Prop Contract Details:
| Prop | Type | Description |
|---|---|---|
| `isPaused` | `boolean` | When true, freeze game loop / stop animations. |
| `soundMuted` | `boolean` | Indicates if audio is currently muted by user. |
| `onScoreChange` | `(score: number) => void` | Call whenever player gains points to update HUD. |
| `onGameOver` | `(finalScore: number) => void` | Call when game ends to save high scores & display modal. |
| `onRestartReady`| `(restartFn: () => void) => void` | Pass your reset function so header/modal restart buttons work. |

### Step 3: Register in `src/App.tsx`

Import your component and add it to `GAME_COMPONENTS`:

```typescript
import { FlappyGame } from './games/Flappy';

const GAME_COMPONENTS: Record<string, React.ComponentType<GameComponentProps>> = {
  tictactoe: TicTacToeGame,
  snake: SnakeGame,
  memory: MemoryMatchGame,
  '2048': Game2048,
  whackamole: WhackAMoleGame,
  flappy: FlappyGame, // <--- Add your game ID here
};
```

Your game will now automatically appear in the Lobby with search, category filtering, high score persistence, pause overlay, audio, and theme support!
