import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { voiceCoach } from '../lib/VoiceCoach';

export function MuteButton() {
  const [isMuted, setIsMuted] = useState(voiceCoach.getIsMuted());

  useEffect(() => {
    voiceCoach.setMuteListener(setIsMuted);
    return () => voiceCoach.setMuteListener(() => {});
  }, []);

  const toggleMute = () => {
    voiceCoach.playClick();
    setIsMuted(voiceCoach.toggleMute());
  };

  return (
    <button 
      onClick={toggleMute}
      className="bg-white/80 backdrop-blur p-3 rounded-full shadow-lg text-blue-500 hover:bg-white transition-all border-2 border-blue-100 pointer-events-auto min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95 z-50"
      title={isMuted ? "Unmute Voice" : "Mute Voice"}
    >
      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </button>
  );
}
