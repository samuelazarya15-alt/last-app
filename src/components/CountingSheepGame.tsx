import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Timer, Moon, Stars, Cloud } from 'lucide-react';
import { logGameSession } from '../lib/progress';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';
import confetti from 'canvas-confetti';

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
  const [isSuccess, setIsSuccess] = useState(false);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Count the jumping sheep!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const numberWords = words.filter(w => w.category === 'Numbers');
    if (numberWords.length === 0) return;

    let maxSheep = 3;
    if (currentLevel === 2) maxSheep = 5;
    if (currentLevel >= 3) maxSheep = 10;

    const count = Math.floor(Math.random() * maxSheep) + 1;
    setSheepCount(count);
    setIsSuccess(false);
    
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
    
    const availableWords = numberWords.filter(w => parseInt(w.id) >= 62 && parseInt(w.id) <= 62 + 10);
    
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
    if (gameState !== 'playing' || isSuccess) return;

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
      setIsSuccess(true);
      
      let nextLevel = level;
      if (newScore > 0 && newScore % 50 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      setTimeout(() => {
        setDoveCheering(false);
        nextRound(nextLevel);
      }, 2000);
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
    <div className="w-full h-full bg-[#0f172a] flex flex-col items-center p-4 relative overflow-hidden font-sans">
      {/* Night Sky Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 right-10 text-yellow-100/20"
        >
          <Moon size={80} fill="currentColor" />
        </motion.div>
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-20 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-white hover:bg-white/20 transition-all border border-white/20"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border border-blue-500/30">
            <span className="font-black text-blue-400">LVL {level}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border border-yellow-500/30">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-yellow-400">{score}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border border-red-500/30">
            <Timer className={timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-red-400"} size={20} />
            <span className={`font-black ${timeLeft <= 10 ? "text-red-500" : "text-white"}`}>{timeLeft}s</span>
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
            className="flex flex-col items-center justify-center flex-1 z-20"
          >
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-6 drop-shadow-2xl"
            >
              🐑
            </motion.div>
            <h2 className="text-5xl font-black text-white mb-4 text-center">Counting Sheep</h2>
            <p className="text-blue-200 font-bold mb-8 text-center max-w-xs text-lg">
              Count the fluffy sheep jumping over the fence!
            </p>
            <button 
              onClick={startGame}
              className="bg-indigo-600 text-white px-16 py-5 rounded-full font-black text-3xl shadow-[0_10px_0_rgb(49,46,129)] active:translate-y-[10px] active:shadow-none transition-all border-2 border-indigo-400"
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
            className="flex flex-col items-center justify-between flex-1 w-full max-w-2xl py-8 z-20"
          >
            {/* Jumping Area */}
            <div className="w-full h-64 relative flex items-end justify-center mb-12">
              {/* Fence */}
              <div className="absolute bottom-0 w-full h-12 bg-amber-900/40 border-t-4 border-amber-900/60 rounded-t-lg z-10 flex items-center justify-center gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-2 h-full bg-amber-900/40" />
                ))}
              </div>

              {/* Sheep */}
              <div className="flex flex-wrap justify-center gap-2 z-20">
                {Array.from({ length: sheepCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -200, y: 0, opacity: 0 }}
                    animate={{ 
                      x: (i - (sheepCount-1)/2) * 60,
                      y: [0, -100, 0],
                      opacity: 1
                    }}
                    transition={{ 
                      delay: i * 0.3,
                      y: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
                      x: { duration: 0.5 }
                    }}
                    className="text-6xl drop-shadow-lg"
                  >
                    🐑
                  </motion.div>
                ))}
              </div>

              {/* Grass */}
              <div className="absolute -bottom-4 w-full h-8 bg-emerald-900/30 blur-md" />
            </div>

            {/* Options Area */}
            <div className="w-full">
              <p className="text-center text-blue-300 font-black uppercase tracking-widest text-sm mb-6">How many sheep?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {options.map((word, idx) => (
                  <motion.button
                    key={`${word.id}-${idx}`}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(word)}
                    className={`bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      isSuccess && (
                        (sheepCount === 1 && word.english === 'One') ||
                        (sheepCount === 2 && word.english === 'Two') ||
                        (sheepCount === 3 && word.english === 'Three') ||
                        (sheepCount === 4 && word.english === 'Four') ||
                        (sheepCount === 5 && word.english === 'Five') ||
                        (sheepCount === 6 && word.english === 'Six') ||
                        (sheepCount === 7 && word.english === 'Seven') ||
                        (sheepCount === 8 && word.english === 'Eight') ||
                        (sheepCount === 9 && word.english === 'Nine') ||
                        (sheepCount === 10 && word.english === 'Ten')
                      ) ? 'border-green-500 bg-green-500/20' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-3xl font-geez font-black text-white">{word.translations.tigrinya}</span>
                    <span className="text-sm font-bold text-blue-300">({word.translations[language || 'english']})</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 z-20"
          >
            <div className="text-8xl mb-6">🌟</div>
            <h2 className="text-5xl font-black text-white mb-2">Sweet Dreams!</h2>
            <p className="text-2xl font-bold text-blue-200 mb-8">You counted {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-white/10 text-white px-10 py-5 rounded-3xl font-black text-xl border border-white/20 hover:bg-white/20 transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-[0_8px_0_rgb(49,46,129)] active:translate-y-1 active:shadow-none transition-all border-2 border-indigo-400"
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

