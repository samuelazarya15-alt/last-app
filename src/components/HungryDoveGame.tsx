import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface HungryDoveGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function HungryDoveGame({ language, onBack, setDoveMessage, setDoveCheering }: HungryDoveGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [fallingWords, setFallingWords] = useState<any[]>([]);
  const [targetWord, setTargetWord] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const spawnNextWord = useCallback(() => {
    const newTarget = words[Math.floor(Math.random() * words.length)];
    setTargetWord(newTarget);
    
    const targetLang = language || 'english';
    const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
    
    voiceCoach.playDualAudio(
      translation,
      targetLang,
      newTarget.audioUrl
    );
    setDoveMessage(`Catch the ${translation}!`);

    // Create 3 falling options
    const wrongOptions = words
      .filter(w => w.id !== newTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    
    const options = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
    
    const newFallingWords = options.map((opt, i) => ({
      ...opt,
      uniqueId: `${opt.id}-${Date.now()}-${i}`,
      x: 20 + (i * 30), // Spread them out horizontally (20%, 50%, 80%)
      duration: 5 - (level * 0.5) + (Math.random() * 1) // Faster as level increases
    }));

    setFallingWords(newFallingWords);
    setIsAnimating(false);
  }, [language, level, setDoveMessage]);

  useEffect(() => {
    spawnNextWord();
  }, [spawnNextWord]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setFallingWords([]);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('hungry', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleCatch = useCallback((word: any) => {
    if (gameOver || isAnimating) return;

    if (word.english === targetWord?.english) {
      // Correct
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 }
      });

      voiceCoach.speak("Yum! Good catch!", language || 'english');
      setFallingWords([]); // Clear screen
      
      setTimeout(() => {
        setDoveCheering(false);
        if (score > 0 && score % 50 === 0) {
          setLevel(l => l + 1);
          setDoveMessage(`Level Up! You are now level ${level + 1}!`);
        }
        spawnNextWord();
      }, 1000);
    } else {
      // Incorrect
      voiceCoach.speak("Yuck! Not that one!", language || 'english');
      setDoveMessage("Yuck! Not that one!");
      setFallingWords(prev => prev.filter(w => w.uniqueId !== word.uniqueId)); // Remove the wrong one
    }
  }, [gameOver, isAnimating, targetWord, language, score, level, setDoveCheering, setDoveMessage, spawnNextWord]);

  const handleMissed = useCallback((word: any) => {
    if (gameOver || isAnimating) return;
    
    if (word.english === targetWord?.english) {
      setIsAnimating(true);
      voiceCoach.speak("Oh no! We missed it!", language || 'english');
      setDoveMessage("Oh no! We missed it!");
      setFallingWords([]);
      setTimeout(spawnNextWord, 1000);
    } else {
      setFallingWords(prev => prev.filter(w => w.uniqueId !== word.uniqueId));
    }
  }, [gameOver, isAnimating, targetWord, language, setDoveMessage, spawnNextWord]);


  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
        <h2 className="text-4xl font-black text-blue-600 mb-4">Game Over!</h2>
        <p className="text-2xl font-bold text-gray-700 mb-8">Score: {score}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setScore(0);
              setLevel(1);
              setGameOver(false);
              spawnNextWord();
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
          isPaused={gameOver || isAnimating} 
          resetKey={level}
        />
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-md border-2 border-white text-center mb-4 z-10">
        <h2 className="text-2xl font-black text-blue-500">
          Catch: {targetWord?.translations[language as keyof typeof targetWord.translations] || targetWord?.english}
        </h2>
      </div>

      <div className="flex-1 w-full max-w-2xl relative max-h-[80vh] bg-sky-100 rounded-[2rem] border-4 border-sky-200 overflow-hidden">
        <AnimatePresence>
          {fallingWords.map((word) => (
            <motion.button
              key={word.uniqueId}
              initial={{ y: -100, x: `${word.x}%`, opacity: 0, scale: 0.5 }}
              animate={{ y: '80vh', opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                y: { duration: Math.max(2, word.duration), ease: "linear" },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              onAnimationComplete={() => handleMissed(word)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCatch(word)}
              className="absolute w-20 h-20 bg-white rounded-full shadow-lg border-4 border-amber-100 flex items-center justify-center text-4xl z-20"
              style={{ left: `${word.x}%`, transform: 'translateX(-50%)' }}
            >
              {word.emoji}
            </motion.button>
          ))}
        </AnimatePresence>
        
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-16 bg-green-400 rounded-b-[1.5rem] z-10 flex items-center justify-center">
           <span className="text-green-800/50 font-bold tracking-widest uppercase">Ground</span>
        </div>
      </div>
    </div>
  );
}
