import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, RefreshCw, Star, Zap, BarChart2 } from 'lucide-react';
import wordsData from '../data/words.json';
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
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  const playSound = (type: 'match' | 'fail' | 'gameover') => {
    const sounds = {
      match: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/ping.mp3',
      fail: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/alien_death.wav',
      gameover: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/key.wav'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.5;
    audio.play().catch(e => {}); // Silently fail to avoid console noise
  };

  const spawnWord = useCallback(() => {
    const randomWord = (wordsData as any[])[Math.floor(Math.random() * wordsData.length)];
    const newWord: FallingWord = {
      id: randomWord.id,
      geez: randomWord.tigrinya,
      latin: randomWord.latin || randomWord.english, // Use latin if exists, else english
      english: randomWord[language.toLowerCase() as keyof typeof randomWord] as string,
      category: randomWord.category,
      x: Math.random() * 70 + 15, // 15% to 85% width
      y: -50,
      speed: 1.2 + Math.random() * 1.5 + (score / 200), // Speed increases with score
      uniqueKey: Date.now() + Math.random(),
    };
    setFallingWords(prev => [...prev, newWord]);
  }, [language, score]);

  const updateOptions = useCallback((currentFalling: FallingWord[]) => {
    if (currentFalling.length === 0) return;
    
    // Pick one from falling as target
    const target = currentFalling[0];
    setTargetWord(target);

    // Get 3 random other words
    const others = (wordsData as any[])
      .filter(w => w.id !== target.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => ({
        id: w.id,
        geez: w.tigrinya,
        latin: w.latin || w.english,
        english: w[language.toLowerCase() as keyof typeof w] as string,
        category: w.category
      }));

    const allOptions = [...others, { 
      id: target.id, 
      geez: target.geez, 
      latin: target.latin, 
      english: target.english, 
      category: target.category 
    }].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
  }, [language]);

  const gameLoop = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      if (!isPaused && !gameOver) {
        setFallingWords(prev => {
          const updated = prev.map(w => ({ ...w, y: w.y + w.speed }));
          
          // Check if any word hit the bottom
          const hitBottom = updated.some(w => w.y > 100);
          if (hitBottom) {
            playSound('fail');
            setGameOver(true);
            setDoveMessage("Oh no! The words fell. Try again!");
            logGameSession('geezgravity', score, 60 - gameTime);
            return updated.filter(w => w.y <= 100);
          }
          
          return updated;
        });

        // Spawn logic
        if (time - lastSpawnTime > 3500 - Math.min(score * 8, 2000)) {
          spawnWord();
          setLastSpawnTime(time);
        }
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, gameOver, score, spawnWord, lastSpawnTime, setDoveMessage, gameTime]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    if (fallingWords.length > 0 && !targetWord) {
      updateOptions(fallingWords);
    }
  }, [fallingWords, targetWord, updateOptions]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && !gameOver && gameTime > 0) {
        setGameTime(prev => prev - 1);
      } else if (gameTime === 0) {
        playSound('gameover');
        setGameOver(true);
        setDoveMessage("Time's up! Great job!");
        logGameSession('geezgravity', score, 60);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, gameOver, gameTime, setDoveMessage]);

  const handleOptionClick = (wordId: string) => {
    if (!targetWord || gameOver) return;

    if (wordId === targetWord.id) {
      // Correct
      playSound('match');
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      
      // Add match effect
      setMatchEffects(prev => [...prev, { id: Date.now(), x: targetWord.x, y: targetWord.y }]);
      
      setFallingWords(prev => prev.filter(w => w.id !== wordId));
      setTargetWord(null);
      setDoveCheering(true);
      setTimeout(() => setDoveCheering(false), 1000);
      
      const newStreak = streak + 1;
      const level = STREAK_LEVELS.find(l => l.count === newStreak);
      if (level) {
        voiceCoach.speak(level.name, language);
      }
    } else {
      // Incorrect
      setStreak(0);
      setScore(prev => Math.max(0, prev - 5));
      voiceCoach.speak("Try again!", language);
    }
  };

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setShowHighScores(false);
    setFallingWords([]);
    setTargetWord(null);
    setGameTime(60);
    setLastSpawnTime(0);
    setMatchEffects([]);
  };

  const fetchHighScores = async () => {
    const history = await getGameHistory(50);
    const gameScores = history
      .filter(s => s.gameId === 'geezgravity')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setHighScores(gameScores);
    setShowHighScores(true);
  };

  const getStreakLevel = () => {
    const level = [...STREAK_LEVELS].reverse().find(l => streak >= l.count);
    return level || null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-indigo-950 overflow-hidden relative font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-indigo-950/80 backdrop-blur-md border-b border-white/10">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={24} />
        </motion.button>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Score</span>
            <motion.span 
              key={score}
              initial={{ scale: 1.5, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-black text-white"
            >
              {score}
            </motion.span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Time</span>
            <span className={`text-2xl font-black ${gameTime < 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {gameTime}s
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end min-w-[80px]">
          <div className="flex items-center gap-2">
            <Zap size={20} className={streak > 0 ? "text-yellow-400 fill-yellow-400 animate-pulse" : "text-white/20"} />
            <span className={`text-2xl font-black ${streak > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{streak}</span>
          </div>
          <AnimatePresence>
            {getStreakLevel() && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className={`px-2 py-0.5 rounded-full ${getStreakLevel()?.bg} border border-white/10`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest ${getStreakLevel()?.color}`}>
                  {getStreakLevel()?.name}!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Game Area */}
      <div ref={gameContainerRef} className="flex-1 relative overflow-hidden pt-24 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-indigo-950 to-black">
        {/* Match Effects */}
        <AnimatePresence>
          {matchEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => setMatchEffects(prev => prev.filter(e => e.id !== effect.id))}
              className="absolute pointer-events-none z-50 flex flex-col items-center"
              style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
            >
              <Star className="text-yellow-400 fill-yellow-400" size={48} />
              <span className="text-2xl font-black text-yellow-400 mt-2">+10</span>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {fallingWords.map((word) => (
            <motion.div
              key={word.uniqueKey}
              initial={{ opacity: 0, scale: 0.5, y: -100 }}
              animate={{ opacity: 1, scale: 1, top: `${word.y}%`, left: `${word.x}%` }}
              exit={{ opacity: 0, scale: 2, filter: 'blur(10px)' }}
              className={`absolute transform -translate-x-1/2 p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-w-[120px] border-4 transition-all duration-300 ${
                targetWord?.id === word.id 
                  ? 'bg-white border-yellow-400 scale-110 z-20 shadow-yellow-400/20' 
                  : 'bg-white/5 border-white/10 z-10'
              }`}
            >
              <span className={`text-4xl font-geez font-black drop-shadow-lg ${targetWord?.id === word.id ? 'text-indigo-900' : 'text-white'}`}>
                {word.geez}
              </span>
              {targetWord?.id === word.id && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-3 -right-3 bg-yellow-400 text-indigo-900 p-1.5 rounded-full shadow-lg"
                >
                  <Star size={18} fill="currentColor" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-5 select-none">
          <div className="absolute top-1/4 left-1/4 text-[15rem] font-geez text-white">ሀ</div>
          <div className="absolute top-2/3 left-3/4 text-[12rem] font-geez text-white">ለ</div>
          <div className="absolute top-1/2 left-1/2 text-[18rem] font-geez text-white">ሐ</div>
        </div>
      </div>

      {/* Options Panel */}
      <div className="h-[28vh] bg-indigo-950/90 backdrop-blur-xl p-6 flex flex-col gap-4 z-50 border-t border-white/10">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-indigo-500/30" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Select the matching Latin</span>
          <div className="h-px w-12 bg-indigo-500/30" />
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {options.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(79, 70, 229, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOptionClick(option.id)}
              className="bg-white/5 border-2 border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center transition-all group"
            >
              <span className="text-xl font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                {option.latin}
              </span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase mt-1 tracking-widest">{option.category}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="bg-indigo-900 rounded-[3rem] p-10 w-full max-w-md flex flex-col items-center text-center shadow-[0_0_100px_rgba(79,70,229,0.3)] border border-white/10 relative overflow-hidden"
            >
              {/* Decorative background in modal */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
              
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-28 h-28 bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-yellow-400/20"
              >
                <Trophy size={56} className="text-indigo-900" />
              </motion.div>
              
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Game Over!</h2>
              <h3 className="text-2xl font-geez font-black text-yellow-400 mb-8">ጸወታ ተወዲኡ!</h3>
              
              <div className="grid grid-cols-2 gap-6 w-full mb-10">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <span className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Final Score</span>
                  <span className="text-3xl font-black text-white">{score}</span>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <span className="block text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Stars Earned</span>
                  <div className="flex items-center justify-center gap-2">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-3xl font-black text-white">+{Math.floor(score / 10)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                {!showHighScores ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={restartGame}
                      className="w-full py-5 bg-white text-indigo-900 rounded-2xl font-black text-xl shadow-[0_8px_0_rgb(226,232,240)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-3 transition-all"
                    >
                      <RefreshCw size={24} />
                      RETRY
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchHighScores}
                      className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black text-xl shadow-[0_8px_0_rgb(67,56,202)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-3 transition-all"
                    >
                      <BarChart2 size={24} />
                      HIGH SCORES
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onBack}
                      className="w-full py-5 bg-white/5 text-white/60 rounded-2xl font-black text-xl hover:bg-white/10 transition-all"
                    >
                      EXIT GAME
                    </motion.button>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="bg-white/10 rounded-3xl p-6 mb-6">
                      <h4 className="text-indigo-300 font-black uppercase tracking-widest text-xs mb-4">Top Performances</h4>
                      <div className="flex flex-col gap-3">
                        {highScores.length > 0 ? highScores.map((s, i) => (
                          <div key={s.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="text-indigo-400 font-black w-4">{i + 1}</span>
                              <span className="text-white font-bold">{new Date(s.timestamp).toLocaleDateString()}</span>
                            </div>
                            <span className="text-yellow-400 font-black text-lg">{s.score}</span>
                          </div>
                        )) : (
                          <p className="text-white/40 italic py-4">No scores logged yet!</p>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowHighScores(false)}
                      className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/20 transition-all"
                    >
                      BACK
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
