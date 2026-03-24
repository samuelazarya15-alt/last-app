import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import wordsData from '../data/words.json';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';

interface FlyDoveGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function FlyDoveGame({ language, onBack, setDoveMessage, setDoveCheering }: FlyDoveGameProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<any[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Select 5 random words for the game
    const shuffled = [...wordsData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    setWords(selected);
    generateOptions(selected[0]);
    setDoveMessage("Help the dove fly by choosing the correct translation!");
  }, []);

  const generateOptions = React.useCallback((correctWord: any) => {
    if (!correctWord) return;
    
    const otherWords = wordsData.filter(w => w.id !== correctWord.id);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
    const wrongOptions = shuffledOthers.slice(0, 2).map(w => w.tigrinya);
    
    const allOptions = [correctWord.tigrinya, ...wrongOptions].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  }, []);

  const handleGameEnd = React.useCallback(async () => {
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    await logGameSession('dove', score, duration);
    onBack();
  }, [score, onBack]);

  const handleTimeUp = React.useCallback(() => {
    if (isFlying) return;
    setDoveMessage("Time's up! The dove couldn't fly.");
    setIsFlying(true);
    setTimeout(() => {
      setIsFlying(false);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        generateOptions(words[currentWordIndex + 1]);
      } else {
        handleGameEnd();
      }
    }, 2000);
  }, [isFlying, setDoveMessage, currentWordIndex, words, generateOptions, handleGameEnd]);

  const handleFly = (selectedWord: string) => {
    if (isFlying) return;
    const currentWord = words[currentWordIndex];
    if (selectedWord === currentWord.tigrinya) {
      setIsFlying(true);
      setDoveCheering(true);
      setDoveMessage("Woohoo! The dove is flying higher!");
      setScore(prev => prev + 10);
      
      setTimeout(() => {
        setIsFlying(false);
        setDoveCheering(false);
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          generateOptions(words[currentWordIndex + 1]);
          setDoveMessage("Keep her flying!");
        } else {
          handleGameEnd();
        }
      }, 2000);
    } else {
      setDoveMessage("Oh no! The dove needs the right word to fly. Try again!");
    }
  };

  if (!words.length) return null;

  const currentWord = words[currentWordIndex];
  const translation = language ? currentWord[language.toLowerCase()] : currentWord.english;

  return (
    <div className="w-full h-full p-6 pb-32 flex flex-col items-center justify-start bg-sky-100 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4 mt-2">
        <button 
          onClick={onBack}
          className="bg-white text-blue-500 font-black px-6 py-3 rounded-full shadow-[0_4px_0_rgb(191,219,254)] active:translate-y-1 active:shadow-none z-10"
        >
          ← Back
        </button>

        <div className="bg-white text-blue-600 font-black px-6 py-3 rounded-full shadow-md z-10 text-xl">
          Score: {score}
        </div>
      </div>

      <div className="w-full z-10 mb-8">
        <GameTimer 
          duration={10} 
          onTimeUp={handleTimeUp} 
          resetKey={currentWordIndex} 
          isPaused={isFlying}
        />
      </div>

      <div className="text-center mb-8 z-10 mt-4">
        <h2 className="text-4xl font-black text-gray-800 mb-4">Help the Dove Fly</h2>
        <div className="bg-white px-8 py-4 rounded-full shadow-md inline-block">
          <p className="text-2xl font-bold text-blue-600">{translation}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end w-full max-w-2xl z-10 relative pb-12">
        {/* The Dove */}
        <motion.div
          animate={isFlying ? { y: -200, scale: 1.2, rotate: [0, -10, 10, 0] } : { y: 0 }}
          transition={isFlying ? { duration: 1.5, ease: "easeOut" } : { duration: 0.5 }}
          className="text-9xl mb-12 drop-shadow-2xl"
        >
          🕊️
        </motion.div>

        {/* Cloud Options */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFly(option)}
              disabled={isFlying}
              className={`bg-white text-sky-600 text-3xl font-black py-8 px-4 rounded-3xl border-4 border-sky-200 shadow-[0_8px_0_rgb(186,230,253)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center ${isFlying ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
