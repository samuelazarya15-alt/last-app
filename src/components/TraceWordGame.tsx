import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { words as wordHelpersWords } from '../data/wordHelpers';
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
  const [level, setLevel] = useState(1);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startNewLevel(level);
  }, [level]);

  const startNewLevel = React.useCallback((currentLevel: number) => {
    let numWords = 3;
    if (currentLevel === 2) numWords = 5;
    if (currentLevel >= 3) numWords = 7;

    const shuffled = [...wordHelpersWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numWords);
    setWords(selected);
    setCurrentWordIndex(0);
    setTracedLetters(new Array(selected[0]?.translations.tigrinya.length || 0).fill(false));
    setDoveMessage("Trace the Ge'ez letters! Click on each letter to trace it.");
  }, [setDoveMessage]);

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
        setTracedLetters(new Array(words[currentWordIndex + 1].translations.tigrinya.length).fill(false));
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
            setTracedLetters(new Array(words[currentWordIndex + 1].translations.tigrinya.length).fill(false));
            setDoveMessage("Here's the next word!");
          } else {
            setDoveMessage(`Level ${level} complete!`);
            setTimeout(() => {
              setLevel(l => l + 1);
            }, 1500);
          }
        }, 2000);
      } else {
        setDoveMessage("Keep going!");
      }
    }
  };

  if (!currentWord) return null;

  const targetLang = language || 'english';
  const displayTranslation = currentWord.translations[targetLang as keyof typeof currentWord.translations];
  const geezWord = currentWord.translations.tigrinya;

  return (
    <div className="w-full h-full bg-yellow-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-yellow-500 hover:scale-110 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-yellow-500">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="text-yellow-500">🏆</span>
            <span className="font-bold text-yellow-700">{score}</span>
          </div>
          <GameTimer duration={60} onTimeUp={handleTimeUp} isPaused={isAnimating} resetKey={level} />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center gap-8 relative z-10">
        
        {/* Target Word Info */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-6 rounded-3xl shadow-xl text-center w-full"
        >
          <h2 className="text-3xl font-black text-yellow-600 mb-2">{displayTranslation}</h2>
          <p className="text-yellow-400 font-medium">Trace the letters below</p>
        </motion.div>

        {/* Tracing Area */}
        <div className="flex gap-4 justify-center items-center flex-wrap">
          <AnimatePresence mode="popLayout">
            {geezWord.split('').map((letter: string, index: number) => (
              <motion.div
                key={`${currentWordIndex}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTrace(index)}
                  disabled={tracedLetters[index] || isAnimating}
                  className={`w-24 h-32 rounded-2xl flex items-center justify-center text-6xl font-geez font-black transition-all duration-300 ${
                    tracedLetters[index] 
                      ? 'bg-yellow-400 text-white shadow-inner scale-105' 
                      : 'bg-white text-gray-300 shadow-xl border-4 border-dashed border-yellow-200 hover:border-yellow-400 hover:text-yellow-200'
                  }`}
                >
                  {letter}
                </motion.button>
                
                {/* Sparkle effect when traced */}
                <AnimatePresence>
                  {tracedLetters[index] && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-yellow-400 rounded-2xl pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mt-8">
          {words.map((_, idx) => (
            <div 
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx === currentWordIndex 
                  ? 'bg-yellow-500 scale-125' 
                  : idx < currentWordIndex 
                    ? 'bg-yellow-300' 
                    : 'bg-yellow-100'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
