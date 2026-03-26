import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface SoundPopGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function SoundPopGame({ language, onBack, setDoveMessage, setDoveCheering }: SoundPopGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [bubbles, setBubbles] = useState<any[]>([]);
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
    setDoveMessage(`Pop the ${translation}!`);

    // Create 3-5 floating bubbles depending on level
    const numWrongOptions = Math.min(2 + Math.floor(level / 2), 4);
    const wrongOptions = words
      .filter(w => w.id !== newTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, numWrongOptions);
    
    const options = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
    
    const newBubbles = options.map((opt, i) => ({
      ...opt,
      uniqueId: `${opt.id}-${Date.now()}-${i}`,
      x: 10 + (i * (80 / options.length)), // Spread them out horizontally
      duration: 8 - (level * 0.5) + (Math.random() * 2), // Float up speed
      wobble: Math.random() * 20 - 10 // Horizontal wobble
    }));

    setBubbles(newBubbles);
    setIsAnimating(false);
  }, [language, level, setDoveMessage]);

  useEffect(() => {
    spawnNextWord();
  }, [spawnNextWord]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setBubbles([]);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('soundpop', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handlePop = useCallback((word: any) => {
    if (gameOver || isAnimating) return;

    voiceCoach.playSfx('pop');
    if (word.english === targetWord?.english) {
      // Correct
      setIsAnimating(true);
      setDoveCheering(true);
      voiceCoach.playSfx('score');
      setScore(s => s + 10);
      
      confetti({
        particleCount: 20,
        spread: 360,
        origin: { x: word.x / 100, y: 0.5 } // Approximate pop location
      });

      voiceCoach.speak("Pop! Good job!", language || 'english');
      setBubbles([]); // Clear screen
      
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
      voiceCoach.playSfx('wrong');
      voiceCoach.speak("Oops! Not that one!", language || 'english');
      setDoveMessage("Oops! Not that one!");
      setBubbles(prev => prev.filter(w => w.uniqueId !== word.uniqueId)); // Pop the wrong one
    }
  }, [gameOver, isAnimating, targetWord, language, score, level, setDoveCheering, setDoveMessage, spawnNextWord]);

  const handleEscaped = useCallback((word: any) => {
    if (gameOver || isAnimating) return;
    
    if (word.english === targetWord?.english) {
      setIsAnimating(true);
      voiceCoach.speak("Oh no! It floated away!", language || 'english');
      setDoveMessage("Oh no! It floated away!");
      setBubbles([]);
      setTimeout(spawnNextWord, 1000);
    } else {
      setBubbles(prev => prev.filter(w => w.uniqueId !== word.uniqueId));
    }
  }, [gameOver, isAnimating, targetWord, language, setDoveMessage, spawnNextWord]);


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
              spawnNextWord();
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
    <div className="w-full h-full flex flex-col items-center justify-start bg-sky-50 p-4 relative overflow-hidden">
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
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-blue-600 text-base">
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
        <h2 className="text-xl font-black text-blue-500">
          Pop: {targetWord?.translations[language as keyof typeof targetWord.translations] || targetWord?.english}
        </h2>
      </div>

      <div className="flex-1 w-full max-w-2xl relative max-h-[80vh] bg-cyan-100/50 rounded-[2rem] border-4 border-cyan-200 overflow-hidden">
        <AnimatePresence>
          {bubbles.map((word) => (
            <motion.button
              key={word.uniqueId}
              initial={{ y: '80vh', x: `${word.x}%`, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: -100, 
                opacity: 1, 
                scale: 1,
                x: [`${word.x}%`, `${word.x + word.wobble}%`, `${word.x - word.wobble}%`, `${word.x}%`]
              }}
              exit={{ opacity: 0, scale: 1.5 }} // Pop effect
              transition={{ 
                y: { duration: Math.max(3, word.duration), ease: "linear" },
                x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              onAnimationComplete={() => handleEscaped(word)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 1.2 }}
              onClick={() => {
                voiceCoach.playClick();
                handlePop(word);
              }}
              className="absolute w-24 h-24 bg-cyan-300/40 backdrop-blur-sm rounded-full shadow-[inset_0_-10px_20px_rgba(255,255,255,0.5),0_4px_10px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center justify-center z-20"
              style={{ transform: 'translateX(-50%)' }}
            >
              <span className="text-2xl drop-shadow-md">{word.emoji}</span>
              <div className="absolute top-2 right-4 w-4 h-4 bg-white/60 rounded-full blur-[1px]" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
