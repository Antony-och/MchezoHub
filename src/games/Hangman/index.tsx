import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameComponentProps } from '../../types/game';
import { sound } from '../../utils/audio';
import { RotateCcw, Lightbulb, Heart, Award, Sparkles, HelpCircle, Trophy } from 'lucide-react';

interface WordItem {
  word: string;
  hint: string;
  funFact: string;
}

const CATEGORIES: Record<string, WordItem[]> = {
  Animals: [
    { word: 'CHEETAH', hint: 'Fastest land animal on Earth', funFact: 'Can accelerate from 0 to 60 mph in just 3 seconds!' },
    { word: 'DOLPHIN', hint: 'Highly intelligent marine mammal', funFact: 'Dolphins sleep with one half of their brain awake and one eye open.' },
    { word: 'PENGUIN', hint: 'Flightless bird in tuxedo colors', funFact: 'Emperor penguins can dive over 1,800 feet deep in freezing Antarctic water.' },
    { word: 'ELEPHANT', hint: 'Largest living land mammal with tusks', funFact: 'Elephants have over 40,000 muscles in their trunk alone!' },
    { word: 'KANGAROO', hint: 'Australian marsupial that hops', funFact: 'Kangaroos use their muscular tails as a fifth leg when balancing.' },
    { word: 'GIRAFFE', hint: 'Tallest mammal with a long blue tongue', funFact: 'A giraffe tongue is roughly 20 inches long and prehensile.' },
    { word: 'OCTOPUS', hint: 'Eight-armed sea creature with three hearts', funFact: 'Octopuses have blue blood powered by copper rather than iron.' },
    { word: 'CHAMELEON', hint: 'Lizard known for changing skin color', funFact: 'They change colors for mood and temperature communication, not just camouflage.' },
    { word: 'FLAMINGO', hint: 'Pink wading bird that stands on one leg', funFact: 'Their pink coloration comes from carotenoid pigments in their shrimp diet.' },
    { word: 'PLATYPUS', hint: 'Egg-laying semi-aquatic Australian mammal', funFact: 'One of the few venomous mammals; males have venom spurs on their hind legs.' },
  ],
  Countries: [
    { word: 'KENYA', hint: 'East African nation famed for the Great Rift Valley', funFact: 'Home to the legendary Maasai Mara national wildlife reserve.' },
    { word: 'BRAZIL', hint: 'South American giant home to the Amazon', funFact: 'Brazil is the only country in the world where both the Equator and Tropic of Capricorn pass.' },
    { word: 'JAPAN', hint: 'Island nation of the rising sun and bullet trains', funFact: 'Composed of over 6,800 distinct islands across the Pacific.' },
    { word: 'CANADA', hint: 'Vast northern country known for maple syrup', funFact: 'Contains over 60% of all natural lakes in the entire world.' },
    { word: 'EGYPT', hint: 'Ancient land of the Nile and pyramids', funFact: 'The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years.' },
    { word: 'NORWAY', hint: 'Scandinavian country of stunning fjords and aurora', funFact: 'Knighted a king penguin named Sir Nils Olav III as a brigadier general.' },
    { word: 'MEXICO', hint: 'Home of ancient Maya ruins and tacos', funFact: 'Introduced chocolate, chili, and corn to the rest of the world.' },
    { word: 'AUSTRALIA', hint: 'Down Under continent with the Great Barrier Reef', funFact: 'Home to more than 10,000 beaches; you could visit a new one every day for 27 years.' },
    { word: 'ARGENTINA', hint: 'Land of tango, pampas, and the high Andes', funFact: 'Has produced both the highest peak (Aconcagua) and lowest point in the Southern Hemisphere.' },
    { word: 'GERMANY', hint: 'Central European heart of the Autobahn and castles', funFact: 'Features over 20,000 historic castles and fortresses.' },
  ],
  Tech: [
    { word: 'PYTHON', hint: 'High-level programming language named after comedy', funFact: 'Creator Guido van Rossum named it after Monty Python’s Flying Circus.' },
    { word: 'ALGORITHM', hint: 'Step-by-step problem-solving computational process', funFact: 'Named after 9th-century Persian mathematician Muhammad al-Khwarizmi.' },
    { word: 'DATABASE', hint: 'Structured collection of electronically stored data', funFact: 'Relational databases were pioneered by Edgar F. Codd at IBM in 1970.' },
    { word: 'FIREWALL', hint: 'Network security barrier monitoring traffic', funFact: 'The term originally meant physical walls designed to prevent structural fire spreading.' },
    { word: 'KEYBOARD', hint: 'Input peripheral used to type characters', funFact: 'The standard QWERTY layout was patented in 1878 to avoid jamming typewriter mechanical arms.' },
    { word: 'MONITOR', hint: 'Visual display output device for computers', funFact: 'Early computer monitors in the 1950s used radar CRT oscilloscope screens.' },
    { word: 'PIXEL', hint: 'Smallest discrete illuminable element of a display', funFact: 'Short for "picture element", first coined in a 1965 aerospace imaging paper.' },
    { word: 'ROUTER', hint: 'Device forwarding data packets between networks', funFact: 'The first primitive routers were Interface Message Processors (IMPs) on ARPANET.' },
    { word: 'QUANTUM', hint: 'Computing paradigm leveraging qubits and entanglement', funFact: 'Qubits can represent 0 and 1 simultaneously through quantum superposition.' },
    { word: 'COMPILER', hint: 'Translates source code into machine instructions', funFact: 'The first compiler was developed by computer pioneer Grace Hopper in 1952.' },
  ],
  Movies: [
    { word: 'AVATAR', hint: 'Sci-fi blockbuster set on bioluminescent Pandora', funFact: 'Highest-grossing film of all time, utilizing groundbreaking performance capture.' },
    { word: 'INCEPTION', hint: 'Heist thriller exploring layers of shared dreaming', funFact: 'Directed by Christopher Nolan, famous for spinning hallway zero-g effects.' },
    { word: 'TITANIC', hint: 'Tragic 1997 romance aboard the ill-fated luxury ship', funFact: 'Won 11 Academy Awards, tied for the most Oscar wins in cinema history.' },
    { word: 'GLADIATOR', hint: 'Roman epic about Maximus seeking justice in the Colosseum', funFact: 'Won Best Picture and cemented Russell Crowe as an iconic action star.' },
    { word: 'INTERSTELLAR', hint: 'Astronauts traverse a wormhole to save humanity', funFact: 'Physicist Kip Thorne’s mathematical models created the visual appearance of the black hole Gargantua.' },
    { word: 'CASABLANCA', hint: 'Classic wartime romance: "Here’s looking at you, kid"', funFact: 'The famous misquoted line is "Play it again, Sam" — the actual line is "Play it once, Sam."' },
    { word: 'JAWS', hint: 'The original 1975 summer blockbuster about a great white shark', funFact: 'The mechanical shark was nicknamed "Bruce" after director Steven Spielberg’s lawyer.' },
    { word: 'MATRIX', hint: 'Sci-fi cyberpunk film with red pill and bullet time', funFact: 'The cascading green digital rain code was sampled from Japanese sushi cookbook recipes!' },
  ],
  Gaming: [
    { word: 'NINTENDO', hint: 'Legendary Kyoto studio creator of Mario and Zelda', funFact: 'Founded all the way back in 1889 as a handmade Hanafuda playing card company!' },
    { word: 'MINECRAFT', hint: 'Block-building sandbox survival phenomenon', funFact: 'Best-selling video game in history with over 300 million copies sold.' },
    { word: 'POKEMON', hint: 'Creature-collecting franchise about pocket monsters', funFact: 'Highest-grossing media franchise in human history across games, cards, and anime.' },
    { word: 'PACMAN', hint: 'Arcade icon that chomps pellets and flees ghosts', funFact: 'Inspired by the visual shape of a pizza missing a single slice!' },
    { word: 'FORTNITE', hint: 'Battle royale game known for building and dance emotes', funFact: 'Hosted the first virtual in-game concert attended by over 12 million live players.' },
    { word: 'TETRIS', hint: 'Falling tetromino puzzle game created by Alexey Pajitnov', funFact: 'Developed in 1984 on an Electronika 60 computer behind the Soviet Iron Curtain.' },
    { word: 'WARCRAFT', hint: 'Fantasy strategy and MMO universe of Azeroth', funFact: 'World of Warcraft generated Guinness records for the most popular MMORPG in history.' },
    { word: 'ZELDA', hint: 'Hero Link embarks on quests across the kingdom of Hyrule', funFact: 'Named after Zelda Fitzgerald, the celebrated wife of novelist F. Scott Fitzgerald.' },
  ],
  Science: [
    { word: 'GRAVITY', hint: 'Fundamental force pulling masses together', funFact: 'Accelerates objects in Earth’s free fall at roughly 9.8 meters per second squared.' },
    { word: 'GALAXY', hint: 'Gravitationally bound system of billions of stars', funFact: 'The observable universe contains an estimated 2 trillion galaxies.' },
    { word: 'NEURON', hint: 'Electrically excitable cell transmitting nerve impulses', funFact: 'The human brain contains roughly 86 billion interconnected neurons.' },
    { word: 'MOLECULE', hint: 'Group of two or more chemically bonded atoms', funFact: 'Water molecules have a bent molecular geometry creating surface tension.' },
    { word: 'VOLCANO', hint: 'Rupture in planetary crust expelling magma and ash', funFact: 'Olympus Mons on Mars is the solar system’s largest volcano, 3x taller than Mt Everest.' },
    { word: 'TELESCOPE', hint: 'Optical instrument revealing distant celestial bodies', funFact: 'The James Webb Space Telescope orbits the Sun 1 million miles away from Earth.' },
    { word: 'ECLIPSE', hint: 'Obscuring of light from one celestial body by another', funFact: 'Total solar eclipses are possible because the Sun is 400x larger than the Moon, but 400x farther away.' },
    { word: 'FOSSIL', hint: 'Preserved mineralized remains of ancient biological organisms', funFact: 'Fossils have been found dating back over 3.5 billion years to primitive cyanobacteria.' },
  ],
};

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { maxMistakes: number; label: string; scoreMultiplier: number }> = {
  easy: { maxMistakes: 8, label: 'Easy (8 Lives)', scoreMultiplier: 1.0 },
  normal: { maxMistakes: 6, label: 'Normal (6 Lives)', scoreMultiplier: 1.5 },
  hard: { maxMistakes: 5, label: 'Hard (5 Lives)', scoreMultiplier: 2.2 },
};

