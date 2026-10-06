import React, { useState, useMemo } from 'react';
import { GameDefinition, GameCategory } from '../types/game';
import { sound } from '../utils/audio';
import {
  Search,
  Trophy,
  Play,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  History,
  Sparkles,
  Gamepad2,
  Code2,
  Flame,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  getHighScores,
  getRecentGames,
  getAllStats,
  ThemeMode,
  setSavedTheme,
} from '../utils/storage';

interface LobbyProps {
  games: GameDefinition[];
  onSelectGame: (gameId: string) => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenDevGuide: () => void;
  onOpenLeaderboard?: () => void;
}

const CATEGORIES: ('All' | GameCategory)[] = ['All', 'Classic', 'Arcade', 'Card', 'Word', 'Puzzle', 'Action'];

export const Lobby: React.FC<LobbyProps> = ({
  games,
  onSelectGame,
  currentTheme,
  onThemeChange,
  onOpenDevGuide,
  onOpenLeaderboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | GameCategory>('All');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  const highScores = useMemo(() => getHighScores(), []);
  const recentGameIds = useMemo(() => getRecentGames(), []);
  const allStats = useMemo(() => getAllStats(), []);

  // Compute hub stats
  const totalPlays = useMemo(() => {
    return Object.values(allStats).reduce((acc, curr) => acc + (curr.plays || 0), 0);
  }, [allStats]);

  // Find recently played game objects
  const recentGames = useMemo(() => {
    return recentGameIds
      .map((id) => games.find((g) => g.id === id))
      .filter((g): g is GameDefinition => !!g);
  }, [recentGameIds, games]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        selectedCategory === 'All' || game.category === selectedCategory;
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [games, selectedCategory, searchQuery]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const toggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    setSavedTheme(next);
    onThemeChange(next);
  };

  // Find featured or most played game
  const featuredGame = useMemo(() => {
    if (recentGames.length > 0) return recentGames[0];
    return games[1] || games[0]; // Snake Arena
  }, [recentGames, games]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-primary selection:bg-accent/20">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 w-full border-b border-border-subtle bg-canvas/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a href="#" className="flex items-center gap-2.5 group cursor-pointer select-none">
            <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-extrabold shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Gamepad2 size={18} />
            </div>
            <span className="text-xl font-black tracking-tight text-text-primary group-hover:text-accent transition-colors">
              MchezoHub
            </span>
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-text-secondary">
            <a href="#library" className="hover:text-text-primary transition-colors">
              Library
            </a>
            <a href="#featured" className="hover:text-text-primary transition-colors">
              Featured
            </a>
            {recentGames.length > 0 && (
              <a href="#recent" className="hover:text-text-primary transition-colors">
                Recent
              </a>
            )}
            {onOpenLeaderboard && (
              <button
                onClick={() => {
                  sound.play('click');
                  onOpenLeaderboard();
                }}
                className="hover:text-text-primary transition-colors cursor-pointer"
              >
                Leaderboard
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            {onOpenLeaderboard && (
              <button
                onClick={() => {
                  sound.play('click');
                  onOpenLeaderboard();
                }}
                className="p-2 rounded-xl text-amber-500 hover:text-amber-400 hover:bg-surface-secondary transition-colors cursor-pointer"
                title="Centralized Leaderboard"
                aria-label="View Leaderboard"
              >
                <Trophy size={18} />
              </button>
            )}

            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label="Toggle sound"
            >
              {isMuted ? <VolumeX size={18} className="text-rose-500" /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle light/dark theme"
            >
              {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => {
                sound.play('click');
                onSelectGame(featuredGame.id);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-accent rounded-xl hover:bg-accent-hover active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>Quick Play</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Hero Spotlight Section */}
        <section id="featured" className="relative rounded-3xl overflow-hidden bg-surface-card border border-border-subtle p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="font-bold text-accent uppercase tracking-wider text-[11px]">MchezoHub</span>
                <span aria-hidden="true">·</span>
                <span>Cheza. Enjoy. Repeat.</span>
                <span aria-hidden="true">·</span>
                <span>Instant Offline Arcade</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary text-balance">
                Cheza. Enjoy. Repeat.
              </h2>

              <p className="text-sm sm:text-base text-text-secondary max-w-xl leading-relaxed">
                Welcome to MchezoHub — your browser arcade featuring {games.length} instant mini-games: Tic-Tac-Toe, Snake, Memory Match, 2048, Whack-a-Mole, Connect Four, Chess, Checkers, Hangman, Solitaire, and Rock Paper Scissors. Zero loading screens, responsive touch & keyboard controls, and local high score tracking.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    sound.play('click');
                    onSelectGame(featuredGame.id);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Play {featuredGame.title}</span>
                </button>

                {onOpenLeaderboard && (
                  <button
                    onClick={() => {
                      sound.play('click');
                      onOpenLeaderboard();
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <Trophy size={15} />
                    <span>Leaderboard</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.play('click');
                    onOpenDevGuide();
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-tertiary font-medium text-xs border border-border-subtle transition-colors cursor-pointer"
                >
                  <Code2 size={15} />
                  <span>Developer Guide</span>
                </button>
              </div>

              {/* Hub Quick Stats */}
              <div className="pt-4 flex items-center gap-6 text-xs text-text-muted">
                <div>
                  <span className="font-bold text-text-primary tabular-nums text-sm">
                    {totalPlays}
                  </span>{' '}
                  Plays Recorded
                </div>
                <span aria-hidden="true">·</span>
                <div>
                  <span className="font-bold text-text-primary tabular-nums text-sm">
                    {games.length}
                  </span>{' '}
                  Mini-Games Ready
                </div>
                <span aria-hidden="true">·</span>
                <div>
                  <span className="font-bold text-emerald-500 tabular-nums text-sm">100%</span>{' '}
                  Offline LocalStorage
                </div>
              </div>
            </div>

            {/* Featured Visual Hero Card */}
            <div className="lg:col-span-5 relative group">
              <div
                onClick={() => {
                  sound.play('click');
                  onSelectGame(featuredGame.id);
                }}
                className="relative rounded-2xl overflow-hidden border border-border-subtle bg-surface-secondary shadow-md cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900 relative">
                  <img
                    src={featuredGame.thumbnail}
                    alt={featuredGame.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback styled visual
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5">
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
                      Featured Pick
                    </span>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {featuredGame.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {featuredGame.tagline}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recently Played Section (if user played any) */}
        {recentGames.length > 0 && (
          <section id="recent" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={18} className="text-accent" />
                <h2 className="text-lg font-bold text-text-primary">Recently Played</h2>
              </div>
              <span className="text-xs text-text-muted">
                {recentGames.length} in history
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGames.map((game) => {
                const best = highScores[game.id] || 0;
                const stats = allStats[game.id];
                return (
                  <div
                    key={`recent-${game.id}`}
                    onClick={() => {
                      sound.play('click');
                      onSelectGame(game.id);
                    }}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-card border border-border-subtle hover:border-accent hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-secondary shrink-0 relative">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-muted flex items-center gap-1.5 mb-0.5">
                        <span>Instant Play</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-500 font-semibold tabular-nums">
                          Best: {best}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-accent transition-colors">
                        {game.title}
                      </h4>
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {stats ? `${stats.plays} plays` : 'Ready to resume'}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-surface-secondary group-hover:bg-accent group-hover:text-white text-text-secondary flex items-center justify-center transition-colors shrink-0">
                      <Play size={13} fill="currentColor" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Game Library Filter & Grid */}
        <section id="library" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Game Library</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Select any mini-game to launch instantly. No downloads or installations required.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Segmented Control */}
              <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-xl border border-border-subtle">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.play('click');
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-surface-card text-text-primary shadow-xs border border-border-subtle'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[200px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-card border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Game Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => {
              const bestScore = highScores[game.id] || 0;
              const stats = allStats[game.id];

              return (
                <div
                  key={game.id}
                  className="flex flex-col rounded-2xl bg-surface-card border border-border-subtle overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Thumbnail Banner */}
                  <div
                    onClick={() => {
                      sound.play('click');
                      onSelectGame(game.id);
                    }}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900 cursor-pointer"
                  >
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient scrim for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* High Score Badge */}
                    <div
                      onClick={(e) => {
                        if (onOpenLeaderboard) {
                          e.stopPropagation();
                          sound.play('click');
                          onOpenLeaderboard();
                        }
                      }}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-md text-[11px] font-semibold text-amber-400 flex items-center gap-1 tabular-nums transition-colors cursor-pointer"
                      title="View Centralized Leaderboard"
                    >
                      <Trophy size={11} />
                      <span>Best: {bestScore}</span>
                    </div>

                    {/* Title overlay inside banner */}
                    <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                      <h3 className="text-lg font-bold drop-shadow-sm">{game.title}</h3>
                      <p className="text-xs text-slate-200 line-clamp-1 opacity-90 drop-shadow-sm">
                        {game.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Unboxed Metadata (Rule: No pill enclosures for static metadata) */}
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                        <span>{game.scoreLabel} Tracked</span>
                        <span aria-hidden="true">·</span>
                        <span>{stats ? `${stats.plays} plays` : '0 plays'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{game.controls.length} Inputs</span>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                        {game.description}
                      </p>
                    </div>

                    {/* Bottom action zone */}
                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-3">
                      <div className="text-[11px] text-text-muted">
                        {game.controls[0]?.key}
                      </div>

                      <button
                        onClick={() => {
                          sound.play('click');
                          onSelectGame(game.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Play Game</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-16 bg-surface-card rounded-2xl border border-border-subtle p-8">
              <p className="text-sm font-semibold text-text-primary mb-1">No mini-games match your search</p>
              <p className="text-xs text-text-muted mb-4">
                Try searching for another keyword or switch category filter to "All".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Redesigned Rich Arcade Footer */}
      <footer className="border-t border-border-strong bg-surface-secondary/40 px-4 sm:px-8 pt-12 pb-8 mt-16 text-xs text-text-muted">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Column 1: Brand & Slogan */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-extrabold shadow-sm">
                  <Gamepad2 size={18} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black tracking-tight text-text-primary">
                    MchezoHub
                  </span>
                  <span className="text-[11px] font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                    Cheza. Enjoy. Repeat.
                  </span>
                </div>
              </div>

              <p className="text-text-secondary leading-relaxed max-w-lg text-xs">
                Your instant browser gaming arcade. 11 offline-first mini-games built with responsive Canvas rendering, Web Audio synthesis, and zero loading times.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-text-muted">
                <span>11 Mini-Games</span>
                <span aria-hidden="true">·</span>
                <span>Zero Install</span>
                <span aria-hidden="true">·</span>
                {onOpenLeaderboard ? (
                  <button
                    onClick={() => {
                      sound.play('click');
                      onOpenLeaderboard();
                    }}
                    className="hover:text-text-primary transition-colors cursor-pointer text-accent font-semibold"
                  >
                    Centralized Leaderboards
                  </button>
                ) : (
                  <span>Local High Scores</span>
                )}
                <span aria-hidden="true">·</span>
                <span>Canvas 2D</span>
              </div>
            </div>

            {/* Column 2: Prominent Developer Corner & Add New Game Action */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-surface-card border-2 border-border-strong shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                  <Code2 size={14} />
                </div>
                <h4 className="text-xs font-extrabold text-text-primary">
                  Developer Corner
                </h4>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed">
                MchezoHub is architected with a modular plug-and-play pattern. Add your own custom mini-game in under 5 minutes.
              </p>

              <button
                onClick={() => {
                  sound.play('click');
                  onOpenDevGuide();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                <Code2 size={15} />
                <span>Add New Game</span>
              </button>
            </div>
          </div>

          {/* Bottom Copyright Sub-Bar */}
          <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-muted">
            <p>
              © {new Date().getFullYear()} MchezoHub. Cheza. Enjoy. Repeat. All scores and settings saved locally.
            </p>
            <div className="flex items-center gap-3">
              <span>Pure Web Tech</span>
              <span>·</span>
              <span>HTML5 Canvas & Web Audio</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
