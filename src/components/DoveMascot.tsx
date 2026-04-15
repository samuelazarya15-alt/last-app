import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { voiceCoach } from '../lib/VoiceCoach';

export function DoveMascot({ isCheering, size = "12vh", relative = false }: { isCheering?: boolean, size?: string, relative?: boolean }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voiceCoach.getIsMuted());

  useEffect(() => {
    voiceCoach.setListener(setIsSpeaking);
    voiceCoach.setMuteListener(setIsMuted);
    return () => {
      voiceCoach.setListener(() => {});
      voiceCoach.setMuteListener(() => {});
    };
  }, []);

  useEffect(() => {
    if (isCheering) {
      voiceCoach.playDoveCheer();
    }
  }, [isCheering]);

  return (
    <div className={`${relative ? 'relative' : 'absolute top-4 left-1/2 transform -translate-x-1/2 mt-4'} z-40 flex flex-col items-center gap-2 pointer-events-none`}>
      <div className="pointer-events-none flex justify-center">
        <motion.div 
          className="relative flex items-center justify-center"
          style={{ maxHeight: size }}
          animate={
            isCheering 
              ? { y: [0, -15, 0], rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } 
              : isSpeaking 
                ? { y: [0, -8, 0], scale: [1, 1.05, 1] } 
                : { y: [0, -4, 0] }
          }
          transition={{ 
            duration: isCheering ? 0.5 : isSpeaking ? 0.8 : 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <img 
            src="https://em-content.zobj.net/source/apple/354/dove_1f54a-fe0f.png" 
            alt="3D Dove Mascot" 
            className="w-auto max-w-full object-contain drop-shadow-2xl"
            style={{ height: size }}
          />
          
          {/* Speaking Indicator */}
          <AnimatePresence>
            {isSpeaking && !isMuted && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full shadow-[0_0_12px_rgba(74,222,128,0.9)] border-2 border-white"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
