import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { RotateCcw, Award, Flame, Bot, User, HelpCircle, Trophy, Swords, Zap } from 'lucide-react';

type ChoiceClassic = 'rock' | 'paper' | 'scissors';
type ChoiceExtended = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';
type Choice = ChoiceExtended;

type Outcome = 'win' | 'lose' | 'tie';
type GameMode = 'classic' | 'rpsls';
type MatchType = 'streak' | 'firstTo5';
type BotPersonality = 'random' | 'smart' | 'psychic';

interface ChoiceInfo {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  beats: Record<Choice, string>; // what it beats and the action verb
}

const CHOICES: Record<Choice, ChoiceInfo> = {
  rock: {
    label: 'Rock',
    emoji: '🪨',
    color: '#ef4444',
    bg: 'bg-rose-500/10 border-rose-500/30',
    beats: {
      scissors: 'crushes Scissors',
      lizard: 'crushes Lizard',
      rock: '',
      paper: '',
      spock: '',
    },
  },
  paper: {
    label: 'Paper',
    emoji: '📄',
    color: '#3b82f6',
    bg: 'bg-blue-500/10 border-blue-500/30',
    beats: {
      rock: 'covers Rock',
      spock: 'disproves Spock',
      scissors: '',
      paper: '',
      lizard: '',
    },
  },
  scissors: {
    label: 'Scissors',
    emoji: '✂️',
    color: '#10b981',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    beats: {
      paper: 'cuts Paper',
      lizard: 'decapitates Lizard',
      scissors: '',
      rock: '',
      spock: '',
    },
  },
  lizard: {
    label: 'Lizard',
    emoji: '🦎',
    color: '#84cc16',
    bg: 'bg-lime-500/10 border-lime-500/30',
    beats: {
      spock: 'poisons Spock',
      paper: 'eats Paper',
      lizard: '',
      rock: '',
      scissors: '',
    },
  },
  spock: {
    label: 'Spock',
    emoji: '🖖',
    color: '#a855f7',
    bg: 'bg-purple-500/10 border-purple-500/30',
    beats: {
      scissors: 'smashes Scissors',
      rock: 'vaporizes Rock',
      spock: '',
      paper: '',
      lizard: '',
    },
  },
};

const BOTS: Record<BotPersonality, { name: string; desc: string; icon: string }> = {
  random: { name: 'Random Ron', desc: 'Unpredictable and wild', icon: '🎲' },
  smart: { name: 'Predictor Pete', desc: 'Counters your favorite move', icon: '🧠' },
  psychic: { name: 'Psychic Sally', desc: 'Analyzes win-stay / lose-shift psychology', icon: '🔮' },
};

