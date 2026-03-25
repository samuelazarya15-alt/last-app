/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DoveMascot } from './components/DoveMascot';
import { StadiumGame } from './components/StadiumGame';
import { TraceWordGame } from './components/TraceWordGame';
import { FeedLionGame } from './components/FeedLionGame';
import { FlyDoveGame } from './components/FlyDoveGame';
import { MatchGame } from './components/MatchGame';
import { MemoryMatchGame } from './components/MemoryMatchGame';
import { FruitMarketGame } from './components/FruitMarketGame';
import { HungryDoveGame } from './components/HungryDoveGame';
import { SoundPopGame } from './components/SoundPopGame';
import { HeritageTrainGame } from './components/HeritageTrainGame';
import { ColorSplashGame } from './components/ColorSplashGame';
import { AnimalOrchestraGame } from './components/AnimalOrchestraGame';
import { SpaceRocketGame } from './components/SpaceRocketGame';
import { HideAndSeekGame } from './components/HideAndSeekGame';
import { WordBridgeGame } from './components/WordBridgeGame';
import { DressUpGame } from './components/DressUpGame';
import { Taskbar } from './components/Taskbar';
import { Home } from './components/Home';
import { Learn as Dictionary } from './components/Learn';
import { Trophy } from './components/Trophy';
import { Intro } from './components/Intro';
import { voiceCoach } from './lib/VoiceCoach';

const LANGUAGES = [
  { code: 'english', name: 'English', flag: '🇬🇧', color: 'bg-blue-400', shadow: 'shadow-[0_8px_0_rgb(59,130,246)]' },
  { code: 'dutch', name: 'Dutch', flag: '🇳🇱', color: 'bg-orange-400', shadow: 'shadow-[0_8px_0_rgb(249,115,22)]' },
  { code: 'norwegian', name: 'Norwegian', flag: '🇳🇴', color: 'bg-red-400', shadow: 'shadow-[0_8px_0_rgb(239,68,68)]' },
  { code: 'swedish', name: 'Swedish', flag: '🇸🇪', color: 'bg-yellow-400', shadow: 'shadow-[0_8px_0_rgb(234,179,8)]' },
  { code: 'german', name: 'German', flag: '🇩🇪', color: 'bg-gray-500', shadow: 'shadow-[0_8px_0_rgb(107,114,128)]' },
];

const WORLDS = [
  { id: 'action', name: 'Action Park' },
  { id: 'nature', name: 'Nature Valley' },
  { id: 'brain', name: 'Brain Gym' },
  { id: 'heritage', name: 'Heritage House' },
];

const GAMES = [
  // Action Park
  { id: 'football', name: 'Word Football', icon: '⚽', color: 'green', world: 'action' },
  { id: 'dove', name: 'Dove Flight', icon: '🕊️', color: 'blue', world: 'action' },
  { id: 'rocket', name: 'Space Rocket', icon: '🚀', color: 'indigo', world: 'action' },
  { id: 'transport', name: 'Transport Race', icon: '🏎️', color: 'red', world: 'action' },
  { id: 'soundpop', name: 'Sound Pop', icon: '🫧', color: 'cyan', world: 'action' },
  { id: 'train', name: 'Heritage Train', icon: '🚂', color: 'stone', world: 'action' },
  
  // Nature Valley
  { id: 'lion', name: 'Feed the Lion', icon: '🥩', color: 'orange', world: 'nature' },
  { id: 'garden', name: 'Vegetable Garden', icon: '🥕', color: 'emerald', world: 'nature' },
  { id: 'animal', name: 'Animal Orchestra', icon: '🦒', color: 'emerald', world: 'nature' },
  { id: 'honey', name: 'Honey Bee', icon: '🐝', color: 'yellow', world: 'nature' },
  { id: 'fruit', name: 'Fruit Market', icon: '🍎', color: 'red', world: 'nature' },
  { id: 'hungry', name: 'Hungry Dove', icon: '🍞', color: 'yellow', world: 'nature' },
  { id: 'sunmoon', name: 'Sun & Moon', icon: '🌞', color: 'amber', world: 'nature' },
  { id: 'sheep', name: 'Counting Sheep', icon: '🐑', color: 'slate', world: 'nature' },

  // Brain Gym
  { id: 'memory', name: 'Memory Clouds', icon: '☁️', color: 'sky', world: 'brain' },
  { id: 'shapes', name: 'Shape Sorter', icon: '🔺', color: 'purple', world: 'brain' },
  { id: 'bridge', name: 'Word Bridge', icon: '🌉', color: 'amber', world: 'brain' },
  { id: 'clock', name: 'Clock Tower', icon: '🕰️', color: 'stone', world: 'brain' },
  { id: 'trace', name: 'Character Trace', icon: '✍️', color: 'yellow', world: 'brain' },
  { id: 'color', name: 'Color Splash', icon: '🎨', color: 'pink', world: 'brain' },
  { id: 'hide', name: 'Hide & Seek', icon: '🏠', color: 'teal', world: 'brain' },
  { id: 'balloon', name: 'Alphabet Balloon', icon: '🎈', color: 'red', world: 'brain' },
  { id: 'body', name: 'Body Parts', icon: '👀', color: 'rose', world: 'brain' },
  { id: 'match', name: 'Word Match', icon: '🧩', color: 'purple', world: 'brain' },

  // Heritage House
  { id: 'grandparent', name: 'Grandparent Mode', icon: '👵', color: 'amber', world: 'heritage' },
  { id: 'coffee', name: 'Coffee Ceremony', icon: '☕', color: 'stone', world: 'heritage' },
  { id: 'dressup', name: 'Dress-Up', icon: '👗', color: 'fuchsia', world: 'heritage' },
  { id: 'family', name: 'Family Tree', icon: '🌳', color: 'green', world: 'heritage' },
];

