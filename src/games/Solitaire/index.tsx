import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { RotateCcw, Undo2, Award, Sparkles, RefreshCw, Clock, Wand2, Palette } from 'lucide-react';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 (A) to 13 (K)
  faceUp: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

const RANK_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

type CardBackTheme = 'ruby' | 'sapphire' | 'emerald' | 'obsidian';

const CARD_BACK_STYLES: Record<CardBackTheme, { bg: string; border: string; name: string }> = {
  ruby: {
    bg: 'bg-gradient-to-br from-red-600 to-red-900',
    border: 'border-red-400/40',
    name: 'Ruby',
  },
  sapphire: {
    bg: 'bg-gradient-to-br from-blue-600 to-indigo-900',
    border: 'border-blue-400/40',
    name: 'Sapphire',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-900',
    border: 'border-emerald-400/40',
    name: 'Emerald',
  },
  obsidian: {
    bg: 'bg-gradient-to-br from-slate-700 to-zinc-950',
    border: 'border-zinc-500/40',
    name: 'Obsidian',
  },
};

interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles [hearts, diamonds, clubs, spades]
  tableaus: Card[][]; // 7 columns
  score: number;
  moves: number;
}

function createShuffledDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];

  suits.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function dealKlondike(): GameState {
  const deck = createShuffledDeck();
  const tableaus: Card[][] = [[], [], [], [], [], [], []];

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop()!;
      card.faceUp = row === col;
      tableaus[col].push(card);
    }
  }

  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableaus,
    score: 0,
    moves: 0,
  };
}

