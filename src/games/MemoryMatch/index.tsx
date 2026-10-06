import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import {
  Gamepad2,
  Trophy,
  Swords,
  Target,
  Dices,
  Zap,
  Flame,
  Rocket,
  Star,
  Ghost,
  TreePine,
  Sun,
  Moon,
  CloudRain,
  Flower2,
  Mountain,
  Compass,
  Fish,
  Bird,
  Leaf,
  Cpu,
  Shield,
  Key,
  Database,
  Globe,
  Radio,
  Wifi,
  Sparkles,
  RotateCcw,
  Timer as TimerIcon,
  Flame as StreakIcon,
} from 'lucide-react';

interface CardItem {
  id: number;
  iconKey: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type CardTheme = 'arcade' | 'nature' | 'tech';
type GridDifficulty = 'easy' | 'medium' | 'hard';

const THEME_ICONS: Record<CardTheme, { key: string; component: React.ComponentType<{ size?: number; className?: string }> }[]> = {
  arcade: [
    { key: 'gamepad', component: Gamepad2 },
    { key: 'trophy', component: Trophy },
    { key: 'swords', component: Swords },
    { key: 'target', component: Target },
    { key: 'dices', component: Dices },
    { key: 'zap', component: Zap },
    { key: 'flame', component: Flame },
    { key: 'rocket', component: Rocket },
    { key: 'star', component: Star },
    { key: 'ghost', component: Ghost },
  ],
  nature: [
    { key: 'tree', component: TreePine },
    { key: 'sun', component: Sun },
    { key: 'moon', component: Moon },
    { key: 'rain', component: CloudRain },
    { key: 'flower', component: Flower2 },
    { key: 'mountain', component: Mountain },
    { key: 'compass', component: Compass },
    { key: 'fish', component: Fish },
    { key: 'bird', component: Bird },
    { key: 'leaf', component: Leaf },
  ],
  tech: [
    { key: 'cpu', component: Cpu },
    { key: 'shield', component: Shield },
    { key: 'key', component: Key },
    { key: 'database', component: Database },
    { key: 'globe', component: Globe },
    { key: 'radio', component: Radio },
    { key: 'wifi', component: Wifi },
    { key: 'target', component: Target },
    { key: 'sparkles', component: Sparkles },
    { key: 'rocket', component: Rocket },
  ],
};

export const MemoryMatchGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [theme, setTheme] = useState<CardTheme>('arcade');
  const [difficulty, setDifficulty] = useState<GridDifficulty>('medium');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const numPairs = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeDeck = useCallback(() => {
    const iconList = THEME_ICONS[theme].slice(0, numPairs);
    const deckIcons = [...iconList, ...iconList];

    // Fisher-Yates shuffle
    for (let i = deckIcons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckIcons[i], deckIcons[j]] = [deckIcons[j], deckIcons[i]];
    }

    const initialCards: CardItem[] = deckIcons.map((item, index) => ({
      id: index,
      iconKey: item.key,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(initialCards);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setStreak(0);
    setScore(0);
    setElapsedTime(0);
    setIsLocked(false);
    onScoreChange(0);
  }, [theme, numPairs, onScoreChange]);

  useEffect(() => {
    onRestartReady(initializeDeck);
  }, [onRestartReady, initializeDeck]);

  // Restart on theme or difficulty change
  useEffect(() => {
    initializeDeck();
  }, [initializeDeck]);

  // Game timer
  useEffect(() => {
    if (isPaused || matches === numPairs) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, matches, numPairs]);

  const handleCardClick = (id: number) => {
    if (isPaused || isLocked) return;

    const clickedCard = cards.find((c) => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    sound.play('move');

    // Flip card
    const updated = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(updated);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsLocked(true);
      setMoves((m) => m + 1);

      const firstCard = cards.find((c) => c.id === newSelected[0])!;
      const secondCard = clickedCard;

      if (firstCard.iconKey === secondCard.iconKey) {
        // MATCH!
        setTimeout(() => {
          sound.play('match');
          const matchedState = updated.map((c) =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isMatched: true, isFlipped: true }
              : c
          );
          setCards(matchedState);
          setSelectedCards([]);
          setIsLocked(false);

          const newStreak = streak + 1;
          setStreak(newStreak);

          // Calculate score
          const baseMatchScore = 150;
          const streakBonus = (newStreak - 1) * 75;
          const addedScore = baseMatchScore + streakBonus;
          const totalScore = score + addedScore;
          setScore(totalScore);
          onScoreChange(totalScore);

          const newMatchesCount = matches + 1;
          setMatches(newMatchesCount);

          if (newMatchesCount === numPairs) {
            // Victory!
            const timeBonus = Math.max(0, 500 - elapsedTime * 8);
            const finalScore = totalScore + timeBonus;
            setScore(finalScore);
            onScoreChange(finalScore);
            sound.play('win');
            setTimeout(() => {
              onGameOver(finalScore);
            }, 600);
          }
        }, 350);
      } else {
        // NO MATCH
        setTimeout(() => {
          sound.play('miss');
          setStreak(0);
          setCards(
            updated.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsLocked(false);
        }, 750);
      }
    }
  };

  // Find icon component
  const renderIcon = (key: string) => {
    const list = THEME_ICONS[theme];
    const match = list.find((item) => item.key === key);
    if (!match) return null;
    const IconComponent = match.component;
    return <IconComponent size={28} className="text-accent" />;
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-xl mx-auto w-full">
      {/* Controls & Options Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 p-2 bg-surface-secondary rounded-xl border border-border-subtle">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-muted mr-1">Deck:</span>
          {(['arcade', 'nature', 'tech'] as CardTheme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-2.5 py-1 text-xs font-medium capitalize rounded-md transition-colors ${
                theme === t
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-muted mr-1">Grid:</span>
          {(['easy', 'medium', 'hard'] as GridDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-2 py-1 text-xs font-medium capitalize rounded transition-colors ${
                difficulty === d
                  ? 'bg-surface-tertiary text-text-primary border border-border-strong'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {d === 'easy' ? '12 Cards' : d === 'medium' ? '16 Cards' : '20 Cards'}
            </button>
          ))}
        </div>
      </div>

      {/* Memory HUD */}
      <div className="grid grid-cols-4 gap-2 w-full mb-4 text-center">
        <div className="p-2 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted flex items-center justify-center gap-1">
            <TimerIcon size={12} />
            <span>Time</span>
          </div>
          <div className="text-base font-bold text-text-primary tabular-nums">
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted">Moves</div>
          <div className="text-base font-bold text-text-primary tabular-nums">{moves}</div>
        </div>

        <div className="p-2 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted flex items-center justify-center gap-1">
            <StreakIcon size={12} className={streak > 1 ? 'text-amber-500' : ''} />
            <span>Streak</span>
          </div>
          <div className={`text-base font-bold tabular-nums ${streak > 1 ? 'text-amber-500' : 'text-text-primary'}`}>
            {streak > 1 ? `${streak}x` : `${streak}`}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-[11px] text-text-muted">Matched</div>
          <div className="text-base font-bold text-emerald-500 tabular-nums">
            {matches}/{numPairs}
          </div>
        </div>
      </div>

      {/* 3D Cards Grid Table Board with clear boundary frame */}
      <div className="p-3 sm:p-4 rounded-3xl bg-surface-card border-2 border-border-strong shadow-lg w-full max-w-[460px]">
        <div
          className={`grid gap-2.5 sm:gap-3 w-full perspective-1000 ${
            difficulty === 'easy'
              ? 'grid-cols-3 sm:grid-cols-4'
              : difficulty === 'medium'
              ? 'grid-cols-4'
              : 'grid-cols-4 sm:grid-cols-5'
          }`}
        >
          {cards.map((card) => {
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isFlipped || card.isMatched || isLocked}
                className="relative aspect-square w-full rounded-xl cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ transformStyle: 'preserve-3d' }}
                aria-label={`Card ${card.id + 1}`}
              >
                <div
                  className={`w-full h-full rounded-xl transition-transform duration-300 transform-style-3d relative ${
                    card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Card Back (Hidden icon) with clear borders */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-xl bg-surface-secondary border-2 border-border-strong flex items-center justify-center backface-hidden shadow-sm hover:border-accent hover:bg-surface-hover transition-colors"
                  >
                    <Sparkles size={18} className="text-text-muted/40" />
                  </div>

                  {/* Card Front (Revealed icon) with clear borders */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-xl border-2 flex items-center justify-center backface-hidden rotate-y-180 transition-colors ${
                      card.isMatched
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                        : 'bg-surface-secondary border-accent shadow-md'
                    }`}
                  >
                    {renderIcon(card.iconKey)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Shuffle */}
      <div className="mt-5">
        <button
          onClick={initializeDeck}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-subtle"
        >
          <RotateCcw size={14} />
          <span>Shuffle Deck</span>
        </button>
      </div>
    </div>
  );
};
