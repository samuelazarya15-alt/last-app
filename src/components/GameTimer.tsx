import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

interface GameTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  resetKey: string | number; // Change this to reset the timer
  isPaused?: boolean;
}

export function GameTimer({ duration, onTimeUp, resetKey, isPaused = false }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);
  const hasCalledOnTimeUpRef = useRef(false);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setTimeLeft(duration);
    hasCalledOnTimeUpRef.current = false;
  }, [duration, resetKey]);

  useEffect(() => {
    if (isPaused || hasCalledOnTimeUpRef.current) return;
    
    if (timeLeft <= 0) {
      hasCalledOnTimeUpRef.current = true;
      // Use a small timeout to ensure this doesn't happen during render
      const timeoutId = setTimeout(() => {
        onTimeUpRef.current();
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isPaused, timeLeft <= 0]);

  // Calculate percentage for the progress bar
  const percentage = Math.max(0, (timeLeft / duration) * 100);
  
  // Determine color based on time left
  let colorClass = 'bg-green-400';
  if (percentage <= 25) {
    colorClass = 'bg-red-400';
  } else if (percentage <= 50) {
    colorClass = 'bg-yellow-400';
  }

  return (
    <div className="w-full max-w-xs mx-auto flex items-center gap-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm border-2 border-white/50 z-10 relative">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${percentage <= 25 ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-blue-100 text-blue-500'}`}>
        <Clock size={18} strokeWidth={3} />
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner border-2 border-gray-200/50">
        <motion.div 
          className={`h-full ${colorClass} rounded-full`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>
      <div className="w-8 text-center font-black text-gray-600 text-sm">
        {timeLeft}
      </div>
    </div>
  );
}