export const SolitaireGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [state, setState] = useState<GameState>(() => dealKlondike());
  const [drawCount, setDrawCount] = useState<1 | 3>(1);
  const [cardBack, setCardBack] = useState<CardBackTheme>('ruby');
  const [history, setHistory] = useState<GameState[]>([]);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);

  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    source: 'waste' | 'tableau' | 'foundation';
    tableauIndex?: number;
    cardIndex?: number;
  } | null>(null);

  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Timer
  useEffect(() => {
    if (isPaused || hasWon) return;
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, hasWon]);

  const resetGame = useCallback(() => {
    const fresh = dealKlondike();
    setState(fresh);
    setHistory([]);
    setSelectedCard(null);
    setSecondsElapsed(0);
    setIsAutoSolving(false);
    setHasWon(false);
    onScoreChangeRef.current(0);
  }, []);

  useEffect(() => {
    onRestartReady(resetGame);
  }, [onRestartReady, resetGame]);

  const saveHistory = (prevState: GameState) => {
    setHistory((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify(prevState))]);
  };

  const handleUndo = () => {
    if (history.length === 0 || isPaused || isAutoSolving) return;
    sound.play('click');
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setState(last);
    setSelectedCard(null);
    onScoreChangeRef.current(last.score);
  };

  // Stock click (Draw 1 or Draw 3)
  const handleStockClick = () => {
    if (isPaused || hasWon || isAutoSolving) return;
    saveHistory(state);
    sound.play('click');

    setState((prev) => {
      const next = { ...prev, moves: prev.moves + 1 };
      if (next.stock.length > 0) {
        const count = Math.min(drawCount, next.stock.length);
        for (let i = 0; i < count; i++) {
          const drawn = { ...next.stock.pop()!, faceUp: true };
          next.waste.push(drawn);
        }
      } else {
        next.stock = next.waste.map((c) => ({ ...c, faceUp: false })).reverse();
        next.waste = [];
      }
      return next;
    });

    setSelectedCard(null);
  };

  // Foundation eligibility
  const canMoveToFoundation = (card: Card, foundationPile: Card[]): boolean => {
    if (foundationPile.length === 0) return card.rank === 1;
    const top = foundationPile[foundationPile.length - 1];
    return top.suit === card.suit && card.rank === top.rank + 1;
  };

  // Tableau eligibility
  const canMoveToTableau = (card: Card, column: Card[]): boolean => {
    if (column.length === 0) return card.rank === 13;
    const top = column[column.length - 1];
    if (!top.faceUp) return false;
    return SUIT_COLORS[card.suit] !== SUIT_COLORS[top.suit] && card.rank === top.rank - 1;
  };

  // Check if board can be auto-solved
  const canAutoSolve = useCallback(() => {
    if (hasWon || isAutoSolving) return false;
    if (state.stock.length > 0 || state.waste.length > 0) return false;
    return state.tableaus.every((col) => col.every((card) => card.faceUp));
  }, [hasWon, isAutoSolving, state.stock.length, state.waste.length, state.tableaus]);

  // Auto-Solve animation loop
  const triggerAutoSolve = () => {
    setIsAutoSolving(true);
    setSelectedCard(null);
    sound.play('golden');

    const interval = setInterval(() => {
      setState((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as GameState;
        let moved = false;

        // Find lowest valid card in tableaus
        for (let colIdx = 0; colIdx < 7; colIdx++) {
          const col = next.tableaus[colIdx];
          if (col.length > 0) {
            const card = col[col.length - 1];
            for (let fIdx = 0; fIdx < 4; fIdx++) {
              if (canMoveToFoundation(card, next.foundations[fIdx])) {
                col.pop();
                next.foundations[fIdx].push(card);
                next.score += 15;
                next.moves += 1;
                moved = true;
                sound.play('click');
                break;
              }
            }
          }
          if (moved) break;
        }

        const totalFoundations = next.foundations.reduce((acc, p) => acc + p.length, 0);
        if (totalFoundations === 52 || !moved) {
          clearInterval(interval);
          setIsAutoSolving(false);
          setHasWon(true);
          sound.play('win');
          onGameOverRef.current(next.score + 300);
        }

        onScoreChangeRef.current(next.score);
        return next;
      });
    }, 150);
  };

  // Auto-move single card to foundation on double-click
  const handleAutoFoundation = (card: Card, source: 'waste' | 'tableau', colIdx?: number) => {
    if (isPaused || !card.faceUp || hasWon || isAutoSolving) return;

    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (canMoveToFoundation(card, state.foundations[fIdx])) {
        saveHistory(state);
        sound.play('win');

        setState((prev) => {
          const next = JSON.parse(JSON.stringify(prev)) as GameState;
          if (source === 'waste') {
            next.waste.pop();
          } else if (source === 'tableau' && colIdx !== undefined) {
            next.tableaus[colIdx].pop();
            const col = next.tableaus[colIdx];
            if (col.length > 0 && !col[col.length - 1].faceUp) {
              col[col.length - 1].faceUp = true;
              next.score += 5;
            }
          }
          next.foundations[fIdx].push(card);
          next.score += 15;
          next.moves += 1;
          onScoreChangeRef.current(next.score);
          checkWinCondition(next);
          return next;
        });

        setSelectedCard(null);
        return;
      }
    }
  };

  const executeTableauMove = (destColIdx: number) => {
    if (!selectedCard) return;

    const { card, source, tableauIndex, cardIndex } = selectedCard;
    const destCol = state.tableaus[destColIdx];

    if (!canMoveToTableau(card, destCol)) return;

    saveHistory(state);
    sound.play('move');

    setState((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as GameState;

      if (source === 'waste') {
        const c = next.waste.pop()!;
        next.tableaus[destColIdx].push(c);
        next.score += 5;
      } else if (source === 'tableau' && tableauIndex !== undefined && cardIndex !== undefined) {
        const stackToMove = next.tableaus[tableauIndex].splice(cardIndex);
        next.tableaus[destColIdx].push(...stackToMove);

        const originCol = next.tableaus[tableauIndex];
        if (originCol.length > 0 && !originCol[originCol.length - 1].faceUp) {
          originCol[originCol.length - 1].faceUp = true;
          next.score += 5;
        }
      }

      next.moves += 1;
      onScoreChangeRef.current(next.score);
      return next;
    });

    setSelectedCard(null);
  };

  const handleFoundationClick = (fIdx: number) => {
    if (!selectedCard) return;
    const { card, source, tableauIndex } = selectedCard;

    if (canMoveToFoundation(card, state.foundations[fIdx])) {
      saveHistory(state);
      sound.play('click');

      setState((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as GameState;
        if (source === 'waste') {
          next.waste.pop();
        } else if (source === 'tableau' && tableauIndex !== undefined) {
          next.tableaus[tableauIndex].pop();
          const col = next.tableaus[tableauIndex];
          if (col.length > 0 && !col[col.length - 1].faceUp) {
            col[col.length - 1].faceUp = true;
            next.score += 5;
          }
        }
        next.foundations[fIdx].push(card);
        next.score += 15;
        next.moves += 1;
        onScoreChangeRef.current(next.score);
        checkWinCondition(next);
        return next;
      });

      setSelectedCard(null);
    }
  };

  const checkWinCondition = (currentState: GameState) => {
    const totalFoundations = currentState.foundations.reduce(
      (acc, pile) => acc + pile.length,
      0
    );
    if (totalFoundations === 52) {
      sound.play('win');
      setHasWon(true);
      onGameOverRef.current(currentState.score + 500);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Render Card Component
  const renderCard = (
    card: Card,
    isSelected: boolean = false,
    onClick?: () => void,
    onDoubleClick?: () => void
  ) => {
    const isRed = SUIT_COLORS[card.suit] === 'red';
    const backStyle = CARD_BACK_STYLES[cardBack];

    if (!card.faceUp) {
      return (
        <div
          onClick={onClick}
          className={`w-12 h-16 sm:w-16 sm:h-22 rounded-xl ${backStyle.bg} border-2 ${backStyle.border} shadow-md flex items-center justify-center cursor-pointer select-none`}
        >
          <div className="w-8 h-12 sm:w-11 sm:h-16 rounded-lg border border-white/20 bg-black/15 flex items-center justify-center">
            <span className="text-white/40 font-bold text-xs">♠</span>
          </div>
        </div>
      );
    }

    return (
      <div
        draggable={card.faceUp}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', card.id);
          onClick?.();
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`w-12 h-16 sm:w-16 sm:h-22 rounded-xl bg-white border-2 flex flex-col justify-between p-1 sm:p-1.5 shadow-md cursor-pointer transition-transform select-none ${
          isSelected
            ? 'ring-3 ring-accent border-accent -translate-y-1 shadow-lg'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center justify-between leading-none">
          <span
            className={`font-black text-xs sm:text-sm ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {RANK_LABELS[card.rank]}
          </span>
          <span className={`text-xs ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
            {SUIT_SYMBOLS[card.suit]}
          </span>
        </div>

        <div className="flex items-center justify-center">
          <span
            className={`text-lg sm:text-2xl leading-none ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {SUIT_SYMBOLS[card.suit]}
          </span>
        </div>

        <div className="flex items-center justify-between leading-none rotate-180">
          <span
            className={`font-black text-xs sm:text-sm ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {RANK_LABELS[card.rank]}
          </span>
          <span className={`text-xs ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
            {SUIT_SYMBOLS[card.suit]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-3 max-w-2xl mx-auto w-full select-none">
      {/* Top HUD Controls Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mb-3 max-w-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isAutoSolving}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              history.length > 0 && !isAutoSolving
                ? 'bg-surface-secondary text-text-primary border-border-strong hover:bg-surface-tertiary shadow-xs'
                : 'opacity-40 cursor-not-allowed text-text-muted border-border-subtle bg-surface-secondary/40'
            }`}
            title="Undo Move"
          >
            <Undo2 size={13} />
            <span>Undo</span>
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary border border-border-strong hover:bg-surface-tertiary transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} />
            <span>Redeal</span>
          </button>

          {/* Draw 1 vs Draw 3 toggle */}
          <button
            onClick={() => {
              setDrawCount(drawCount === 1 ? 3 : 1);
              resetGame();
            }}
            className="px-2 py-1.5 text-xs font-semibold rounded-xl bg-surface-secondary/70 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Toggle Draw Mode"
          >
            Draw {drawCount}
          </button>

          {/* Card Back theme switcher */}
          <div className="flex items-center gap-1 ml-1">
            {(Object.keys(CARD_BACK_STYLES) as CardBackTheme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => setCardBack(theme)}
                className={`w-5 h-5 rounded-full ${CARD_BACK_STYLES[theme].bg} border ${
                  cardBack === theme ? 'ring-2 ring-accent scale-110' : 'opacity-60'
                } transition-all cursor-pointer`}
                title={`${CARD_BACK_STYLES[theme].name} Back`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-surface-card border border-border-strong shadow-xs flex items-center gap-1">
            <Clock size={12} className="text-text-muted" />
            <span className="tabular-nums font-mono font-semibold text-text-primary">
              {formatTime(secondsElapsed)}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-surface-card border border-border-strong shadow-xs flex items-center gap-1">
            <span className="text-text-muted">Moves:</span>
            <strong className="text-text-primary tabular-nums font-bold">{state.moves}</strong>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-surface-card border border-border-strong shadow-xs flex items-center gap-1">
            <span className="text-text-muted">Score:</span>
            <strong className="text-accent tabular-nums font-extrabold text-sm">
              {state.score}
            </strong>
          </div>
        </div>
      </div>

      {/* Felt Poker Table Surface */}
      <div className="w-full max-w-xl rounded-3xl bg-[#0f3823] dark:bg-[#092215] border-4 border-[#071c11] shadow-2xl p-3 sm:p-4 min-h-[460px] flex flex-col justify-between relative">
        {/* Auto Solve floating banner */}
        {canAutoSolve() && !hasWon && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={triggerAutoSolve}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-extrabold text-xs shadow-xl animate-bounce transition-all cursor-pointer"
            >
              <Wand2 size={15} />
              <span>Auto-Complete Klondike!</span>
            </button>
          </div>
        )}

        {/* Top Row: Stock, Waste, and 4 Foundations */}
        <div className="flex items-center justify-between w-full mb-5">
          {/* Stock & Waste zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stock Pile */}
            <div onClick={handleStockClick} className="relative cursor-pointer">
              {state.stock.length > 0 ? (
                <div
                  className={`w-12 h-16 sm:w-16 sm:h-22 rounded-xl ${CARD_BACK_STYLES[cardBack].bg} border-2 ${CARD_BACK_STYLES[cardBack].border} shadow-md flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-xs">
                    {state.stock.length}
                  </span>
                </div>
              ) : (
                <div className="w-12 h-16 sm:w-16 sm:h-22 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-white/40 transition-colors">
                  <RefreshCw size={18} />
                </div>
              )}
            </div>

            {/* Waste Pile */}
            <div className="w-12 h-16 sm:w-16 sm:h-22 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center relative">
              {state.waste.length > 0 &&
                renderCard(
                  state.waste[state.waste.length - 1],
                  selectedCard?.source === 'waste',
                  () => {
                    const top = state.waste[state.waste.length - 1];
                    setSelectedCard({ card: top, source: 'waste' });
                  },
                  () => {
                    const top = state.waste[state.waste.length - 1];
                    handleAutoFoundation(top, 'waste');
                  }
                )}
            </div>
          </div>

          {/* 4 Foundations */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {state.foundations.map((pile, fIdx) => {
              const suitKey = ['hearts', 'diamonds', 'clubs', 'spades'][fIdx] as Suit;
              const topCard = pile[pile.length - 1];
              const isEligibleTarget =
                selectedCard && canMoveToFoundation(selectedCard.card, pile);

              return (
                <div
                  key={fIdx}
                  onClick={() => handleFoundationClick(fIdx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFoundationClick(fIdx);
                  }}
                  className={`w-12 h-16 sm:w-16 sm:h-22 rounded-xl border-2 bg-black/20 flex items-center justify-center relative cursor-pointer transition-all shadow-inner ${
                    isEligibleTarget
                      ? 'border-emerald-400 ring-2 ring-emerald-400/60'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {topCard ? (
                    renderCard(topCard)
                  ) : (
                    <span className="text-white/20 font-bold text-lg sm:text-xl">
                      {SUIT_SYMBOLS[suitKey]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 7 Tableau Columns */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full flex-1 items-start min-h-[300px]">
          {state.tableaus.map((col, colIdx) => {
            const isEligibleColumn =
              selectedCard && canMoveToTableau(selectedCard.card, col);

            return (
              <div
                key={colIdx}
                onClick={() => {
                  if (col.length === 0 && selectedCard) {
                    executeTableauMove(colIdx);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  executeTableauMove(colIdx);
                }}
                className={`flex flex-col items-center min-h-[140px] relative w-full rounded-xl transition-all ${
                  isEligibleColumn ? 'bg-white/5 ring-1 ring-accent/60' : ''
                }`}
              >
                {col.length === 0 ? (
                  <div className="w-12 h-16 sm:w-16 sm:h-22 rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center text-white/20 text-xs font-bold">
                    K
                  </div>
                ) : (
                  col.map((card, cardIdx) => {
                    const isSelected =
                      selectedCard?.source === 'tableau' &&
                      selectedCard.tableauIndex === colIdx &&
                      selectedCard.cardIndex === cardIdx;

                    return (
                      <div
                        key={card.id}
                        style={{ marginTop: cardIdx === 0 ? 0 : -52 }}
                        className="relative z-10"
                      >
                        {renderCard(
                          card,
                          isSelected,
                          () => {
                            if (!card.faceUp) return;
                            if (selectedCard) {
                              executeTableauMove(colIdx);
                            } else {
                              setSelectedCard({
                                card,
                                source: 'tableau',
                                tableauIndex: colIdx,
                                cardIndex: cardIdx,
                              });
                            }
                          },
                          () => {
                            if (cardIdx === col.length - 1) {
                              handleAutoFoundation(card, 'tableau', colIdx);
                            }
                          }
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer controls & Victory status */}
      <div className="w-full max-w-xl flex items-center justify-between mt-3 px-1 text-xs text-text-muted">
        <p>Double-click any face-up card to quickly send it to foundations.</p>

        {hasWon && (
          <div className="flex items-center gap-1.5 font-bold text-emerald-500 animate-bounce">
            <Sparkles size={14} />
            <span>Klondike Cleared!</span>
          </div>
        )}
      </div>
    </div>
  );
};
