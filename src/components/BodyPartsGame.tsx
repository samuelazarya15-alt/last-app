import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';

interface BodyPartsGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export const BodyPartsGame: React.FC<BodyPartsGameProps> = ({
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

  const lang = (language || 'english');

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Find the body part!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const bodyWords = words.filter(w => w.category === 'Body');
    if (bodyWords.length === 0) return;

    const numOptions = Math.min(2 + currentLevel * 2, 8); // 4, 6, 8 options based on level
    const shuffled = [...bodyWords].sort(() => Math.random() - 0.5);
    const selectedOptions = shuffled.slice(0, numOptions);
    
    const target = selectedOptions[Math.floor(Math.random() * selectedOptions.length)];
    setCurrentTarget(target);
    setOptions(selectedOptions.sort(() => Math.random() - 0.5));
    
    const translation = target.translations[lang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, lang, target.audioUrl);
  }, [lang]);

  const handleSelect = (id: string) => {
    if (gameState !== 'playing') return;

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
      } else {
        setDoveMessage("Great job!");
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
      logGameSession('body', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-rose-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-rose-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-blue-600">Lvl {level}</span>
          </div>
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
              Learn the names of body parts in Tigrinya and your language!
            </p>
            <button 
              onClick={startGame}
              className="bg-rose-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(225,29,72)] active:translate-y-1 active:shadow-none transition-all"
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
            className="flex flex-col items-center justify-start flex-1 w-full max-w-md"
          >
            <div className="bg-white p-4 rounded-[2rem] shadow-xl border-4 border-rose-100 mb-6 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-1">Find the Tigrinya word for:</p>
              <h3 className="text-3xl font-black text-rose-600">{currentTarget.translations[lang as keyof typeof currentTarget.translations]}</h3>
            </div>

            <div className={`grid ${options.length > 4 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 w-full overflow-y-auto max-h-[50vh] p-2`}>
              {options.map((part) => (
                <motion.button
                  key={part.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(part.id)}
                  className="bg-white p-4 rounded-[1.5rem] shadow-md border-4 border-transparent hover:border-rose-400 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-5xl">{part.emoji}</span>
                  <span className="text-xl font-geez font-bold text-rose-800">{part.translations.tigrinya}</span>
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
