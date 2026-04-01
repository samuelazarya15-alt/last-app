import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';

interface CountingSheepGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export const CountingSheepGame: React.FC<CountingSheepGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [sheepCount, setSheepCount] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [level, setLevel] = useState(1);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("How many sheep can you see?");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const numberWords = words.filter(w => w.category === 'Numbers');
    if (numberWords.length === 0) return;

    let maxSheep = 3;
    if (currentLevel === 2) maxSheep = 5;
    if (currentLevel >= 3) maxSheep = 10;

    const count = Math.floor(Math.random() * maxSheep) + 1;
    setSheepCount(count);
    
    const targetWord = numberWords.find(w => w.english === count.toString() || 
      (count === 1 && w.english === 'One') ||
      (count === 2 && w.english === 'Two') ||
      (count === 3 && w.english === 'Three') ||
      (count === 4 && w.english === 'Four') ||
      (count === 5 && w.english === 'Five') ||
      (count === 6 && w.english === 'Six') ||
      (count === 7 && w.english === 'Seven') ||
      (count === 8 && w.english === 'Eight') ||
      (count === 9 && w.english === 'Nine') ||
      (count === 10 && w.english === 'Ten')
    );

    if (!targetWord) return;

    const opts = new Set<any>();
    opts.add(targetWord);
    
    const availableWords = numberWords.filter(w => parseInt(w.id) >= 62 && parseInt(w.id) <= 62 + maxSheep - 1);
    
    while (opts.size < 3) {
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      if (randomWord) opts.add(randomWord);
    }
    
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    
    const targetLang = language || 'english';
    const translation = targetWord.translations[targetLang as keyof typeof targetWord.translations];
    voiceCoach.playDualAudio(translation, targetLang, targetWord.audioUrl);
  }, [language]);

  const handleSelect = (selectedWord: any) => {
    if (gameState !== 'playing') return;

    const isCorrect = 
      (sheepCount === 1 && selectedWord.english === 'One') ||
      (sheepCount === 2 && selectedWord.english === 'Two') ||
      (sheepCount === 3 && selectedWord.english === 'Three') ||
      (sheepCount === 4 && selectedWord.english === 'Four') ||
      (sheepCount === 5 && selectedWord.english === 'Five') ||
      (sheepCount === 6 && selectedWord.english === 'Six') ||
      (sheepCount === 7 && selectedWord.english === 'Seven') ||
      (sheepCount === 8 && selectedWord.english === 'Eight') ||
      (sheepCount === 9 && selectedWord.english === 'Nine') ||
      (sheepCount === 10 && selectedWord.english === 'Ten');

    if (isCorrect) {
      const newScore = score + 10;
      setScore(newScore);
      setDoveCheering(true);
      voiceCoach.playCorrect();
      
      let nextLevel = level;
      if (newScore > 0 && newScore % 50 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
      }
      
      setTimeout(() => {
        setDoveCheering(false);
        nextRound(nextLevel);
      }, 1000);
    } else {
      voiceCoach.playIncorrect();
      setDoveMessage("Try counting again!");
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('sheep', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-blue-600">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-slate-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-slate-600">{timeLeft}s</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center flex-1"
          >
            <div className="text-6xl mb-6">🐑</div>
            <h2 className="text-3xl font-black text-slate-600 mb-4 text-center">Counting Sheep</h2>
            <p className="text-gray-500 font-bold mb-8 text-center max-w-xs">
              Count the fluffy sheep and pick the right Tigrinya number!
            </p>
            <button 
              onClick={startGame}
              className="bg-slate-500 text-white px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(71,85,105)] active:translate-y-1 active:shadow-none transition-all"
            >
              START!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-start flex-1 w-full max-w-md"
          >
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {Array.from({ length: sheepCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-6xl"
                >
                  🐑
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-4 w-full justify-center">
              {options.map((word, idx) => (
                <motion.button
                  key={`${word.id}-${idx}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(word)}
                  className="w-full bg-white rounded-3xl shadow-md border-4 border-slate-100 flex flex-col items-center justify-center py-4 px-6 hover:border-slate-400 transition-all"
                >
                  <span className="text-3xl font-geez font-black text-slate-700">{word.translations.tigrinya}</span>
                  <span className="text-sm font-bold text-slate-400">({word.translations[language || 'english']})</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1"
          >
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-black text-slate-600 mb-2">Counting Finished!</h2>
            <p className="text-xl font-bold text-gray-500 mb-8">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-slate-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(71,85,105)] active:translate-y-1 active:shadow-none transition-all"
              >
                PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
