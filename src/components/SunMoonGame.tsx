import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Sun, Moon, Star, Cloud } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface SunMoonGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const ITEMS = [
  { id: 'sun', icon: <Sun size={48} />, type: 'day', name: { english: 'Sun', dutch: 'Zon', norwegian: 'Sol', swedish: 'Sol', german: 'Sonne' } },
  { id: 'moon', icon: <Moon size={48} />, type: 'night', name: { english: 'Moon', dutch: 'Maan', norwegian: 'Måne', swedish: 'Måne', german: 'Mond' } },
  { id: 'star', icon: <Star size={48} />, type: 'night', name: { english: 'Star', dutch: 'Ster', norwegian: 'Stjerne', swedish: 'Stjärna', german: 'Stern' } },
  { id: 'cloud', icon: <Cloud size={48} />, type: 'day', name: { english: 'Cloud', dutch: 'Wolk', norwegian: 'Sky', swedish: 'Moln', german: 'Wolke' } },
];

export const SunMoonGame: React.FC<SunMoonGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState(ITEMS[0]);
  const [options, setOptions] = useState(ITEMS);

  const lang = (language || 'english') as keyof typeof ITEMS[0]['name'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    nextRound();
    setDoveMessage("Find the day or night item!");
  };

  const nextRound = () => {
    const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    setCurrentTarget(target);
    setOptions([...ITEMS].sort(() => Math.random() - 0.5));
  };

  const handleSelect = (id: string) => {
    if (gameState !== 'playing') return;

    if (id === currentTarget.id) {
      setScore(s => s + 1);
      setDoveCheering(true);
      setTimeout(() => setDoveCheering(false), 1000);
      nextRound();
    } else {
      setDoveMessage("Try again!");
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('sunmoon', score, 30);
      setDoveMessage(`Great job! You found ${score} items!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className={`w-full h-full transition-colors duration-1000 ${currentTarget.type === 'day' ? 'bg-sky-100' : 'bg-indigo-900'} flex flex-col items-center p-4 relative overflow-hidden`}>
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-indigo-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-indigo-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-indigo-600">{timeLeft}s</span>
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
            <div className="flex gap-4 mb-6">
              <div className="text-6xl">🌞</div>
              <div className="text-6xl">🌙</div>
            </div>
            <h2 className="text-3xl font-black text-indigo-600 mb-4 text-center">Sun & Moon</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Find the items that belong to the day or night!
            </p>
            <button 
              onClick={startGame}
              className="bg-indigo-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(49,46,129)] active:translate-y-1 active:shadow-none transition-all"
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
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-indigo-100 mb-12 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Find the:</p>
              <h3 className="text-4xl font-black text-indigo-600">{currentTarget.name[lang]}</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full">
              {options.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(item.id)}
                  className="bg-white p-8 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-indigo-400 transition-all flex items-center justify-center text-indigo-500"
                >
                  {item.icon}
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
            <h2 className="text-3xl font-black text-indigo-600 mb-2">Day & Night Master!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You found {score} items!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(49,46,129)] active:translate-y-1 active:shadow-none transition-all"
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
