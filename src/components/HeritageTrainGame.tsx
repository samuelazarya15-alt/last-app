import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';

interface HeritageTrainGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function HeritageTrainGame({ language, onBack, setDoveMessage, setDoveCheering }: HeritageTrainGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetLetter, setTargetLetter] = useState<string>('');
  const [options, setOptions] = useState<any[]>([]);
  const [trainCars, setTrainCars] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const spawnNextLetter = useCallback(() => {
    // Pick a random word to get its starting letter
    const targetWord = words[Math.floor(Math.random() * words.length)];
    const letter = targetWord.english.charAt(0).toUpperCase();
    setTargetLetter(letter);

    voiceCoach.speak(`Find words starting with ${letter}!`, language || 'english');
    setDoveMessage(`Find words starting with ${letter}!`);

    // Find 1-2 words starting with this letter
    const correctWords = words.filter(w => w.english.charAt(0).toUpperCase() === letter);
    const selectedCorrect = correctWords.sort(() => 0.5 - Math.random()).slice(0, 1 + Math.floor(Math.random() * 2));

    // Fill the rest with wrong words
    const wrongWords = words.filter(w => w.english.charAt(0).toUpperCase() !== letter);
    const selectedWrong = wrongWords.sort(() => 0.5 - Math.random()).slice(0, 4 - selectedCorrect.length);

    const newOptions = [...selectedCorrect, ...selectedWrong].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
    setIsAnimating(false);
  }, [language, setDoveMessage]);

  useEffect(() => {
    spawnNextLetter();
  }, [spawnNextLetter]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('train', score, 60);
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const handleLoadCar = useCallback((word: any) => {
    if (gameOver || isAnimating) return;

    if (word.english.charAt(0).toUpperCase() === targetLetter) {
      // Correct
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      const targetLang = language || 'english';
      const translation = word.translations[targetLang as keyof typeof word.translations];
      voiceCoach.playDualAudio(translation, targetLang, word.audioUrl);
      
      setTrainCars(prev => [...prev, word]);
      setOptions(prev => prev.filter(w => w.id !== word.id));
      
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 }
      });

      setTimeout(() => {
        setDoveCheering(false);
        // Check if there are any more correct words
        const remainingCorrect = options.filter(w => w.id !== word.id && w.english.charAt(0).toUpperCase() === targetLetter);
        if (remainingCorrect.length === 0) {
           // Train departs!
           setIsAnimating(true);
           voiceCoach.speak("Choo choo! Great job!", language || 'english');
           setTimeout(() => {
             setTrainCars([]);
             if (score > 0 && score % 50 === 0) {
               setLevel(l => l + 1);
               setDoveMessage(`Level Up! You are now level ${level + 1}!`);
             }
             spawnNextLetter();
           }, 1500);
        } else {
           setIsAnimating(false);
        }
      }, 1000);
    } else {
      // Incorrect
      voiceCoach.speak("Oops! Wrong letter!", language || 'english');
      setDoveMessage("Oops! Wrong letter!");
    }
  }, [gameOver, isAnimating, targetLetter, language, score, level, options, setDoveCheering, setDoveMessage, spawnNextLetter]);


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
              setTrainCars([]);
              spawnNextLetter();
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
    <div className="w-full h-full flex flex-col items-center justify-start bg-sky-50 p-4 relative overflow-hidden">
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
          duration={60} 
          onTimeUp={handleGameEnd} 
          isPaused={gameOver || isAnimating} 
          resetKey={level}
        />
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-md border-2 border-white text-center mb-4 z-10">
        <h2 className="text-base font-black text-stone-600">
          Starts with: <span className="text-2xl text-red-500">{targetLetter}</span>
        </h2>
      </div>

      <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-between max-h-[80vh] relative">
        
        {/* Options to load */}
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
                onClick={() => handleLoadCar(opt)}
                className="bg-white p-4 rounded-2xl shadow-md border-4 border-stone-100 flex items-center justify-center gap-4"
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-bold text-stone-700 uppercase">{opt.english}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* The Train */}
        <div className="w-full h-48 relative mt-auto flex items-end overflow-hidden pb-4">
           {/* Train Engine */}
           <motion.div 
             animate={trainCars.length === 0 && isAnimating ? { x: '150vw' } : { x: 0 }}
             transition={{ duration: 1.5, ease: "easeInOut" }}
             className="w-32 h-32 bg-stone-800 rounded-t-3xl rounded-br-3xl flex-shrink-0 relative z-20 flex items-center justify-center border-b-8 border-stone-900 shadow-xl"
           >
              <div className="absolute top-2 right-4 w-8 h-12 bg-stone-600 rounded-t-md" />
              <span className="text-6xl relative z-10">🚂</span>
              {/* Wheels */}
              <div className="absolute -bottom-4 left-2 w-8 h-8 bg-stone-900 rounded-full border-4 border-stone-400" />
              <div className="absolute -bottom-4 right-2 w-8 h-8 bg-stone-900 rounded-full border-4 border-stone-400" />
           </motion.div>

           {/* Train Cars */}
           <AnimatePresence>
             {trainCars.map((car, i) => (
               <motion.div
                 key={car.id}
                 initial={{ x: -100, opacity: 0 }}
                 animate={trainCars.length === 0 && isAnimating ? { x: '150vw' } : { x: 0, opacity: 1 }}
                 exit={{ x: '150vw', opacity: 0 }}
                 transition={{ duration: trainCars.length === 0 && isAnimating ? 1.5 : 0.5, ease: "easeInOut" }}
                 className="w-28 h-24 bg-red-500 rounded-lg ml-2 flex-shrink-0 relative flex items-center justify-center border-b-8 border-red-700 shadow-lg"
               >
                 <span className="text-5xl">{car.emoji}</span>
                 {/* Wheels */}
                 <div className="absolute -bottom-4 left-2 w-6 h-6 bg-stone-900 rounded-full border-2 border-stone-400" />
                 <div className="absolute -bottom-4 right-2 w-6 h-6 bg-stone-900 rounded-full border-2 border-stone-400" />
                 {/* Link */}
                 <div className="absolute top-1/2 -left-2 w-2 h-2 bg-stone-800" />
               </motion.div>
             ))}
           </AnimatePresence>
           
           {/* Track */}
           <div className="absolute bottom-2 w-full h-2 bg-stone-400 flex justify-between px-4">
             {Array.from({length: 20}).map((_, i) => (
               <div key={i} className="w-2 h-full bg-stone-600" />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