export default function App() {
  const [step, setStep] = useState<'intro' | 'name' | 'language' | 'app'>('intro');
  const [kidName, setKidName] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [currentWorld, setCurrentWorld] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [doveCheering, setDoveCheering] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    if (step === 'app') {
      import('./lib/progress').then(({ getUserStats }) => {
        getUserStats().then(stats => {
          if (stats) setStars(stats.stars);
        });
      });
    }
  }, [step, currentTab, currentGame]);

  // Helper to trigger voice messages
  const setDoveMessage = React.useCallback((msg: string) => {
    voiceCoach.speak(msg, language || 'english');
  }, [language]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kidName.trim()) {
      voiceCoach.setName(kidName.trim());
      setStep('language');
      setDoveMessage(`Hi ${kidName.trim()}! What language do you speak?`);
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setStep('app');
    setDoveMessage(`Great choice, ${kidName.trim()}! Let's start learning. Check out your progress or play a game!`);
  };

  const renderTabContent = () => {
    if (currentGame) {
      const commonProps = {
        language,
        onBack: () => {
          setCurrentGame(null);
          setDoveMessage(`Welcome back, ${kidName.trim()}! What do you want to play next?`);
        },
        setDoveMessage,
        setDoveCheering
      };

      // Fallback for unimplemented games
      const renderPlaceholder = (name: string) => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
          <div className="w-full flex justify-between items-center absolute top-4 left-4 z-10">
            <button 
              onClick={commonProps.onBack}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-xl"
            >
              🏠
            </button>
          </div>
          <h2 className="text-base font-black text-blue-600 mb-4">{name}</h2>
          <p className="text-sm font-bold text-gray-500 text-center">Coming soon! Let's play another game.</p>
        </div>
      );

      switch (currentGame) {
        case 'football': return <StadiumGame {...commonProps} />;
        case 'trace': return <TraceWordGame {...commonProps} />;
        case 'lion': return <FeedLionGame {...commonProps} />;
        case 'dove': return <FlyDoveGame {...commonProps} />;
        case 'match': return <MatchGame {...commonProps} />;
        case 'memory': return <MemoryMatchGame {...commonProps} />;
        case 'fruit': return <FruitMarketGame {...commonProps} />;
        case 'hungry': return <HungryDoveGame {...commonProps} />;
        case 'soundpop': return <SoundPopGame {...commonProps} />;
        case 'train': return <HeritageTrainGame {...commonProps} />;
        case 'color': return <ColorSplashGame {...commonProps} />;
        case 'animal': return <AnimalOrchestraGame {...commonProps} />;
        case 'rocket': return <SpaceRocketGame {...commonProps} />;
        case 'hide': return <HideAndSeekGame {...commonProps} />;
        case 'bridge': return <WordBridgeGame {...commonProps} />;
        case 'dressup': return <DressUpGame {...commonProps} />;
        default: return null;
      }
    }

    switch (currentTab) {
      case 'home':
        return <Home setCurrentTab={setCurrentTab} setCurrentWorld={setCurrentWorld} />;
      case 'dictionary':
        return <Dictionary language={language || 'english'} />;
      case 'trophy':
        return <Trophy />;
      case 'games':
        const filteredGames = currentWorld ? GAMES.filter(g => g.world === currentWorld) : GAMES;
        return (
          <div className="w-full h-full p-4 pb-8 flex flex-col items-center justify-start bg-sky-50 overflow-y-auto pt-[28vh]">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 flex flex-col items-center"
            >
              {currentWorld && (
                <button 
                  onClick={() => setCurrentTab('home')}
                  className="mb-2 text-blue-500 font-bold flex items-center justify-center gap-2 min-w-[50px] min-h-[50px] px-4 rounded-full hover:bg-blue-50 transition-colors text-sm"
                >
                  ← Back to Worlds
                </button>
              )}
              <h2 className="text-base font-black text-green-600 mb-1">
                {currentWorld ? WORLDS.find(w => w.id === currentWorld)?.name : 'Play & Learn!'}
              </h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Choose a Game</p>
            </motion.div>

            <div className="grid grid-cols-4 gap-8 w-full max-w-4xl px-2">
              {filteredGames.map((game) => (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentGame(game.id)}
                  className={`group relative bg-white p-2 rounded-2xl shadow-sm border-2 border-${game.color}-50 flex flex-col items-center justify-center gap-2 transition-all hover:border-${game.color}-400 hover:shadow-md w-full aspect-square`}
                >
                  <div className={`bg-${game.color}-400 w-[48px] h-[48px] rounded-xl shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center`}>
                    <span className="text-2xl">{game.icon}</span>
                  </div>
                  <div className="text-center px-1">
                    <span className={`block text-[10px] font-black text-${game.color}-600 leading-tight line-clamp-2`}>{game.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      default:
        return <Home setCurrentTab={setCurrentTab} setCurrentWorld={setCurrentWorld} />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-sky-200 overflow-hidden font-sans selection:bg-yellow-300 relative shadow-2xl">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <Intro key="intro" onStart={() => {
            setStep('name');
            setDoveMessage("Hi! What's your name?");
          }} />
        )}

        {step === 'name' && (
          <motion.div 
            key="name-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center justify-center h-full p-6 max-h-[80vh] m-auto gap-8"
          >
            <DoveMascot isCheering={doveCheering} />
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-[85%] text-center mt-4">
              <h1 className="text-base font-black text-blue-500 mb-6">What's your name?</h1>
              <form onSubmit={handleNameSubmit} className="flex flex-col gap-8">
                <input 
                  type="text" 
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full text-center text-base font-bold p-4 rounded-2xl border-4 border-blue-100 outline-none focus:border-blue-400 transition-colors"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!kidName.trim()}
                  className="bg-yellow-400 text-yellow-900 text-base font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none disabled:opacity-50 transition-all w-full"
                >
                  Next
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'language' && (
          <motion.div 
            key="language-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto max-h-[80vh] m-auto"
          >
            <DoveMascot isCheering={doveCheering} />
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-[85%] text-center mt-4">
              <h1 className="text-base font-black text-blue-500 mb-6">What language do you speak?</h1>
              <div className="flex flex-col gap-4">
                {LANGUAGES.map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`${lang.color} ${lang.shadow} text-white text-sm font-black py-4 px-6 rounded-2xl flex items-center justify-start gap-4 border-2 border-white/30 active:translate-y-1 active:shadow-none transition-all w-full`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    {lang.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'app' && (
          <motion.div 
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-screen flex flex-col bg-sky-50 overflow-hidden"
          >
            {/* Top Header (15vh) */}
            <div className="h-[15vh] shrink-0 bg-white/80 backdrop-blur-md shadow-sm z-50 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="w-[10vh] h-[10vh] min-w-[50px] min-h-[50px] bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                  {kidName.charAt(0).toUpperCase()}
                </div>
                <span className="font-black text-gray-700 text-base">{kidName}</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => {
                    setCurrentGame(null);
                    setCurrentTab('trophy');
                  }}
                  className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full hover:scale-105 transition-transform"
                >
                  <span className="text-yellow-500 text-xl">⭐</span>
                  <span className="font-black text-yellow-600 text-base">{stars}</span>
                </button>
                <button 
                  onClick={() => {
                    setCurrentGame(null);
                    setCurrentTab('dictionary');
                  }}
                  className="w-[10vh] h-[10vh] min-w-[50px] min-h-[50px] bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform text-xl"
                >
                  📖
                </button>
              </div>
            </div>

            {/* Play Arena (65vh) */}
            <div className="h-[65vh] relative w-full overflow-hidden">
              {!currentGame && <DoveMascot isCheering={doveCheering} />}
              <motion.div
                key="main-app"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full w-full"
              >
                {renderTabContent()}
              </motion.div>
            </div>

            {/* Bottom Navigation (20vh) */}
            <div className="h-[20vh] shrink-0 w-full bg-white/90 backdrop-blur-md border-t-4 border-gray-100 flex items-center justify-center gap-8 px-6 z-50">
              <button 
                onClick={() => {
                  if (currentGame) {
                    setCurrentGame(null);
                  } else if (currentTab === 'games' && currentWorld) {
                    setCurrentWorld(null);
                  } else {
                    setCurrentTab('home');
                  }
                }}
                className="flex-1 max-w-[200px] h-[10vh] min-h-[64px] bg-gray-200 text-gray-600 rounded-[2rem] font-black text-base flex items-center justify-center shadow-sm hover:bg-gray-300 transition-colors"
              >
                BACK
              </button>
              <button 
                onClick={() => {
                  setCurrentGame(null);
                  setCurrentWorld(null);
                  setCurrentTab('home');
                }}
                className="flex-1 max-w-[200px] h-[10vh] min-h-[64px] bg-blue-500 text-white rounded-[2rem] font-black text-base flex items-center justify-center shadow-[0_6px_0_rgb(37,99,235)] hover:bg-blue-600 transition-colors active:translate-y-1 active:shadow-none"
              >
                HOME
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
