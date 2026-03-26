import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface HideAndSeekGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function HideAndSeekGame({ language, onBack, setDoveMessage, setDoveCheering }: HideAndSeekGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetWord, setTargetWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const spawnNextRound = useCallback((currentLevel: number) => {
    // Pick 5-8 random words
    const numItems = Math.min(4 + Math.floor(currentLevel / 2), 8);
    const selectedWords = words.sort(() => 0.5 - Math.random()).slice(0, numItems);
    
    // Assign random positions (x: 10-90, y: 10-90)
    const positionedOptions = selectedWords.map(w => ({
      ...w,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      rotation: Math.random() * 60 - 30,
      scale: Math.random() * 0.5 + 0.8
    }));
    
    setOptions(positionedOptions);

    const newTarget = positionedOptions[Math.floor(Math.random() * positionedOptions.length)];
    setTargetWord(newTarget);
    
    const targetLang = language || 'english';
    const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
    
    voiceCoach.playDualAudio(
      translation,
      targetLang,
      newTarget.audioUrl
    );
    setDoveMessage(`Can you find the ${translation}?`);

    setIsAnimating(false);
  }, [language, setDoveMessage]);

  useEffect(() => {
    spawnNextRound(1);
  }, [spawnNextRound]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('hide', score, 60);
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
      voiceCoach.playSfx('score');
      setScore(s => s + 10);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      voiceCoach.speak("Found it! Great job!", language || 'english');
      
      setTimeout(() => {
        setDoveCheering(false);
        let nextLevel = level;
        if (score > 0 && score % 30 === 0) {
          nextLevel = level + 1;
          setLevel(nextLevel);
          setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
        }
        spawnNextRound(nextLevel);
      }, 1500);

    } else {
      // Incorrect
      voiceCoach.playSfx('wrong');
      voiceCoach.speak("Not quite! Keep looking!", language || 'english');
      setDoveMessage("Not quite! Keep looking!");
    }
  }, [gameOver, isAnimating, targetWord, language, score, level, setDoveCheering, setDoveMessage, spawnNextRound]);

  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
        <h2 className="text-xl font-black text-blue-600 mb-4">Game Over!</h2>
        <p className="text-base font-bold text-gray-700 mb-8">Score: {score}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              voiceCoach.playClick();
              setScore(0);
              setLevel(1);
              setGameOver(false);
              spawnNextRound(1);
            }}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-base shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none"
          >
            Play Again
          </button>
          <button 
            onClick={() => {
              voiceCoach.playClick();
              onBack();
            }}
            className="bg-gray-400 text-white px-8 py-4 rounded-2xl font-black text-base shadow-[0_6px_0_rgb(107,114,128)] active:translate-y-1 active:shadow-none"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-amber-50 p-4 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={() => {
            voiceCoach.playClick();
            onBack();
          }}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md text-xl"
        >
          🏠
        </button>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-amber-600 text-base">
            Level {level}
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-green-600 text-base">
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
        <h2 className="text-xl font-black text-amber-600">
          Find: {targetWord?.translations[language as keyof typeof targetWord.translations] || targetWord?.english}
        </h2>
      </div>

      <div className="flex-1 w-full max-w-3xl bg-amber-100/50 rounded-3xl border-4 border-amber-200 relative overflow-hidden shadow-inner">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-200/50 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-orange-200/50 rounded-full blur-xl" />
        
        <AnimatePresence>
          {options.map((opt) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: opt.scale, rotate: opt.rotation }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: opt.scale * 1.1 }}
              whileTap={{ scale: opt.scale * 0.9 }}
              onClick={() => {
                voiceCoach.playClick();
                handleSelect(opt);
              }}
              className="absolute text-2xl drop-shadow-lg flex items-center justify-center"
              style={{
                left: `${opt.x}%`,
                top: `${opt.y}%`,
                transform: `translate(-50%, -50%)`
              }}
            >
              {opt.emoji}
              {isAnimating && opt.id === targetWord?.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.5 }}
                  className="absolute inset-0 border-4 border-green-500 rounded-full"
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
