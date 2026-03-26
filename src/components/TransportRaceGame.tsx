import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Car, Bike, Truck, Plane } from 'lucide-react';
import { logGameSession } from '../lib/progress';

interface TransportRaceGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const VEHICLES = [
  { id: 'car', icon: <Car size={48} />, name: { english: 'Car', dutch: 'Auto', norwegian: 'Bil', swedish: 'Bil', german: 'Auto' } },
  { id: 'bike', icon: <Bike size={48} />, name: { english: 'Bike', dutch: 'Fiets', norwegian: 'Sykkel', swedish: 'Cykel', german: 'Fahrrad' } },
  { id: 'truck', icon: <Truck size={48} />, name: { english: 'Truck', dutch: 'Vrachtwagen', norwegian: 'Lastebil', swedish: 'Lastbil', german: 'LKW' } },
  { id: 'plane', icon: <Plane size={48} />, name: { english: 'Plane', dutch: 'Vliegtuig', norwegian: 'Fly', swedish: 'Flygplan', german: 'Flugzeug' } },
];

export const TransportRaceGame: React.FC<TransportRaceGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState(VEHICLES[0]);
  const [options, setOptions] = useState(VEHICLES);

  const lang = (language || 'english') as keyof typeof VEHICLES[0]['name'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    nextRound();
    setDoveMessage("Find the right vehicle!");
  };

  const nextRound = () => {
    const target = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    setCurrentTarget(target);
    // Shuffle options
    setOptions([...VEHICLES].sort(() => Math.random() - 0.5));
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
      logGameSession('transport', score, 30);
      setDoveMessage(`Great job! You found ${score} vehicles!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-sky-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-blue-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-blue-600">{timeLeft}s</span>
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
            <div className="text-6xl mb-6">🏎️</div>
            <h2 className="text-3xl font-black text-blue-600 mb-4 text-center">Transport Race</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Listen to the dove and find the right vehicle as fast as you can!
            </p>
            <button 
              onClick={startGame}
              className="bg-blue-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none transition-all"
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
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-blue-100 mb-12 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Find the:</p>
              <h3 className="text-4xl font-black text-blue-600">{currentTarget.name[lang]}</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full">
              {options.map((vehicle) => (
                <motion.button
                  key={vehicle.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(vehicle.id)}
                  className="bg-white p-8 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-blue-400 transition-all flex items-center justify-center text-blue-500"
                >
                  {vehicle.icon}
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
            <h2 className="text-3xl font-black text-blue-600 mb-2">Race Finished!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You found {score} vehicles!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none transition-all"
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
