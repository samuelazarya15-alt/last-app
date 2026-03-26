import { motion } from 'motion/react';
import { Rocket, Leaf, Brain, Home as HomeIcon, Star } from 'lucide-react';
import { voiceCoach } from '../lib/VoiceCoach';

interface HomeProps {
  setCurrentTab: (tab: string) => void;
  setCurrentWorld: (world: string) => void;
}

const WORLDS = [
  { id: 'action', name: 'Action Park', icon: Rocket, color: 'blue', desc: 'Fast-paced fun!' },
  { id: 'nature', name: 'Nature Valley', icon: Leaf, color: 'green', desc: 'Explore the outdoors' },
  { id: 'brain', name: 'Brain Gym', icon: Brain, color: 'purple', desc: 'Puzzles & logic' },
  { id: 'heritage', name: 'Heritage House', icon: HomeIcon, color: 'amber', desc: 'Culture & family' },
];

export function Home({ setCurrentTab, setCurrentWorld }: HomeProps) {
  const kidName = voiceCoach.getName() || 'Friend';

  return (
    <div className="w-full h-full p-4 pb-8 pt-[28vh] flex flex-col items-center justify-start bg-sky-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 relative"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -left-8 text-yellow-400 opacity-50"
        >
          <Star size={48} fill="currentColor" />
        </motion.div>
        
        <h1 className="text-xl font-black text-blue-600 mb-2 drop-shadow-sm tracking-tight">
          Hi, {kidName}!
        </h1>
        <div className="inline-block bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border-2 border-blue-100 shadow-sm">
          <p className="text-base font-bold text-gray-600">
            Where to today?
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-4xl px-2">
        {WORLDS.map((world) => (
          <motion.button
            key={world.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              voiceCoach.playClick();
              setCurrentWorld(world.id);
              setCurrentTab('games');
              voiceCoach.speak(`Welcome to ${world.name}!`, "english");
            }}
            className={`group relative bg-white rounded-2xl shadow-sm border-2 border-${world.color}-100 flex flex-col items-center justify-center gap-2 transition-all hover:border-${world.color}-400 hover:shadow-md overflow-hidden max-h-[15vh] min-h-[100px]`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-${world.color}-400`} />
            <div className={`bg-${world.color}-400 p-3 rounded-xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
              <world.icon size={36} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="text-center px-2">
              <span className={`block text-base font-black text-${world.color}-600 tracking-tight leading-tight`}>{world.name}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
