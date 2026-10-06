import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  X,
  Medal,
  Award,
  Crown,
  Play,
  RotateCcw,
  User,
  Sparkles,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  Edit2,
  Flame,
} from 'lucide-react';
import { GAMES } from '../data/games';
import {
  LeaderboardEntry,
  getLeaderboard,
  getPlayerName,
  setPlayerName,
  clearLeaderboard,
  deleteLeaderboardEntry,
  resetLeaderboardToDefaults,
} from '../utils/storage';
import { sound } from '../utils/audio';

interface LeaderboardModalProps {
  onClose: () => void;
  onSelectGame?: (gameId: string) => void;
  initialGameId?: string;
}

type SortOption = 'score' | 'recent' | 'player';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  onSelectGame,
  initialGameId = 'all',
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [playerNameInput, setPlayerNameInput] = useState<string>(() => getPlayerName());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [onlyMyScores, setOnlyMyScores] = useState<boolean>(false);
  const [confirmClearType, setConfirmClearType] = useState<'none' | 'all' | 'game'>('none');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Reload entries when mounted or on focus
  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingName) {
          setIsEditingName(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditingName]);

  const handleSavePlayerName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerNameInput.trim().slice(0, 20) || 'Champion';
    setPlayerName(trimmed);
    setPlayerNameInput(trimmed);
    setIsEditingName(false);
    // Refresh entries so "You" badges reflect correctly
    setEntries(getLeaderboard());
    sound.play('click');
  };

  const handleClearCurrentView = () => {
    if (confirmClearType === 'game' && selectedGameId !== 'all') {
      clearLeaderboard(selectedGameId);
    } else {
      clearLeaderboard('all');
    }
    setEntries(getLeaderboard());
    setConfirmClearType('none');
    sound.play('click');
  };

  const handleResetToSeeds = () => {
    const seeded = resetLeaderboardToDefaults();
    setEntries(seeded);
    setConfirmClearType('none');
    sound.play('golden');
  };

  const handleDeleteSingle = (entryId: string) => {
    deleteLeaderboardEntry(entryId);
    setEntries(getLeaderboard());
    setDeletingId(null);
    sound.play('click');
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      sound.play('tick');
    }
  };

  // Current active player name
  const currentPlayer = useMemo(() => getPlayerName().toLowerCase(), [playerNameInput]);

  // Overall player summary statistics
  const stats = useMemo(() => {
    const myEntries = entries.filter(
      (e) => e.playerName.toLowerCase() === currentPlayer || e.badge === 'You'
    );
    const topScore = myEntries.reduce((max, e) => Math.max(max, e.score), 0);
    const gamesPlayed = new Set(myEntries.map((e) => e.gameId)).size;

    // Calculate podium finishes across all games
    let podiumCount = 0;
    GAMES.forEach((g) => {
      const gEntries = entries
        .filter((e) => e.gameId === g.id)
        .sort((a, b) => b.score - a.score);
      const top3 = gEntries.slice(0, 3);
      if (
        top3.some(
          (e) => e.playerName.toLowerCase() === currentPlayer || e.badge === 'You'
        )
      ) {
        podiumCount++;
      }
    });

    return {
      totalEntries: entries.length,
      myRecords: myEntries.length,
      myTopScore: topScore,
      gamesMastered: gamesPlayed,
      podiumCount,
    };
  }, [entries, currentPlayer]);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    let list = [...entries];

    if (selectedGameId !== 'all') {
      list = list.filter((e) => e.gameId === selectedGameId);
    }

    if (onlyMyScores) {
      list = list.filter(
        (e) => e.playerName.toLowerCase() === currentPlayer || e.badge === 'You'
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.playerName.toLowerCase().includes(q) ||
          e.gameTitle.toLowerCase().includes(q) ||
          (e.badge && e.badge.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'score') {
      list.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'recent') {
      list.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'player') {
      list.sort((a, b) => a.playerName.localeCompare(b.playerName));
    }

    return list;
  }, [entries, selectedGameId, onlyMyScores, searchQuery, sortBy, currentPlayer]);

  // Top 3 Podium for current view (only when sorted by score)
  const podiumWinners = useMemo(() => {
    if (sortBy !== 'score' || filteredEntries.length === 0) return null;
    const top1 = filteredEntries[0] || null;
    const top2 = filteredEntries[1] || null;
    const top3 = filteredEntries[2] || null;
    return { top1, top2, top3 };
  }, [filteredEntries, sortBy]);

  const formatTimestamp = (ts: number): string => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getGameCounts = (gameId: string): number => {
    if (gameId === 'all') return entries.length;
    return entries.filter((e) => e.gameId === gameId).length;
  };

  const activeGameDefinition = GAMES.find((g) => g.id === selectedGameId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Centralized Leaderboard"
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-surface-card border-2 border-border-strong shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-border-subtle bg-surface-secondary/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Trophy size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                  Centralized Leaderboard
                </h2>
                <span className="text-[11px] font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 hidden sm:inline-block">
                  LocalStorage
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{GAMES.length} Instant Mini-Games</span>
                <span aria-hidden="true">·</span>
                <span>Persistent Offline Rankings</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-500 font-medium">Live Synced</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.play('click');
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer text-xs font-semibold"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <span className="hidden sm:inline text-[11px] text-text-muted">Esc</span>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Player Profile & Stats Banner */}
        <div className="px-5 sm:px-7 py-3 bg-surface-secondary/25 border-b border-border-subtle shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Player Name Profile Editor */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                <User size={16} />
              </div>

              {isEditingName ? (
                <form onSubmit={handleSavePlayerName} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    maxLength={20}
                    placeholder="Enter player name"
                    autoFocus
                    className="px-2.5 py-1 text-xs rounded-lg bg-surface-card border-2 border-accent text-text-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover cursor-pointer"
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerNameInput(getPlayerName());
                      setIsEditingName(false);
                    }}
                    className="px-2 py-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">Player:</span>
                  <span className="text-text-primary font-bold text-sm">
                    {getPlayerName()}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-md text-text-muted hover:text-accent transition-colors cursor-pointer"
                    title="Change Player Name"
                    aria-label="Edit player name"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Zero-Pill Unboxed Stats Strip */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-text-muted">
              <div>
                <span className="font-bold text-text-primary tabular-nums">
                  {stats.totalEntries}
                </span>{' '}
                Total Runs
              </div>
              <span aria-hidden="true">·</span>
              <div>
                <span className="font-bold text-accent tabular-nums">
                  {stats.myRecords}
                </span>{' '}
                Your Runs
              </div>
              <span aria-hidden="true">·</span>
              <div>
                <span className="font-bold text-amber-500 tabular-nums">
                  {stats.podiumCount}
                </span>{' '}
                Podiums
              </div>
              <span aria-hidden="true">·</span>
              <div>
                <span className="font-bold text-emerald-500 tabular-nums">
                  {stats.gamesMastered}
                </span>{' '}
                Games Mastered
              </div>
            </div>
          </div>
        </div>

        {/* Game Tabs Selector with smooth scroll controls */}
        <div className="relative px-5 sm:px-7 py-2.5 border-b border-border-subtle bg-surface-card shrink-0 flex items-center gap-1.5">
          <button
            onClick={() => scrollTabs('left')}
            className="hidden sm:flex p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer shrink-0"
            title="Scroll left"
            aria-label="Scroll game categories left"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={tabsScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1"
          >
            {/* All Games Tab */}
            <button
              onClick={() => {
                sound.play('click');
                setSelectedGameId('all');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedGameId === 'all'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
              }`}
            >
              <span>All 11 Games</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedGameId === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-tertiary text-text-muted'
                }`}
              >
                {entries.length}
              </span>
            </button>

            {/* Individual Game Tabs */}
            {GAMES.map((game) => {
              const isSelected = selectedGameId === game.id;
              const count = getGameCounts(game.id);

              return (
                <button
                  key={game.id}
                  onClick={() => {
                    sound.play('click');
                    setSelectedGameId(game.id);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
                  }`}
                >
                  <span>{game.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-tertiary text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs('right')}
            className="hidden sm:flex p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer shrink-0"
            title="Scroll right"
            aria-label="Scroll game categories right"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Filter Controls Row: Search, Sort, and Only My Scores */}
        <div className="px-5 sm:px-7 py-2.5 border-b border-border-subtle bg-surface-secondary/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search player, game, or badge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-xl bg-surface-secondary border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-muted text-[11px] flex items-center gap-1">
                <ArrowUpDown size={12} />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  sound.play('click');
                  setSortBy(e.target.value as SortOption);
                }}
                className="px-2 py-1 text-xs rounded-lg bg-surface-secondary border border-border-subtle text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="score">Highest Score</option>
                <option value="recent">Most Recent</option>
                <option value="player">Player Name</option>
              </select>
            </div>
          </div>

          {/* Toggle: Only My Scores */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.play('click');
                setOnlyMyScores((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                onlyMyScores
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-surface-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              <User size={13} />
              <span>Only My Scores</span>
            </button>
          </div>
        </div>

        {/* Content Body: Scrollable Podium & Table */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-6">
          {/* Top 3 Championship Podium (shown when there are entries and sorted by score) */}
          {podiumWinners && podiumWinners.top1 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-secondary/30 border border-border-subtle">
              <div className="text-center mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-muted flex items-center justify-center gap-1.5">
                  <Flame size={14} className="text-amber-500" />
                  <span>
                    Championship Podium{' '}
                    {activeGameDefinition ? `· ${activeGameDefinition.title}` : '· Global All-Time'}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto items-end pt-2">
                {/* 2nd Place (Silver) */}
                {podiumWinners.top2 ? (
                  <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-surface-card border border-slate-400/30 shadow-xs relative">
                    <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-400 flex items-center justify-center mb-1.5 border border-slate-300/30">
                      <Medal size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      2nd Place
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-full">
                      {podiumWinners.top2.playerName}
                    </strong>
                    <div className="text-base sm:text-lg font-black font-mono text-text-primary mt-1">
                      {podiumWinners.top2.score.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {podiumWinners.top2.scoreLabel || 'pts'}
                    </span>
                    <span className="text-[10px] text-text-muted mt-0.5">
                      {podiumWinners.top2.gameTitle}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-border-subtle text-text-muted text-xs">
                    <span>—</span>
                  </div>
                )}

                {/* 1st Place (Gold / Crown) */}
                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 via-surface-card to-surface-card border-2 border-amber-500/50 shadow-md relative -translate-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/25 text-amber-500 flex items-center justify-center mb-1.5 border border-amber-500/40 animate-pulse">
                    <Crown size={20} />
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-500 uppercase tracking-wider">
                    Champion
                  </span>
                  <strong className="text-sm sm:text-base font-extrabold text-text-primary truncate max-w-full">
                    {podiumWinners.top1.playerName}
                  </strong>
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-500 mt-1">
                    {podiumWinners.top1.score.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-text-muted font-semibold">
                    {podiumWinners.top1.scoreLabel || 'pts'}
                  </span>
                  <span className="text-[10px] text-text-secondary mt-0.5 font-medium">
                    {podiumWinners.top1.gameTitle}
                  </span>
                </div>

                {/* 3rd Place (Bronze) */}
                {podiumWinners.top3 ? (
                  <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-surface-card border border-amber-700/30 shadow-xs relative">
                    <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-700/30">
                      <Award size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                      3rd Place
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-full">
                      {podiumWinners.top3.playerName}
                    </strong>
                    <div className="text-base sm:text-lg font-black font-mono text-text-primary mt-1">
                      {podiumWinners.top3.score.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {podiumWinners.top3.scoreLabel || 'pts'}
                    </span>
                    <span className="text-[10px] text-text-muted mt-0.5">
                      {podiumWinners.top3.gameTitle}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-border-subtle text-text-muted text-xs">
                    <span>—</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard Table / Cards */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-text-muted flex items-center justify-center mx-auto">
                <Trophy size={24} />
              </div>
              <h4 className="text-base font-bold text-text-primary">
                {searchQuery || onlyMyScores
                  ? 'No matching scores found'
                  : 'No scores recorded yet'}
              </h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {searchQuery || onlyMyScores
                  ? 'Try clearing the search query or adjusting your filters to view rankings.'
                  : `Play ${activeGameDefinition ? activeGameDefinition.title : 'any mini-game'} to set a new high score and claim your place on the leaderboard!`}
              </p>

              {activeGameDefinition && onSelectGame && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      sound.play('click');
                      onClose();
                      onSelectGame(activeGameDefinition.id);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Play {activeGameDefinition.title} Now</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-strong text-text-muted uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5 px-3 w-16">Rank</th>
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3">Game</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                    <th className="py-2.5 px-3 text-center">Badge</th>
                    <th className="py-2.5 px-3 text-right">Recorded</th>
                    <th className="py-2.5 px-3 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredEntries.map((entry, index) => {
                    const isTop1 = index === 0 && sortBy === 'score';
                    const isTop2 = index === 1 && sortBy === 'score';
                    const isTop3 = index === 2 && sortBy === 'score';
                    const isMe =
                      entry.playerName.toLowerCase() === currentPlayer ||
                      entry.badge === 'You';
                    const gameObj = GAMES.find((g) => g.id === entry.gameId);

                    return (
                      <tr
                        key={entry.id || `${entry.gameId}-${index}`}
                        className={`transition-colors hover:bg-surface-secondary/50 group ${
                          isMe ? 'bg-accent/5 font-medium' : ''
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3 px-3 tabular-nums font-bold">
                          <div className="flex items-center gap-1.5">
                            {isTop1 ? (
                              <div
                                className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center"
                                title="Champion #1"
                              >
                                <Crown size={14} />
                              </div>
                            ) : isTop2 ? (
                              <div
                                className="w-6 h-6 rounded-lg bg-slate-300/20 text-slate-400 flex items-center justify-center"
                                title="Runner-up #2"
                              >
                                <Medal size={14} />
                              </div>
                            ) : isTop3 ? (
                              <div
                                className="w-6 h-6 rounded-lg bg-amber-700/20 text-amber-600 flex items-center justify-center"
                                title="3rd Place"
                              >
                                <Award size={14} />
                              </div>
                            ) : (
                              <span className="w-6 text-center text-text-muted">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Player Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-text-primary truncate max-w-[150px]">
                              {entry.playerName}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent text-white">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Game Title & Thumbnail */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {gameObj && (
                              <div className="w-6 h-6 rounded-md overflow-hidden bg-surface-secondary shrink-0">
                                <img
                                  src={gameObj.thumbnail}
                                  alt={gameObj.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <span className="text-text-primary font-medium truncate max-w-[160px]">
                              {entry.gameTitle || gameObj?.title || entry.gameId}
                            </span>
                          </div>
                        </td>

                        {/* High Score */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm tabular-nums text-text-primary">
                          <span
                            className={
                              isTop1
                                ? 'text-amber-500 font-extrabold'
                                : isTop2
                                ? 'text-text-primary'
                                : ''
                            }
                          >
                            {entry.score.toLocaleString()}
                          </span>{' '}
                          <span className="text-[10px] font-normal text-text-muted">
                            {entry.scoreLabel || 'pts'}
                          </span>
                        </td>

                        {/* Badge / Title */}
                        <td className="py-3 px-3 text-center">
                          {entry.badge ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-secondary text-text-secondary border border-border-subtle">
                              {entry.badge}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* Recorded Timestamp */}
                        <td className="py-3 px-3 text-right text-text-muted tabular-nums">
                          {formatTimestamp(entry.timestamp)}
                        </td>

                        {/* Action Buttons: Direct Play and Delete */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onSelectGame && (
                              <button
                                onClick={() => {
                                  sound.play('click');
                                  onClose();
                                  onSelectGame(entry.gameId);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface-secondary text-text-primary hover:bg-accent hover:text-white transition-colors cursor-pointer"
                                title={`Launch ${entry.gameTitle}`}
                              >
                                <Play size={10} fill="currentColor" />
                                <span>Play</span>
                              </button>
                            )}

                            {deletingId === entry.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteSingle(entry.id)}
                                  className="p-1 text-[10px] bg-rose-600 text-white rounded font-bold cursor-pointer"
                                  title="Confirm delete"
                                >
                                  Del
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="p-1 text-[10px] text-text-muted hover:text-text-primary cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(entry.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-rose-500 transition-opacity cursor-pointer"
                                title="Delete entry"
                                aria-label="Delete entry"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Sub-Bar: Management & Persistence Info */}
        <div className="px-5 sm:px-7 py-3 border-t border-border-subtle bg-surface-secondary/35 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-emerald-500 shrink-0" />
            <span>Scores stored in browser localStorage. Synced across all games.</span>
          </div>

          <div className="flex items-center gap-3">
            {confirmClearType !== 'none' ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-500 font-medium">
                  {confirmClearType === 'game' ? 'Clear this game?' : 'Clear all scores?'}
                </span>
                <button
                  onClick={handleClearCurrentView}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setConfirmClearType('none')}
                  className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetToSeeds}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors cursor-pointer"
                  title="Reset to default demo champions"
                >
                  <RotateCcw size={12} />
                  <span>Restore Demo Roster</span>
                </button>

                <button
                  onClick={() =>
                    setConfirmClearType(selectedGameId === 'all' ? 'all' : 'game')
                  }
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                  title="Clear scores"
                >
                  <Trash2 size={12} />
                  <span>
                    {selectedGameId === 'all' ? 'Clear All' : 'Clear This Game'}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                sound.play('click');
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors cursor-pointer border border-border-subtle"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
