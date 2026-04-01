import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, RefreshCw, Star, Zap, BarChart2, Timer } from 'lucide-react';
import { words } from '../data/wordHelpers';
import { voiceCoach } from '../lib/VoiceCoach';
import { updateStats, logGameSession, getGameHistory, GameSession } from '../lib/progress';

interface Word {
  id: string;
  geez: string;
  latin: string;
  english: string;
  category: string;
}

interface FallingWord extends Word {
  x: number;
  y: number;
  speed: number;
  uniqueKey: number;
}

interface MatchEffect {
  id: number;
  x: number;
  y: number;
}

const STREAK_LEVELS = [
  { count: 3, name: 'Abol', color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  { count: 6, name: 'Tona', color: 'text-orange-400', bg: 'bg-orange-400/20' },
  { count: 9, name: 'Bereka', color: 'text-red-400', bg: 'bg-red-400/20' },
];

export function GeezGravityGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [options, setOptions] = useState<Word[]>([]);
  const [targetWord, setTargetWord] = useState<FallingWord | null>(null);
  const [gameTime, setGameTime] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [lastSpawnTime, setLastSpawnTime] = useState(0);
  const [matchEffects, setMatchEffects] = useState<MatchEffect[]>([]);
  const [showHighScores, setShowHighScores] = useState(false);
  const [highScores, setHighScores] = useState<GameSession[]>([]);
  const [level, setLevel] = useState(1);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  const playSound = (type: 'match' | 'fail' | 'gameover') => {
    if (type === 'match') {
      voiceCoach.playCorrect();
    } else if (type === 'fail') {
      voiceCoach.playIncorrect();
    } else if (type === 'gameover') {
      voiceCoach.playIncorrect();
    }
  };

  const spawnWord = useCallback(() => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const targetLang = language || 'english';
    const newWord: FallingWord = {
      id: randomWord.id,
      geez: randomWord.translations.tigrinya,
      latin: randomWord.translations[targetLang as keyof typeof randomWord.translations], // Use target language as latin
      english: randomWord.translations[targetLang as keyof typeof randomWord.translations],
      category: randomWord.category,
      x: Math.random() * 70 + 15, // 15% to 85% width
      y: -50,
      speed: 1.2 + Math.random() * 1.5 + (level * 0.5), // Speed increases with level
      uniqueKey: Date.now() + Math.random(),
    };
    setFallingWords(prev => [...prev, newWord]);
  }, [language, level]);

  const updateOptions = useCallback((currentFalling: FallingWord[]) => {
    if (currentFalling.length === 0) return;
    
    // Pick one from falling as target
    const target = currentFalling[0];
    setTargetWord(target);

    // Get 3 random other words
    const targetLang = language || 'english';
    const others = words
      .filter(w => w.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => ({
        id: w.id,
        geez: w.translations.tigrinya,
        latin: w.translations[targetLang as keyof typeof w.translations],
        english: w.translations[targetLang as keyof typeof w.translations],
        category: w.category
      }));

    const allOptions = [target, ...others].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  }, [language]);

  const handleMatch = useCallback((selectedOption: Word) => {
    if (gameOver || isPaused || !targetWord) return;

    if (selectedOption.id === targetWord.id) {
      // Match!
      playSound('match');
      setDoveCheering(true);
      
      const newScore = score + 10 + (streak * 2);
      setScore(newScore);
      setStreak(s => s + 1);
      
      if (newScore > 0 && newScore % 50 === 0) {
        setLevel(l => l + 1);
        setDoveMessage(`Level Up! You are now level ${level + 1}!`);
      }

      // Add match effect
      setMatchEffects(prev => [...prev, { id: Date.now(), x: targetWord.x, y: targetWord.y }]);

      // Remove matched word
      setFallingWords(prev => {
        const remaining = prev.filter(w => w.uniqueKey !== targetWord.uniqueKey);
        updateOptions(remaining);
        return remaining;
      });

      // Clear effect after animation
      setTimeout(() => {
        setMatchEffects(prev => prev.filter(e => e.id !== Date.now()));
        setDoveCheering(false);
      }, 1000);

    } else {
      // Miss
      playSound('fail');
      setStreak(0);
      setDoveMessage("Oops! Try again.");
    }
  }, [score, streak, gameOver, isPaused, targetWord, updateOptions, setDoveMessage, setDoveCheering, level]);

  const endGame = useCallback(async () => {
    setGameOver(true);
    setIsPaused(true);
    playSound('gameover');
    setDoveMessage(`Game Over! You scored ${score} points!`);
    
    try {
      await logGameSession('geezgravity', score, 60);
      const history = await getGameHistory('geezgravity');
      setHighScores(history.slice(0, 5)); // Top 5
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  }, [score, setDoveMessage]);

  const gameLoop = useCallback((time: number) => {
    if (isPaused || gameOver) return;

    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;

      // Update falling words
      setFallingWords(prev => {
        const updated = prev.map(w => ({
          ...w,
          y: w.y + (w.speed * (deltaTime / 16)) // Normalize to 60fps
        }));

        // Check for missed words (off screen)
        const missed = updated.filter(w => w.y > 100);
        if (missed.length > 0) {
          setStreak(0);
          // If the target word was missed, update options
          if (missed.some(m => m.uniqueKey === targetWord?.uniqueKey)) {
            const remaining = updated.filter(w => w.y <= 100);
            updateOptions(remaining);
          }
        }

        return updated.filter(w => w.y <= 100);
      });

      // Spawn new words
      if (time - lastSpawnTime > Math.max(1000, 3000 - (level * 200))) {
        spawnWord();
        setLastSpawnTime(time);
      }
    }

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, gameOver, lastSpawnTime, score, targetWord, spawnWord, updateOptions, level]);

  useEffect(() => {
    if (!isPaused && !gameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop, isPaused, gameOver]);

  useEffect(() => {
    if (gameTime > 0 && !isPaused && !gameOver) {
      const timer = setInterval(() => setGameTime(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (gameTime === 0 && !gameOver) {
      endGame();
    }
  }, [gameTime, isPaused, gameOver, endGame]);

  // Initial spawn
  useEffect(() => {
    if (fallingWords.length === 0 && !gameOver && !isPaused) {
      spawnWord();
    }
  }, [fallingWords.length, gameOver, isPaused, spawnWord]);

  // Update options when falling words change (if no target)
  useEffect(() => {
    if (fallingWords.length > 0 && !targetWord) {
      updateOptions(fallingWords);
    }
  }, [fallingWords, targetWord, updateOptions]);

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setGameTime(60);
    setFallingWords([]);
    setOptions([]);
    setTargetWord(null);
    setGameOver(false);
    setIsPaused(false);
    setLevel(1);
    setLastSpawnTime(performance.now());
    lastTimeRef.current = undefined;
    setDoveMessage("Let's play Ge'ez Gravity! Match the falling words.");
  };

  const currentStreakLevel = STREAK_LEVELS.slice().reverse().find(l => streak >= l.count);

  return (
    <div className="w-full h-full bg-indigo-950 flex flex-col items-center relative overflow-hidden font-sans text-white">
      
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center p-4 z-10 bg-indigo-900/50 backdrop-blur-sm border-b border-indigo-800/50">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-indigo-800/80 rounded-full flex items-center justify-center shadow-lg text-indigo-200 hover:bg-indigo-700 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex gap-3">
          <div className="bg-indigo-800/80 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-indigo-700/50">
            <span className="font-bold text-indigo-200 text-sm">Lvl {level}</span>
          </div>
          <div className="bg-indigo-800/80 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-indigo-700/50">
            <Trophy className="text-yellow-400" size={16} />
            <span className="font-black text-white text-sm">{score}</span>
          </div>
          <div className="bg-indigo-800/80 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-indigo-700/50">
            <Timer className={gameTime <= 10 ? "text-red-400 animate-pulse" : "text-indigo-300"} size={16} />
            <span className={`font-black text-sm ${gameTime <= 10 ? "text-red-400" : "text-white"}`}>{gameTime}s</span>
          </div>
        </div>
      </div>

      {/* Streak Indicator */}
      <AnimatePresence>
        {streak >= 3 && currentStreakLevel && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full ${currentStreakLevel.bg} border border-white/20 backdrop-blur-md flex items-center gap-2 z-20 shadow-xl`}
          >
            <Zap className={currentStreakLevel.color} size={16} />
            <span className={`font-black text-sm ${currentStreakLevel.color}`}>
              {currentStreakLevel.name} Streak! ({streak}x)
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Area */}
      <div 
        ref={gameContainerRef}
        className="flex-1 w-full relative overflow-hidden"
      >
        {/* Falling Words */}
        <AnimatePresence>
          {fallingWords.map((word) => (
            <motion.div
              key={word.uniqueKey}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: word.uniqueKey === targetWord?.uniqueKey ? 1.2 : 1,
                top: `${word.y}%`,
                left: `${word.x}%`,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.1 }} // Smooth out the manual updates
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-3 rounded-2xl shadow-2xl backdrop-blur-sm border-2 ${
                word.uniqueKey === targetWord?.uniqueKey 
                  ? 'bg-indigo-600/90 border-indigo-400 z-20 shadow-[0_0_30px_rgba(99,102,241,0.6)]' 
                  : 'bg-indigo-800/60 border-indigo-700/50 z-10'
              }`}
            >
              <span className={`font-geez font-black ${word.uniqueKey === targetWord?.uniqueKey ? 'text-4xl text-white' : 'text-2xl text-indigo-200'}`}>
                {word.geez}
              </span>
              {word.uniqueKey === targetWord?.uniqueKey && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 border-2 border-dashed border-indigo-400/50 rounded-3xl pointer-events-none"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Match Effects */}
        <AnimatePresence>
          {matchEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 1, scale: 0.5, top: `${effect.y}%`, left: `${effect.x}%` }}
              animate={{ opacity: 0, scale: 2, top: `${effect.y - 10}%` }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl pointer-events-none z-30"
            >
              ✨
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Options Panel */}
      <div className="w-full bg-indigo-900/80 backdrop-blur-md border-t border-indigo-800/50 p-4 pb-8 z-20">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {options.map((option, index) => (
            <motion.button
              key={`${option.id}-${index}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMatch(option)}
              disabled={gameOver || isPaused}
              className="bg-indigo-800/80 hover:bg-indigo-700 border-2 border-indigo-600/50 p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <span className="text-lg font-black text-white">{option.english}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-indigo-900 border border-indigo-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-600/20 to-transparent pointer-events-none" />
              
              <div className="text-6xl mb-4 relative z-10">☄️</div>
              <h2 className="text-3xl font-black text-white mb-2 relative z-10">Time's Up!</h2>
              
              <div className="bg-indigo-950/50 rounded-2xl p-4 mb-6 border border-indigo-800/50 relative z-10">
                <p className="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-1">Final Score</p>
                <p className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                  {score}
                </p>
              </div>

              {/* High Scores Toggle */}
              <button 
                onClick={() => setShowHighScores(!showHighScores)}
                className="flex items-center justify-center gap-2 w-full text-indigo-300 hover:text-white transition-colors mb-6 font-bold text-sm"
              >
                <BarChart2 size={16} />
                {showHighScores ? 'Hide Leaderboard' : 'Show Leaderboard'}
              </button>

              <AnimatePresence>
                {showHighScores && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-indigo-950/50 rounded-xl p-3 border border-indigo-800/50 text-left">
                      <h3 className="text-indigo-200 font-bold text-xs uppercase tracking-wider mb-2 border-b border-indigo-800/50 pb-2">Top Scores</h3>
                      {highScores.length > 0 ? (
                        <ul className="space-y-2">
                          {highScores.map((session, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-indigo-300 flex items-center gap-2">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="w-4 inline-block text-center">{idx + 1}.</span>}
                                {new Date(session.timestamp).toLocaleDateString()}
                              </span>
                              <span className="font-bold text-white">{session.score}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-indigo-400 text-sm italic text-center py-2">No scores yet!</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3 relative z-10">
                <button
                  onClick={restartGame}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-xl font-black text-lg shadow-[0_4px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Play Again
                </button>
                <button
                  onClick={onBack}
                  className="w-full bg-indigo-800 hover:bg-indigo-700 text-indigo-200 py-3 rounded-xl font-bold transition-colors"
                >
                  Back to Games
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
