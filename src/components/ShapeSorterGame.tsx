import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Square, Circle, Triangle, Star, RectangleHorizontal, Zap } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';
import confetti from 'canvas-confetti';

interface ShapeSorterGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const SHAPE_ICONS: Record<string, any> = {
  'Circle': Circle,
  'Square': Square,
  'Triangle': Triangle,
  'Rectangle': RectangleHorizontal,
  'Star': Star
};

const SHAPE_COLORS: Record<string, string> = {
  'Circle': 'bg-red-500',
  'Square': 'bg-blue-500',
  'Triangle': 'bg-green-500',
  'Rectangle': 'bg-yellow-500',
  'Star': 'bg-purple-500'
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
  const [isSuccess, setIsSuccess] = useState(false);
  
  const constraintsRef = useRef(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Drag the shape to the matching word!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const shapeWords = words.filter(w => w.category === 'Shapes');
    if (shapeWords.length === 0) return;

    let numOptions = 3;
    if (currentLevel >= 3) numOptions = 4;
    if (currentLevel >= 5) numOptions = 5;

    const shuffled = [...shapeWords].sort(() => Math.random() - 0.5);
    const availableShapes = shuffled.slice(0, numOptions);
    const target = availableShapes[Math.floor(Math.random() * availableShapes.length)];
    
    setCurrentTarget(target);
    setOptions(availableShapes.sort(() => Math.random() - 0.5));
    setIsSuccess(false);
    
    const targetLang = language || 'english';
    const translation = target.translations[targetLang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, targetLang, target.audioUrl);
  }, [language]);

  const handleMatch = (id: string) => {
    if (gameState !== 'playing' || !currentTarget || isSuccess) return;

    if (id === currentTarget.id) {
      const newScore = score + 10;
      setScore(newScore);
      setDoveCheering(true);
      voiceCoach.playCorrect();
      setIsSuccess(true);
      
      let nextLevel = level;
      if (newScore > 0 && newScore % 50 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      setTimeout(() => {
        setDoveCheering(false);
        nextRound(nextLevel);
      }, 1500);
    } else {
      voiceCoach.playIncorrect();
      setDoveMessage("Oops! Try another one.");
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

  const TargetIcon = currentTarget ? SHAPE_ICONS[currentTarget.english] : Square;

  return (
    <div className="w-full h-full bg-orange-50 flex flex-col items-center p-4 relative overflow-hidden" ref={constraintsRef}>
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="grid grid-cols-6 gap-8 p-4">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="text-4xl">🧸</div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-20 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-orange-500 hover:scale-110 transition-transform border-2 border-orange-100"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-blue-100">
            <span className="font-black text-blue-600">LVL {level}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-yellow-100">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-orange-600">{score}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-red-100">
            <Timer className={timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-red-400"} size={20} />
            <span className={`font-black ${timeLeft <= 10 ? "text-red-500" : "text-orange-600"}`}>{timeLeft}s</span>
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
            className="flex flex-col items-center justify-center flex-1 z-20"
          >
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-8xl mb-6 drop-shadow-xl"
            >
              🧩
            </motion.div>
            <h2 className="text-5xl font-black text-orange-600 mb-4 text-center drop-shadow-md">Shape Sorter</h2>
            <p className="text-orange-800 font-bold mb-8 text-center max-w-xs text-lg">
              Match the shapes to their Tigrinya names!
            </p>
            <button 
              onClick={startGame}
              className="bg-orange-500 text-white px-16 py-5 rounded-full font-black text-3xl shadow-[0_10px_0_rgb(194,65,12)] hover:shadow-[0_5px_0_rgb(194,65,12)] hover:translate-y-[5px] active:translate-y-[10px] active:shadow-none transition-all"
            >
              PLAY!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && currentTarget && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-between flex-1 w-full max-w-2xl py-8 z-20"
          >
            {/* Target Shape (The one to drag) */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-orange-400 font-black uppercase tracking-widest text-sm">Drag this shape:</p>
              <motion.div
                drag
                dragConstraints={constraintsRef}
                dragSnapToOrigin
                onDragEnd={(_, info) => {
                  // Basic hit detection logic could go here if we had target refs
                  // For now, let's keep it simple click-based or just use the drag for visual fun
                }}
                whileDrag={{ scale: 1.2, zIndex: 50 }}
                className={`w-40 h-40 ${SHAPE_COLORS[currentTarget.english]} rounded-3xl shadow-2xl flex items-center justify-center text-white border-8 border-white/30 cursor-grab active:cursor-grabbing relative`}
              >
                <TargetIcon size={80} strokeWidth={3} />
                <div className="absolute -top-2 -right-2 bg-white text-orange-500 p-2 rounded-full shadow-lg">
                  <Zap size={20} fill="currentColor" />
                </div>
              </motion.div>
              <h3 className="text-2xl font-black text-orange-700 mt-2">
                {currentTarget.translations[language || 'english']}
              </h3>
            </div>

            {/* Drop Zones (The options) */}
            <div className="w-full">
              <p className="text-center text-orange-400 font-black uppercase tracking-widest text-sm mb-4">To the correct word:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                {options.map((shape) => (
                  <motion.button
                    key={shape.id}
                    whileHover={{ scale: 1.05, backgroundColor: '#fff' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMatch(shape.id)}
                    className={`bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-lg border-4 transition-all flex flex-col items-center justify-center gap-2 ${
                      isSuccess && shape.id === currentTarget.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-orange-200 hover:border-orange-400'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-300 mb-1">
                      {React.createElement(SHAPE_ICONS[shape.english] || Square, { size: 32 })}
                    </div>
                    <span className="text-2xl font-geez font-black text-orange-900">{shape.translations.tigrinya}</span>
                    {isSuccess && shape.id === currentTarget.id && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                        <Trophy size={16} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 z-20"
          >
            <div className="text-8xl mb-6">🥇</div>
            <h2 className="text-5xl font-black text-orange-600 mb-2 drop-shadow-md">Great Sorting!</h2>
            <p className="text-2xl font-bold text-orange-800 mb-8">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-white text-gray-600 px-10 py-5 rounded-3xl font-black text-xl shadow-[0_8px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-orange-500 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-[0_10px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none transition-all border-4 border-white"
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

