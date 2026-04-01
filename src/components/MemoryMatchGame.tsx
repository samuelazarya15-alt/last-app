import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { words as wordHelpersWords } from '../data/wordHelpers';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

interface Card {
  id: number;
  wordId: string;
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

  const pairsCount = 4; // 8 cards total

  useEffect(() => {
    startNewLevel();
  }, [level]);

  const startNewLevel = React.useCallback(() => {
    setDoveMessage("Find the matching pairs!");
    const shuffledWords = [...wordHelpersWords].sort(() => Math.random() - 0.5).slice(0, pairsCount);
    
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
    <div className="w-full h-full bg-sky-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-sky-500 hover:scale-110 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-sky-500">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="text-sky-500">🏆</span>
            <span className="font-bold text-sky-700">{score}</span>
          </div>
          <GameTimer duration={60} onTimeUp={handleTimeUp} isPaused={isAnimating} resetKey={level} />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center gap-8 relative z-10">
        <div className="grid grid-cols-4 gap-4 w-full px-4">
          <AnimatePresence>
            {cards.map((card, index) => (
              <motion.div
                key={`${card.id}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square relative perspective-1000"
              >
                <motion.button
                  whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: card.isFlipped || card.isMatched ? 1 : 0.95 }}
                  onClick={() => handleCardClick(index)}
                  className={`w-full h-full rounded-2xl shadow-lg transition-all duration-500 transform-style-3d ${
                    card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front of card (hidden) */}
                  <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center backface-hidden border-4 border-sky-100">
                    <span className="text-4xl">☁️</span>
                  </div>
                  
                  {/* Back of card (revealed) */}
                  <div className="absolute inset-0 bg-sky-100 rounded-2xl flex items-center justify-center backface-hidden rotate-y-180 border-4 border-sky-300">
                    <span className={`font-bold ${card.type === 'native' ? 'font-geez text-3xl' : 'text-xl'} text-sky-800 text-center px-2`}>
                      {card.text}
                    </span>
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
