import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface CountingSheepGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export const CountingSheepGame: React.FC<CountingSheepGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [sheepCount, setSheepCount] = useState(0);
  const [options, setOptions] = useState<number[]>([]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    nextRound();
    setDoveMessage("How many sheep can you see?");
  };

  const nextRound = () => {
    const count = Math.floor(Math.random() * 5) + 1;
    setSheepCount(count);
    
    // Generate 3 options including the correct one
    const opts = new Set<number>();
    opts.add(count);
    while (opts.size < 3) {
      opts.add(Math.floor(Math.random() * 5) + 1);
    }
    setOptions(Array.from(opts).sort((a, b) => a - b));
  };

  const handleSelect = (num: number) => {
    if (gameState !== 'playing') return;

    if (num === sheepCount) {
      setScore(s => s + 1);
      setDoveCheering(true);
      setTimeout(() => setDoveCheering(false), 1000);
      nextRound();
    } else {
      setDoveMessage("Try counting again!");
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('sheep', score, 30);
      setDoveMessage(`Great job! You counted ${score} sheep!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-slate-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-slate-600">{timeLeft}s</span>
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
            <div className="text-6xl mb-6">🐑</div>
            <h2 className="text-3xl font-black text-slate-600 mb-4 text-center">Counting Sheep</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Count the fluffy sheep and pick the right number!
            </p>
            <button 
              onClick={startGame}
              className="bg-slate-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(71,85,105)] active:translate-y-1 active:shadow-none transition-all"
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
            className="flex flex-col items-center justify-center flex-1 w-full max-w-md"
          >
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {Array.from({ length: sheepCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-6xl"
                >
                  🐑
                </motion.div>
              ))}
            </div>

            <div className="flex gap-4 w-full justify-center">
              {options.map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelect(num)}
                  className="w-20 h-20 bg-white rounded-3xl shadow-lg border-4 border-slate-100 flex items-center justify-center text-3xl font-black text-slate-600 hover:border-slate-400 transition-all"
                >
                  {num}
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
            <h2 className="text-3xl font-black text-slate-600 mb-2">Counting Finished!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You counted {score} sheep sets!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-slate-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(71,85,105)] active:translate-y-1 active:shadow-none transition-all"
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
