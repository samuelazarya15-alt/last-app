import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Square, Circle, Triangle, Star, RectangleHorizontal } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';

interface ShapeSorterGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const SHAPE_ICONS: Record<string, React.ReactNode> = {
  'Circle': <Circle size={48} />,
  'Square': <Square size={48} />,
  'Triangle': <Triangle size={48} />,
  'Rectangle': <RectangleHorizontal size={48} />,
  'Star': <Star size={48} />
};

export const ShapeSorterGame: React.FC<ShapeSorterGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [level, setLevel] = useState(1);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Find the right shape!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const shapeWords = words.filter(w => w.category === 'Shapes');
    if (shapeWords.length === 0) return;

    let numOptions = 2;
    if (currentLevel === 2) numOptions = 4;
    if (currentLevel >= 3) numOptions = 5;

    const availableShapes = shapeWords.slice(0, numOptions);
    const target = availableShapes[Math.floor(Math.random() * availableShapes.length)];
    
    setCurrentTarget(target);
    setOptions([...availableShapes].sort(() => Math.random() - 0.5));
    
    const targetLang = language || 'english';
    const translation = target.translations[targetLang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, targetLang, target.audioUrl);
  }, [language]);

  const handleSelect = (id: string) => {
    if (gameState !== 'playing' || !currentTarget) return;

    if (id === currentTarget.id) {
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
      logGameSession('shapes', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-purple-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-purple-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-blue-600">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-purple-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-purple-600">{timeLeft}s</span>
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
            <div className="text-6xl mb-6">🔺</div>
            <h2 className="text-3xl font-black text-purple-600 mb-4 text-center">Shape Sorter</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Sort the shapes as fast as you can and learn Tigrinya names!
            </p>
            <button 
              onClick={startGame}
              className="bg-purple-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none transition-all"
            >
              START!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && currentTarget && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center flex-1 w-full max-w-md"
          >
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-purple-100 mb-12 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Find the Tigrinya word for:</p>
              <h3 className="text-4xl font-black text-purple-600">{currentTarget.translations[language || 'english']}</h3>
            </div>

            <div className="flex flex-wrap justify-center gap-6 w-full">
              {options.map((shape) => (
                <motion.button
                  key={shape.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(shape.id)}
                  className="bg-white p-8 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-purple-400 transition-all flex flex-col items-center justify-center gap-2 text-purple-500"
                >
                  {SHAPE_ICONS[shape.english] || <Square size={48} />}
                  <span className="text-2xl font-geez font-bold text-purple-800">{shape.translations.tigrinya}</span>
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
            <h2 className="text-3xl font-black text-purple-600 mb-2">Shapes Sorted!</h2>
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
                className="bg-purple-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none transition-all"
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
