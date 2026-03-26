import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface HoneyBeeGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const FLOWERS = [
  { id: 'red', icon: '🌹', color: 'bg-red-400', name: { english: 'Red', dutch: 'Rood', norwegian: 'Rød', swedish: 'Röd', german: 'Rot' } },
  { id: 'blue', icon: '🦋', color: 'bg-blue-400', name: { english: 'Blue', dutch: 'Blauw', norwegian: 'Blå', swedish: 'Blå', german: 'Blau' } },
  { id: 'yellow', icon: '🌻', color: 'bg-yellow-400', name: { english: 'Yellow', dutch: 'Geel', norwegian: 'Gul', swedish: 'Gul', german: 'Gelb' } },
  { id: 'pink', icon: '🌸', color: 'bg-pink-400', name: { english: 'Pink', dutch: 'Roze', norwegian: 'Rosa', swedish: 'Rosa', german: 'Rosa' } },
];

export const HoneyBeeGame: React.FC<HoneyBeeGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState(FLOWERS[0]);
  const [options, setOptions] = useState(FLOWERS);

  const lang = (language || 'english') as keyof typeof FLOWERS[0]['name'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    nextRound();
    setDoveMessage("Help the bee find the flower!");
  };

  const nextRound = () => {
    const target = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    setCurrentTarget(target);
    setOptions([...FLOWERS].sort(() => Math.random() - 0.5));
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
      logGameSession('honey', score, 30);
      setDoveMessage(`Great job! The bee collected ${score} flowers!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-yellow-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-yellow-600 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-yellow-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-yellow-600">{timeLeft}s</span>
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
            <div className="text-6xl mb-6">🐝</div>
            <h2 className="text-3xl font-black text-yellow-600 mb-4 text-center">Honey Bee</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Help the bee find the right colored flowers!
            </p>
            <button 
              onClick={startGame}
              className="bg-yellow-400 text-yellow-900 px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all"
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
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-yellow-100 mb-12 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Find the:</p>
              <h3 className="text-4xl font-black text-yellow-600">{currentTarget.name[lang]} flower</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full">
              {options.map((flower) => (
                <motion.button
                  key={flower.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(flower.id)}
                  className={`bg-white p-8 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-yellow-400 transition-all flex items-center justify-center text-6xl`}
                >
                  {flower.icon}
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
            <div className="text-6xl mb-6">🍯</div>
            <h2 className="text-3xl font-black text-yellow-600 mb-2">Honey Collected!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">The bee found {score} flowers!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-yellow-400 text-yellow-900 px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all"
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
