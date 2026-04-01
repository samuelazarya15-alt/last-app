import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { words as wordHelpersWords } from '../data/wordHelpers';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

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
  const [level, setLevel] = useState(1);
  const startTime = useRef(Date.now());

  const targetLang = language || 'english';

  useEffect(() => {
    startNewGame(level);
  }, [gameKey, level]);

  const startNewGame = React.useCallback((currentLevel: number) => {
    // Select random words for the match game based on level
    let numPairs = 3;
    if (currentLevel === 2) numPairs = 4;
    if (currentLevel >= 3) numPairs = 5;

    const shuffled = [...wordHelpersWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numPairs);
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
      const englishWord = words.find(w => w.translations[targetLang as keyof typeof w.translations] === selectedEnglish);
      if (englishWord && englishWord.translations.tigrinya === selectedTigrinya) {
        // Match found
        voiceCoach.playCorrect();
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
            setDoveMessage(`Level ${level} complete!`);
            setTimeout(() => {
              setLevel(l => l + 1);
              setGameKey(k => k + 1);
            }, 1500);
          } else {
            setDoveMessage("Keep going!");
          }
        }, 1000);
      } else {
        // No match
        voiceCoach.playIncorrect();
        setDoveMessage("Oops, those don't match. Try again!");
        setTimeout(() => {
          setSelectedEnglish(null);
          setSelectedTigrinya(null);
        }, 1000);
      }
    }
  }, [selectedEnglish, selectedTigrinya, words, matchedPairs, isGameOver, setDoveMessage, setDoveCheering, level, targetLang]);

  const handleEnglishClick = (word: string) => {
    if (isGameOver || matchedPairs.includes(words.find(w => w.translations[targetLang as keyof typeof w.translations] === word)?.id || '')) return;
    setSelectedEnglish(word);
    voiceCoach.playClick();
  };

  const handleTigrinyaClick = (word: string) => {
    if (isGameOver || matchedPairs.includes(words.find(w => w.translations.tigrinya === word)?.id || '')) return;
    setSelectedTigrinya(word);
    voiceCoach.playClick();
  };

  return (
    <div className="w-full h-full bg-purple-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-purple-500 hover:scale-110 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-purple-500">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="text-purple-500">🏆</span>
            <span className="font-bold text-purple-700">{score}</span>
          </div>
          <GameTimer duration={60} onTimeUp={handleTimeUp} isPaused={isGameOver} />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full max-w-4xl flex justify-center items-center gap-8 relative z-10">
        
        {/* English Column */}
        <div className="flex flex-col gap-4 w-1/3">
          <AnimatePresence>
            {englishOptions.map((word, index) => {
              const isMatched = matchedPairs.includes(word.id);
              const isSelected = selectedEnglish === word.translations[targetLang as keyof typeof word.translations];
              const displayWord = word.translations[targetLang as keyof typeof word.translations];
              
              return (
                <motion.button
                  key={`en-${word.id}-${index}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ 
                    opacity: isMatched ? 0 : 1, 
                    x: 0,
                    scale: isSelected ? 1.05 : 1
                  }}
                  whileHover={{ scale: isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: isMatched ? 1 : 0.95 }}
                  onClick={() => handleEnglishClick(displayWord)}
                  disabled={isMatched || isGameOver}
                  className={`p-4 rounded-2xl shadow-lg font-bold text-xl transition-colors ${
                    isSelected 
                      ? 'bg-purple-500 text-white border-4 border-purple-300' 
                      : 'bg-white text-purple-700 hover:bg-purple-50 border-4 border-transparent'
                  } ${isMatched ? 'pointer-events-none' : ''}`}
                >
                  {displayWord}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Connection Line Area (Visual only) */}
        <div className="w-16 h-full flex flex-col items-center justify-center opacity-30">
          <div className="w-1 h-full bg-purple-200 rounded-full" />
        </div>

        {/* Tigrinya Column */}
        <div className="flex flex-col gap-4 w-1/3">
          <AnimatePresence>
            {tigrinyaOptions.map((word, index) => {
              const isMatched = matchedPairs.includes(word.id);
              const isSelected = selectedTigrinya === word.translations.tigrinya;
              
              return (
                <motion.button
                  key={`ti-${word.id}-${index}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ 
                    opacity: isMatched ? 0 : 1, 
                    x: 0,
                    scale: isSelected ? 1.05 : 1
                  }}
                  whileHover={{ scale: isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: isMatched ? 1 : 0.95 }}
                  onClick={() => handleTigrinyaClick(word.translations.tigrinya)}
                  disabled={isMatched || isGameOver}
                  className={`p-4 rounded-2xl shadow-lg font-geez font-black text-3xl transition-colors ${
                    isSelected 
                      ? 'bg-purple-500 text-white border-4 border-purple-300' 
                      : 'bg-white text-purple-700 hover:bg-purple-50 border-4 border-transparent'
                  } ${isMatched ? 'pointer-events-none' : ''}`}
                >
                  {word.translations.tigrinya}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
