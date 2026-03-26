import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart } from 'lucide-react';

interface GrandparentGameProps {
  language: string | null;
  onBack: () => void;
  setDoveMessage: (msg: string) => void;
  setDoveCheering: (cheering: boolean) => void;
}

const STORIES = [
  {
    id: 'story1',
    title: { english: 'The Wise Owl', dutch: 'De Wijze Uil', norwegian: 'Den vise uglen', swedish: 'Den visa ugglan', german: 'Die weise Eule' },
    content: { 
      english: 'Once upon a time, there was a wise owl who lived in a big oak tree...', 
      dutch: 'Er was eens een wijze uil die in een grote eikenboom woonde...',
      norwegian: 'Det var en gang en vis ugle som bodde i et stort eiketre...',
      swedish: 'Det var en gång en vis uggla som bodde i en stor ek...',
      german: 'Es war einmal eine weise Eule, die in einer großen Eiche lebte...'
    },
    icon: '🦉'
  },
  {
    id: 'story2',
    title: { english: 'The Brave Lion', dutch: 'De Dappere Leeuw', norwegian: 'Den tapre løven', swedish: 'Det modiga lejonet', german: 'Der tapfere Löwe' },
    content: { 
      english: 'In the heart of the jungle, a brave lion protected all his friends...', 
      dutch: 'In het hart van de jungle beschermde een dappere leeuw al zijn vrienden...',
      norwegian: 'I hjertet av jungelen beskyttet en tapper løve alle vennene sine...',
      swedish: 'I hjärtat av djungeln skyddade ett modigt lejon alla sina vänner...',
      german: 'Im Herzen des Dschungels beschützte ein tapferer Löwe alle seine Freunde...'
    },
    icon: '🦁'
  }
];

export const GrandparentGame: React.FC<GrandparentGameProps> = ({
  language,
  onBack,
  setDoveMessage,
  setDoveCheering
}) => {
  const [selectedStory, setSelectedStory] = useState<typeof STORIES[0] | null>(null);
  const lang = (language || 'english') as keyof typeof STORIES[0]['title'];

  const handleStorySelect = (story: typeof STORIES[0]) => {
    setSelectedStory(story);
    setDoveMessage("Listen to the story!");
    setDoveCheering(true);
    setTimeout(() => setDoveCheering(false), 2000);
  };

  return (
    <div className="w-full h-full bg-orange-50 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-orange-500 hover:scale-110 transition-transform"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="bg-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
          <Heart className="text-red-500" size={20} />
          <span className="font-black text-orange-600 uppercase tracking-widest text-xs">Grandparent Mode</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedStory ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center flex-1 w-full max-w-md"
          >
            <div className="text-6xl mb-6">👵👴</div>
            <h2 className="text-3xl font-black text-orange-600 mb-4 text-center">Story Time</h2>
            <p className="text-gray-500 font-bold mb-8 text-center">
              Pick a story to read with your grandparent!
            </p>

            <div className="grid grid-cols-1 gap-4 w-full">
              {STORIES.map((story) => (
                <motion.button
                  key={story.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStorySelect(story)}
                  className="bg-white p-6 rounded-[2rem] shadow-lg border-4 border-transparent hover:border-orange-400 transition-all flex items-center gap-6 text-left"
                >
                  <span className="text-5xl">{story.icon}</span>
                  <div>
                    <h3 className="text-xl font-black text-orange-600">{story.title[lang]}</h3>
                    <p className="text-gray-400 text-sm font-bold">Click to read</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="story"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center flex-1 w-full max-w-md bg-white p-8 rounded-[3rem] shadow-xl border-4 border-orange-100 relative"
          >
            <button 
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-orange-500"
            >
              Close
            </button>
            
            <div className="text-6xl mb-6">{selectedStory.icon}</div>
            <h2 className="text-3xl font-black text-orange-600 mb-6 text-center">{selectedStory.title[lang]}</h2>
            <div className="flex-1 overflow-y-auto w-full">
              <p className="text-xl font-bold text-gray-600 leading-relaxed text-center">
                {selectedStory.content[lang]}
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedStory(null)}
              className="mt-8 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_6px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none transition-all"
            >
              FINISH STORY
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
