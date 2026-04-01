import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface SpaceRocketGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function SpaceRocketGame({ language, onBack, setDoveMessage, setDoveCheering }: SpaceRocketGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [options, setOptions] = useState<any[]>([]);
  const [rocketParts, setRocketParts] = useState<number>(0); // 0 to 3
  const [isAnimating, setIsAnimating] = useState(false);

  const spawnNextCategory = useCallback(() => {
    const categories = Array.from(new Set(words.map(w => w.category)));
    const newCategory = categories[Math.floor(Math.random() * categories.length)];
    setTargetCategory(newCategory);
    
    voiceCoach.speak(`Find words for ${newCategory}!`, language || 'english');
    setDoveMessage(`Find words for ${newCategory}!`);

    // Find 1 correct word
    const correctWords = words.filter(w => w.category === newCategory);
    const selectedCorrect = correctWords[Math.floor(Math.random() * correctWords.length)];

    // Find 3 wrong words
    const wrongWords = words.filter(w => w.category !== newCategory);
    const selectedWrong = wrongWords.sort(() => 0.5 - Math.random()).slice(0, 3);

    const newOptions = [selectedCorrect, ...selectedWrong].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
    setIsAnimating(false);
  }, [language, setDoveMessage]);

  useEffect(() => {
    spawnNextCategory();
  }, [spawnNextCategory]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('rocket', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleSelect = useCallback((word: any) => {
    if (gameOver || isAnimating) return;

    if (word.category === targetCategory) {
      // Correct
      voiceCoach.playCorrect();
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      const targetLang = language || 'english';
      const translation = word.translations[targetLang as keyof typeof word.translations];
      voiceCoach.playDualAudio(translation, targetLang, word.audioUrl);
      
      setRocketParts(prev => {
        const newParts = prev + 1;
        if (newParts >= 3) {
          // Rocket is complete!
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 120,
              origin: { y: 0.8 },
              colors: ['#ef4444', '#f97316', '#eab308'] // Fire colors
            });
            voiceCoach.speak("Blast off!", language || 'english');
            setDoveMessage("Blast off!");
            
            setTimeout(() => {
              setRocketParts(0);
              if (score > 0 && score % 30 === 0) {
                setLevel(l => l + 1);
                setDoveMessage(`Level Up! You are now level ${level + 1}!`);
              }
              spawnNextCategory();
            }, 2000);
          }, 1000);
        } else {
          setTimeout(() => {
            setDoveCheering(false);
            spawnNextCategory();
          }, 1500);
        }
        return newParts;
      });

    } else {
      // Incorrect
      voiceCoach.playIncorrect();
      voiceCoach.speak("Oops! Wrong category!", language || 'english');
      setDoveMessage("Oops! Wrong category!");
    }
  }, [gameOver, isAnimating, targetCategory, language, score, level, setDoveCheering, setDoveMessage, spawnNextCategory]);

  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
        <h2 className="text-base font-black text-blue-600 mb-4">Game Over!</h2>
        <p className="text-sm font-bold text-gray-700 mb-8">Score: {score}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              voiceCoach.playClick();
              setScore(0);
              setLevel(1);
              setGameOver(false);
              setRocketParts(0);
              spawnNextCategory();
            }}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none"
          >
            Play Again
          </button>
          <button 
            onClick={() => {
              voiceCoach.playClick();
              onBack();
            }}
            className="bg-gray-400 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_6px_0_rgb(107,114,128)] active:translate-y-1 active:shadow-none"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-indigo-950 p-4 relative overflow-hidden">
      {/* Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({length: 50}).map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite alternate`
            }}
          />
        ))}
      </div>

      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={() => {
            voiceCoach.playClick();
            onBack();
          }}
          className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-sm border border-white/30"
        >
          🏠
        </button>
        <div className="flex gap-4">
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm font-bold text-indigo-200 border border-white/30 text-sm">
            Level {level}
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm font-bold text-green-300 border border-white/30 text-sm">
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

      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-md border border-white/30 text-center mb-4 z-10">
        <h2 className="text-base font-black text-white">
          Category: <span className="text-sm text-yellow-400">{targetCategory}</span>
        </h2>
      </div>

      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-between max-h-[80vh] relative z-10">
        
        {/* Options */}
        <div className="grid grid-cols-2 gap-4 w-full px-4 mt-4">
          <AnimatePresence>
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  voiceCoach.playClick();
                  handleSelect(opt);
                }}
                className="bg-indigo-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-md border-2 border-indigo-400 flex flex-col items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
              >
                <span className="text-4xl mb-2">{opt.emoji}</span>
                <span className="text-2xl font-geez font-black text-white">{opt.translations.tigrinya}</span>
                <span className="text-xs font-bold text-indigo-200 uppercase">{opt.translations[language || 'english']}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* The Rocket */}
        <div className="w-full h-64 relative mt-auto flex flex-col items-center justify-end pb-8">
           <motion.div 
             animate={rocketParts >= 3 && isAnimating ? { y: '-100vh' } : { y: 0 }}
             transition={{ duration: 2, ease: "easeIn" }}
             className="flex flex-col items-center"
           >
              {/* Nose Cone (Part 3) */}
              <AnimatePresence>
                {rocketParts >= 3 && (
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[60px] border-b-red-500 relative z-30"
                  />
                )}
              </AnimatePresence>

              {/* Body (Part 2) */}
              <AnimatePresence>
                {rocketParts >= 2 && (
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-20 h-24 bg-gray-200 relative z-20 flex items-center justify-center border-x-4 border-gray-400"
                  >
                    <div className="w-10 h-10 bg-sky-300 rounded-full border-4 border-gray-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Base & Fins (Part 1) */}
              <AnimatePresence>
                {rocketParts >= 1 && (
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative z-10"
                  >
                    <div className="w-20 h-16 bg-gray-300 border-x-4 border-b-4 border-gray-400 rounded-b-lg flex justify-center items-end pb-2">
                       <div className="w-12 h-4 bg-gray-800 rounded-full" />
                    </div>
                    {/* Fins */}
                    <div className="absolute bottom-0 -left-6 w-0 h-0 border-t-[30px] border-t-transparent border-r-[24px] border-r-red-500 border-b-[30px] border-b-red-500" />
                    <div className="absolute bottom-0 -right-6 w-0 h-0 border-t-[30px] border-t-transparent border-l-[24px] border-l-red-500 border-b-[30px] border-b-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fire */}
              {rocketParts >= 3 && isAnimating && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: [1, 1.2, 0.8, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.2 }}
                  className="w-12 h-20 bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 rounded-b-full blur-sm origin-top mt-1"
                />
              )}
           </motion.div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }
      `}} />
    </div>
  );
}
