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

export function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  // Default to dark for arcade / gaming vibe, or check media query
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
