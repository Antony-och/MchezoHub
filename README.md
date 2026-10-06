# 🎮 MchezoHub

### Cheza. Enjoy. Repeat.

**MchezoHub** is a modern browser-based game hub that brings a collection of classic and arcade-style mini-games together in one fast, interactive experience.

Play instantly in your browser — **no downloads, accounts, or external backend required.**

---

## ✨ Features

- 🎮 **11 playable mini-games**
- 🤖 AI opponents with multiple difficulty levels
- 👥 Local 2-player pass-and-play modes
- 📱 Touch and mobile-friendly controls
- ⌨️ Keyboard controls for supported games
- 🏆 Persistent high scores and play statistics
- 🔊 Browser-based game sound effects
- 🌙 Light and dark themes
- ⏸️ Shared pause and restart controls
- 🎉 Game-over celebrations and confetti
- 💾 LocalStorage-based game persistence
- ⚡ Fast, responsive single-page experience

---

# 🕹️ Games

## 1. Tic-Tac-Toe

**Location:** `src/games/TicTacToe`

A classic 3×3 tactical battle with multiple ways to play.

**Features:**
- 🤖 Easy, Medium, and Unbeatable AI
- 🧠 Unbeatable Minimax strategy
- 👥 Local 2-player mode
- ✨ Dynamic winning-line highlights
- 🔥 Streak multiplier scoring
- 📊 Round scoreboard

---

## 2. Snake Arena

**Location:** `src/games/Snake`

A fast-paced Snake game built with the HTML5 Canvas API.

**Features:**
- 🍎 Standard apples worth +10 points
- ⭐ Golden Starfruits worth +50 points
- 🧱 Solid-wall mode
- 🌀 Wrap-around portal mode
- ⚡ Multiple speed levels
- 📱 Touch-friendly virtual D-pad
- 🎨 Canvas-based rendering

---

## 3. Memory Match

**Location:** `src/games/MemoryMatch`

A visual memory challenge built around animated card matching.

**Features:**
- 🃏 3D CSS card-flip animations
- 🎨 Arcade, Nature, and Tech themes
- 🔢 12, 16, and 20-card boards
- 🔥 Combo multiplier chains
- 📱 Touch-friendly gameplay

---

## 4. 2048

**Location:** `src/games/Game2048`

The classic number-merging puzzle with smooth interactions.

**Features:**
- 🔢 Power-of-two tile merging
- ⌨️ Arrow key and WASD controls
- 👆 Touch swipe gestures
- ↩️ Single-step move undo
- ♾️ Endless mode after reaching 2048
- ✨ Smooth merge animations

---

## 5. Whack-a-Mole

**Location:** `src/games/WhackAMole`

A fast 30-second arcade reflex challenge.

**Features:**
- ⏱️ 30-second rounds
- 🔨 Custom mallet cursor
- 🟤 Brown Moles — +10 points
- 👑 King Moles — +30 points
- 🌵 Cactus traps — -15 points
- 🔥 Combo system
- 💥 Floating score animations

---

## 6. Connect Four

**Location:** `src/games/ConnectFour`

A classic vertical strategy game played on a 7×6 board.

**Features:**
- 🤖 Easy, Medium, and Hard AI
- 👥 Local 2-player mode
- 🔴 Red vs. Yellow gameplay
- 🎯 Horizontal, vertical, and diagonal detection
- ✨ Winning-disc highlights
- ⌨️ Keyboard shortcuts using keys `1–7`
- 🖱️ Mouse and touch controls
- 🎞️ Column drop indicators

---

## 7. Chess

**Location:** `src/games/Chess`

A browser-based chess experience with AI and local multiplayer.

**Features:**
- ♟️ Full 8×8 chessboard
- 📍 Rank and file coordinates
- 🧠 Legal move calculation
- 👑 Pawn promotion to Queen
- 🤖 Easy, Medium, and Hard AI
- 👥 Local 2-player mode
- ⚔️ Check and checkmate detection
- 📦 Captured-piece trays
- 🚨 Check indicators

---

## 8. Checkers

**Location:** `src/games/Checkers`

