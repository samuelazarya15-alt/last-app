import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Music, X } from 'lucide-react';
import { voiceCoach } from '../lib/VoiceCoach';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [sfxVol, setSfxVol] = React.useState(voiceCoach.getSfxVolume() * 100);
  const [musicVol, setMusicVol] = React.useState(voiceCoach.getMusicVolume() * 100);
  const [isMuted, setIsMuted] = React.useState(voiceCoach.getIsMuted());

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    voiceCoach.setSfxVolume(val / 100);
    voiceCoach.playSfx('pop');
  };

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    voiceCoach.setMusicVolume(val / 100);
  };

  const handleToggleMute = () => {
    const muted = voiceCoach.toggleMute();
    setIsMuted(muted);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl border-4 border-blue-100 p-8 w-full max-w-sm overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-400" />
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-black text-blue-600 uppercase tracking-tight">Settings</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Mute Toggle */}
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isMuted ? 'bg-gray-400' : 'bg-blue-500'} text-white`}>
                    <Volume2 size={20} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Sound & Music</span>
                </div>
                <button
                  onClick={handleToggleMute}
                  className={`w-14 h-8 rounded-full relative transition-colors ${isMuted ? 'bg-gray-300' : 'bg-green-400'}`}
                >
                  <motion.div
                    animate={{ x: isMuted ? 4 : 28 }}
                    className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {/* SFX Volume */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Volume2 size={18} />
                  <span className="text-sm font-bold">Sound Effects</span>
                  <span className="ml-auto text-xs font-black text-blue-500">{Math.round(sfxVol)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVol}
                  onChange={(e) => handleSfxChange(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Music Volume */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Music size={18} />
                  <span className="text-sm font-bold">Background Music</span>
                  <span className="ml-auto text-xs font-black text-blue-500">{Math.round(musicVol)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVol}
                  onChange={(e) => handleMusicChange(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-10 bg-blue-500 text-white text-sm font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none transition-all"
            >
              DONE
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
