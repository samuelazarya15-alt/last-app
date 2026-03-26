import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface CoffeeCeremonyGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const STEPS = [
  { id: 'beans', icon: '🫘', name: { english: 'Roast Beans', dutch: 'Bonen roosteren', norwegian: 'Riste bønner', swedish: 'Rosta bönor', german: 'Bohnen rösten' } },
  { id: 'grind', icon: '🔨', name: { english: 'Grind Beans', dutch: 'Bonen malen', norwegian: 'Male bønner', swedish: 'Mala bönor', german: 'Bohnen mahlen' } },
  { id: 'boil', icon: '🔥', name: { english: 'Boil Water', dutch: 'Water koken', norwegian: 'Koke vann', swedish: 'Koka vatten', german: 'Wasser kochen' } },
  { id: 'pour', icon: '☕', name: { english: 'Pour Coffee', dutch: 'Koffie inschenken', norwegian: 'Helle kaffe', swedish: 'Hälla kaffe', german: 'Kaffee einschenken' } },
];

export const CoffeeCeremonyGame: React.FC<CoffeeCeremonyGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const lang = (language || 'english') as keyof typeof STEPS[0]['name'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    setCurrentStepIndex(0);
    setDoveMessage("Let's make some coffee!");
  };

  const handleStepClick = (id: string) => {
    if (gameState !== 'playing') return;

    if (id === STEPS[currentStepIndex].id) {
      if (currentStepIndex === STEPS.length - 1) {
        setScore(s => s + 1);
        setDoveCheering(true);
        setTimeout(() => setDoveCheering(false), 1000);
        setCurrentStepIndex(0);
        setDoveMessage("Delicious! Let's make another one!");
      } else {
        setCurrentStepIndex(i => i + 1);
      }
    } else {
      setDoveMessage("That's not the right step!");
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('coffee', score, 30);
      setDoveMessage(`Great job! You made ${score} cups of coffee!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-stone-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-stone-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-stone-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-stone-600">{timeLeft}s</span>
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
            <div className="text-6xl mb-6">☕</div>
            <h2 className="text-3xl font-black text-stone-600 mb-4 text-center">Coffee Ceremony</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Follow the steps to make traditional coffee!
            </p>
            <button 
              onClick={startGame}
              className="bg-stone-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(120,113,108)] active:translate-y-1 active:shadow-none transition-all"
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
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-stone-100 mb-12 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Next Step:</p>
              <h3 className="text-4xl font-black text-stone-600">{STEPS[currentStepIndex].name[lang]}</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full">
              {STEPS.map((step) => (
                <motion.button
                  key={step.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStepClick(step.id)}
                  className={`bg-white p-8 rounded-[2rem] shadow-lg border-4 transition-all flex items-center justify-center text-6xl ${
                    step.id === STEPS[currentStepIndex].id ? 'border-stone-400 bg-stone-50' : 'border-transparent'
                  }`}
                >
                  {step.icon}
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
            <h2 className="text-3xl font-black text-stone-600 mb-2">Ceremony Complete!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You made {score} cups of coffee!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-stone-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(120,113,108)] active:translate-y-1 active:shadow-none transition-all"
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
