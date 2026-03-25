import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { voiceCoach } from '../lib/VoiceCoach';
import wordsData from '../data/words.json';
import { Volume2, Search, Edit3, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Learn({ language }: { language: string }) {
  const [mode, setMode] = useState<'dictionary' | 'spelling'>('dictionary');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [words, setWords] = useState<any[]>(wordsData);
  
  // Spelling practice state
  const [currentSpellingWord, setCurrentSpellingWord] = useState<any | null>(null);
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  useEffect(() => {
    // Attempt to fetch from Supabase
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
    
    // Only fetch if real credentials are provided
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      fetchWords();
    }
  }, []);

  const pickRandomWord = useCallback(() => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentSpellingWord(randomWord);
    setSpellingInput('');
    setSpellingFeedback('idle');
  }, [words]);

  useEffect(() => {
    if (mode === 'spelling' && !currentSpellingWord && words.length > 0) {
      pickRandomWord();
    }
  }, [mode, words, currentSpellingWord, pickRandomWord]);

  const filteredWords = useMemo(() => {
    return words.filter(word => {
      const translation = word[language.toLowerCase() as keyof typeof word] as string;
      return word.tigrinya.includes(searchTerm) || 
             (translation && translation.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [searchTerm, language, words]);

  const playAudio = async (word: any) => {
    setActiveWordId(word.id);
    const translation = word[language.toLowerCase() as keyof typeof word] as string;
    
    // Play dual audio: Native audio first, then Translation
    await voiceCoach.playDualAudio(translation, language, (word as any).audioUrl);
    
    setActiveWordId(null);
  };

  const checkSpelling = () => {
    if (!currentSpellingWord) return;
    
    if (spellingInput.trim() === currentSpellingWord.tigrinya) {
      setSpellingFeedback('correct');
      voiceCoach.speakPromise("Great job! That's correct.", language);
      setTimeout(pickRandomWord, 2000);
    } else {
      setSpellingFeedback('incorrect');
      voiceCoach.speakPromise("Not quite right. Try again!", language);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-sky-50 pb-8 pt-[28vh] overflow-hidden">
      <div className="mb-8 sticky top-0 z-10 bg-sky-50/80 backdrop-blur-md pt-2 pb-6 px-4 rounded-b-[3rem]">
        <div className="flex justify-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('dictionary')}
            className={`flex items-center px-8 py-4 rounded-[2rem] font-black text-sm transition-all ${
              mode === 'dictionary' 
                ? 'bg-blue-500 text-white shadow-[0_8px_0_rgb(37,99,235)]' 
                : 'bg-white text-blue-400 border-4 border-blue-50 shadow-sm hover:border-blue-200'
            }`}
          >
            <BookOpen className="mr-3" size={24} strokeWidth={3} /> Dictionary
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('spelling')}
            className={`flex items-center px-8 py-4 rounded-[2rem] font-black text-sm transition-all ${
              mode === 'spelling' 
                ? 'bg-green-500 text-white shadow-[0_8px_0_rgb(22,163,74)]' 
                : 'bg-white text-green-400 border-4 border-green-50 shadow-sm hover:border-green-200'
            }`}
          >
            <Edit3 className="mr-3" size={24} strokeWidth={3} /> Spelling
          </motion.button>
        </div>

        {mode === 'dictionary' && (
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-4 border-blue-100 rounded-[2rem] py-5 pl-16 pr-8 text-base font-black outline-none focus:border-blue-400 transition-all shadow-lg placeholder:text-blue-200"
            />
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-blue-400" size={32} strokeWidth={4} />
          </div>
        )}
      </div>

      {mode === 'dictionary' ? (
        <div className="flex-1 overflow-y-auto space-y-6 px-4 pb-12">
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
                onClick={() => playAudio(word)}
                className={`bg-white rounded-3xl p-5 shadow-sm border-4 cursor-pointer flex items-center justify-between transition-all ${
                  isActive 
                    ? 'border-blue-400 shadow-[0_6px_0_rgb(37,99,235)]' 
                    : 'border-white shadow-[0_4px_0_rgb(243,244,246)] hover:border-blue-100'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="text-base font-geez font-black text-gray-800">{word.tigrinya}</h3>
                    <span className="text-sm font-bold text-gray-300 tracking-widest uppercase">{phonetic}</span>
                  </div>
                  <p className="text-base font-black text-blue-500 tracking-tight">{translation}</p>
                </div>
                <div className={`p-3 rounded-2xl transition-all ${
                  isActive ? 'bg-blue-500 text-white rotate-12' : 'bg-blue-50 text-blue-400'
                }`}>
                  <Volume2 size={28} strokeWidth={3} />
                </div>
              </motion.div>
            );
          })}
          
          {filteredWords.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-300 font-black text-base mt-20"
            >
              No words found. Try another search! 🕊️
            </motion.div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
          {currentSpellingWord && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-2xl border-4 border-green-100 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-green-400" />
              <h3 className="text-sm font-black text-gray-400 mb-4 uppercase tracking-widest">Spell this word:</h3>
              <p className="text-base font-black text-green-500 mb-10 tracking-tighter">
                {currentSpellingWord[language.toLowerCase() as keyof typeof currentSpellingWord]}
              </p>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => playAudio(currentSpellingWord)}
                className="mb-10 p-6 bg-blue-50 text-blue-500 rounded-[2rem] hover:bg-blue-100 transition-all shadow-sm"
              >
                <Volume2 size={48} strokeWidth={3} />
              </motion.button>

              <div className="w-full relative">
                <input
                  type="text"
                  value={spellingInput}
                  onChange={(e) => {
                    setSpellingInput(e.target.value);
                    setSpellingFeedback('idle');
                  }}
                  placeholder="Type Ge'ez here..."
                  className={`w-full text-center font-geez text-base p-8 border-4 rounded-[2rem] outline-none transition-all mb-8 shadow-inner ${
                    spellingFeedback === 'correct' ? 'border-green-400 bg-green-50 text-green-600' :
                    spellingFeedback === 'incorrect' ? 'border-red-400 bg-red-50 text-red-600' :
                    'border-gray-100 focus:border-green-400 bg-gray-50'
                  }`}
                />
                
                <AnimatePresence>
                  {spellingFeedback !== 'idle' && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full font-black text-white shadow-lg text-sm ${
                        spellingFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {spellingFeedback === 'correct' ? '✨ CORRECT! ✨' : '❌ TRY AGAIN ❌'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkSpelling}
                disabled={!spellingInput.trim() || spellingFeedback === 'correct'}
                className="w-full py-6 bg-green-500 text-white rounded-[2rem] font-black text-base shadow-[0_10px_0_rgb(22,163,74)] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                CHECK SPELLING
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
