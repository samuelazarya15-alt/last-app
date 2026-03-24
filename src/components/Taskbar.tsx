import { Home, Dribbble, BookOpen, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Taskbar({ currentTab, setCurrentTab }: TaskbarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home', color: 'bg-yellow-400', shadow: 'shadow-[0_4px_0_rgb(202,138,4)]', textColor: 'text-yellow-500' },
    { id: 'games', icon: Dribbble, label: 'Games', color: 'bg-green-400', shadow: 'shadow-[0_4px_0_rgb(34,197,94)]', textColor: 'text-green-500' },
    { id: 'dictionary', icon: BookOpen, label: 'Dictionary', color: 'bg-blue-400', shadow: 'shadow-[0_4px_0_rgb(59,130,246)]', textColor: 'text-blue-500' },
    { id: 'trophy', icon: Trophy, label: 'Trophy', color: 'bg-purple-400', shadow: 'shadow-[0_4px_0_rgb(168,85,247)]', textColor: 'text-purple-500' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md bg-white/90 backdrop-blur-md border-4 border-gray-100 px-4 py-3 flex justify-between items-center z-50 rounded-full shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className="relative flex flex-col items-center justify-center outline-none w-1/4"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div 
              animate={{ 
                y: isActive ? -12 : 0,
                scale: isActive ? 1.1 : 1
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={`p-3 rounded-full border-4 ${isActive ? 'border-white ' + tab.color + ' ' + tab.shadow : 'border-transparent bg-gray-100'} transition-colors z-10`}
            >
              <Icon size={24} className={isActive ? 'text-white' : 'text-gray-400'} strokeWidth={isActive ? 3 : 2} />
            </motion.div>
            
            {isActive && (
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute -bottom-6 font-black text-[10px] uppercase tracking-wider ${tab.textColor}`}
              >
                {tab.label}
              </motion.span>
            )}
            
            {isActive && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-gray-300"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
