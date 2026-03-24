import { motion } from 'motion/react';
import { Gamepad2, BookOpen, Trophy, Star } from 'lucide-react';
import { voiceCoach } from '../lib/VoiceCoach';

interface HomeProps {
  setCurrentTab: (tab: string) => void;
}

export function Home({ setCurrentTab }: HomeProps) {
  const kidName = voiceCoach.getName() || 'Friend';

  return (
    <div className="w-full h-full p-4 pb-32 flex flex-col items-center justify-center bg-sky-50 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -left-8 text-yellow-400 opacity-50"
        >
          <Star size={48} fill="currentColor" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-black text-blue-600 mb-2 drop-shadow-sm tracking-tight">
          Hi, {kidName}!
        </h1>
        <div className="inline-block bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-blue-100 shadow-sm">
          <p className="text-lg font-bold text-gray-600">
            Ready for an adventure?
          </p>
        </div>
      </motion.div>

      <div className="flex flex-row gap-6 w-full max-w-2xl px-4 items-stretch h-64">
        <motion.button
          whileHover={{ scale: 1.05, y: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCurrentTab('games');
            voiceCoach.speak("Let's play some games!", "english");
          }}
          className="flex-1 group relative bg-white rounded-[3rem] shadow-[0_20px_40px_rgba(34,197,94,0.15)] border-4 border-green-100 flex flex-col items-center justify-center gap-4 transition-all hover:border-green-400 hover:shadow-[0_25px_50px_rgba(34,197,94,0.2)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-green-400" />
          <div className="bg-green-400 p-6 rounded-[2rem] shadow-[0_8px_0_rgb(22,163,74)] group-hover:scale-110 group-hover:rotate-3 transition-transform">
            <Gamepad2 size={56} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <span className="block text-3xl font-black text-green-600 tracking-tighter">PLAY</span>
            <span className="block text-xs font-bold text-green-400 uppercase tracking-widest mt-1">Fun Games</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCurrentTab('dictionary');
            voiceCoach.speak("Let's learn new words!", "english");
          }}
          className="flex-1 group relative bg-white rounded-[3rem] shadow-[0_20px_40px_rgba(59,130,246,0.15)] border-4 border-blue-100 flex flex-col items-center justify-center gap-4 transition-all hover:border-blue-400 hover:shadow-[0_25px_50px_rgba(59,130,246,0.2)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-400" />
          <div className="bg-blue-400 p-6 rounded-[2rem] shadow-[0_8px_0_rgb(37,99,235)] group-hover:scale-110 group-hover:-rotate-3 transition-transform">
            <BookOpen size={56} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <span className="block text-3xl font-black text-blue-600 tracking-tighter">LEARN</span>
            <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">Dictionary</span>
          </div>
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setCurrentTab('trophy');
          voiceCoach.speak("Check out your trophies!", "english");
        }}
        className="mt-8 w-full max-w-2xl group relative bg-white/50 backdrop-blur-sm p-5 rounded-[2.5rem] border-4 border-purple-200 flex items-center justify-between px-10 transition-all hover:bg-white hover:border-purple-400 shadow-sm"
      >
        <div className="flex items-center gap-6">
          <div className="bg-purple-400 p-3 rounded-2xl shadow-[0_4px_0_rgb(147,51,234)] group-hover:scale-110 transition-transform">
            <Trophy size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <span className="block text-xl font-black text-purple-600 tracking-tight">MY PROGRESS</span>
            <span className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest">See your achievements</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Star key={i} className={`text-yellow-400 ${i === 2 ? 'animate-bounce' : 'animate-pulse'}`} fill="currentColor" size={20} />
          ))}
        </div>
      </motion.button>
    </div>
  );
}