A traditional 8×8 checkers game with AI and local multiplayer.

**Features:**
- 🔴 Red vs. Black pieces
- ↗️ Diagonal movement
- ⛓️ Multi-jump captures
- 👑 King promotion
- ↔️ Kings move forward and backward
- 🤖 AI opponent
- 👥 Local 2-player mode

---

## 9. Hangman

**Location:** `src/games/Hangman`

A classic word-guessing game with themed categories and streak bonuses.

**Categories:**
- 🐾 Animals
- 🌍 Countries
- 💻 Technology
- 🔬 Science

**Features:**
- 💡 Hint system
- 🔥 Streak bonuses
- 🪢 Dynamic SVG gallows
- ❌ Six allowed mistakes
- ⌨️ Keyboard support
- 🔤 Interactive letter buttons

---

## 10. Solitaire

**Location:** `src/games/Solitaire`

A complete browser implementation of classic Klondike Solitaire.

**Features:**
- 🃏 Full 52-card deck
- 📚 Seven tableau columns
- ♠️ Four suit foundations
- 🂠 Stock and waste piles
- 🖱️ Double-click to send cards to foundations
- ↩️ Undo moves
- 📊 Move and score tracking

---

## 11. Rock Paper Scissors

**Location:** `src/games/RockPaperScissors`

A fast-paced Rock Paper Scissors game against an adaptive AI.

**Features:**
- 🤖 Adaptive AI
- 🧠 Tracks player tendencies
- ⏱️ Animated 3-2-1 countdown
- 🔥 Streak multipliers
- ⌨️ Keyboard shortcuts:
  - `1` — Rock
  - `2` — Paper
  - `3` — Scissors

---

# 🧩 Shared Game Systems

MchezoHub uses shared systems to provide a consistent experience across every game.

### 🔊 Audio System

**Location:** `src/utils/audio.ts`

A zero-dependency browser audio engine built with the **Web Audio API**.

It generates sounds for:

- Player actions
- Eating collectibles
- Golden bonuses
- Successful matches
- Whacks
- Victories
- Game overs

A global mute state is shared across the application.

---

### 💾 Persistent Storage

**Location:** `src/utils/storage.ts`

Uses browser **LocalStorage** to persist game information between sessions.

Tracks:

- 🏆 All-time high scores
- 🎮 Total plays
- 🕐 Recently played games
- 📊 Game statistics

No external database is required.

---

### 🎮 Shared Game Shell

**Location:** `src/components/GameShell.tsx`

Provides a consistent interface around every game.

Includes:

- Game header
- Live score
- High score
- Pause functionality
- Audio controls
- Light/dark theme switch
- Game rules
- Restart controls

---

### 🎉 Game Over & Victory System

**Locations:**

- `src/components/GameOverModal.tsx`
- `src/components/Confetti.tsx`

Provides a consistent end-of-game experience with:

- 🏆 High-score detection
- 🎉 Confetti celebrations
- 📊 Score comparisons
- 🔄 Instant replay
- ⌨️ `Enter` key replay support

---

### 🎨 Theme System

**Location:** `src/index.css`

MchezoHub uses CSS variables to provide consistent theming throughout the application.

Examples include:

```css
--bg-canvas
--surface-card
--accent
```

The interface supports both:

- ☀️ Light mode
- 🌙 Dark mode

---

# 🏗️ Project Structure

```text
src/
├── assets/
├── components/
│   ├── GameOverModal.tsx
│   ├── GameShell.tsx
│   └── Confetti.tsx
│
├── data/
│   └── games.ts
│
├── games/
│   ├── TicTacToe/
│   ├── Snake/
│   ├── MemoryMatch/
│   ├── Game2048/
│   ├── WhackAMole/
│   ├── ConnectFour/
│   ├── Chess/
│   ├── Checkers/
│   ├── Hangman/
│   ├── Solitaire/
│   └── RockPaperScissors/
│
├── utils/
│   ├── audio.ts
│   └── storage.ts
│
├── types/
│   └── game.ts
│
├── App.tsx
└── index.css
```

---

# 🚀 Adding a New Game

