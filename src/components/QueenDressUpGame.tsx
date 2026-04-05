import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Trophy, Timer, Heart, Sparkles, Crown, Wand2 } from 'lucide-react';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession } from '../lib/progress';

interface QueenDressUpGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

export const QueenDressUpGame: React.FC<QueenDressUpGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [targetWord, setTargetWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [dressedItems, setDressedItems] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setDressedItems([]);
    setGameState('playing');
    nextRound(1);
    setDoveMessage("Help the Queen get ready for the ball!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    const clothingWords = words.filter(w => w.category === 'Clothing');
    if (clothingWords.length === 0) return;

    // Pick a target that hasn't been dressed yet in this "outfit"
    // If all dressed, reset the outfit but keep score
    let availableTargets = clothingWords.filter(w => !dressedItems.find(d => d.id === w.id));
    if (availableTargets.length === 0) {
      setDressedItems([]);
      availableTargets = clothingWords;
    }

    const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
    setTargetWord(target);
    setIsSuccess(false);

    const numOptions = Math.min(3 + Math.floor(currentLevel / 3), 6);
    const opts = new Set<any>();
    opts.add(target);
    
    while (opts.size < numOptions) {
      const randomWord = clothingWords[Math.floor(Math.random() * clothingWords.length)];
      if (randomWord) opts.add(randomWord);
    }
    
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    
    const targetLang = language || 'english';
    const translation = target.translations[targetLang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, targetLang, target.audioUrl);
    setDoveMessage(`Find the ${translation}!`);
  }, [language, dressedItems, setDoveMessage]);

  const handleSelect = (word: any) => {
    if (gameState !== 'playing' || isSuccess) return;

    if (word.id === targetWord?.id) {
      const newScore = score + 10;
      setScore(newScore);
      setDoveCheering(true);
      voiceCoach.playCorrect();
      setIsSuccess(true);
      setDressedItems(prev => [...prev, word]);
      
      voiceCoach.speak("Beautiful!", language || 'english');
      
      if (newScore > 0 && newScore % 50 === 0) {
        setLevel(l => l + 1);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff69b4', '#da70d6', '#ee82ee', '#ffffff']
        });
      }

      setTimeout(() => {
        setDoveCheering(false);
        nextRound(level);
      }, 2000);
    } else {
      voiceCoach.playIncorrect();
      setDoveMessage("Try another one!");
    }
  };

  const randomizeOutfit = () => {
    const clothingWords = words.filter(w => w.category === 'Clothing');
    if (clothingWords.length === 0) return;

    const categories = {
      head: ['Hat'],
      top: ['Shirt', 'Jacket', 'Dress'],
      bottom: ['Pants', 'Skirt'],
      feet: ['Shoes', 'Socks'],
      acc: ['Belt']
    };

    const newOutfit: any[] = [];
    Object.values(categories).forEach(group => {
      const availableInGroup = clothingWords.filter(w => group.includes(w.english));
      if (availableInGroup.length > 0 && Math.random() > 0.2) {
        const randomItem = availableInGroup[Math.floor(Math.random() * availableInGroup.length)];
        newOutfit.push(randomItem);
      }
    });

    if (newOutfit.length === 0) {
      newOutfit.push(clothingWords[Math.floor(Math.random() * clothingWords.length)]);
    }

    setDressedItems(newOutfit);
    voiceCoach.speak("Magic transformation!", language || 'english');
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.5 },
      colors: ['#ff69b4', '#ffffff', '#da70d6']
    });
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('queendressup', score, 60);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-pink-100 to-purple-200 flex flex-col items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              duration: 4 + Math.random() * 3, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute text-pink-300/40"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            {i % 2 === 0 ? <Sparkles size={20 + Math.random() * 30} /> : <Heart size={15 + Math.random() * 25} />}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-30 mb-2">
        <button 
          onClick={onBack}
          className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl text-pink-500 hover:scale-110 active:scale-95 transition-all border-2 border-pink-200"
        >
          <ArrowLeft size={28} />
        </button>
        
        <div className="flex gap-2">
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 border border-pink-200">
            <span className="font-black text-pink-600 text-lg">LVL {level}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 border border-yellow-200">
            <Trophy className="text-yellow-500" size={24} />
            <span className="font-black text-yellow-600 text-lg">{score}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 border border-red-200">
            <Timer className={timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-red-400"} size={24} />
            <span className={`font-black text-lg ${timeLeft <= 10 ? "text-red-500" : "text-gray-700"}`}>{timeLeft}s</span>
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
            className="flex flex-col items-center justify-center flex-1 z-30"
          >
            <motion.div 
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-[10rem] mb-8 drop-shadow-2xl"
            >
              👸
            </motion.div>
            <h2 className="text-6xl font-black text-pink-600 mb-6 text-center drop-shadow-sm tracking-tight">Queen's Wardrobe</h2>
            <p className="text-purple-700 font-bold mb-10 text-center max-w-sm text-xl leading-relaxed">
              Help the Queen find her royal clothes and accessories!
            </p>
            <button 
              onClick={startGame}
              className="bg-pink-500 text-white px-20 py-6 rounded-full font-black text-4xl shadow-[0_12px_0_rgb(190,24,93)] hover:translate-y-1 active:translate-y-[12px] active:shadow-none transition-all border-4 border-pink-300"
            >
              DRESS UP!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-between flex-1 w-full max-w-4xl z-30"
          >
            {/* Queen Character Area */}
            <div className="relative w-full flex-1 flex items-center justify-center min-h-[300px]">
              <div className="relative w-72 h-[450px] bg-white/40 backdrop-blur-sm rounded-[5rem] border-4 border-white/60 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* The Queen */}
                <span className="text-[14rem] z-10 select-none">👸</span>
                
                {/* Dressed Items Overlays */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <AnimatePresence>
                    {dressedItems.map((item, idx) => (
                      <motion.div
                        key={`${item.id}-${idx}`}
                        initial={{ scale: 3, opacity: 0, y: -150 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="absolute w-full h-full flex items-center justify-center text-9xl"
                        style={{
                          top: item.english === 'Hat' ? '-30%' : 
                               item.english === 'Shoes' ? '40%' : 
                               item.english === 'Dress' ? '15%' : 
                               item.english === 'Socks' ? '35%' :
                               item.english === 'Shirt' ? '10%' :
                               item.english === 'Pants' ? '25%' : '0%'
                        }}
                      >
                        {item.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Sparkle Effect on Success */}
                {isSuccess && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 2.5], opacity: [1, 0] }}
                    className="absolute z-40 text-yellow-400"
                  >
                    <Sparkles size={150} />
                  </motion.div>
                )}
              </div>

              {/* Randomize Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={randomizeOutfit}
                className="absolute -right-4 bottom-10 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white z-50 text-white"
                title="Magic Randomize!"
              >
                <Wand2 size={32} />
              </motion.button>
            </div>

            {/* Question & Options */}
            <div className="w-full mt-4 pb-6">
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-[2.5rem] shadow-2xl border-4 border-pink-200 mb-6 text-center max-w-md mx-auto">
                <p className="text-pink-400 font-black uppercase tracking-[0.2em] text-sm mb-1">Find the Queen's</p>
                <h3 className="text-4xl font-black text-purple-700 tracking-tight">
                  {targetWord?.translations[language || 'english']}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full px-2">
                {options.map((word, idx) => (
                  <motion.button
                    key={`${word.id}-${idx}`}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(word)}
                    className={`bg-white/90 backdrop-blur-md p-6 rounded-[3rem] border-4 transition-all flex flex-col items-center justify-center gap-3 shadow-xl min-h-[140px] ${
                      isSuccess && word.id === targetWord.id 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-white hover:border-pink-300'
                    }`}
                  >
                    <span className="text-6xl drop-shadow-md">{word.emoji}</span>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-purple-700 font-geez leading-none mb-1">{word.translations.tigrinya}</span>
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">{word.english}</span>
                    </div>
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
            className="flex flex-col items-center justify-center flex-1 z-30"
          >
            <div className="text-[12rem] mb-8 drop-shadow-2xl">👑</div>
            <h2 className="text-6xl font-black text-pink-600 mb-4 tracking-tight">Royal Success!</h2>
            <p className="text-3xl font-bold text-purple-700 mb-12">The Queen looks stunning! ({score} points)</p>
            <div className="flex gap-6">
              <button 
                onClick={onBack}
                className="bg-white text-pink-600 px-12 py-6 rounded-[2.5rem] font-black text-2xl border-4 border-pink-100 shadow-2xl hover:bg-pink-50 transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-pink-500 text-white px-12 py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_10px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none transition-all border-4 border-pink-300"
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
