import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Clock } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface ClockTowerGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const TIMES = [
  { id: '1', time: '1:00', name: { english: 'One O\'clock', dutch: 'Eén uur', norwegian: 'Klokken ett', swedish: 'Klockan ett', german: 'Ein Uhr' } },
  { id: '3', time: '3:00', name: { english: 'Three O\'clock', dutch: 'Drie uur', norwegian: 'Klokken tre', swedish: 'Klockan tre', german: 'Drei Uhr' } },
  { id: '6', time: '6:00', name: { english: 'Six O\'clock', dutch: 'Zes uur', norwegian: 'Klokken seks', swedish: 'Klockan sex', german: 'Sechs Uhr' } },
  { id: '9', time: '9:00', name: { english: 'Nine O\'clock', dutch: 'Negen uur', norwegian: 'Klokken ni', swedish: 'Klockan ni', german: 'Neun Uhr' } },
  { id: '12', time: '12:00', name: { english: 'Twelve O\'clock', dutch: 'Twaalf uur', norwegian: 'Klokken twaalf', swedish: 'Klockan tolv', german: 'Zwölf Uhr' } },
];

export const ClockTowerGame: React.FC<ClockTowerGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState(TIMES[0]);
  const [options, setOptions] = useState(TIMES);

  const lang = (language || 'english') as keyof typeof TIMES[0]['name'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    nextRound();
    setDoveMessage("What time is it?");
  };

  const nextRound = () => {
    const target = TIMES[Math.floor(Math.random() * TIMES.length)];
    setCurrentTarget(target);
    setOptions([...TIMES].sort(() => Math.random() - 0.5));
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
      logGameSession('clock', score, 30);
      setDoveMessage(`Great job! You told the time ${score} times!`);
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
            <div className="text-6xl mb-6">🕰️</div>
            <h2 className="text-3xl font-black text-stone-600 mb-4 text-center">Clock Tower</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Learn to tell the time on the big clock tower!
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
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Find the time:</p>
              <h3 className="text-4xl font-black text-stone-600">{currentTarget.name[lang]}</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full overflow-y-auto max-h-[50vh] p-2">
              {options.map((time) => (
                <motion.button
                  key={time.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(time.id)}
                  className="bg-white p-6 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-stone-400 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Clock size={48} className="text-stone-400" />
                  <span className="text-2xl font-black text-stone-600">{time.time}</span>
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
            <h2 className="text-3xl font-black text-stone-600 mb-2">Time Master!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You matched {score} times!</p>
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
