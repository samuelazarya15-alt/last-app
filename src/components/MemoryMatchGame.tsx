import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import WORDS from '../data/words.json';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';

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
    const shuffledWords = [...WORDS].sort(() => Math.random() - 0.5).slice(0, pairsCount);
    
    const newCards: Card[] = [];
    let idCounter = 0;
    
    shuffledWords.forEach(word => {
      newCards.push({
        id: idCounter++,
        wordId: word.id,
        text: word.tigrinya,
        type: 'native',
        isFlipped: false,
        isMatched: false
      });
      newCards.push({
        id: idCounter++,
        wordId: word.id,
        text: word[language as keyof typeof word] as string,
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
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setScore(s => s + 20);
          setMatches(m => m + 1);
          setIsAnimating(false);
          setDoveCheering(true);
          setDoveMessage("Great match!");
          setTimeout(() => setDoveCheering(false), 1500);

          if (matches + 1 === pairsCount) {
            // Level complete
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#A855F7', '#3B82F6', '#10B981']
            });
            setTimeout(() => {
              setLevel(l => l + 1);
            }, 2000);
          }
        }, 800);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsAnimating(false);
        }, 1200);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-4 pb-32 relative overflow-hidden bg-purple-100">
      <div className="w-full flex justify-between items-center z-10 mb-2 mt-2">
        <button 
          onClick={onBack}
          className="bg-white/90 px-4 py-2 rounded-full font-black text-purple-600 shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-[0_0px_0_rgb(147,51,234)] transition-all text-sm border-2 border-purple-200"
        >
          ← Back
        </button>

        <div className="flex gap-2">
          <div className="bg-purple-400 px-3 py-1 rounded-full font-black text-white shadow-[0_4px_0_rgb(147,51,234)] text-sm border-2 border-purple-300">
            Lvl {level}
          </div>
          <div className="bg-yellow-400 px-3 py-1 rounded-full font-black text-yellow-900 shadow-[0_4px_0_rgb(202,138,4)] text-sm border-2 border-yellow-300">
            {score} pt
          </div>
        </div>
      </div>

      <div className="w-full z-10 mb-4">
        <GameTimer 
          duration={60} 
          onTimeUp={handleTimeUp} 
          resetKey={level} 
          isPaused={isAnimating || matches === pairsCount}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md z-10 mt-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`relative w-full aspect-square cursor-pointer ${card.isMatched ? 'opacity-0 pointer-events-none' : ''}`}
            onClick={() => handleCardClick(index)}
            whileHover={!card.isFlipped && !isAnimating ? { scale: 1.05 } : {}}
            whileTap={!card.isFlipped && !isAnimating ? { scale: 0.95 } : {}}
            style={{ perspective: 1000 }}
          >
            <motion.div
              className="w-full h-full relative"
              animate={{ rotateY: card.isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front of card (hidden) */}
              <div 
                className="absolute inset-0 bg-purple-500 rounded-xl border-4 border-purple-600 shadow-[0_4px_0_rgb(147,51,234)] flex items-center justify-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-4xl">❓</span>
              </div>

              {/* Back of card (revealed) */}
              <div 
                className="absolute inset-0 bg-white rounded-xl border-4 border-purple-300 shadow-md flex items-center justify-center p-2 text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className={`font-black ${card.type === 'native' ? 'text-2xl text-purple-800' : 'text-xl text-blue-600'}`}>
                  {card.text}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
