import React from 'react';
import { motion } from 'motion/react';

interface IntroProps {
  onStart: () => void;
}

export const Intro: React.FC<IntroProps> = ({ onStart }) => {
  return (
    <motion.div 
      key="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full p-6 bg-sky-300 relative overflow-hidden"
    >
      {/* Sunburst background */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 opacity-20"
        style={{
          background: 'repeating-conic-gradient(from 0deg, #fff 0deg 15deg, transparent 15deg 30deg)'
        }}
      />

      {/* Eritrean Flag Header */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/2/29/Flag_of_Eritrea.svg" 
          alt="Eritrean Flag" 
          className="w-16 h-auto object-contain rounded shadow-md mb-2"
        />
        <p className="text-white font-bold text-sm tracking-widest uppercase drop-shadow-md">Welcome to Selam</p>
      </div>

      <div className="z-10 flex flex-col items-center mt-8">
        <motion.div
          initial={{ y: -100, scale: 0.5 }}
          animate={{ 
            y: [0, -30, 0],
            rotate: [-2, 2, -2],
          }}
          transition={{ 
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { type: "spring", bounce: 0.6, duration: 1.5 }
          }}
          className="relative mb-8 w-56 h-56 flex items-center justify-center"
        >
          {/* Big 3D Dove with Flapping Animation */}
          <motion.img 
            src="https://em-content.zobj.net/source/apple/354/dove_1f54a-fe0f.png" 
            alt="3D Dove Mascot" 
            animate={{ 
              scaleY: [1, 0.85, 1],
              scaleX: [1, 1.08, 1],
              y: [0, 8, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          />
        </motion.div>

        <motion.h1 
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
          className="text-6xl font-black text-white mb-2 drop-shadow-[0_12px_12px_rgba(0,0,0,0.3)] tracking-tighter"
          style={{ WebkitTextStroke: '4px #3b82f6' }}
        >
          Selam!
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-5xl font-geez font-black text-yellow-400 mb-6 drop-shadow-[0_8px_8px_rgba(0,0,0,0.4)]"
          style={{ WebkitTextStroke: '3px #ca8a04' }}
        >
          ሰላም
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-base font-black text-blue-800 mb-8 text-center bg-white/60 px-8 py-2 rounded-full shadow-lg border-2 border-white/20"
        >
          Learn Tigrinya
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, type: "spring" }}
          whileHover={{ scale: 1.1, rotate: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onStart}
          className="group relative bg-white py-6 px-20 rounded-[2.5rem] border-4 border-yellow-400 shadow-[0_15px_30px_rgba(202,138,4,0.3)] transition-all hover:shadow-[0_20px_40px_rgba(202,138,4,0.4)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400" />
          <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover:opacity-5 transition-opacity" />
          <span className="relative z-10 text-base font-black text-yellow-600 tracking-tighter flex items-center gap-4">
            START 
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🚀
            </motion.span>
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
