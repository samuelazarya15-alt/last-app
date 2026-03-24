import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface ColorSplashGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function ColorSplashGame({ language, onBack, setDoveMessage, setDoveCheering }: ColorSplashGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetColor, setTargetColor] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [splashes, setSplashes] = useState<string[]>([]);

  const spawnNextColor = useCallback(() => {
    const colorWords = words.filter(w => w.category === 'Colors');
    if (colorWords.length === 0) return;

    const newTarget = colorWords[Math.floor(Math.random() * colorWords.length)];
    setTargetColor(newTarget);
    
    const targetLang = language || 'english';
    const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
    
    voiceCoach.playDualAudio(
      translation,
      targetLang,
      newTarget.audioUrl
    );
    setDoveMessage(`Find the color ${translation}!`);

    // Create 3-5 color options
    const numWrongOptions = Math.min(2 + Math.floor(level / 2), 5);
    const wrongOptions = colorWords
      .filter(w => w.id !== newTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, numWrongOptions);
    
    const newOptions = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
    setIsAnimating(false);
  }, [language, level, setDoveMessage]);

  useEffect(() => {
    spawnNextColor();
  }, [spawnNextColor]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('color', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleSplash = useCallback((color: any) => {
    if (gameOver || isAnimating) return;

    if (color.id === targetColor?.id) {
      // Correct
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      // Add a splash to the background
      setSplashes(prev => [...prev, color.english.toLowerCase()]);
      
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.6 },
        colors: [color.english.toLowerCase()] // Try to use the actual color
      });

      voiceCoach.speak("Splash! That's it!", language || 'english');
      
      setTimeout(() => {
        setDoveCheering(false);
        if (score > 0 && score % 50 === 0) {
          setLevel(l => l + 1);
          setDoveMessage(`Level Up! You are now level ${level + 1}!`);
        }
        spawnNextColor();
      }, 1500);
    } else {
      // Incorrect
      voiceCoach.speak("Oops! Wrong color!", language || 'english');
      setDoveMessage("Oops! Wrong color!");
    }
  }, [gameOver, isAnimating, targetColor, language, score, level, setDoveCheering, setDoveMessage, spawnNextColor]);

  // Helper to map color names to Tailwind classes or hex codes
  const getColorStyle = (colorName: string) => {
    const map: Record<string, string> = {
      'Red': '#ef4444',
      'Blue': '#3b82f6',
      'Green': '#22c55e',
      'Yellow': '#eab308',
      'Orange': '#f97316',
      'Purple': '#a855f7',
      'Pink': '#ec4899',
      'Brown': '#a16207',
      'Black': '#1f2937',
      'White': '#ffffff',
      'Gray': '#9ca3af'
    };
    return map[colorName] || '#cbd5e1';
  };

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
              setSplashes([]);
              spawnNextColor();
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
      {/* Background Splashes */}
      {splashes.map((splashColor, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: Math.random() * 2 + 1, opacity: 0.2 }}
          className="absolute rounded-full blur-xl pointer-events-none"
          style={{
            backgroundColor: getColorStyle(splashColor),
            width: '200px',
            height: '200px',
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 80}%`,
            zIndex: 0
          }}
        />
      ))}

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

      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-md border-2 border-white text-center mb-8 z-10">
        <h2 className="text-3xl font-black text-blue-500">
          Find: {targetColor?.translations[language as keyof typeof targetColor.translations] || targetColor?.english}
        </h2>
      </div>

      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center max-h-[80vh] z-10">
        <div className="flex flex-wrap justify-center gap-6 w-full px-4">
          <AnimatePresence>
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, rotate: Math.random() * 10 - 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSplash(opt)}
                className="w-32 h-32 rounded-[2rem] shadow-xl border-4 border-white/50 flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                style={{ backgroundColor: getColorStyle(opt.english) }}
              >
                {/* Paint drip effect */}
                <div className="absolute top-0 left-4 w-4 h-12 bg-white/20 rounded-b-full" />
                <div className="absolute top-0 right-8 w-3 h-8 bg-white/20 rounded-b-full" />
                
                <span className="text-4xl drop-shadow-md z-10">{opt.emoji}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
