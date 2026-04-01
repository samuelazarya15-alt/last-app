import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface AnimalOrchestraGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function AnimalOrchestraGame({ language, onBack, setDoveMessage, setDoveCheering }: AnimalOrchestraGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetAnimal, setTargetAnimal] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const [exploreCount, setExploreCount] = useState(0);

  const setupRound = useCallback(() => {
    const animalWords = words.filter(w => w.category === 'Animals');
    if (animalWords.length === 0) return;

    // Pick 3-5 animals for the stage
    const numAnimals = Math.min(3 + Math.floor(level / 2), 6);
    const selectedAnimals = animalWords.sort(() => 0.5 - Math.random()).slice(0, numAnimals);
    setOptions(selectedAnimals);

    if (mode === 'explore') {
      setDoveMessage("Tap the animals to hear their names!");
      voiceCoach.speak("Tap the animals to hear their names!", language || 'english');
    } else {
      const newTarget = selectedAnimals[Math.floor(Math.random() * selectedAnimals.length)];
      setTargetAnimal(newTarget);
      
      const targetLang = language || 'english';
      const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
      
      voiceCoach.playDualAudio(
        translation,
        targetLang,
        newTarget.audioUrl
      );
      setDoveMessage(`Where is the ${translation}?`);
    }
    setIsAnimating(false);
  }, [language, level, mode, setDoveMessage]);

  useEffect(() => {
    setupRound();
  }, [setupRound]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('animal', score, 90);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleTap = useCallback((animal: any) => {
    if (gameOver || isAnimating) return;

    if (mode === 'explore') {
      // Just play the sound and name
      voiceCoach.playClick();
      const targetLang = language || 'english';
      const translation = animal.translations[targetLang as keyof typeof animal.translations];
      voiceCoach.playDualAudio(translation, targetLang, animal.audioUrl);
      
      setExploreCount(c => {
        const newCount = c + 1;
        if (newCount >= options.length) {
           // Switch to quiz mode after exploring all
           setTimeout(() => {
             setMode('quiz');
             setExploreCount(0);
           }, 2000);
        }
        return newCount;
      });
    } else {
      // Quiz mode
      if (animal.id === targetAnimal?.id) {
        // Correct
        voiceCoach.playCorrect();
        setIsAnimating(true);
        setDoveCheering(true);
        setScore(s => s + 10);
        
        confetti({
          particleCount: 40,
          spread: 80,
          origin: { y: 0.6 }
        });

        voiceCoach.speak("Bravo! That's right!", language || 'english');
        
        setTimeout(() => {
          setDoveCheering(false);
          if (score > 0 && score % 40 === 0) {
            setLevel(l => l + 1);
            setDoveMessage(`Level Up! You are now level ${level + 1}!`);
            setMode('explore'); // Go back to explore for new level
          }
          setupRound();
        }, 1500);
      } else {
        // Incorrect
        voiceCoach.playIncorrect();
        voiceCoach.speak("Oops! Try again!", language || 'english');
        setDoveMessage("Oops! Try again!");
      }
    }
  }, [gameOver, isAnimating, mode, targetAnimal, language, score, level, options.length, setDoveCheering, setDoveMessage, setupRound]);

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
              setMode('explore');
              setExploreCount(0);
              setGameOver(false);
              setupRound();
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
    <div className="w-full h-full flex flex-col items-center justify-start bg-emerald-50 p-4 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-sm"
        >
          🏠
        </button>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-blue-600 text-sm">
            Level {level}
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-green-600 text-sm">
            Score: {score}
          </div>
        </div>
        <GameTimer 
          duration={90} // Longer duration for explore + quiz
          onTimeUp={handleGameEnd} 
          isPaused={gameOver || isAnimating} 
          resetKey={level}
        />
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-md border-2 border-white text-center mb-8 z-10">
        <h2 className="text-base font-black text-emerald-600">
          {mode === 'explore' 
            ? "Tap to explore!" 
            : (
              <div className="flex flex-col items-center">
                <span className="text-gray-500 text-xs uppercase tracking-widest mb-1">Find the:</span>
                <span className="text-3xl font-geez text-emerald-700 mb-1">{targetAnimal?.translations.tigrinya}</span>
                <span className="text-sm text-emerald-500">({targetAnimal?.translations[language as keyof typeof targetAnimal.translations] || targetAnimal?.english})</span>
              </div>
            )
          }
        </h2>
      </div>

      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center max-h-[80vh] z-10 relative">
        {/* Stage / Curtains */}
        <div className="absolute top-0 left-0 w-full h-16 bg-red-600 rounded-b-[3rem] shadow-lg z-0" />
        <div className="absolute top-0 left-0 w-16 h-full bg-red-600 rounded-r-[3rem] shadow-lg z-0" />
        <div className="absolute top-0 right-0 w-16 h-full bg-red-600 rounded-l-[3rem] shadow-lg z-0" />

        <div className="flex flex-wrap justify-center gap-6 w-full px-20 py-10 z-10">
          <AnimatePresence>
            {options.map((opt, i) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1, y: -10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTap(opt)}
                className={`w-32 h-32 rounded-3xl shadow-xl border-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden bg-white ${mode === 'quiz' && targetAnimal?.id === opt.id && isAnimating ? 'border-green-400 bg-green-50' : 'border-emerald-100'}`}
              >
                <span className="text-4xl drop-shadow-md z-10">{opt.emoji}</span>
                <span className="text-xl font-geez font-bold text-emerald-800 z-10">{opt.translations.tigrinya}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
