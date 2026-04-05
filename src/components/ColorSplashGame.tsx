import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameTimer } from './GameTimer';
import { voiceCoach } from '../lib/VoiceCoach';
import { words } from '../data/wordHelpers';
import { logGameSession, updateStats } from '../lib/progress';
import { ArrowLeft, Trophy, Palette, Sparkles } from 'lucide-react';

interface ColorSplashGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const COLOR_MAP: Record<string, string> = {
  'Red': '#ef4444',
  'Blue': '#3b82f6',
  'Green': '#22c55e',
  'Yellow': '#eab308',
  'Orange': '#f97316',
  'Purple': '#a855f7',
  'Pink': '#ec4899',
  'Brown': '#78350f',
  'Black': '#1f2937',
  'White': '#ffffff',
  'Gray': '#9ca3af'
};

export function ColorSplashGame({ language, onBack, setDoveMessage, setDoveCheering }: ColorSplashGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [targetColor, setTargetColor] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [paintedParts, setPaintedParts] = useState<Record<string, string>>({});
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  const spawnNextColor = useCallback(() => {
    const colorWords = words.filter(w => w.category === 'Colors');
    if (colorWords.length === 0) return;

    const newTarget = colorWords[Math.floor(Math.random() * colorWords.length)];
    setTargetColor(newTarget);
    
    const targetLang = language || 'english';
    const translation = newTarget.translations[targetLang as keyof typeof newTarget.translations];
    
    voiceCoach.playDualAudio(translation, targetLang, newTarget.audioUrl);
    setDoveMessage(`Find the color ${translation}!`);

    const numWrongOptions = Math.min(2 + Math.floor(level / 2), 5);
    const wrongOptions = colorWords
      .filter(w => w.id !== newTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, numWrongOptions);
    
    const newOptions = [newTarget, ...wrongOptions].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
    setIsAnimating(false);
  }, [language, level, setDoveMessage]);

  useEffect(() => {
    spawnNextColor();
  }, [spawnNextColor]);

  const handleGameEnd = useCallback(async () => {
    setGameOver(true);
    setDoveMessage(`Great painting! You scored ${score} points!`);
    await logGameSession('color', score, 60);
  }, [score, setDoveMessage]);

  const handleSplash = useCallback((color: any, e: React.MouseEvent) => {
    if (gameOver || isAnimating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (color.id === targetColor?.id) {
      voiceCoach.playCorrect();
      setIsAnimating(true);
      setDoveCheering(true);
      setScore(s => s + 10);
      
      const hexColor = COLOR_MAP[color.english] || '#000';
      
      // Paint a random part of the picture
      const parts = ['roof', 'walls', 'door', 'window', 'sun', 'grass', 'flower1', 'flower2'];
      const unpainted = parts.filter(p => !paintedParts[p]);
      if (unpainted.length > 0) {
        const partToPaint = unpainted[Math.floor(Math.random() * unpainted.length)];
        setPaintedParts(prev => ({ ...prev, [partToPaint]: hexColor }));
      } else {
        // If all painted, just change a random one
        const randomPart = parts[Math.floor(Math.random() * parts.length)];
        setPaintedParts(prev => ({ ...prev, [randomPart]: hexColor }));
      }

      setSplashes(prev => [...prev, { id: Date.now(), x, y, color: hexColor }]);
      
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: [hexColor]
      });

      setTimeout(() => {
        setDoveCheering(false);
        if (score > 0 && score % 50 === 0) {
          setLevel(l => l + 1);
        }
        spawnNextColor();
        setSplashes(prev => prev.filter(s => s.id !== Date.now()));
      }, 1200);
    } else {
      voiceCoach.playIncorrect();
      setDoveMessage("Oops! Try again!");
    }
  }, [gameOver, isAnimating, targetColor, score, level, paintedParts, setDoveCheering, setDoveMessage, spawnNextColor]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start bg-white p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-30 mb-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-sky-500 hover:scale-110 transition-transform border-2 border-sky-100"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-blue-100">
            <span className="font-black text-blue-600">LVL {level}</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2 border-2 border-yellow-100">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-black text-yellow-600">{score}</span>
          </div>
          <GameTimer duration={60} onTimeUp={handleGameEnd} isPaused={gameOver || isAnimating} resetKey={level} />
        </div>
      </div>

      {/* Coloring Book Area */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center relative z-10">
        <div className="relative w-full aspect-video bg-sky-50 rounded-[3rem] border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center mb-8">
          {/* Simple SVG House Scene */}
          <svg viewBox="0 0 400 300" className="w-full h-full p-8 drop-shadow-lg">
            {/* Sun */}
            <motion.circle 
              cx="350" cy="50" r="30" 
              fill={paintedParts.sun || 'none'} 
              stroke="#cbd5e1" strokeWidth="2"
              animate={paintedParts.sun ? { scale: [1, 1.1, 1] } : {}}
            />
            {/* Grass */}
            <rect x="0" y="240" width="400" height="60" fill={paintedParts.grass || 'none'} stroke="#cbd5e1" strokeWidth="2" />
            {/* House Walls */}
            <rect x="100" y="140" width="200" height="100" fill={paintedParts.walls || 'none'} stroke="#cbd5e1" strokeWidth="2" />
            {/* Roof */}
            <path d="M100 140 L200 60 L300 140 Z" fill={paintedParts.roof || 'none'} stroke="#cbd5e1" strokeWidth="2" />
            {/* Door */}
            <rect x="180" y="190" width="40" height="50" fill={paintedParts.door || 'none'} stroke="#cbd5e1" strokeWidth="2" />
            {/* Window */}
            <rect x="130" y="170" width="30" height="30" fill={paintedParts.window || 'none'} stroke="#cbd5e1" strokeWidth="2" />
            {/* Flowers */}
            <circle cx="50" cy="260" r="10" fill={paintedParts.flower1 || 'none'} stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="350" cy="260" r="10" fill={paintedParts.flower2 || 'none'} stroke="#cbd5e1" strokeWidth="2" />
          </svg>

          <div className="absolute top-4 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-sky-100">
            <Palette size={16} className="text-sky-500" />
            <span className="text-xs font-black text-sky-700 uppercase tracking-widest">Coloring Book</span>
          </div>
        </div>

        {/* Target Display */}
        <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-sky-100 mb-8 text-center w-64 relative">
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-1">Find this color:</p>
          <h3 className="text-4xl font-geez font-black text-sky-600">
            {targetColor?.translations[language || 'english']}
          </h3>
          <div className="absolute -right-2 -top-2 bg-yellow-400 text-white p-2 rounded-full shadow-lg animate-bounce">
            <Sparkles size={16} fill="white" />
          </div>
        </div>

        {/* Color Options */}
        <div className="flex flex-wrap justify-center gap-4 w-full px-4">
          <AnimatePresence>
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, rotate: Math.random() * 10 - 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleSplash(opt, e)}
                className="w-24 h-24 rounded-full shadow-xl border-4 border-white flex items-center justify-center relative overflow-hidden group"
                style={{ backgroundColor: COLOR_MAP[opt.english] || '#cbd5e1' }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl drop-shadow-md z-10">{opt.emoji}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Splash Effects */}
      <AnimatePresence>
        {splashes.map(s => (
          <motion.div
            key={s.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              left: s.x,
              top: s.y,
              backgroundColor: s.color,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              zIndex: 100,
              pointerEvents: 'none'
            }}
          />
        ))}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
          >
            <div className="text-8xl mb-6 animate-bounce">🎨</div>
            <h2 className="text-5xl font-black text-sky-600 mb-2">Masterpiece!</h2>
            <p className="text-2xl font-bold text-gray-500 mb-8">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-gray-100 text-gray-600 px-10 py-5 rounded-3xl font-black text-xl shadow-[0_8px_0_rgb(209,213,219)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={() => {
                  setScore(0);
                  setLevel(1);
                  setGameOver(false);
                  setPaintedParts({});
                  spawnNextColor();
                }}
                className="bg-sky-500 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-[0_10px_0_rgb(14,165,233)] active:translate-y-1 active:shadow-none transition-all border-4 border-white"
              >
                PAINT AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
