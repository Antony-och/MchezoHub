import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { Bot, Users, RotateCcw, Award } from 'lucide-react';

type Player = 'X' | 'O';
type AIDifficulty = 'easy' | 'medium' | 'hard';
type Mode = 'ai' | 'pvp';

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const TicTacToeGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [cumulativeScore, setCumulativeScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState({ xWins: 0, oWins: 0, ties: 0 });

  const checkWinner = (squares: (Player | null)[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as Player, line: combo };
      }
    }
    if (squares.every((sq) => sq !== null)) {
      return { winner: 'draw' as const, line: null };
    }
    return null;
  };

  const resetRound = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  }, []);

  const fullReset = useCallback(() => {
    resetRound();
    setCumulativeScore(0);
    setStreak(0);
    setStats({ xWins: 0, oWins: 0, ties: 0 });
    onScoreChange(0);
  }, [resetRound, onScoreChange]);

  useEffect(() => {
    onRestartReady(fullReset);
  }, [onRestartReady, fullReset]);

  // Minimax evaluation for unbeatable AI
  const minimax = (
    currentBoard: (Player | null)[],
    depth: number,
    isMaximizing: boolean
  ): { score: number; bestMove?: number } => {
    const result = checkWinner(currentBoard);
    if (result) {
      if (result.winner === 'O') return { score: 10 - depth };
      if (result.winner === 'X') return { score: depth - 10 };
      if (result.winner === 'draw') return { score: 0 };
    }

    const availableMoves: number[] = [];
    currentBoard.forEach((cell, idx) => {
      if (cell === null) availableMoves.push(idx);
    });

    if (isMaximizing) {
      let maxScore = -Infinity;
      let bestMove = availableMoves[0];
      for (const move of availableMoves) {
        currentBoard[move] = 'O';
        const evalResult = minimax(currentBoard, depth + 1, false);
        currentBoard[move] = null;
        if (evalResult.score > maxScore) {
          maxScore = evalResult.score;
          bestMove = move;
        }
      }
      return { score: maxScore, bestMove };
    } else {
      let minScore = Infinity;
      let bestMove = availableMoves[0];
      for (const move of availableMoves) {
        currentBoard[move] = 'X';
        const evalResult = minimax(currentBoard, depth + 1, true);
        currentBoard[move] = null;
        if (evalResult.score < minScore) {
          minScore = evalResult.score;
          bestMove = move;
        }
      }
      return { score: minScore, bestMove };
    }
  };

  const getAiMove = (currentBoard: (Player | null)[], diff: AIDifficulty): number => {
    const available = currentBoard
      .map((cell, idx) => (cell === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (available.length === 0) return -1;

    // Easy: 70% random, 30% smart
    if (diff === 'easy') {
      if (Math.random() < 0.7) {
        return available[Math.floor(Math.random() * available.length)];
      }
    }

    // Medium: 35% random, 65% minimax
    if (diff === 'medium') {
      if (Math.random() < 0.35) {
        return available[Math.floor(Math.random() * available.length)];
      }
    }

    // Hard: 100% Minimax
    const { bestMove } = minimax([...currentBoard], 0, true);
    return bestMove ?? available[0];
  };

  const handleCellClick = (index: number) => {
    if (isPaused || board[index] || winner || isAiThinking) return;

    sound.play('move');
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const outcome = checkWinner(newBoard);
    if (outcome) {
      handleRoundEnd(outcome.winner, outcome.line, newBoard);
      return;
    }

    if (mode === 'ai' && currentPlayer === 'X') {
      setCurrentPlayer('O');
      setIsAiThinking(true);

      setTimeout(() => {
        const aiIndex = getAiMove(newBoard, difficulty);
        if (aiIndex !== -1) {
          sound.play('move');
          newBoard[aiIndex] = 'O';
          setBoard([...newBoard]);

          const aiOutcome = checkWinner(newBoard);
          if (aiOutcome) {
            handleRoundEnd(aiOutcome.winner, aiOutcome.line, newBoard);
          } else {
            setCurrentPlayer('X');
          }
        }
        setIsAiThinking(false);
      }, 400);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const handleRoundEnd = (
    roundWinner: Player | 'draw',
    line: number[] | null,
    finalBoard: (Player | null)[]
  ) => {
    setWinner(roundWinner);
    setWinningLine(line);

    if (roundWinner === 'draw') {
      sound.play('tick');
      setStats((prev) => ({ ...prev, ties: prev.ties + 1 }));
    } else if (roundWinner === 'X') {
      sound.play('win');
      const pointMultiplier = difficulty === 'hard' ? 250 : difficulty === 'medium' ? 150 : 100;
      const roundPoints = pointMultiplier + streak * 25;
      const newScore = cumulativeScore + roundPoints;
      setCumulativeScore(newScore);
      setStreak((s) => s + 1);
      setStats((prev) => ({ ...prev, xWins: prev.xWins + 1 }));
      onScoreChange(newScore);
    } else {
      sound.play('gameover');
      setStreak(0);
      setStats((prev) => ({ ...prev, oWins: prev.oWins + 1 }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full">
      {/* Game controls and Mode selection */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-surface-secondary rounded-xl border border-border-subtle">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMode('ai');
              resetRound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              mode === 'ai'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Bot size={14} />
            <span>vs AI</span>
          </button>
          <button
            onClick={() => {
              setMode('pvp');
              resetRound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              mode === 'pvp'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={14} />
            <span>2 Players</span>
          </button>
        </div>

        {mode === 'ai' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-text-muted mr-1 hidden sm:inline">AI:</span>
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  resetRound();
                }}
                className={`px-2 py-1 text-xs font-medium capitalize rounded transition-colors ${
                  difficulty === d
                    ? 'bg-surface-tertiary text-text-primary border border-border-strong'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Match scoreboard */}
      <div className="grid grid-cols-3 gap-3 w-full mb-6 text-center">
        <div className="p-3 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-xs text-text-muted mb-0.5">Player X</div>
          <div className="text-lg font-bold text-blue-500 tabular-nums">{stats.xWins}</div>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-xs text-text-muted mb-0.5">Ties</div>
          <div className="text-lg font-bold text-text-secondary tabular-nums">{stats.ties}</div>
        </div>
        <div className="p-3 rounded-xl bg-surface-card border border-border-subtle">
          <div className="text-xs text-text-muted mb-0.5">
            {mode === 'ai' ? `Bot (${difficulty})` : 'Player O'}
          </div>
          <div className="text-lg font-bold text-rose-500 tabular-nums">{stats.oWins}</div>
        </div>
      </div>

      {/* Status banner */}
      <div className="mb-4 text-center h-8 flex items-center justify-center">
        {winner ? (
          <div className="flex items-center gap-2 font-semibold text-sm">
            {winner === 'draw' ? (
              <span className="text-text-secondary">Round Draw! Well played.</span>
            ) : (
              <span className={winner === 'X' ? 'text-blue-500' : 'text-rose-500'}>
                🎉 Player {winner} Wins This Round!
              </span>
            )}
          </div>
        ) : isAiThinking ? (
          <div className="text-xs text-text-muted flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Bot is calculating move...
          </div>
        ) : (
          <div className="text-sm font-medium text-text-secondary">
            Current Turn:{' '}
            <span className={currentPlayer === 'X' ? 'text-blue-500 font-bold' : 'text-rose-500 font-bold'}>
              {currentPlayer === 'X' ? 'Player X' : mode === 'ai' ? 'Bot (O)' : 'Player O'}
            </span>
          </div>
        )}
      </div>

      {/* 3x3 Game Board with classic prominent grid lines */}
      <div className="relative p-4 sm:p-5 bg-surface-card rounded-3xl border-2 border-border-strong shadow-lg w-full max-w-[360px] aspect-square flex items-center justify-center">
        {/* The 3x3 Grid with intersecting divider lines */}
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full relative">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            const col = index % 3;
            const row = Math.floor(index / 3);

            // Border lines for classic Tic-Tac-Toe # grid
            const hasRightBorder = col < 2;
            const hasBottomBorder = row < 2;

            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || !!winner || isAiThinking}
                className={`relative flex items-center justify-center font-bold text-4xl transition-all duration-150 select-none group/cell ${
                  hasRightBorder ? 'border-r-4 border-border-strong' : ''
                } ${
                  hasBottomBorder ? 'border-b-4 border-border-strong' : ''
                } ${
                  cell === null && !winner && !isAiThinking
                    ? 'hover:bg-accent/5 cursor-pointer active:scale-95'
                    : ''
                } ${
                  isWinningCell
                    ? 'bg-emerald-500/15'
                    : ''
                }`}
                aria-label={`Cell row ${row + 1}, column ${col + 1}`}
              >
                {cell === 'X' && (
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 text-blue-500 drop-shadow-sm animate-pop-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                {cell === 'O' && (
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 text-rose-500 drop-shadow-sm animate-pop-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                )}

                {/* Ghost preview on hover */}
                {cell === null && !winner && !isAiThinking && (
                  <span className="opacity-0 group-hover/cell:opacity-20 transition-opacity pointer-events-none">
                    {currentPlayer === 'X' ? (
                      <svg className="w-12 h-12 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}

          {/* Winning Strike Line Overlay */}
          {winningLine && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 300 300"
            >
              {(() => {
                // Determine line start & end based on winning combo
                const [a, , c] = winningLine;
                const coords: Record<number, { x: number; y: number }> = {
                  0: { x: 50, y: 50 },
                  1: { x: 150, y: 50 },
                  2: { x: 250, y: 50 },
                  3: { x: 50, y: 150 },
                  4: { x: 150, y: 150 },
                  5: { x: 250, y: 150 },
                  6: { x: 50, y: 250 },
                  7: { x: 150, y: 250 },
                  8: { x: 250, y: 250 },
                };
                const start = coords[a];
                const end = coords[c];
                if (!start || !end) return null;

                return (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  />
                );
              })()}
            </svg>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={resetRound}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-subtle"
        >
          <RotateCcw size={14} />
          <span>New Round</span>
        </button>

        {cumulativeScore > 0 && (
          <button
            onClick={() => onGameOver(cumulativeScore)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <Award size={14} />
            <span>Finish Match ({cumulativeScore} pts)</span>
          </button>
        )}
      </div>
    </div>
  );
};
