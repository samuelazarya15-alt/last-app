import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Zap, Snowflake, Flame, Trophy, Star, Cloud, Timer, ArrowLeft } from 'lucide-react';
import { words } from '../data/wordHelpers';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

type BallType = 'standard' | 'golden' | 'fire' | 'ice';

export function StadiumGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [kickedOption, setKickedOption] = useState<string | null>(null);
  const [ballType, setBallType] = useState<BallType>('standard');

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Kick the ball to the matching Tigrinya word!");
    voiceCoach.playMusic('https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/ping.mp3');
  };

  const nextRound = useCallback((currentLevel: number) => {
    const actionWords = words.filter(w => w.category === 'Action' || w.category === 'Nature');
    if (actionWords.length === 0) return;

    let numOptions = 2;
    if (currentLevel === 2) numOptions = 3;
    if (currentLevel >= 3) numOptions = 4;

    const target = actionWords[Math.floor(Math.random() * actionWords.length)];
    setCurrentTarget(target);
    
    const opts = new Set<any>();
    opts.add(target);
    while (opts.size < Math.min(numOptions, actionWords.length)) {
      const randomWord = actionWords[Math.floor(Math.random() * actionWords.length)];
      if (randomWord) opts.add(randomWord);
    }
    
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    
    // Randomly assign a special ball type (20% chance)
    const rand = Math.random();
    if (rand > 0.9) setBallType('golden');
    else if (rand > 0.8) setBallType('fire');
    else if (rand > 0.7) setBallType('ice');
    else setBallType('standard');

    const targetLang = language || 'english';
    const translation = target.translations[targetLang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, targetLang, target.audioUrl);
  }, [language]);

  const handleSelect = (id: string) => {
    if (gameState !== 'playing' || !currentTarget || isAnimating) return;

    setKickedOption(id);
    setIsAnimating(true);
    voiceCoach.playSfx('kick');

    setTimeout(() => {
      if (id === currentTarget.id) {
        voiceCoach.playCorrect();
        setDoveCheering(true);
        
        let points = 10;
        let message = "GOAL! Great job!";
        let confettiColors = ['#FFD700', '#00FF00', '#0000FF', '#FF0000'];

        if (ballType === 'golden') {
          points = 30;
          message = "GOLDEN GOAL! +30 points!";
          confettiColors = ['#FFD700', '#FFFACD', '#DAA520'];
        } else if (ballType === 'fire') {
          points = 20;
          message = "FIRE SHOT! +20 points!";
          confettiColors = ['#FF4500', '#FF8C00', '#FF0000'];
        } else if (ballType === 'ice') {
          points = 15;
          message = "COOL GOAL! +15 points!";
          confettiColors = ['#00BFFF', '#87CEEB', '#FFFFFF'];
        }

        setDoveMessage(message);
        const newScore = score + points;
        setScore(newScore);
        
        let nextLevel = level;
        if (newScore > 0 && newScore % 50 === 0) {
          nextLevel += 1;
          setLevel(nextLevel);
          setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
          voiceCoach.playSfx('success');
        }
        
        confetti({
          particleCount: ballType === 'golden' ? 250 : 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: confettiColors
        });

        setTimeout(() => {
          setIsAnimating(false);
          setKickedOption(null);
          setDoveCheering(false);
          nextRound(nextLevel);
        }, 2000);
      } else {
        voiceCoach.playIncorrect();
        setDoveMessage("Oops! Try again!");
        setTimeout(() => {
          setIsAnimating(false);
          setKickedOption(null);
        }, 1000);
      }
    }, 500);
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('football', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
      voiceCoach.stopMusic();
    }
  }, [timeLeft, gameState, score]);

  useEffect(() => {
    return () => voiceCoach.stopMusic();
  }, []);

  const getBallStyles = () => {
    switch (ballType) {
      case 'golden': return 'bg-yellow-400 border-yellow-600 shadow-[0_6px_0_rgb(202,138,4)]';
      case 'fire': return 'bg-orange-500 border-orange-700 shadow-[0_6px_0_rgb(194,65,12)]';
      case 'ice': return 'bg-blue-300 border-blue-500 shadow-[0_6px_0_rgb(37,99,235)]';
      default: return 'bg-white border-gray-800 shadow-[0_6px_0_rgb(31,41,55)]';
    }
  };

  const getBallIcon = () => {
    switch (ballType) {
      case 'golden': return <Star className="text-yellow-600" size={20} fill="currentColor" />;
      case 'fire': return <Flame className="text-orange-200" size={20} />;
      case 'ice': return <Snowflake className="text-blue-600" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-4 pb-32 relative overflow-hidden">
      {/* Stadium Background */}
      <div className="absolute inset-0 bg-green-500 overflow-hidden" style={{
        backgroundImage: 'linear-gradient(to bottom, #4ade80 0%, #22c55e 100%)',
        perspective: '1000px'
      }}>
        {/* Animated Clouds */}
        <motion.div 
          animate={{ x: [-100, 500] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-0 text-white/30"
        >
          <Cloud size={100} fill="currentColor" />
        </motion.div>
        <motion.div 
          animate={{ x: [500, -100] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-24 right-0 text-white/20"
        >
          <Cloud size={80} fill="currentColor" />
        </motion.div>

        {/* Stadium Lights */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-4 pt-2">
          {[1, 2, 3, 4].map(i => (
            <motion.div 
              key={i}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              className="w-8 h-8 rounded-full bg-yellow-100 shadow-[0_0_20px_rgba(254,240,138,0.8)]"
            />
          ))}
        </div>

        {/* Pitch Lines */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[60%] border-t-8 border-white/40 rounded-[50%] transform rotate-x-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] border-t-8 border-white/40 rounded-[50%] transform rotate-x-60" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[100%] bg-white/40" />
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-4">
        <button 
          onClick={() => {
            voiceCoach.stopMusic();
            onBack();
          }}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-green-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <span className="font-bold text-blue-600">Lvl {level}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-green-600">{score}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            <Timer className="text-red-500" size={20} />
            <span className="font-black text-green-600">{timeLeft}s</span>
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
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            <div className="text-6xl mb-6">⚽</div>
            <h2 className="text-3xl font-black text-white mb-4 text-center drop-shadow-md">Word Football</h2>
            <p className="text-white font-bold mb-8 text-center max-w-xs drop-shadow-md">
              Kick the ball to the matching Tigrinya word!
            </p>
            <button 
              onClick={startGame}
              className="bg-white text-green-600 px-12 py-4 rounded-3xl font-black text-2xl shadow-[0_8px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
            >
              START!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && currentTarget && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center flex-1 w-full max-w-md z-10"
          >
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-xl border-4 border-green-100 mb-8 text-center w-full">
              <p className="text-gray-400 font-black uppercase tracking-widest mb-2">Target Word:</p>
              <h3 className="text-4xl font-black text-green-600">{currentTarget.translations[language || 'english']}</h3>
            </div>

            {/* Goal Posts & Options */}
            <div className="relative w-full h-[40vh] mb-8">
              {/* Goal Net */}
              <div className="absolute inset-x-4 top-0 bottom-12 border-4 border-white rounded-t-lg bg-white/10"
                style={{
                  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2)), linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0.2))',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px'
                }}
              />

              <div className="absolute inset-0 grid grid-cols-2 gap-4 p-6">
                {options.map((item, index) => (
                  <motion.button
                    key={item.id}
                    disabled={isAnimating}
                    onClick={() => handleSelect(item.id)}
                    className={`relative bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-4 ${
                      kickedOption === item.id 
                        ? item.id === currentTarget.id ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                        : 'border-transparent hover:border-green-400'
                    } transition-all flex flex-col items-center justify-center`}
                  >
                    <span className="text-3xl font-geez font-black text-gray-800">{item.translations.tigrinya}</span>
                    {kickedOption === item.id && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-4 -right-4 text-4xl"
                      >
                        {item.id === currentTarget.id ? '⭐' : '❌'}
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* The Football */}
              <motion.div
                animate={
                  kickedOption 
                    ? { 
                        y: -200, 
                        scale: 0.5, 
                        rotate: 720,
                        x: options.findIndex(o => o.id === kickedOption) % 2 === 0 ? -50 : 50
                      }
                    : { y: 0, scale: 1, rotate: 0, x: 0 }
                }
                transition={{ duration: 0.5, type: 'spring' }}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl shadow-xl z-20 ${getBallStyles()}`}
              >
                {getBallIcon() || '⚽'}
              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">Match Over!</h2>
            <p className="text-xl font-bold text-white mb-8 drop-shadow-md">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  voiceCoach.stopMusic();
                  onBack();
                }}
                className="bg-white text-gray-600 px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_8px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all border-2 border-white"
              >
                PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
