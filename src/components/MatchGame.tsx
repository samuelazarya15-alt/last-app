import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import wordsData from '../data/words.json';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';

interface MatchGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export function MatchGame({ language, onBack, setDoveMessage, setDoveCheering }: MatchGameProps) {
  const [words, setWords] = useState<any[]>([]);
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [selectedTigrinya, setSelectedTigrinya] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [englishOptions, setEnglishOptions] = useState<any[]>([]);
  const [tigrinyaOptions, setTigrinyaOptions] = useState<any[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [score, setScore] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startNewGame();
  }, [gameKey]);

  const startNewGame = React.useCallback(() => {
    // Select 4 random words for the match game
    const shuffled = [...wordsData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setWords(selected);
    
    // Shuffle options independently
    setEnglishOptions([...selected].sort(() => 0.5 - Math.random()));
    setTigrinyaOptions([...selected].sort(() => 0.5 - Math.random()));
    
    setMatchedPairs([]);
    setSelectedEnglish(null);
    setSelectedTigrinya(null);
    setIsGameOver(false);
    
    setDoveMessage("Match the words! Click a word on the left, then its translation on the right.");
  }, [setDoveMessage]);

  const handleGameEnd = React.useCallback(async () => {
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    await logGameSession('match', score, duration);
    onBack();
  }, [score, onBack]);

  const handleTimeUp = React.useCallback(() => {
    if (isGameOver) return;
    setIsGameOver(true);
    setDoveMessage("Time's up! Let's try again.");
    setTimeout(() => {
      handleGameEnd();
    }, 3000);
  }, [isGameOver, setDoveMessage, handleGameEnd]);

  useEffect(() => {
    if (selectedEnglish && selectedTigrinya && !isGameOver) {
      // Check for match
      const englishWord = words.find(w => w.english === selectedEnglish);
      if (englishWord && englishWord.tigrinya === selectedTigrinya) {
        // Match found
        const newMatchedPairs = [...matchedPairs, englishWord.id];
        setMatchedPairs(newMatchedPairs);
        setDoveCheering(true);
        setDoveMessage("Great match!");
        setScore(prev => prev + 25);
        
        setTimeout(() => {
          setDoveCheering(false);
          setSelectedEnglish(null);
          setSelectedTigrinya(null);
          
          if (newMatchedPairs.length === words.length) {
            setIsGameOver(true);
            setDoveMessage("You matched them all! Amazing job!");
            handleGameEnd();
          } else {
            setDoveMessage("Keep going!");
          }
        }, 1000);
      } else {
        // No match
        setDoveMessage("Oops, those don't match. Try again!");
        setTimeout(() => {
          setSelectedEnglish(null);
          setSelectedTigrinya(null);
        }, 1000);
      }
    }
  }, [selectedEnglish, selectedTigrinya, isGameOver, matchedPairs, words]);

  if (!words.length) return null;

  return (
    <div className="w-full h-full p-6 pb-32 flex flex-col items-center justify-start bg-purple-50 relative overflow-hidden">
      <div className="w-full flex justify-between items-center z-10 mb-4 mt-2">
        <button 
          onClick={onBack}
          className="bg-white text-purple-500 font-black px-6 py-3 rounded-full shadow-[0_4px_0_rgb(216,180,254)] active:translate-y-1 active:shadow-none z-10 text-sm"
        >
          ← Back
        </button>
      </div>

      <div className="w-full z-10 mb-8">
        <GameTimer 
          duration={30} 
          onTimeUp={handleTimeUp} 
          resetKey={gameKey} 
          isPaused={isGameOver}
        />
      </div>

      <div className="text-center mb-12 z-10">
        <h2 className="text-base font-black text-gray-800 mb-4">Match the Words</h2>
      </div>

      <div className="flex w-full max-w-4xl gap-8 z-10">
        {/* Left Column (English/Selected Language) */}
        <div className="flex-1 flex flex-col gap-4">
          {englishOptions.map((word) => {
            const isMatched = matchedPairs.includes(word.id);
            const isSelected = selectedEnglish === word.english;
            const translation = language ? word[language.toLowerCase()] : word.english;
            
            return (
              <motion.button
                key={`eng-${word.id}`}
                whileHover={!isMatched ? { scale: 1.02 } : {}}
                whileTap={!isMatched ? { scale: 0.98 } : {}}
                onClick={() => !isMatched && !isGameOver && setSelectedEnglish(word.english)}
                disabled={isMatched || isGameOver}
                className={`p-6 rounded-2xl font-black text-base border-4 transition-all ${
                  isMatched 
                    ? 'bg-green-100 border-green-300 text-green-400 opacity-50 cursor-not-allowed' 
                    : isSelected
                      ? 'bg-purple-500 border-purple-600 text-white shadow-[0_4px_0_rgb(147,51,234)] translate-y-1'
                      : isGameOver
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-purple-200 text-purple-700 shadow-[0_8px_0_rgb(233,213,255)] hover:border-purple-300'
                }`}
              >
                {translation}
              </motion.button>
            );
          })}
        </div>

        {/* Right Column (Tigrinya) */}
        <div className="flex-1 flex flex-col gap-4">
          {tigrinyaOptions.map((word) => {
            const isMatched = matchedPairs.includes(word.id);
            const isSelected = selectedTigrinya === word.tigrinya;
            
            return (
              <motion.button
                key={`tig-${word.id}`}
                whileHover={!isMatched ? { scale: 1.02 } : {}}
                whileTap={!isMatched ? { scale: 0.98 } : {}}
                onClick={() => !isMatched && !isGameOver && setSelectedTigrinya(word.tigrinya)}
                disabled={isMatched || isGameOver}
                className={`p-6 rounded-2xl font-black text-base border-4 transition-all ${
                  isMatched 
                    ? 'bg-green-100 border-green-300 text-green-400 opacity-50 cursor-not-allowed' 
                    : isSelected
                      ? 'bg-blue-500 border-blue-600 text-white shadow-[0_4px_0_rgb(37,99,235)] translate-y-1'
                      : isGameOver
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-blue-200 text-blue-700 shadow-[0_8px_0_rgb(191,219,254)] hover:border-blue-300'
                }`}
              >
                {word.tigrinya}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