MchezoHub uses a modular game architecture, making it easy to add new games without changing the existing game systems.

Adding a game requires **three main steps**.

---

## Step 1 — Register the Game

Open:

```text
src/data/games.ts
```

Add a new `GameDefinition` to the `GAMES` array:

```typescript
import { GameDefinition } from '../types/game';

export const GAMES: GameDefinition[] = [
  // Existing games...

  {
    id: 'flappy',
    title: 'Flappy Bird',
    tagline: 'Flap through pipes in a classic obstacle flight',
    description:
      'Tap or press Space to flap upward and navigate through challenging obstacles.',
    category: 'Arcade',
    thumbnail: '/src/assets/images/thumb_flappy.jpg',
    accentColor: '#10b981',
    scoreLabel: 'Pipes',
    controls: [
      {
        key: 'Space / Click',
        action: 'Flap wings upward',
      },
    ],
    rules: [
      'Tap to flap upward; gravity pulls you downward.',
      'Each obstacle safely cleared grants +1 point.',
      'Colliding with an obstacle or the ground ends the round.',
    ],
  },
];
```

---

## Step 2 — Create the Game Component

Create:

```text
src/games/Flappy/index.tsx
```

The component should implement `GameComponentProps`:

```typescript
import React, { useEffect, useState } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';

export const FlappyGame: React.FC<GameComponentProps> = ({
  isPaused,
  soundMuted,
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
    onGameOver(score);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Game implementation */}
    </div>
  );
};
```

### Game Component Contract

Every game receives the following props:

| Prop | Type | Purpose |
|---|---|---|
| `isPaused` | `boolean` | Pause game loops and animations when true. |
| `soundMuted` | `boolean` | Indicates whether game audio is muted. |
| `onScoreChange` | `(score: number) => void` | Updates the shared score display. |
| `onGameOver` | `(finalScore: number) => void` | Ends the game and triggers score processing. |
| `onRestartReady` | `(restartFn: () => void) => void` | Registers the game's reset function with the shared shell. |

---

## Step 3 — Register the Component

Open:

```text
src/App.tsx
```

Import the game:

```typescript
import { FlappyGame } from './games/Flappy';
```

Then add it to `GAME_COMPONENTS`:

```typescript
const GAME_COMPONENTS: Record<
  string,
  React.ComponentType<GameComponentProps>
> = {
  tictactoe: TicTacToeGame,
  snake: SnakeGame,
  memory: MemoryMatchGame,
  '2048': Game2048,
  whackamole: WhackAMoleGame,
  flappy: FlappyGame,
};
```

That's it.

The new game can now use the existing MchezoHub infrastructure, including:

- 🔎 Lobby search
- 🗂️ Category filtering
- 🏆 High-score persistence
- ⏸️ Pause controls
- 🔊 Audio controls
- 🌙 Theme support
- 🎉 Game-over celebrations
- 🔄 Restart functionality

---

# ⚡ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd mchezo-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local development URL shown in your terminal.

---

# 🛠️ Build for Production

Create a production build with:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 🔒 Architecture

MchezoHub is intentionally designed as a **client-side application**.

There is:

- ❌ No external backend
- ❌ No database
- ❌ No authentication system
- ❌ No server-side game state

Game progress and statistics are stored locally in the user's browser using **LocalStorage**.

This keeps the application lightweight, fast, and easy to deploy as a static web application.

---

# 📱 Browser & Input Support

MchezoHub is designed for both desktop and mobile browsers.

Depending on the game, players can use:

- ⌨️ Keyboard controls
- 🖱️ Mouse controls
- 👆 Touch gestures
- 📱 Virtual touch controls

Games automatically integrate with the shared UI where applicable.

---

# 🎯 Project Goals

MchezoHub is built around a simple idea:

> **Make classic games instantly accessible, fun, and easy to play.**

The project focuses on:

- Fast gameplay
- Simple controls
- Responsive design
- Reusable game architecture
- Consistent UI/UX
- No unnecessary backend complexity

---

## 📄 License

Add your preferred license here.

---

## 🎮 MchezoHub

**Cheza. Enjoy. Repeat.**