export const RockPaperScissorsGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [mode, setMode] = useState<GameMode>('classic');
  const [matchType, setMatchType] = useState<MatchType>('streak');
  const [botType, setBotType] = useState<BotPersonality>('smart');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [botChoice, setBotChoice] = useState<Choice | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [outcomePhrase, setOutcomePhrase] = useState<string>('');
  const [isClashing, setIsClashing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [stats, setStats] = useState({ wins: 0, losses: 0, ties: 0 });
  const [matchWinner, setMatchWinner] = useState<'player' | 'bot' | null>(null);

  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const playerHistoryRef = useRef<{ player: Choice; bot: Choice; outcome: Outcome }[]>([]);

  const resetGame = useCallback(() => {
    setPlayerChoice(null);
    setBotChoice(null);
    setOutcome(null);
    setOutcomePhrase('');
    setIsClashing(false);
    setCountdown(null);
    setScore(0);
    setStreak(0);
    setStats({ wins: 0, losses: 0, ties: 0 });
    setMatchWinner(null);
    playerHistoryRef.current = [];
    onScoreChangeRef.current(0);
  }, []);

  useEffect(() => {
    onRestartReady(resetGame);
  }, [onRestartReady, resetGame]);

  const activeChoices: Choice[] =
    mode === 'classic'
      ? ['rock', 'paper', 'scissors']
      : ['rock', 'paper', 'scissors', 'lizard', 'spock'];

  // AI Throw Selector
  const getBotPick = (): Choice => {
    const list = activeChoices;

    if (botType === 'random' || playerHistoryRef.current.length < 2) {
      return list[Math.floor(Math.random() * list.length)];
    }

    if (botType === 'smart') {
      // Frequency counter: pick what defeats player's most frequent choice
      const counts: Record<string, number> = {};
      list.forEach((c) => (counts[c] = 0));
      playerHistoryRef.current.slice(-5).forEach((item) => {
        if (counts[item.player] !== undefined) counts[item.player]++;
      });

      let favored: Choice = list[0];
      let maxCount = -1;
      list.forEach((c) => {
        if (counts[c] > maxCount) {
          maxCount = counts[c];
          favored = c;
        }
      });

      // Find move that beats favored
      const counters = list.filter((c) => CHOICES[c].beats[favored]);
      return counters.length > 0
        ? counters[Math.floor(Math.random() * counters.length)]
        : list[Math.floor(Math.random() * list.length)];
    }

    // Psychic Sally: Win-Stay, Lose-Shift theory
    const last = playerHistoryRef.current[playerHistoryRef.current.length - 1];
    if (last.outcome === 'win') {
      // Player tends to repeat winning move: counter it!
      const counters = list.filter((c) => CHOICES[c].beats[last.player]);
      return counters[Math.floor(Math.random() * counters.length)];
    } else {
      // Player shifts: anticipate counter to bot's last move
      return list[Math.floor(Math.random() * list.length)];
    }
  };

  const handlePlayerThrow = useCallback(
    (choice: Choice) => {
      if (isPaused || isClashing || matchWinner) return;

      sound.play('click');
      setIsClashing(true);
      setCountdown(3);
      setPlayerChoice(choice);
      setBotChoice(null);
      setOutcome(null);
      setOutcomePhrase('');

      setTimeout(() => setCountdown(2), 200);
      setTimeout(() => setCountdown(1), 400);

      setTimeout(() => {
        setCountdown(null);
        const botPick = getBotPick();
        setBotChoice(botPick);

        let roundOutcome: Outcome = 'tie';
        let phrase = 'Standoff!';

        if (choice === botPick) {
          roundOutcome = 'tie';
          phrase = `Both chose ${CHOICES[choice].label}!`;
          sound.play('tick');
          setStats((s) => ({ ...s, ties: s.ties + 1 }));
        } else if (CHOICES[choice].beats[botPick]) {
          roundOutcome = 'win';
          phrase = `${CHOICES[choice].label} ${CHOICES[choice].beats[botPick]}!`;
          sound.play('win');
          const mult = Math.min(streak + 1, 5);
          const points = (mode === 'rpsls' ? 150 : 100) * mult;
          const newScore = score + points;
          const newStreak = streak + 1;
          setScore(newScore);
          setStreak(newStreak);
          setBestStreak((b) => Math.max(b, newStreak));
          setStats((s) => {
            const nextWins = s.wins + 1;
            if (matchType === 'firstTo5' && nextWins >= 5) {
              setMatchWinner('player');
              sound.play('win');
            }
            return { ...s, wins: nextWins };
          });
          onScoreChangeRef.current(newScore);
        } else {
          roundOutcome = 'lose';
          phrase = `${CHOICES[botPick].label} ${CHOICES[botPick].beats[choice]}!`;
          sound.play('gameover');
          setStreak(0);
          setStats((s) => {
            const nextLosses = s.losses + 1;
            if (matchType === 'firstTo5' && nextLosses >= 5) {
              setMatchWinner('bot');
              sound.play('gameover');
            }
            return { ...s, losses: nextLosses };
          });
        }

        setOutcome(roundOutcome);
        setOutcomePhrase(phrase);
        playerHistoryRef.current.push({ player: choice, bot: botPick, outcome: roundOutcome });
        setIsClashing(false);
      }, 650);
    },
    [isPaused, isClashing, matchWinner, streak, score, mode, matchType]
  );

  // Keyboard bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      const k = e.key.toLowerCase();
      if (k === '1' || k === 'r') handlePlayerThrow('rock');
      if (k === '2' || k === 'p') handlePlayerThrow('paper');
      if (k === '3' || k === 's') handlePlayerThrow('scissors');
      if (mode === 'rpsls') {
        if (k === '4' || k === 'l') handlePlayerThrow('lizard');
        if (k === '5' || k === 'k') handlePlayerThrow('spock');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayerThrow, isPaused, mode]);

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-lg mx-auto w-full select-none">
      {/* Top HUD: Mode Selector & Match Format */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 max-w-[430px] p-2 bg-surface-secondary/70 rounded-2xl border border-border-strong">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMode('classic');
              resetGame();
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'classic'
                ? 'bg-accent text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Classic (3)
          </button>

          <button
            onClick={() => {
              setMode('rpsls');
              resetGame();
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'rpsls'
                ? 'bg-accent text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            RPSLS (5)
          </button>
        </div>

        {/* AI Personality & Format Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 bg-surface-card p-0.5 rounded-xl border border-border-subtle">
            {(['smart', 'psychic', 'random'] as BotPersonality[]).map((b) => (
              <button
                key={b}
                onClick={() => setBotType(b)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  botType === b
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title={BOTS[b].desc}
              >
                {BOTS[b].icon} {b}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
            title="Rules Cheat Sheet"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Streak / Match Status HUD */}
      <div className="w-full flex items-center justify-between gap-3 mb-3 max-w-[430px] px-1 text-xs">
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold animate-pulse">
              <Flame size={13} className="fill-orange-500" />
              <span>{streak}x Streak!</span>
            </div>
          )}
          {bestStreak > 0 && streak === 0 && (
            <div className="text-[11px] text-text-muted">
              Best: <strong className="text-text-primary">{bestStreak}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-xl bg-surface-card border border-border-strong shadow-xs flex items-center gap-1">
            <span className="text-text-muted">Score:</span>
            <strong className="text-accent font-black text-sm tabular-nums">{score}</strong>
          </div>
        </div>
      </div>

      {/* Duel Arena Card */}
      <div className="relative w-full max-w-[430px] rounded-3xl bg-surface-card border-2 border-border-strong shadow-xl p-5 flex flex-col items-center mb-4">
        {/* Stage Header */}
        <div className="w-full flex items-center justify-between text-xs font-bold text-text-muted mb-3 px-2">
          <div className="flex items-center gap-1.5 text-text-primary">
            <User size={15} />
            <span>You</span>
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-text-muted">VS</span>
          <div className="flex items-center gap-1.5 text-text-primary">
            <Bot size={15} />
            <span>{BOTS[botType].name}</span>
          </div>
        </div>

        {/* Duel Clash Stage */}
        <div className="w-full flex items-center justify-between py-2 px-2 sm:px-6 relative min-h-[140px]">
          {/* Player Hand */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-4xl sm:text-5xl transition-all shadow-md ${
                playerChoice ? CHOICES[playerChoice].bg : 'bg-surface-secondary border-border-subtle'
              } ${isClashing ? 'scale-110 animate-bounce' : ''}`}
            >
              {playerChoice ? CHOICES[playerChoice].emoji : '❔'}
            </div>
            <span className="text-xs font-bold text-text-secondary">
              {playerChoice ? CHOICES[playerChoice].label : 'Pick a move'}
            </span>
          </div>

          {/* Center VS / Clash Outcome */}
          <div className="flex flex-col items-center px-1 max-w-[130px] text-center">
            {countdown !== null ? (
              <span className="text-4xl font-black text-accent animate-ping">{countdown}</span>
            ) : outcome ? (
              <div className="flex flex-col items-center gap-1 animate-in zoom-in-75 duration-150">
                <span
                  className={`px-2.5 py-1 rounded-xl font-extrabold text-xs uppercase tracking-wider border shadow-xs ${
                    outcome === 'win'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                      : outcome === 'lose'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                  }`}
                >
                  {outcome === 'win' ? '🎉 Win' : outcome === 'lose' ? '💀 Defeat' : '🤝 Tie'}
                </span>
                <span className="text-[10px] font-semibold text-text-muted leading-tight mt-0.5">
                  {outcomePhrase}
                </span>
              </div>
            ) : (
              <Swords size={24} className="text-text-muted opacity-30" />
            )}
          </div>

          {/* Bot Hand */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-4xl sm:text-5xl transition-all shadow-md ${
                botChoice ? CHOICES[botChoice].bg : 'bg-surface-secondary border-border-subtle'
              } ${isClashing ? 'scale-110 animate-bounce' : ''}`}
            >
              {botChoice ? CHOICES[botChoice].emoji : '🤖'}
            </div>
            <span className="text-xs font-bold text-text-secondary">
              {botChoice ? CHOICES[botChoice].label : 'Waiting...'}
            </span>
          </div>
        </div>

        {/* Live Score Record */}
        <div className="w-full flex items-center justify-around mt-3 pt-3 border-t border-border-subtle text-xs">
          <div className="text-center">
            <div className="text-text-muted text-[11px]">Wins</div>
            <strong className="text-emerald-500 text-sm font-bold tabular-nums">
              {stats.wins}
            </strong>
          </div>
          <div className="text-center">
            <div className="text-text-muted text-[11px]">Ties</div>
            <strong className="text-text-secondary text-sm font-bold tabular-nums">
              {stats.ties}
            </strong>
          </div>
          <div className="text-center">
            <div className="text-text-muted text-[11px]">Losses</div>
            <strong className="text-rose-500 text-sm font-bold tabular-nums">
              {stats.losses}
            </strong>
          </div>
        </div>
      </div>

      {/* Choice Buttons Bar */}
      <div
        className={`w-full max-w-[430px] grid ${
          mode === 'classic' ? 'grid-cols-3' : 'grid-cols-5'
        } gap-2 mb-4`}
      >
        {activeChoices.map((c, idx) => {
          const info = CHOICES[c];
          return (
            <button
              key={c}
              onClick={() => handlePlayerThrow(c)}
              disabled={isClashing || !!matchWinner}
              className="p-2 sm:p-3 rounded-2xl bg-surface-card hover:bg-surface-secondary active:scale-95 border-2 border-border-strong text-text-primary flex flex-col items-center justify-center gap-0.5 shadow-md transition-all cursor-pointer group hover:border-accent"
            >
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                {info.emoji}
              </span>
              <span className="text-[11px] sm:text-xs font-bold leading-tight">{info.label}</span>
              <span className="text-[9px] text-text-muted font-mono">[{idx + 1}]</span>
            </button>
          );
        })}
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-strong shadow-xs cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Reset Score</span>
        </button>

        {score > 0 && (
          <button
            onClick={() => onGameOverRef.current(score)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm cursor-pointer"
          >
            <Award size={14} />
            <span>Finish Session ({score} pts)</span>
          </button>
        )}
      </div>

      {/* Rules Cheat Sheet Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card border-2 border-border-strong p-6 shadow-2xl relative">
            <h3 className="text-base font-extrabold text-text-primary mb-3 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <span>Matchup Hierarchy</span>
            </h3>

            <div className="space-y-1.5 text-xs text-text-secondary leading-relaxed">
              <p>✂️ <strong>Scissors</strong> cuts Paper & decapitates Lizard</p>
              <p>📄 <strong>Paper</strong> covers Rock & disproves Spock</p>
              <p>🪨 <strong>Rock</strong> crushes Scissors & crushes Lizard</p>
              <p>🦎 <strong>Lizard</strong> poisons Spock & eats Paper</p>
              <p>🖖 <strong>Spock</strong> smashes Scissors & vaporizes Rock</p>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
