import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import wordsData from '../data/words.json';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';

interface FeedLionGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function FeedLionGame({ language, onBack, setDoveMessage, setDoveCheering }: FeedLionGameProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<any[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isEating, setIsEating] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Select 5 random words for the game
    const shuffled = [...wordsData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    setWords(selected);
    generateOptions(selected[0]);
    setDoveMessage("Feed the lion the correct word!");
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
    await logGameSession('lion', score, duration);
    onBack();
  }, [score, onBack]);

  const handleTimeUp = React.useCallback(() => {
    if (isEating) return;
    setDoveMessage("Time's up! The lion is still hungry.");
    setIsEating(true);
    setTimeout(() => {
      setIsEating(false);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        generateOptions(words[currentWordIndex + 1]);
      } else {
        handleGameEnd();
      }
    }, 2000);
  }, [isEating, setDoveMessage, currentWordIndex, words, generateOptions, handleGameEnd]);

  const handleFeed = (selectedWord: string) => {
    if (isEating) return;
    const currentWord = words[currentWordIndex];
    if (selectedWord === currentWord.tigrinya) {
      setIsEating(true);
      setDoveCheering(true);
      setDoveMessage("Yum! The lion loved it!");
      setScore(prev => prev + 10);
      
      setTimeout(() => {
        setIsEating(false);
        setDoveCheering(false);
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          generateOptions(words[currentWordIndex + 1]);
          setDoveMessage("Here comes another hungry lion!");
        } else {
          handleGameEnd();
        }
      }, 2000);
    } else {
      setDoveMessage("Oops! The lion didn't want that word. Try again!");
    }
  };

  if (!words.length) return null;

  const currentWord = words[currentWordIndex];
  const translation = language ? currentWord[language.toLowerCase()] : currentWord.english;

  return (
    <div className="w-full h-full p-6 pb-32 flex flex-col items-center justify-start bg-orange-50 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4 mt-2">
        <button 
          onClick={onBack}
          className="bg-white text-orange-500 font-black px-6 py-3 rounded-full shadow-[0_4px_0_rgb(253,186,116)] active:translate-y-1 active:shadow-none z-10"
        >
          ← Back
        </button>

        <div className="bg-white text-orange-600 font-black px-6 py-3 rounded-full shadow-md z-10 text-xl">
          Score: {score}
        </div>
      </div>

      <div className="w-full z-10 mb-8">
        <GameTimer 
          duration={10} 
          onTimeUp={handleTimeUp} 
          resetKey={currentWordIndex} 
          isPaused={isEating}
        />
      </div>

      <div className="text-center mb-8 z-10">
        <h2 className="text-4xl font-black text-gray-800 mb-4">Feed the Lion</h2>
        <div className="bg-white px-8 py-4 rounded-full shadow-md inline-block">
          <p className="text-2xl font-bold text-orange-600">{translation}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl z-10 relative">
        {/* The Lion */}
        <motion.div
          animate={isEating ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : { y: [0, -10, 0] }}
          transition={isEating ? { duration: 0.5, repeat: 3 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-9xl mb-12 drop-shadow-2xl"
        >
          {isEating ? '🦁😋' : '🦁'}
        </motion.div>

        {/* Food Options */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFeed(option)}
              disabled={isEating}
              className={`bg-yellow-400 text-yellow-900 text-3xl font-black py-8 px-4 rounded-3xl border-4 border-white shadow-[0_8px_0_rgb(202,138,4)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center ${isEating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
