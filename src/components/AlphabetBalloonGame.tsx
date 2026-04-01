import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

interface AlphabetBalloonGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const GEEZ_LETTERS = ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ', 'ተ', 'ቸ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዐ', 'ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ጸ', 'ፀ', 'ፈ', 'ፐ', 'ቨ'];

export const AlphabetBalloonGame: React.FC<AlphabetBalloonGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState('ሀ');
  const [options, setOptions] = useState<string[]>([]);
  const [level, setLevel] = useState(1);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Pop the right balloon!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const target = GEEZ_LETTERS[Math.floor(Math.random() * GEEZ_LETTERS.length)];
    setCurrentTarget(target);
    
    const numOptions = Math.min(2 + currentLevel * 2, 8); // 4, 6, 8 options
    const opts = new Set<string>();
    opts.add(target);
    while (opts.size < numOptions) {
      opts.add(GEEZ_LETTERS[Math.floor(Math.random() * GEEZ_LETTERS.length)]);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  }, []);

  const handleSelect = (letter: string) => {
    if (gameState !== 'playing') return;

    if (letter === currentTarget) {
      const newScore = score + 10;
      setScore(newScore);
      setDoveCheering(true);
      voiceCoach.playCorrect();
      
      let nextLevel = level;
      if (newScore > 0 && newScore % 50 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
      }
      
      setTimeout(() => {
        setDoveCheering(false);
        nextRound(nextLevel);
      }, 1000);
    } else {
      voiceCoach.playIncorrect();
      setDoveMessage("Try again!");
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('balloon', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-red-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-red-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-blue-600">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-red-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-red-600">{timeLeft}s</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center flex-1"
          >
            <div className="text-6xl mb-6">🎈</div>
            <h2 className="text-3xl font-black text-red-600 mb-4 text-center">Alphabet Balloon</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Pop the balloon with the correct Tigrinya letter as fast as you can!
            </p>
            <button 
              onClick={startGame}
              className="bg-red-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(220,38,38)] active:translate-y-1 active:shadow-none transition-all"
            >
              START!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-start flex-1 w-full max-w-md"
          >
            <div className="bg-white p-4 rounded-[2rem] shadow-xl border-4 border-red-100 mb-6 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-1">Pop the:</p>
              <h3 className="text-5xl font-geez font-black text-red-600">{currentTarget}</h3>
            </div>

            <div className={`grid ${options.length > 4 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 w-full overflow-y-auto max-h-[50vh] p-2`}>
              {options.map((letter, i) => (
                <motion.button
                  key={`${letter}-${i}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(letter)}
                  className="bg-white p-4 rounded-[1.5rem] shadow-md border-4 border-transparent hover:border-red-400 transition-all flex items-center justify-center text-5xl font-geez font-black text-red-500 aspect-square relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">🎈</div>
                  <span className="relative z-10">{letter}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1"
          >
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-black text-red-600 mb-2">Well Done!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(220,38,38)] active:translate-y-1 active:shadow-none transition-all"
              >
                PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
