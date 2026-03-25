import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Zap, Snowflake, Flame, Trophy, Star, Cloud } from 'lucide-react';
import WORDS from '../data/words.json';
import { GameTimer } from './GameTimer';
import { logGameSession } from '../lib/progress';

import { voiceCoach } from '../lib/VoiceCoach';

type BallType = 'standard' | 'golden' | 'fire' | 'ice';

export function StadiumGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [kickedOption, setKickedOption] = useState<string | null>(null);
  const [ballType, setBallType] = useState<BallType>('standard');
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const startTime = useRef(Date.now());

  const currentWord = WORDS[currentWordIndex];
  const baseTimeLimit = Math.max(5, 15 - (level - 1) * 2);
  const timeLimit = ballType === 'ice' ? baseTimeLimit * 2 : baseTimeLimit;

  useEffect(() => {
    // Play stadium background music
    voiceCoach.playMusic('https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/ping.mp3');
    return () => voiceCoach.stopMusic();
  }, []);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('football_high_score');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    generateOptions();
  }, [currentWordIndex, level]);

  const generateOptions = React.useCallback(() => {
    const correctTranslation = currentWord[language as keyof typeof currentWord] as string;
    const otherWords = WORDS.filter(w => w.id !== currentWord.id);
    const randomWrong1 = otherWords[Math.floor(Math.random() * otherWords.length)][language as keyof typeof currentWord] as string;
    let randomWrong2 = otherWords[Math.floor(Math.random() * otherWords.length)][language as keyof typeof currentWord] as string;
    while (randomWrong2 === randomWrong1) {
      randomWrong2 = otherWords[Math.floor(Math.random() * otherWords.length)][language as keyof typeof currentWord] as string;
    }
    
    const shuffled = [correctTranslation, randomWrong1, randomWrong2].sort(() => Math.random() - 0.5);
    setOptions(shuffled);

    // Randomly assign a special ball type (20% chance)
    const rand = Math.random();
    if (rand > 0.9) setBallType('golden');
    else if (rand > 0.8) setBallType('fire');
    else if (rand > 0.7) setBallType('ice');
    else setBallType('standard');
    
    setIsTimeFrozen(false);
  }, [currentWord, language]);

  const handleGameEnd = React.useCallback(async () => {
    const duration = Math.floor((Date.now() - startTime.current) / 1000);
    if (score > highScore) {
      localStorage.setItem('football_high_score', score.toString());
    }
    await logGameSession('football', score, duration);
    onBack();
  }, [score, highScore, onBack]);

  const handleTimeUp = React.useCallback(() => {
    if (isAnimating || isTimeFrozen) return;
    voiceCoach.playSfx('wrong');
    setDoveMessage("Time's up! Let's try the next one.");
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (currentWordIndex < WORDS.length - 1) {
        setCurrentWordIndex((prev) => (prev + 1));
      } else {
        handleGameEnd();
      }
    }, 2000);
  }, [isAnimating, isTimeFrozen, currentWordIndex, setDoveMessage, handleGameEnd]);

  const handleGuess = React.useCallback((guess: string) => {
    if (isAnimating) return;
    
    setKickedOption(guess);
    setIsAnimating(true);
    voiceCoach.playSfx('kick');

    setTimeout(() => {
      if (guess === currentWord[language as keyof typeof currentWord]) {
        // Correct
        voiceCoach.playSfx('score');
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
        setScore(s => s + points);
        voiceCoach.playSfx('score');
        
        if ((currentWordIndex + 1) % 3 === 0) {
          setLevel(l => l + 1);
          setDoveMessage("Level Up! Faster now!");
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
          if (currentWordIndex < WORDS.length - 1) {
            setCurrentWordIndex((prev) => (prev + 1));
          } else {
            handleGameEnd();
          }
        }, 2000);
      } else {
        // Wrong
        voiceCoach.playSfx('wrong');
        setDoveMessage("Oops! Try again!");
        setTimeout(() => {
          setIsAnimating(false);
          setKickedOption(null);
        }, 1000);
      }
    }, 500);
  }, [isAnimating, currentWord, language, ballType, currentWordIndex, setDoveCheering, setDoveMessage, handleGameEnd]);

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
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              className="w-12 h-12 bg-yellow-100 rounded-full blur-xl"
            />
          ))}
        </div>

        {/* Pitch lines */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-1/2 border-8 border-white/50 rounded-t-[50%]" style={{ transform: 'translateX(-50%) rotateX(60deg)' }}></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 max-w-md h-1/4 border-8 border-white/50 rounded-t-xl" style={{ transform: 'translateX(-50%) rotateX(60deg)' }}></div>
      </div>

      <div className="w-full flex justify-between items-center z-10 mb-2 mt-2">
        <button 
          onClick={onBack}
          className="bg-white/90 px-4 py-2 rounded-full font-black text-blue-600 shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-[0_0px_0_rgb(37,99,235)] transition-all text-base border-2 border-blue-200"
        >
          ← Back
        </button>

        <div className="flex gap-2">
          <div className="bg-purple-500 px-3 py-1 rounded-full font-black text-white shadow-[0_4px_0_rgb(126,34,206)] text-sm flex items-center gap-1 border-2 border-purple-300">
            <Trophy size={16} fill="currentColor" />
            {highScore}
          </div>
          <div className="bg-blue-400 px-3 py-1 rounded-full font-black text-white shadow-[0_4px_0_rgb(37,99,235)] text-base border-2 border-blue-300">
            Lvl {level}
          </div>
          <div className="bg-yellow-400 px-3 py-1 rounded-full font-black text-yellow-900 shadow-[0_4px_0_rgb(202,138,4)] text-base border-2 border-yellow-300">
            {score} pt
          </div>
        </div>
      </div>

      <div className="w-full z-10 mb-4">
        <GameTimer 
          duration={timeLimit} 
          onTimeUp={handleTimeUp} 
          resetKey={currentWordIndex} 
          isPaused={isAnimating || isTimeFrozen}
        />
      </div>

      {/* Jumbotron */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 bg-gray-900 border-4 border-gray-700 rounded-2xl p-3 shadow-2xl mb-4 w-full max-w-sm text-center"
      >
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gray-600 rounded-t-xl"></div>
        <h2 className="text-xl font-black text-yellow-400 tracking-wider" style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.6)' }}>
          {currentWord.tigrinya}
        </h2>
        
        {/* Ball Type Indicator */}
        <AnimatePresence>
          {ballType !== 'standard' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -right-4 -bottom-4 bg-white p-2 rounded-full shadow-lg border-2 border-gray-100 flex items-center gap-1"
            >
              {getBallIcon()}
              <span className="text-xs font-black uppercase text-gray-600">{ballType}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Goal Net */}
      <div className="relative z-0 w-full max-w-xs h-24 border-t-[8px] border-l-[8px] border-r-[8px] border-white rounded-t-2xl flex items-end justify-center mb-4"
           style={{
             backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3)), linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.3))',
             backgroundSize: '20px 20px',
             backgroundPosition: '0 0, 10px 10px'
           }}>
      </div>

      {/* Football Buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-4 z-50">
        {options.map((option, index) => {
          const isKicked = kickedOption === option;
          return (
            <motion.button
              key={index}
              animate={isKicked ? { 
                x: -150, 
                y: -150,
                scale: 0.5, 
                rotate: 360,
                opacity: 0
              } : { 
                x: 0,
                y: 0, 
                scale: 1, 
                rotate: 0,
                opacity: 1
              }}
              transition={{ duration: 0.5, type: "spring" }}
              whileHover={!isAnimating ? { scale: 1.05, rotate: Math.random() * 10 - 5 } : {}}
              whileTap={!isAnimating ? { scale: 0.95 } : {}}
              onClick={() => handleGuess(option)}
              disabled={isAnimating}
              className={`rounded-full w-[64px] h-[64px] flex items-center justify-center text-base font-black border-2 active:translate-y-1 active:shadow-none transition-all relative overflow-hidden group shadow-md ${getBallStyles()} ${isKicked ? 'z-50' : 'z-10'}`}
            >
              {/* Football pattern overlay */}
              <div className={`absolute inset-0 pointer-events-none flex items-center justify-center opacity-20 ${ballType === 'standard' ? 'text-black' : 'text-white'}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
                  <path d="M50 0 L95 35 L75 90 L25 90 L5 35 Z" fill="none" stroke="currentColor" strokeWidth="4"/>
                  <path d="M50 0 L50 45 M95 35 L65 60 M75 90 L50 65 M25 90 L35 60 M5 35 L35 45" stroke="currentColor" strokeWidth="4"/>
                  <polygon points="35,45 65,45 75,65 50,85 25,65" fill="currentColor" />
                </svg>
              </div>

              {/* Special Ball Effects */}
              {ballType === 'fire' && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute inset-0 bg-orange-400 blur-md pointer-events-none"
                />
              )}
              {ballType === 'ice' && (
                <div className="absolute inset-0 bg-blue-100/30 backdrop-blur-[1px] pointer-events-none" />
              )}

              <span className={`relative z-10 text-center px-1 leading-tight rounded-lg backdrop-blur-sm text-xs ${ballType === 'standard' ? 'bg-white/80 text-gray-800' : 'bg-black/20 text-white'}`}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Power-up Controls (Optional: if we want manual activation, but here we use ball types) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-4">
        {isTimeFrozen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-blue-500 text-white px-4 py-2 rounded-full font-black flex items-center gap-2 shadow-lg"
          >
            <Snowflake size={20} /> TIME FROZEN
          </motion.div>
        )}
      </div>
    </div>
  );
}