export const HangmanGame: React.FC<GameComponentProps> = ({
  isPaused,
  onGameOver,
  onScoreChange,
  onRestartReady,
}) => {
  const [category, setCategory] = useState<string>('Animals');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [currentWordItem, setCurrentWordItem] = useState<WordItem>(() => {
    const list = CATEGORIES['Animals'];
    return list[Math.floor(Math.random() * list.length)];
  });
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const maxMistakes = DIFFICULTY_CONFIG[difficulty].maxMistakes;
  const word = currentWordItem.word.toUpperCase();
  const mistakeCount = Array.from(guessedLetters).filter((char) => !word.includes(char)).length;
  const livesRemaining = Math.max(0, maxMistakes - mistakeCount);

  // Pick new word
  const nextWord = useCallback(
    (catName: string = category, diff: Difficulty = difficulty) => {
      let pool: WordItem[] = [];
      if (catName === 'All') {
        Object.values(CATEGORIES).forEach((items) => pool.push(...items));
      } else {
        pool = CATEGORIES[catName] || CATEGORIES['Animals'];
      }

      let randomItem = pool[Math.floor(Math.random() * pool.length)];
      if (randomItem.word === currentWordItem.word && pool.length > 1) {
        randomItem = pool.find((item) => item.word !== currentWordItem.word) || randomItem;
      }
      setCurrentWordItem(randomItem);

      // On Easy, reveal 1 starter letter
      const initialLetters = new Set<string>();
      if (diff === 'easy') {
        const uniqueChars = Array.from(new Set(randomItem.word.split('')));
        const revealChar = uniqueChars[Math.floor(Math.random() * uniqueChars.length)];
        initialLetters.add(revealChar);
      }

      setGuessedLetters(initialLetters);
      setShowHint(false);
      setGameStatus('playing');
    },
    [category, difficulty, currentWordItem.word]
  );

  const fullReset = useCallback(() => {
    nextWord('Animals', 'normal');
    setCategory('Animals');
    setDifficulty('normal');
    setScore(0);
    setStreak(0);
    onScoreChangeRef.current(0);
  }, [nextWord]);

  useEffect(() => {
    onRestartReady(fullReset);
  }, [onRestartReady, fullReset]);

  // Handle letter guess
  const makeGuess = useCallback(
    (char: string) => {
      if (isPaused || gameStatus !== 'playing') return;
      if (guessedLetters.has(char)) return;

      const nextLetters = new Set(guessedLetters);
      nextLetters.add(char);
      setGuessedLetters(nextLetters);

      const isCorrect = word.includes(char);
      if (isCorrect) {
        sound.play('click');
        const isSolved = word.split('').every((c) => nextLetters.has(c));
        if (isSolved) {
          sound.play('win');
          setGameStatus('won');
          const mult = DIFFICULTY_CONFIG[difficulty].scoreMultiplier;
          const bonus = (maxMistakes - mistakeCount) * 25;
          const streakBonus = streak * 40;
          const roundPoints = Math.round((120 + bonus + streakBonus) * mult);
          const newScore = score + roundPoints;
          setScore(newScore);
          setStreak((s) => s + 1);
          onScoreChangeRef.current(newScore);
        }
      } else {
        sound.play('whack');
        const newMistakes = Array.from(nextLetters).filter((c) => !word.includes(c)).length;
        if (newMistakes >= maxMistakes) {
          sound.play('gameover');
          setGameStatus('lost');
          setStreak(0);
        }
      }
    },
    [isPaused, gameStatus, guessedLetters, word, mistakeCount, streak, score, maxMistakes, difficulty]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        makeGuess(key);
      } else if (key === 'H' && !showHint && gameStatus === 'playing') {
        setShowHint(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [makeGuess, isPaused, showHint, gameStatus]);

  const handleUseHint = () => {
    if (showHint || gameStatus !== 'playing') return;
    sound.play('tick');
    setShowHint(true);
  };

  const categoriesList = ['All', ...Object.keys(CATEGORIES)];

  return (
    <div className="flex flex-col items-center justify-center p-3 max-w-lg mx-auto w-full select-none">
      {/* Category selector pill bar */}
      <div className="w-full flex items-center justify-between gap-1.5 mb-2.5 max-w-[450px]">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-secondary/80 rounded-2xl border border-border-strong w-full no-scrollbar">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                nextWord(cat, difficulty);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty & HUD Bar */}
      <div className="w-full flex items-center justify-between max-w-[450px] mb-3 px-1 text-xs">
        <div className="flex items-center gap-1 bg-surface-secondary/60 p-1 rounded-xl border border-border-subtle">
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                nextWord(category, d);
              }}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                difficulty === d
                  ? 'bg-surface-card text-text-primary shadow-xs border border-border-strong'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-rose-500">
            <Heart size={14} className="fill-rose-500" />
            <span>{livesRemaining}/{maxMistakes}</span>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Sparkles size={11} />
              <span>{streak}x</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <span className="text-text-muted">Pts:</span>
            <strong className="font-extrabold text-accent tabular-nums">{score}</strong>
          </div>
        </div>
      </div>

      {/* Main Gallows & Blackboard Display Card */}
      <div className="relative w-full max-w-[450px] rounded-3xl bg-surface-card border-2 border-border-strong shadow-xl p-4 sm:p-5 flex flex-col items-center mb-3">
        {/* Expressive Stick Figure Gallows */}
        <div className="w-full max-w-[200px] h-36 relative flex items-center justify-center my-0.5">
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full stroke-text-primary fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round"
          >
            {/* Wooden Base & Beam */}
            <path d="M 20 150 L 75 150" />
            <path d="M 38 150 L 38 22" />
            <path d="M 38 22 L 110 22" />
            <path d="M 110 22 L 110 40" />
            <path d="M 38 45 L 62 22" />

            {/* Stage 1: Head with expressive face */}
            {mistakeCount >= 1 && (
              <g className="stroke-rose-500 stroke-[3]">
                <circle cx="110" cy="52" r="12" />
                {gameStatus === 'lost' ? (
                  /* Dead X eyes */
                  <>
                    <path d="M 106 48 L 109 51 M 109 48 L 106 51" />
                    <path d="M 111 48 L 114 51 M 114 48 L 111 51" />
                    <path d="M 107 57 Q 110 54 113 57" />
                  </>
                ) : mistakeCount >= 4 ? (
                  /* Worried face */
                  <>
                    <circle cx="107" cy="50" r="1" fill="currentColor" />
                    <circle cx="113" cy="50" r="1" fill="currentColor" />
                    <path d="M 107 57 Q 110 54 113 57" />
                  </>
                ) : (
                  /* Calm face */
                  <>
                    <circle cx="107" cy="50" r="1" fill="currentColor" />
                    <circle cx="113" cy="50" r="1" fill="currentColor" />
                    <path d="M 107 56 Q 110 59 113 56" />
                  </>
                )}
              </g>
            )}

            {/* Won celebratory crown */}
            {gameStatus === 'won' && (
              <path
                d="M 104 38 L 106 33 L 110 36 L 114 33 L 116 38 Z"
                className="stroke-amber-400 fill-amber-400 stroke-2"
              />
            )}

            {/* Stage 2: Spine / Torso */}
            {mistakeCount >= 2 && <path d="M 110 64 L 110 100" className="stroke-rose-500 stroke-[3]" />}

            {/* Stage 3: Left Arm */}
            {mistakeCount >= 3 && <path d="M 110 74 L 92 88" className="stroke-rose-500 stroke-[3]" />}

            {/* Stage 4: Right Arm */}
            {mistakeCount >= 4 && <path d="M 110 74 L 128 88" className="stroke-rose-500 stroke-[3]" />}

            {/* Stage 5: Left Leg */}
            {mistakeCount >= 5 && <path d="M 110 100 L 92 126" className="stroke-rose-500 stroke-[3]" />}

            {/* Stage 6: Right Leg */}
            {mistakeCount >= 6 && <path d="M 110 100 L 128 126" className="stroke-rose-500 stroke-[3]" />}
          </svg>
        </div>

        {/* Word Blanks Display */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-2.5 px-2">
          {word.split('').map((char, idx) => {
            const isRevealed = guessedLetters.has(char) || gameStatus === 'lost';
            const isMissed = gameStatus === 'lost' && !guessedLetters.has(char);

            return (
              <div
                key={idx}
                className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl border-2 flex items-center justify-center font-extrabold text-base sm:text-xl transition-all ${
                  isMissed
                    ? 'border-rose-500 text-rose-500 bg-rose-500/10'
                    : isRevealed
                    ? 'border-border-strong text-text-primary bg-surface-secondary shadow-xs'
                    : 'border-border-strong bg-surface-secondary/40 text-transparent'
                }`}
              >
                {isRevealed ? char : '_'}
              </div>
            );
          })}
        </div>

        {/* Clue & Fun Fact section */}
        {showHint ? (
          <div className="mt-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs text-center max-w-sm animate-in fade-in duration-200">
            <strong>Hint:</strong> {currentWordItem.hint}
          </div>
        ) : (
          <button
            onClick={handleUseHint}
            disabled={gameStatus !== 'playing'}
            className="mt-1 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
          >
            <Lightbulb size={13} className="text-amber-500" />
            <span>Need a clue? (Press H)</span>
          </button>
        )}

        {/* Word Result & Fun Fact Card */}
        {gameStatus !== 'playing' && (
          <div className="mt-3 w-full flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-secondary/80 border border-border-strong animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-xs font-bold ${
                  gameStatus === 'won' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {gameStatus === 'won' ? '🎉 Word Solved!' : `💀 Mystery Word: ${word}`}
              </span>

              <button
                onClick={() => nextWord(category, difficulty)}
                className="px-3 py-1 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Next Word</span>
              </button>
            </div>

            <p className="text-[11px] text-text-muted text-left w-full leading-relaxed border-t border-border-subtle pt-1.5">
              💡 <span className="font-semibold text-text-primary">Fun Fact:</span> {currentWordItem.funFact}
            </p>
          </div>
        )}
      </div>

      {/* On-Screen A-Z Keyboard Buttons */}
      <div className="w-full max-w-[450px] flex flex-col items-center gap-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
            {row.map((letter) => {
              const isGuessed = guessedLetters.has(letter);
              const isCorrect = isGuessed && word.includes(letter);
              const isWrong = isGuessed && !word.includes(letter);

              return (
                <button
                  key={letter}
                  onClick={() => makeGuess(letter)}
                  disabled={isGuessed || gameStatus !== 'playing'}
                  className={`h-9 sm:h-10 flex-1 max-w-[38px] rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                    isCorrect
                      ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                      : isWrong
                      ? 'bg-surface-secondary text-text-muted/40 line-through opacity-40 cursor-default'
                      : 'bg-surface-card hover:bg-surface-secondary active:scale-95 text-text-primary border border-border-strong shadow-xs'
                  }`}
                  aria-label={`Letter ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Finish Session button */}
      {score > 0 && (
        <div className="mt-3">
          <button
            onClick={() => onGameOverRef.current(score)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors border border-border-strong shadow-xs cursor-pointer"
          >
            <Trophy size={14} className="text-amber-500" />
            <span>Finish Session ({score} pts)</span>
          </button>
        </div>
      )}
    </div>
  );
};
