import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface DressUpGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function DressUpGame({ language, onBack, setDoveMessage, setDoveCheering }: DressUpGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetWord, setTargetWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [dressedItems, setDressedItems] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const spawnNextItem = useCallback(() => {
    const clothingWords = words.filter(w => w.category === 'Clothing');
    if (clothingWords.length === 0) return;

    // Pick a target that hasn't been dressed yet
    const availableTargets = clothingWords.filter(w => !dressedItems.find(d => d.id === w.id));
    
    if (availableTargets.length === 0) {
      // All items dressed!
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 }
      });
      voiceCoach.speak("Looking great!", language || 'english');
      setDoveMessage("Looking great!");
      
      setTimeout(() => {
        setDressedItems([]);
        if (score > 0 && score % 50 === 0) {
          setLevel(l => l + 1);
          setDoveMessage(`Level Up! You are now level ${level + 1}!`);
        }
        // Small delay before restarting
        setTimeout(() => {
          // Re-evaluate available targets after reset
          const newAvailable = clothingWords;
          const newTarget = newAvailable[Math.floor(Math.random() * newAvailable.length)];
          setTargetWord(newTarget);
          
          const targetLang = language || 'english';
          const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
          
          voiceCoach.playDualAudio(translation, targetLang, newTarget.audioUrl);
          setDoveMessage(`Find the ${translation}!`);

          const numWrongOptions = Math.min(2 + Math.floor(level / 2), 5);
          const wrongOptions = clothingWords
            .filter(w => w.id !== newTarget.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, numWrongOptions);
          
          const newOptions = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
          setOptions(newOptions);
          setIsAnimating(false);
        }, 500);
      }, 3000);
      return;
    }

    const newTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    setTargetWord(newTarget);
    
    const targetLang = language || 'english';
    const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
    
    voiceCoach.playDualAudio(
      translation,
      targetLang,
      newTarget.audioUrl
    );
    setDoveMessage(`Find the ${translation}!`);

    // Create 3-5 options
    const numWrongOptions = Math.min(2 + Math.floor(level / 2), 5);
    const wrongOptions = clothingWords
      .filter(w => w.id !== newTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, numWrongOptions);
    
    const newOptions = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
    setIsAnimating(false);
  }, [language, level, setDoveMessage, dressedItems, score]);

  useEffect(() => {
    spawnNextItem();
  }, [spawnNextItem]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('dressup', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleSelect = useCallback((word: any) => {
    if (gameOver || isAnimating) return;

    if (word.id === targetWord?.id) {
      // Correct
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      setDressedItems(prev => [...prev, word]);
      
      voiceCoach.speak("Perfect fit!", language || 'english');
      
      setTimeout(() => {
        setDoveCheering(false);
        // spawnNextItem will be called automatically because dressedItems changed
      }, 1500);

    } else {
      // Incorrect
      voiceCoach.speak("Oops! Try another one!", language || 'english');
      setDoveMessage("Oops! Try another one!");
    }
  }, [gameOver, isAnimating, targetWord, language, setDoveCheering, setDoveMessage]);

  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
        <h2 className="text-base font-black text-blue-600 mb-4">Game Over!</h2>
        <p className="text-sm font-bold text-gray-700 mb-8">Score: {score}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setScore(0);
              setLevel(1);
              setGameOver(false);
              setDressedItems([]);
              // spawnNextItem will run due to useEffect
            }}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none"
          >
            Play Again
          </button>
          <button 
            onClick={onBack}
            className="bg-gray-400 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_6px_0_rgb(107,114,128)] active:translate-y-1 active:shadow-none"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-pink-50 p-4 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-sm"
        >
          🏠
        </button>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-pink-600 text-sm">
            Level {level}
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-green-600 text-sm">
            Score: {score}
          </div>
        </div>
        <GameTimer 
          duration={60} 
          onTimeUp={handleGameEnd} 
          isPaused={gameOver || isAnimating} 
          resetKey={level}
        />
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-md border-2 border-white text-center mb-4 z-10">
        <h2 className="text-base font-black text-pink-600">
          Find: {targetWord?.translations[language as keyof typeof targetWord.translations] || targetWord?.english}
        </h2>
      </div>

      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-between max-h-[80vh] relative z-10">
        
        {/* Character */}
        <div className="w-48 h-64 relative mt-4 bg-white/50 rounded-3xl border-4 border-pink-200 flex items-center justify-center shadow-inner">
          <span className="text-8xl opacity-50">🧍</span>
          
          {/* Dressed Items */}
          <AnimatePresence>
            {dressedItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute text-6xl drop-shadow-md"
                style={{
                  // Simple positioning based on index for now
                  top: `${20 + (i * 15)}%`,
                  left: `${50 + (Math.random() * 20 - 10)}%`,
                  transform: 'translateX(-50%)',
                  zIndex: 20 + i
                }}
              >
                {item.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 w-full px-4 mt-auto pb-4">
          <AnimatePresence>
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(opt)}
                className="bg-white p-4 rounded-2xl shadow-md border-4 border-pink-100 flex items-center justify-center gap-4 hover:border-pink-300 transition-colors"
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-bold text-gray-700 uppercase">{opt.english}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
