import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { voiceCoach } from '../lib/VoiceCoach';
import wordsData from '../data/words.json';
import { Volume2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DoveMascot } from './DoveMascot';

const CATEGORIES = [
  'All', 'Family', 'Colors', 'Adjectives', 'Verbs', 'Professions', 
  'Food', 'Nature', 'Phrases', 'Dates', 'Numbers', 'Body', 
  'House', 'Transport', 'Places', 'Clothing', 'Time', 'Emotions', 
  'Weather', 'School', 'Tools', 'Tech', 'Sports', 'Hobbies', 
  'Shapes', 'Directions'
];

export function Learn({ language }: { language: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [words, setWords] = useState<any[]>(wordsData);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const { data, error } = await supabase.from('words').select('*');
        if (data && !error && data.length > 0) {
          setWords(data);
        }
      } catch (e) {
        console.log("Using local words data fallback.");
      }
    };
    
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      fetchWords();
    }
  }, []);

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const translation = word[language.toLowerCase() as keyof typeof word] as string;
      const matchesSearch = word.tigrinya.includes(searchTerm) || 
             (translation && translation.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || word.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, language, words, selectedCategory]);

  const playAudio = async (word: any) => {
    setActiveWordId(word.id);
    const translation = word[language.toLowerCase() as keyof typeof word] as string;
    await voiceCoach.playDualAudio(translation, language, (word as any).audioUrl);
    setActiveWordId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-sky-50">
      {/* Optimized Header (14vh) */}
      <div className="h-[14vh] shrink-0 bg-white/80 backdrop-blur-md shadow-sm z-10 flex flex-col items-center justify-center px-4 pt-1">
        <div className="w-full max-w-xl relative mb-2">
          <input
            type="text"
            placeholder="Search words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-blue-100 rounded-full py-1.5 pl-10 pr-4 text-sm font-black outline-none focus:border-blue-400 transition-all shadow-sm placeholder:text-blue-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} strokeWidth={4} />
        </div>

        {/* Categories Scroll */}
        <div className="w-full overflow-x-auto no-scrollbar flex gap-2 pb-1 px-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                voiceCoach.playClick();
                setSelectedCategory(cat);
              }}
              className={`whitespace-nowrap px-4 py-1 rounded-full text-[10px] font-black transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-blue-400 border-2 border-blue-50 hover:border-blue-200'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Word List */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4 pb-20">
        {filteredWords.map((word) => {
          const translation = word[language.toLowerCase() as keyof typeof word] as string;
          const phonetic = (word as any).phonetic || `[${translation.toLowerCase()}]`;
          const isActive = activeWordId === word.id;

          return (
            <motion.div
              key={word.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              animate={isActive ? { y: [0, -5, 0] } : {}}
              transition={{ duration: 0.5 }}
              onClick={() => {
                voiceCoach.playClick();
                playAudio(word);
              }}
              className={`bg-white rounded-2xl p-4 shadow-sm border-4 cursor-pointer flex items-center justify-between transition-all ${
                isActive 
                  ? 'border-blue-400 shadow-[0_4px_0_rgb(37,99,235)]' 
                  : 'border-white shadow-[0_2px_0_rgb(243,244,246)] hover:border-blue-100'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h3 className="text-base font-geez font-black text-gray-800">{word.tigrinya}</h3>
                  <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">{phonetic}</span>
                </div>
                <p className="text-sm font-black text-blue-500 tracking-tight">{translation}</p>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md">
                  {word.category}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl transition-all ${
                isActive ? 'bg-blue-500 text-white rotate-12' : 'bg-blue-50 text-blue-400'
              }`}>
                <Volume2 size={22} strokeWidth={3} />
              </div>
            </motion.div>
          );
        })}
        
        {filteredWords.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-300 font-black text-sm mt-10"
          >
            No words found in this category. 🕊️
          </motion.div>
        )}
      </div>
    </div>
  );
}

