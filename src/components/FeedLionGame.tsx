import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';

interface FeedLionGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function FeedLionGame({ language, onBack, setDoveMessage, setDoveCheering }: FeedLionGameProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [isEating, setIsEating] = useState(false);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Feed the lion the correct Tigrinya word!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const animalWords = words.filter(w => w.category === 'Nature' || w.category === 'Food');
    if (animalWords.length === 0) return;

    let numOptions = 2;
    if (currentLevel === 2) numOptions = 3;
    if (currentLevel >= 3) numOptions = 4;

    const target = animalWords[Math.floor(Math.random() * animalWords.length)];
    setCurrentTarget(target);
    
    const opts = new Set<any>();
    opts.add(target);
    while (opts.size < Math.min(numOptions, animalWords.length)) {
      const randomWord = animalWords[Math.floor(Math.random() * animalWords.length)];
      if (randomWord) opts.add(randomWord);
    }
    
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    
    const targetLang = language || 'english';
    const translation = target.translations[targetLang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, targetLang, target.audioUrl);
  }, [language]);

  const handleSelect = (id: string) => {
    if (gameState !== 'playing' || !currentTarget || isEating) return;

    if (id === currentTarget.id) {
      voiceCoach.playCorrect();
      setIsEating(true);
      setDoveCheering(true);
      setDoveMessage("Yum! The lion loved it!");
      
      const newScore = score + 10;
      setScore(newScore);
      
      let nextLevel = level;
      if (newScore > 0 && newScore % 50 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
      }
      
      setTimeout(() => {
        setIsEating(false);
        setDoveCheering(false);
        nextRound(nextLevel);
      }, 2000);
    } else {
      voiceCoach.playIncorrect();
      setDoveMessage("Oops! The lion didn't want that word. Try again!");
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('lion', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full p-6 pb-32 flex flex-col items-center justify-start bg-orange-50 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4 mt-2">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-orange-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-orange-600">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-orange-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-orange-600">{timeLeft}s</span>
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
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            <div className="text-6xl mb-6">🦁</div>
            <h2 className="text-3xl font-black text-orange-600 mb-4 text-center">Feed the Lion</h2>
            <p className="text-gray-600 font-bold mb-8 text-center max-w-xs">
              Feed the lion the correct Tigrinya word!
            </p>
            <button 
              onClick={startGame}
              className="bg-orange-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none transition-all"
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
            className="flex flex-col items-center justify-center flex-1 w-full max-w-md z-10"
          >
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-orange-100 mb-8 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Target Word:</p>
              <h3 className="text-4xl font-black text-orange-600">{currentTarget.translations[language || 'english']}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {options.map((item) => (
                <motion.button
                  key={item.id}
                  disabled={isEating}
                  onClick={() => handleSelect(item.id)}
                  className="bg-white p-6 rounded-2xl shadow-lg border-4 border-transparent hover:border-orange-400 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-3xl font-geez font-black text-gray-800">{item.translations.tigrinya}</span>
                </motion.button>
              ))}
            </div>

            {/* Eating Lion Animation */}
            <AnimatePresence>
              {isEating && (
                <motion.div
                  initial={{ y: 100, opacity: 0, scale: 0.5 }}
                  animate={{ 
                    y: 0, 
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.5, 1.5, 0.5]
                  }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute bottom-1/4 text-6xl pointer-events-none z-50"
                >
                  🦁
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-black text-orange-600 mb-2">Time Complete!</h2>
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
                className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none transition-all"
              >
                PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
