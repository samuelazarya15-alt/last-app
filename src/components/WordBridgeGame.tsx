import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface WordBridgeGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function WordBridgeGame({ language, onBack, setDoveMessage, setDoveCheering }: WordBridgeGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetWord, setTargetWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [bridgeParts, setBridgeParts] = useState<number>(0); // 0 to 4
  const [isAnimating, setIsAnimating] = useState(false);

  const spawnNextPlank = useCallback(() => {
    const newTarget = words[Math.floor(Math.random() * words.length)];
    setTargetWord(newTarget);
    
    const targetLang = language || 'english';
    const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
    
    voiceCoach.playDualAudio(
      translation,
      targetLang,
      newTarget.audioUrl
    );
    setDoveMessage(`Find the ${translation} to build the bridge!`);

    // Create 3-4 options
    const numWrongOptions = Math.min(2 + Math.floor(level / 2), 4);
    const wrongOptions = words
      .filter(w => w.id !== newTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, numWrongOptions);
    
    const newOptions = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
    setIsAnimating(false);
  }, [language, level, setDoveMessage]);

  useEffect(() => {
    spawnNextPlank();
  }, [spawnNextPlank]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('bridge', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleSelect = useCallback((word: any) => {
    if (gameOver || isAnimating) return;

    if (word.id === targetWord?.id) {
      // Correct
      voiceCoach.playCorrect();
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      setBridgeParts(prev => {
        const newParts = prev + 1;
        if (newParts >= 4) {
          // Bridge is complete!
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.6 }
            });
            voiceCoach.speak("You crossed the river!", language || 'english');
            setDoveMessage("You crossed the river!");
            
            setTimeout(() => {
              setBridgeParts(0);
              if (score > 0 && score % 40 === 0) {
                setLevel(l => l + 1);
                setDoveMessage(`Level Up! You are now level ${level + 1}!`);
              }
              spawnNextPlank();
            }, 2000);
          }, 500);
        } else {
          setTimeout(() => {
            setDoveCheering(false);
            spawnNextPlank();
          }, 1000);
        }
        return newParts;
      });

    } else {
      // Incorrect
      voiceCoach.playIncorrect();
      voiceCoach.speak("Oops! That's not it!", language || 'english');
      setDoveMessage("Oops! That's not it!");
    }
  }, [gameOver, isAnimating, targetWord, language, score, level, setDoveCheering, setDoveMessage, spawnNextPlank]);

  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
        <h2 className="text-4xl font-black text-blue-600 mb-4">Game Over!</h2>
        <p className="text-2xl font-bold text-gray-700 mb-8">Score: {score}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              voiceCoach.playClick();
              setScore(0);
              setLevel(1);
              setGameOver(false);
              setBridgeParts(0);
              spawnNextPlank();
            }}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none"
          >
            Play Again
          </button>
          <button 
            onClick={() => {
              voiceCoach.playClick();
              onBack();
            }}
            className="bg-gray-400 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(107,114,128)] active:translate-y-1 active:shadow-none"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-cyan-50 p-4 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={() => {
            voiceCoach.playClick();
            onBack();
          }}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-2xl"
        >
          🏠
        </button>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-cyan-600">
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
        <h2 className="text-3xl font-black text-cyan-600">
          Find: {targetWord?.translations[language as keyof typeof targetWord.translations] || targetWord?.english}
        </h2>
      </div>

      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-between max-h-[80vh] relative z-10">
        
        {/* River and Bridge */}
        <div className="w-full h-48 relative mt-4 bg-blue-400 rounded-3xl overflow-hidden shadow-inner border-4 border-blue-300 flex items-center justify-center">
          {/* Water animation */}
          <div className="absolute inset-0 opacity-30">
            <div className="w-[200%] h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjBRMTAgMTAgMjAgMjBUMzAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] animate-[wave_3s_linear_infinite]" />
          </div>
          
          {/* Banks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-green-500 rounded-r-3xl border-r-4 border-green-600 z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-green-500 rounded-l-3xl border-l-4 border-green-600 z-10" />

          {/* Bridge Planks */}
          <div className="flex gap-2 z-20 px-16 w-full justify-between h-12">
            {[0, 1, 2, 3].map((plankIndex) => (
              <div key={plankIndex} className="flex-1 h-full relative">
                <AnimatePresence>
                  {bridgeParts > plankIndex && (
                    <motion.div
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute inset-0 bg-amber-700 rounded-md border-b-4 border-amber-900 shadow-lg flex items-center justify-center"
                    >
                      <div className="w-full h-1 bg-amber-800/50 my-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          
          {/* Character crossing */}
          <AnimatePresence>
            {bridgeParts >= 4 && (
              <motion.div
                initial={{ x: -100 }}
                animate={{ x: '100vw' }}
                transition={{ duration: 2, ease: "linear" }}
                className="absolute z-30 text-5xl"
                style={{ top: '20%' }}
              >
                🏃
              </motion.div>
            )}
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
                onClick={() => {
                  voiceCoach.playClick();
                  handleSelect(opt);
                }}
                className="bg-white p-4 rounded-2xl shadow-md border-4 border-cyan-100 flex items-center justify-center gap-4 hover:border-cyan-300 transition-colors"
              >
                <span className="text-4xl">{opt.emoji}</span>
                <span className="text-xl font-bold text-gray-700 uppercase">{opt.english}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
