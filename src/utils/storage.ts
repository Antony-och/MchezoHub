/**
 * LocalStorage utilities for GameHub
 * Handles persistent high scores, recently played tracking, and game statistics.
 */

export interface GameStats {
  plays: number;
  lastPlayed: number;
  highScore: number;
}

const HIGH_SCORES_KEY = 'gamehub_high_scores_v1';
const RECENT_GAMES_KEY = 'gamehub_recent_games_v1';
const STATS_KEY = 'gamehub_game_stats_v1';
const THEME_KEY = 'gamehub_theme_v1';

export function getHighScores(): Record<string, number> {
  try {
    const raw = localStorage.getItem(HIGH_SCORES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getHighScore(gameId: string): number {
  const scores = getHighScores();
  return scores[gameId] || 0;
}

/**
 * Saves a score. Returns true if it's a new high score.
 */
export function saveScore(gameId: string, score: number): boolean {
  try {
    const scores = getHighScores();
    const currentHigh = scores[gameId] || 0;
    const isNewHigh = score > currentHigh;

    if (isNewHigh) {
      scores[gameId] = score;
      localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
    }

    // Update stats as well
    recordPlay(gameId, score, isNewHigh ? score : currentHigh);

    return isNewHigh;
  } catch {
    return false;
  }
}

export function getRecentGames(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_GAMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentGame(gameId: string): void {
  try {
    const list = getRecentGames().filter((id) => id !== gameId);
    list.unshift(gameId);
    // Keep top 6
    const trimmed = list.slice(0, 6);
    localStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function getAllStats(): Record<string, GameStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordPlay(gameId: string, score: number, currentHigh: number): void {
  try {
    const all = getAllStats();
    const prev = all[gameId] || { plays: 0, lastPlayed: 0, highScore: 0 };
    all[gameId] = {
      plays: prev.plays + 1,
      lastPlayed: Date.now(),
      highScore: Math.max(prev.highScore, currentHigh, score),
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(all));
  } catch {}
}

export type ThemeMode = 'dark' | 'light';

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  gameTitle: string;
  playerName: string;
  score: number;
  scoreLabel: string;
  timestamp: number;
  badge?: string;
}

const LEADERBOARD_KEY = 'mchezohub_leaderboard_v2';
const PLAYER_NAME_KEY = 'mchezohub_player_name_v2';

export const INITIAL_LEADERBOARD_SEEDS: LeaderboardEntry[] = [
  {
    id: 'seed-snake-1',
    gameId: 'snake',
    gameTitle: 'Snake Arena',
    playerName: 'ViperKing',
    score: 840,
    scoreLabel: 'Points',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    badge: 'Master',
  },
  {
    id: 'seed-snake-2',
    gameId: 'snake',
    gameTitle: 'Snake Arena',
    playerName: 'Cobras',
    score: 620,
    scoreLabel: 'Points',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    badge: 'Veteran',
  },
  {
    id: 'seed-2048-1',
    gameId: '2048',
    gameTitle: '2048',
    playerName: 'TileMaster',
    score: 24890,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
    badge: 'Grandmaster',
  },
  {
    id: 'seed-2048-2',
    gameId: '2048',
    gameTitle: '2048',
    playerName: 'GridGenius',
    score: 16420,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    badge: 'Ace',
  },
  {
    id: 'seed-chess-1',
    gameId: 'chess',
    gameTitle: 'Chess',
    playerName: 'KasparovFan',
    score: 1850,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 20,
    badge: 'Grandmaster',
  },
  {
    id: 'seed-checkers-1',
    gameId: 'checkers',
    gameTitle: 'Checkers',
    playerName: 'CrownHunter',
    score: 1200,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 15,
    badge: 'Kingmaker',
  },
  {
    id: 'seed-solitaire-1',
    gameId: 'solitaire',
    gameTitle: 'Solitaire',
    playerName: 'AceOfSpades',
    score: 720,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 10,
    badge: 'Klondike Pro',
  },
  {
    id: 'seed-hangman-1',
    gameId: 'hangman',
    gameTitle: 'Hangman',
    playerName: 'LexiconSage',
    score: 1450,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 8,
    badge: 'Wordsmith',
  },
  {
    id: 'seed-whack-1',
    gameId: 'whackamole',
    gameTitle: 'Whack-a-Mole',
    playerName: 'ReflexGod',
    score: 410,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    badge: 'Speedster',
  },
  {
    id: 'seed-connect-1',
    gameId: 'connectfour',
    gameTitle: 'Connect Four',
    playerName: 'QuadMaster',
    score: 8,
    scoreLabel: 'Wins',
    timestamp: Date.now() - 1000 * 60 * 60 * 30,
    badge: 'Strategist',
  },
  {
    id: 'seed-rps-1',
    gameId: 'rps',
    gameTitle: 'Rock Paper Scissors',
    playerName: 'MindReader',
    score: 14,
    scoreLabel: 'Streak',
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
    badge: 'Oracle',
  },
  {
    id: 'seed-ttt-1',
    gameId: 'tictactoe',
    gameTitle: 'Tic-Tac-Toe',
    playerName: 'GridAce',
    score: 12,
    scoreLabel: 'Wins',
    timestamp: Date.now() - 1000 * 60 * 60 * 25,
    badge: 'Undefeated',
  },
  {
    id: 'seed-memory-1',
    gameId: 'memory',
    gameTitle: 'Memory Match',
    playerName: 'MindVault',
    score: 1840,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    badge: 'Synapse King',
  },
  {
    id: 'seed-memory-2',
    gameId: 'memory',
    gameTitle: 'Memory Match',
    playerName: 'EchoCard',
    score: 1420,
    scoreLabel: 'Score',
    timestamp: Date.now() - 1000 * 60 * 60 * 42,
    badge: 'Sharp Eye',
  },
];

export function getPlayerName(): string {
  try {
    const saved = localStorage.getItem(PLAYER_NAME_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
  } catch {}
  return 'Champion';
}

export function setPlayerName(name: string): void {
  try {
    const clean = name.trim().slice(0, 20) || 'Champion';
    localStorage.setItem(PLAYER_NAME_KEY, clean);
  } catch {}
}

export function getAllLeaderboardEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Initialize with seed data and any existing local high scores
  try {
    const initial = [...INITIAL_LEADERBOARD_SEEDS];
    const highScores = getHighScores();
    const playerName = getPlayerName();

    Object.entries(highScores).forEach(([gameId, score]) => {
      if (score > 0) {
        initial.push({
          id: `player-${gameId}-${Date.now()}`,
          gameId,
          gameTitle: gameId.toUpperCase(),
          playerName,
          score,
          scoreLabel: 'Score',
          timestamp: Date.now(),
          badge: 'You',
        });
      }
    });

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return INITIAL_LEADERBOARD_SEEDS;
  }
}

export function getLeaderboard(gameId?: string): LeaderboardEntry[] {
  const all = getAllLeaderboardEntries();
  if (!gameId || gameId === 'all') {
    // Return all sorted by highest score or recency
    return all.sort((a, b) => b.score - a.score);
  }
  return all
    .filter((entry) => entry.gameId === gameId)
    .sort((a, b) => b.score - a.score);
}

export function recordLeaderboardEntry(
  gameId: string,
  gameTitle: string,
  score: number,
  scoreLabel: string = 'Score',
  customPlayerName?: string
): LeaderboardEntry {
  const all = getAllLeaderboardEntries();
  const playerName = customPlayerName || getPlayerName();

  const newEntry: LeaderboardEntry = {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    gameId,
    gameTitle,
    playerName,
    score,
    scoreLabel,
    timestamp: Date.now(),
    badge: 'You',
  };

  all.push(newEntry);

  // Keep top 50 per game to avoid storage bloat
  const grouped: Record<string, LeaderboardEntry[]> = {};
  all.forEach((e) => {
    if (!grouped[e.gameId]) grouped[e.gameId] = [];
    grouped[e.gameId].push(e);
  });

  const pruned: LeaderboardEntry[] = [];
  Object.values(grouped).forEach((list) => {
    list.sort((a, b) => b.score - a.score);
    pruned.push(...list.slice(0, 30));
  });

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(pruned));
  } catch {}

  return newEntry;
}

export function deleteLeaderboardEntry(entryId: string): void {
  try {
    const all = getAllLeaderboardEntries().filter((e) => e.id !== entryId);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(all));
  } catch {}
}

export function resetLeaderboardToDefaults(): LeaderboardEntry[] {
  try {
    const initial = [...INITIAL_LEADERBOARD_SEEDS];
    const highScores = getHighScores();
    const playerName = getPlayerName();

    Object.entries(highScores).forEach(([gameId, score]) => {
      if (score > 0) {
        initial.push({
          id: `player-${gameId}-${Date.now()}`,
          gameId,
          gameTitle: gameId.toUpperCase(),
          playerName,
          score,
          scoreLabel: 'Score',
          timestamp: Date.now(),
          badge: 'You',
        });
      }
    });

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return INITIAL_LEADERBOARD_SEEDS;
  }
}

export function clearLeaderboard(gameId?: string): void {
  try {
    if (!gameId || gameId === 'all') {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
    } else {
      const all = getAllLeaderboardEntries().filter((e) => e.gameId !== gameId);
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(all));
    }
  } catch {}
}

export function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return 'dark';
}

export function setSavedTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {}
}
