import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Zap } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';
import confetti from 'canvas-confetti';

interface Balloon {
  id: string;
  letter: string;
  color: string;
  x: number;
  y: number;
  speed: number;
  scale: number;
  rotation: number;
}

interface AlphabetBalloonGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const GEEZ_LETTERS = ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ', 'ተ', 'ቸ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዐ', 'ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ጸ', 'ፀ', 'ፈ', 'ፐ', 'ቨ'];
const BALLOON_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const spawnBalloon = useCallback((letter?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newBalloon: Balloon = {
      id,
      letter: letter || GEEZ_LETTERS[Math.floor(Math.random() * GEEZ_LETTERS.length)],
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      x: Math.random() * 80 + 10, // 10% to 90%
      y: 110, // Start below screen
      speed: 0.5 + Math.random() * 0.5 + (level * 0.1),
      scale: 0.8 + Math.random() * 0.4,
      rotation: (Math.random() - 0.5) * 20
    };
    return newBalloon;
  }, [level]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setCombo(0);
    setGameState('playing');
    
    const initialTarget = GEEZ_LETTERS[Math.floor(Math.random() * GEEZ_LETTERS.length)];
    setCurrentTarget(initialTarget);
    
    // Spawn initial balloons
    const initialBalloons = [];
    initialBalloons.push(spawnBalloon(initialTarget));
    for (let i = 0; i < 5; i++) {
      const b = spawnBalloon();
      b.y = 20 + i * 15; // Spread them out initially
      initialBalloons.push(b);
    }
    setBalloons(initialBalloons);
    setDoveMessage("Pop the right balloon!");
  };

  const handlePop = (balloon: Balloon) => {
    if (gameState !== 'playing') return;

    // Create pop effect
    setPopEffects(prev => [...prev, { id: Date.now(), x: balloon.x, y: balloon.y, color: balloon.color }]);
    setTimeout(() => {
      setPopEffects(prev => prev.filter(e => e.id !== Date.now()));
    }, 500);

    if (balloon.letter === currentTarget) {
      voiceCoach.playCorrect();
      const comboBonus = Math.floor(combo / 3) * 5;
      const points = 10 + comboBonus;
      const newScore = score + points;
      
      setScore(newScore);
      setCombo(prev => prev + 1);
      setDoveCheering(true);
      
      if (combo > 0 && combo % 5 === 0) {
        setDoveMessage(`${combo} COMBO! 🔥`);
      }

      let nextLevel = level;
      if (newScore > 0 && newScore % 100 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! Level ${nextLevel} 🚀`);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }

      // Pick new target
      const newTarget = GEEZ_LETTERS[Math.floor(Math.random() * GEEZ_LETTERS.length)];
      setCurrentTarget(newTarget);
      
      // Ensure the new target is on screen soon
      setBalloons(prev => {
        const filtered = prev.filter(b => b.id !== balloon.id);
        return [...filtered, spawnBalloon(newTarget)];
      });

      setTimeout(() => setDoveCheering(false), 1000);
    } else {
      voiceCoach.playIncorrect();
      setCombo(0);
      setDoveMessage("Oops! Try again!");
      setBalloons(prev => prev.filter(b => b.id !== balloon.id));
    }
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setBalloons(prev => {
        const moved = prev.map(b => ({
          ...b,
          y: b.y - b.speed,
          x: b.x + Math.sin(Date.now() / 1000 + parseInt(b.id, 36)) * 0.2 // Swaying
        }));

        // Remove balloons that went off screen
        const filtered = moved.filter(b => b.y > -20);
        
        // Spawn new ones to keep count
        if (filtered.length < 6 + level) {
          const needsTarget = !filtered.some(b => b.letter === currentTarget);
          filtered.push(spawnBalloon(needsTarget ? currentTarget : undefined));
        }

        return filtered;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameState, level, currentTarget, spawnBalloon]);

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
    <div className="w-full h-full bg-sky-100 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Background clouds */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 text-6xl">☁️</div>
        <div className="absolute top-40 right-20 text-8xl">☁️</div>
        <div className="absolute bottom-40 left-20 text-7xl">☁️</div>
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-20 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-sky-600 hover:scale-110 transition-transform border-2 border-sky-200"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-blue-100">
            <span className="font-black text-blue-600">LVL {level}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-yellow-100">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-yellow-600">{score}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-red-100">
            <Timer className={timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-red-400"} size={20} />
            <span className={`font-black ${timeLeft <= 10 ? "text-red-500" : "text-red-600"}`}>{timeLeft}s</span>
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
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl mb-6 drop-shadow-xl"
            >
              🎈
            </motion.div>
            <h2 className="text-5xl font-black text-red-500 mb-4 text-center drop-shadow-md">Balloon Pop!</h2>
            <p className="text-sky-800 font-bold mb-8 text-center max-w-xs text-lg">
              Pop the balloons with the correct letters to score points!
            </p>
            <button 
              onClick={startGame}
              className="bg-red-500 text-white px-16 py-5 rounded-full font-black text-3xl shadow-[0_10px_0_rgb(185,28,28)] hover:shadow-[0_5px_0_rgb(185,28,28)] hover:translate-y-[5px] active:translate-y-[10px] active:shadow-none transition-all"
            >
              LET'S GO!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-start flex-1 w-full relative"
          >
            {/* Target Display */}
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border-4 border-red-400 mb-6 text-center z-20 w-64">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-1">Find & Pop:</p>
              <h3 className="text-6xl font-geez font-black text-red-500">{currentTarget}</h3>
            </div>

            {/* Combo Indicator */}
            <AnimatePresence>
              {combo >= 3 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-32 right-4 z-30 bg-yellow-400 text-white px-4 py-2 rounded-full font-black shadow-lg flex items-center gap-2 border-2 border-white"
                >
                  <Zap size={20} fill="white" />
                  <span>{combo} COMBO!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Balloons Area */}
            <div ref={gameAreaRef} className="flex-1 w-full relative">
              {balloons.map((balloon) => (
                <motion.button
                  key={balloon.id}
                  onClick={() => handlePop(balloon)}
                  style={{
                    position: 'absolute',
                    left: `${balloon.x}%`,
                    top: `${balloon.y}%`,
                    scale: balloon.scale,
                    rotate: `${balloon.rotation}deg`
                  }}
                  className="w-24 h-32 flex flex-col items-center justify-center cursor-pointer group"
                >
                  {/* Balloon Body */}
                  <div 
                    className="w-20 h-24 rounded-full relative shadow-inner"
                    style={{ backgroundColor: balloon.color }}
                  >
                    {/* Highlight */}
                    <div className="absolute top-3 left-4 w-4 h-6 bg-white/30 rounded-full blur-[2px]" />
                    
                    {/* Letter */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-geez font-black text-white drop-shadow-md select-none">
                        {balloon.letter}
                      </span>
                    </div>

                    {/* Knot */}
                    <div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-3 rounded-sm"
                      style={{ backgroundColor: balloon.color }}
                    />
                  </div>
                  {/* String */}
                  <div className="w-0.5 h-12 bg-gray-400/50" />
                </motion.button>
              ))}

              {/* Pop Effects */}
              {popEffects.map(effect => (
                <motion.div
                  key={effect.id}
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  style={{
                    position: 'absolute',
                    left: `${effect.x}%`,
                    top: `${effect.y}%`,
                    color: effect.color
                  }}
                  className="text-4xl pointer-events-none z-30"
                >
                  💥
                </motion.div>
              ))}
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
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-md">Amazing!</h2>
            <p className="text-2xl font-bold text-sky-800 mb-8">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-white text-gray-600 px-10 py-5 rounded-3xl font-black text-xl shadow-[0_8px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-red-500 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-[0_10px_0_rgb(185,28,28)] active:translate-y-1 active:shadow-none transition-all border-4 border-white"
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

