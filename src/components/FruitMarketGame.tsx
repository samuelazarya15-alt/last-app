import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface FruitMarketGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function FruitMarketGame({ language, onBack, setDoveMessage, setDoveCheering }: FruitMarketGameProps) {
  const [score, setScore] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [basketFruits, setBasketFruits] = useState<string[]>([]);

  const fruitWords = words.filter(w => w.category === 'Food' || w.category === 'Nature');
  const currentWord = fruitWords[currentWordIndex];

  const generateOptions = useCallback((correctWord: any) => {
    const wrongOptions = fruitWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    
    return [correctWord, ...wrongOptions].sort(() => 0.5 - Math.random());
  }, [fruitWords]);

  useEffect(() => {
    if (fruitWords.length > 0 && !gameOver) {
      setOptions(generateOptions(fruitWords[currentWordIndex]));
      const targetLang = language || 'english';
      const translation = fruitWords[currentWordIndex].translations[targetLang as keyof typeof fruitWords[0]['translations']];
      
      voiceCoach.playDualAudio(
        translation,
        targetLang,
        fruitWords[currentWordIndex].audioUrl
      );
      setDoveMessage(`Can you find the ${translation}?`);
    }
  }, [currentWordIndex, language, gameOver, generateOptions]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('fruit', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleDrop = useCallback((fruit: any) => {
    if (isAnimating || gameOver) return;

    if (fruit.id === currentWord.id) {
      // Correct
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10 + (streak * 2));
      setStreak(s => s + 1);
      setBasketFruits(prev => [...prev, fruit.emoji]);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });

      voiceCoach.speak("Yum! That's right!", language || 'english');

      setTimeout(() => {
        setIsAnimating(false);
        setDoveCheering(false);
        
        if (currentWordIndex < fruitWords.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          if ((currentWordIndex + 1) % 5 === 0) {
            setLevel(l => l + 1);
            setDoveMessage(`Level Up! You are now level ${level + 1}!`);
          }
        } else {
          handleGameEnd();
        }
      }, 1500);
    } else {
      // Incorrect
      setStreak(0);
      voiceCoach.speak("Oops! Try again!", language || 'english');
      setDoveMessage("Oops! Try again!");
    }
  }, [isAnimating, gameOver, currentWord, streak, language, currentWordIndex, fruitWords.length, handleGameEnd, level, setDoveCheering, setDoveMessage]);

  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
        <h2 className="text-4xl font-black text-blue-600 mb-4">Game Over!</h2>
        <p className="text-2xl font-bold text-gray-700 mb-8">Score: {score}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setScore(0);
              setCurrentWordIndex(0);
              setLevel(1);
              setStreak(0);
              setBasketFruits([]);
              setGameOver(false);
            }}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none"
          >
            Play Again
          </button>
          <button 
            onClick={onBack}
            className="bg-gray-400 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(107,114,128)] active:translate-y-1 active:shadow-none"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-sky-50 p-4 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-2xl"
        >
          🏠
        </button>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-blue-600">
            Level {level}
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-green-600">
            Score: {score}
          </div>
        </div>
        <GameTimer 
          duration={60} 
          onTimeUp={handleGameEnd} 
          isPaused={isAnimating || gameOver} 
          resetKey={level}
        />
      </div>

      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-between max-h-[80vh]">
        {/* The Target Word */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] shadow-xl border-4 border-white text-center w-full max-w-[85%] mb-8">
          <h2 className="text-4xl font-black text-blue-500 mb-2">
            {currentWord?.translations[language as keyof typeof currentWord.translations] || currentWord?.english}
          </h2>
          <p className="text-xl font-bold text-gray-400 uppercase tracking-widest">
            {currentWord?.english}
          </p>
        </div>

        {/* The Fruits (Draggable options) */}
        <div className="flex justify-center gap-4 w-full mb-8">
          {options.map((option, i) => (
            <motion.button
              key={`${option.id}-${i}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDrop(option)}
              className="w-24 h-24 bg-white rounded-3xl shadow-lg border-4 border-gray-100 flex items-center justify-center text-5xl"
            >
              {option.emoji}
            </motion.button>
          ))}
        </div>

        {/* The Basket */}
        <div className="relative w-full max-w-sm h-48 bg-amber-200 rounded-b-[3rem] rounded-t-xl border-8 border-amber-600 shadow-2xl flex items-end justify-center overflow-hidden p-4">
          <div className="absolute top-0 w-full h-4 bg-amber-700/20" />
          <div className="flex flex-wrap-reverse justify-center gap-2 max-h-full overflow-hidden">
            <AnimatePresence>
              {basketFruits.map((fruit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, y: -50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="text-4xl"
                >
                  {fruit}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
