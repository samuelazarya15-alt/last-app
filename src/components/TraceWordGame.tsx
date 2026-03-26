import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import wordsData from '../data/words.json';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

interface TraceWordGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function TraceWordGame({ language, onBack, setDoveMessage, setDoveCheering }: TraceWordGameProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [tracedLetters, setTracedLetters] = useState<boolean[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [score, setScore] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Select 5 random words for the game
    const shuffled = [...wordsData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    setWords(selected);
    setTracedLetters(new Array(selected[0]?.tigrinya.length || 0).fill(false));
    setDoveMessage("Trace the Ge'ez letters! Click on each letter to trace it.");
  }, []);

  const currentWord = words[currentWordIndex];

  const handleGameEnd = React.useCallback(async () => {
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    await logGameSession('trace', score, duration);
    onBack();
  }, [score, onBack]);

  const handleTimeUp = React.useCallback(() => {
    if (isAnimating) return;
    voiceCoach.playIncorrect();
    setDoveMessage("Time's up! Let's try the next word.");
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setTracedLetters(new Array(words[currentWordIndex + 1].tigrinya.length).fill(false));
      } else {
        handleGameEnd();
      }
    }, 2000);
  }, [isAnimating, setDoveMessage, currentWordIndex, words, handleGameEnd]);

  const handleTrace = (index: number) => {
    if (isAnimating) return;
    if (!tracedLetters[index]) {
      const newTraced = [...tracedLetters];
      newTraced[index] = true;
      setTracedLetters(newTraced);
      setScore(prev => prev + 2);
      voiceCoach.playClick();

      // Check if word is fully traced
      if (newTraced.every(Boolean)) {
        voiceCoach.playCorrect();
        setIsAnimating(true);
        setDoveCheering(true);
        setDoveMessage("Great job! You traced the word!");
        setScore(prev => prev + 10);
        setTimeout(() => {
          setIsAnimating(false);
          setDoveCheering(false);
          if (currentWordIndex < words.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
            setTracedLetters(new Array(words[currentWordIndex + 1].tigrinya.length).fill(false));
            setDoveMessage("Here's the next word!");
          } else {
            handleGameEnd();
          }
        }, 2000);
      } else {
        setDoveMessage("Keep going!");
      }
    }
  };

  if (!currentWord) return null;

  const translation = language ? currentWord[language.toLowerCase()] : currentWord.english;

  return (
    <div className="w-full h-full p-6 pb-32 flex flex-col items-center justify-start bg-sky-50 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4 mt-2">
        <button 
          onClick={() => {
            voiceCoach.playClick();
            onBack();
          }}
          className="bg-white text-blue-500 font-black px-6 py-3 rounded-full shadow-[0_4px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none z-10 text-sm"
        >
          ← Back
        </button>
      </div>

      <div className="w-full z-10 mb-8">
        <GameTimer 
          duration={20} 
          onTimeUp={handleTimeUp} 
          resetKey={currentWordIndex} 
          isPaused={isAnimating}
        />
      </div>

      <div className="text-center mb-12 z-10">
        <h2 className="text-base font-black text-gray-800 mb-4">Trace the Word</h2>
        <div className="bg-white px-8 py-4 rounded-full shadow-md inline-block">
          <p className="text-base font-bold text-blue-600">{translation}</p>
        </div>
      </div>

      <div className="flex gap-4 z-10">
        {currentWord.tigrinya.split('').map((letter: string, index: number) => (
          <motion.div
            key={`${currentWordIndex}-${index}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="relative"
          >
            {/* Background dashed letter */}
            <div className="text-8xl md:text-9xl font-black text-gray-200 select-none" style={{ WebkitTextStroke: '2px #cbd5e1', color: 'transparent', borderStyle: 'dashed' }}>
              {letter}
            </div>
            
            {/* Foreground interactive letter */}
            <motion.div
              className={`absolute inset-0 text-8xl md:text-9xl font-black flex items-center justify-center cursor-pointer select-none ${tracedLetters[index] ? 'text-green-500' : 'text-transparent hover:text-green-200'}`}
              style={tracedLetters[index] ? { WebkitTextStroke: '2px #22c55e' } : {}}
              onClick={() => handleTrace(index)}
              whileHover={!tracedLetters[index] ? { scale: 1.1 } : {}}
              whileTap={!tracedLetters[index] ? { scale: 0.9 } : {}}
            >
              {letter}
            </motion.div>
            
            {/* Sparkles when traced */}
            <AnimatePresence>
              {tracedLetters[index] && (
                <motion.div
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{ opacity: 0, scale: 2 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-4xl">✨</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
