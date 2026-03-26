import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface BodyPartsGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const BODY_PARTS = [
  { id: 'eyes', icon: '👀', name: { english: 'Eyes', dutch: 'Ogen', norwegian: 'Øyne', swedish: 'Ögon', german: 'Augen' } },
  { id: 'nose', icon: '👃', name: { english: 'Nose', dutch: 'Neus', norwegian: 'Nese', swedish: 'Näsa', german: 'Nase' } },
  { id: 'ears', icon: '👂', name: { english: 'Ears', dutch: 'Oren', norwegian: 'Ører', swedish: 'Öron', german: 'Ohren' } },
  { id: 'mouth', icon: '👄', name: { english: 'Mouth', dutch: 'Mond', norwegian: 'Munn', swedish: 'Mun', german: 'Mund' } },
  { id: 'hands', icon: '🙌', name: { english: 'Hands', dutch: 'Handen', norwegian: 'Hender', swedish: 'Händer', german: 'Hände' } },
  { id: 'feet', icon: '👣', name: { english: 'Feet', dutch: 'Voeten', norwegian: 'Føtter', swedish: 'Fötter', german: 'Füße' } },
];

export const BodyPartsGame: React.FC<BodyPartsGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState(BODY_PARTS[0]);
  const [options, setOptions] = useState(BODY_PARTS);

  const lang = (language || 'english') as keyof typeof BODY_PARTS[0]['name'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    nextRound();
    setDoveMessage("Find the body part!");
  };

  const nextRound = () => {
    const target = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
    setCurrentTarget(target);
    setOptions([...BODY_PARTS].sort(() => Math.random() - 0.5));
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
      logGameSession('body', score, 30);
      setDoveMessage(`Great job! You identified ${score} body parts!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-rose-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-rose-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-rose-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-rose-600">{timeLeft}s</span>
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
            <div className="text-6xl mb-6">👀</div>
            <h2 className="text-3xl font-black text-rose-600 mb-4 text-center">Body Parts</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Learn the names of body parts in your language!
            </p>
            <button 
              onClick={startGame}
              className="bg-rose-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(225,29,72)] active:translate-y-1 active:shadow-none transition-all"
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
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-rose-100 mb-12 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Find the:</p>
              <h3 className="text-4xl font-black text-rose-600">{currentTarget.name[lang]}</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full overflow-y-auto max-h-[50vh] p-2">
              {options.map((part) => (
                <motion.button
                  key={part.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(part.id)}
                  className="bg-white p-6 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-rose-400 transition-all flex items-center justify-center text-6xl"
                >
                  {part.icon}
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
            <h2 className="text-3xl font-black text-rose-600 mb-2">Well Done!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You found {score} body parts!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(225,29,72)] active:translate-y-1 active:shadow-none transition-all"
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
