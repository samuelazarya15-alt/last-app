import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { words as wordHelpersWords } from '../data/wordHelpers';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

interface Card {
  id: number;
  wordId: number;
  text: string;
  type: 'native' | 'translation';
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryMatchGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTime = useRef(Date.now());
  const [level, setLevel] = useState(1);
  const [pairsCount, setPairsCount] = useState(4);

  useEffect(() => {
    // Increase difficulty every level
    const newPairsCount = Math.min(4 + Math.floor((level - 1) / 2) * 2, 12);
    setPairsCount(newPairsCount);
    startNewLevel(newPairsCount);
  }, [level]);

  const startNewLevel = React.useCallback((count: number) => {
    setDoveMessage("Find the matching pairs!");
    const shuffledWords = [...wordHelpersWords].sort(() => Math.random() - 0.5).slice(0, count);
    
    const newCards: Card[] = [];
    let idCounter = 0;
    
    const targetLang = language || 'english';

    shuffledWords.forEach(word => {
      newCards.push({
        id: idCounter++,
        wordId: word.id,
        text: word.translations.tigrinya,
        type: 'native',
        isFlipped: false,
        isMatched: false
      });
      newCards.push({
        id: idCounter++,
        wordId: word.id,
        text: word.translations[targetLang as keyof typeof word.translations],
        type: 'translation',
        isFlipped: false,
        isMatched: false
      });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setFlippedIndices([]);
    setMatches(0);
  }, [language, setDoveMessage]);

  const handleGameEnd = React.useCallback(async () => {
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    await logGameSession('memory', score, duration);
    onBack();
  }, [score, onBack]);

  const handleTimeUp = React.useCallback(() => {
    if (isAnimating) return;
    setDoveMessage("Time's up! Let's try again.");
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      handleGameEnd();
    }, 2000);
  }, [isAnimating, setDoveMessage, handleGameEnd]);

  const handleCardClick = (index: number) => {
    if (isAnimating || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length === 2) return;

    voiceCoach.playSfx('pop');
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    if (newFlipped.length === 2) {
      setIsAnimating(true);
      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.wordId === secondCard.wordId) {
        // Match!
        setTimeout(() => {
          voiceCoach.playSfx('score');
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setScore(prev => prev + 10);
          setMatches(prev => prev + 1);
          setFlippedIndices([]);
          setDoveCheering(true);
          setDoveMessage("You found a match!");
          
          setTimeout(() => {
            setDoveCheering(false);
            setIsAnimating(false);
            if (matches + 1 === pairsCount) {
              voiceCoach.playSfx('success');
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
              setDoveMessage(`Level ${level} complete!`);
              setTimeout(() => {
                setLevel(l => l + 1);
              }, 2000);
            }
          }, 1000);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          voiceCoach.playSfx('pop');
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsAnimating(false);
          setDoveMessage("Oops, try again!");
        }, 1000);
      }
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-100 to-white flex flex-col items-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '4s' }}>☁️</div>
        <div className="absolute top-20 right-20 text-8xl animate-bounce" style={{ animationDuration: '6s' }}>☁️</div>
        <div className="absolute bottom-20 left-1/4 text-7xl animate-bounce" style={{ animationDuration: '5s' }}>☁️</div>
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-6">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-sky-500 hover:scale-110 transition-transform border-2 border-sky-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        
        <div className="flex gap-3">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-sky-100">
            <span className="font-black text-sky-600">LVL {level}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-yellow-100">
            <span className="text-lg">🏆</span>
            <span className="font-black text-sky-700">{score}</span>
          </div>
          <GameTimer duration={60} onTimeUp={handleTimeUp} isPaused={isAnimating} resetKey={level} />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center relative z-10">
        <div className={`grid ${pairsCount <= 4 ? 'grid-cols-2 sm:grid-cols-4' : pairsCount <= 6 ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4 sm:grid-cols-6'} gap-3 sm:gap-4 w-full px-2`}>
          <AnimatePresence>
            {cards.map((card, index) => (
              <motion.div
                key={`${card.id}-${index}`}
                initial={{ scale: 0, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.03, type: 'spring', stiffness: 200 }}
                className="aspect-square relative perspective-1000"
              >
                <motion.button
                  whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: card.isFlipped || card.isMatched ? 1 : 0.95 }}
                  onClick={() => handleCardClick(index)}
                  className={`w-full h-full rounded-2xl shadow-xl transition-all duration-500 transform-style-3d relative ${
                    card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front of card (hidden) */}
                  <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center backface-hidden border-4 border-sky-100 group overflow-hidden">
                    <div className="absolute inset-0 bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-4xl sm:text-5xl relative z-10 drop-shadow-sm">❓</span>
                    <div className="absolute bottom-2 w-1/2 h-1 bg-sky-100 rounded-full" />
                  </div>
                  
                  {/* Back of card (revealed) */}
                  <div className={`absolute inset-0 rounded-2xl flex items-center justify-center backface-hidden rotate-y-180 border-4 ${
                    card.isMatched ? 'bg-green-50 border-green-300' : 'bg-sky-100 border-sky-300'
                  }`}>
                    <div className="flex flex-col items-center gap-1 p-2">
                      <span className={`font-black leading-tight ${card.type === 'native' ? 'font-geez text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} text-sky-900 text-center`}>
                        {card.text}
                      </span>
                      {card.isMatched && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-500 text-xl"
                        >
                          ✨
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
