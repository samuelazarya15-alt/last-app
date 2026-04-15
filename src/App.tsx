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
import { HeritageTrainGame } from './components/HeritageTrainGame';
import { ColorSplashGame } from './components/ColorSplashGame';
import { AnimalOrchestraGame } from './components/AnimalOrchestraGame';
import { SpaceRocketGame } from './components/SpaceRocketGame';
import { HideAndSeekGame } from './components/HideAndSeekGame';
import { WordBridgeGame } from './components/WordBridgeGame';
import { QueenDressUpGame } from './components/QueenDressUpGame';
import { GeezGravityGame } from './components/GeezGravityGame';
import { TransportRaceGame } from './components/TransportRaceGame';
import { VegetableGardenGame } from './components/VegetableGardenGame';
import { ShapeSorterGame } from './components/ShapeSorterGame';
import { HoneyBeeGame } from './components/HoneyBeeGame';
import { SunMoonGame } from './components/SunMoonGame';
import { CountingSheepGame } from './components/CountingSheepGame';
import { Basketball3DGame } from './components/Basketball3DGame';
import { Cycling3DGame } from './components/Cycling3DGame';
import { AlphabetBalloonGame } from './components/AlphabetBalloonGame';
import { BodyPartsGame } from './components/BodyPartsGame';
import { ClockTowerGame } from './components/ClockTowerGame';
import { CoffeeCeremonyGame } from './components/CoffeeCeremonyGame';
import { GrandparentGame } from './components/GrandparentGame';
import { FamilyTreeGame } from './components/FamilyTreeGame';
import { Taskbar } from './components/Taskbar';
import { SettingsModal } from './components/SettingsModal';
import { Home } from './components/Home';
import { Learn } from './components/Learn';
import { Trophy } from './components/Trophy';
import { Intro } from './components/Intro';
import { MuteButton } from './components/MuteButton';
import { voiceCoach } from './lib/VoiceCoach';
import { auth, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Settings, ArrowLeft, Home as HomeIcon, BookOpen, Trophy as TrophyIcon, Play, LogIn } from 'lucide-react';

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
  { id: 'basketball3d', name: '3D Basketball', icon: '🏀', color: 'orange', world: 'action', isNew: true },
  { id: 'cycling3d', name: '3D Cycling', icon: '🚴', color: 'blue', world: 'action', isNew: true },
  { id: 'dove', name: 'Dove Flight', icon: '🕊️', color: 'blue', world: 'action' },
  { id: 'rocket', name: 'Space Rocket', icon: '🚀', color: 'indigo', world: 'action' },
  { id: 'transport', name: 'Transport Race', icon: '🏎️', color: 'red', world: 'action' },
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
  { id: 'geezgravity', name: "Ge'ez Gravity", icon: '☄️', color: 'indigo', world: 'brain' },
  { id: 'trace', name: 'Character Trace', icon: '✍️', color: 'yellow', world: 'brain' },
  { id: 'color', name: 'Color Splash', icon: '🎨', color: 'pink', world: 'brain' },
  { id: 'hide', name: 'Hide & Seek', icon: '🏠', color: 'teal', world: 'brain' },
  { id: 'balloon', name: 'Alphabet Balloon', icon: '🎈', color: 'red', world: 'brain' },
  { id: 'body', name: 'Body Parts', icon: '👀', color: 'rose', world: 'brain' },
  { id: 'match', name: 'Word Match', icon: '🧩', color: 'purple', world: 'brain' },

  // Heritage House
  { id: 'grandparent', name: 'Grandparent Mode', icon: '👵', color: 'amber', world: 'heritage' },
  { id: 'coffee', name: 'Coffee Ceremony', icon: '☕', color: 'stone', world: 'heritage' },
  { id: 'queendressup', name: "Queen's Wardrobe", icon: '👑', color: 'fuchsia', world: 'heritage' },
  { id: 'family', name: 'Family Tree', icon: '🌳', color: 'green', world: 'heritage' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [step, setStep] = useState<'intro' | 'auth' | 'name' | 'language' | 'app'>('intro');
  const [kidName, setKidName] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('games');
  const [currentWorld, setCurrentWorld] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [doveCheering, setDoveCheering] = useState(false);
  const [stars, setStars] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // If logged in, we can skip name/language if we already have them
        import('./lib/progress').then(({ getUserStats }) => {
          getUserStats().then(stats => {
            if (stats) {
              setKidName(stats.name);
              setLanguage(stats.language);
              setStars(stats.stars);
              setStep('app');
            } else if (step === 'auth') {
              setStep('name');
            }
          });
        });
      }
    });
    return () => unsubscribe();
  }, []);

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

  if (!isAuthReady) {
    return (
      <div className="w-full max-w-md mx-auto h-screen bg-sky-200 flex items-center justify-center">
        <div className="animate-bounce text-4xl">🕊️</div>
      </div>
    );
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kidName.trim()) {
      voiceCoach.setName(kidName.trim());
      setStep('language');
      setDoveMessage(`Hi ${kidName.trim()}! What language do you speak?`);
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    voiceCoach.playClick();
    setLanguage(langCode);
    setStep('app');
    setDoveMessage(`Great choice, ${kidName.trim()}! Let's start learning. Check out your progress or play a game!`);
    
    // Save initial stats to Firestore if logged in
    if (user) {
      import('./lib/progress').then(({ updateStats }) => {
        updateStats(0); // This will create the user doc with current name/language
      });
    }
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
        case 'basketball3d': return <Basketball3DGame {...commonProps} />;
        case 'cycling3d': return <Cycling3DGame {...commonProps} />;
        case 'trace': return <TraceWordGame {...commonProps} />;
        case 'lion': return <FeedLionGame {...commonProps} />;
        case 'dove': return <FlyDoveGame {...commonProps} />;
        case 'match': return <MatchGame {...commonProps} />;
        case 'memory': return <MemoryMatchGame {...commonProps} />;
        case 'fruit': return <FruitMarketGame {...commonProps} />;
        case 'hungry': return <HungryDoveGame {...commonProps} />;
        case 'train': return <HeritageTrainGame {...commonProps} />;
        case 'color': return <ColorSplashGame {...commonProps} />;
        case 'animal': return <AnimalOrchestraGame {...commonProps} />;
        case 'rocket': return <SpaceRocketGame {...commonProps} />;
        case 'hide': return <HideAndSeekGame {...commonProps} />;
        case 'bridge': return <WordBridgeGame {...commonProps} />;
        case 'queendressup': return <QueenDressUpGame {...commonProps} />;
        case 'geezgravity': return <GeezGravityGame {...commonProps} />;
        case 'transport': return <TransportRaceGame {...commonProps} />;
        case 'garden': return <VegetableGardenGame {...commonProps} />;
        case 'shapes': return <ShapeSorterGame {...commonProps} />;
        case 'honey': return <HoneyBeeGame {...commonProps} />;
        case 'sunmoon': return <SunMoonGame {...commonProps} />;
        case 'sheep': return <CountingSheepGame {...commonProps} />;
        case 'balloon': return <AlphabetBalloonGame {...commonProps} />;
        case 'body': return <BodyPartsGame {...commonProps} />;
        case 'clock': return <ClockTowerGame {...commonProps} />;
        case 'coffee': return <CoffeeCeremonyGame {...commonProps} />;
        case 'grandparent': return <GrandparentGame {...commonProps} />;
        case 'family': return <FamilyTreeGame {...commonProps} />;
        default: {
          const game = GAMES.find(g => g.id === currentGame);
          return renderPlaceholder(game?.name || 'Game');
        }
      }
    }

    switch (currentTab) {
      case 'learn':
        return <Learn language={language || 'english'} />;
      case 'trophy':
        return <Trophy />;
      case 'games':
        return (
          <div className="w-full h-full p-4 pb-12 flex flex-col items-center justify-start bg-sky-50 overflow-y-auto pt-[12vh]">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10 flex flex-col items-center"
            >
              <h2 className="text-4xl font-black text-blue-600 mb-2 drop-shadow-sm">
                Let's Play!
              </h2>
              <p className="text-lg font-bold text-gray-400 uppercase tracking-widest">Pick a Game</p>
            </motion.div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-4xl px-4">
              {GAMES.map((game) => (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    voiceCoach.playClick();
                    setCurrentGame(game.id);
                  }}
                  className={`group relative bg-white p-4 rounded-[2rem] shadow-lg border-4 border-${game.color}-50 flex flex-col items-center justify-center gap-4 transition-all hover:border-${game.color}-400 hover:shadow-2xl w-full aspect-square`}
                >
                  {(game as any).isNew && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md z-10 animate-pulse">
                      NEW
                    </div>
                  )}
                  <div className={`bg-${game.color}-400 w-[72px] h-[72px] rounded-2xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform flex items-center justify-center`}>
                    <span className="text-5xl">{game.icon}</span>
                  </div>
                  <div className="text-center px-1">
                    <span className={`block text-sm font-black text-${game.color}-700 leading-tight tracking-tight`}>
                      {game.name}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      default:
        return <Learn language={language || 'english'} />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-sky-200 overflow-hidden font-sans selection:bg-yellow-300 relative shadow-2xl">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <Intro key="intro" onStart={() => {
            voiceCoach.playClick();
            setStep(user ? 'name' : 'auth');
            setDoveMessage("Hi! Let's get started!");
          }} />
        )}

        {step === 'auth' && (
          <div className="h-full w-full relative flex items-center justify-center overflow-hidden">
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <DoveMascot isCheering={doveCheering} size="22vh" relative={true} />
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
              <MuteButton />
            </div>
            <motion.div
              key="auth-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              className="flex flex-col items-center justify-center h-full p-6 max-h-[80vh] m-auto gap-8 relative z-10"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-[85%] text-center mt-4">
              <h1 className="text-xl font-black text-blue-500 mb-6">Let's save your progress!</h1>
              <p className="text-gray-600 mb-8 font-bold">Sign in to keep your stars and levels safe.</p>
              <button
                onClick={async () => {
                  voiceCoach.playClick();
                  try {
                    await signInWithGoogle();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex items-center justify-center gap-3 bg-white border-4 border-blue-100 text-blue-600 text-xl font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(219,234,254)] active:translate-y-1 active:shadow-none transition-all w-full"
              >
                <LogIn className="w-6 h-6" />
                Sign in with Google
              </button>
              <button
                onClick={() => {
                  voiceCoach.playClick();
                  setStep('name');
                  setDoveMessage("Hi! What's your name?");
                }}
                className="mt-6 text-blue-400 font-bold hover:text-blue-600 transition-colors"
              >
                Continue without signing in
              </button>
            </div>
          </motion.div>
        </div>
      )}

        {step === 'name' && (
          <div className="h-full w-full relative flex items-center justify-center overflow-hidden">
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <DoveMascot isCheering={doveCheering} size="22vh" relative={true} />
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
              <MuteButton />
            </div>
            <motion.div 
              key="name-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              className="flex flex-col items-center justify-center h-full p-6 max-h-[80vh] m-auto gap-8 relative z-10"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-[85%] text-center mt-4">
              <h1 className="text-xl font-black text-blue-500 mb-6">What's your name?</h1>
              <form onSubmit={(e) => {
                voiceCoach.playClick();
                handleNameSubmit(e);
              }} className="flex flex-col gap-8">
                <input 
                  type="text" 
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full text-center text-xl font-bold p-4 rounded-2xl border-4 border-blue-100 outline-none focus:border-blue-400 transition-colors"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!kidName.trim()}
                  className="bg-yellow-400 text-yellow-900 text-xl font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none disabled:opacity-50 transition-all w-full"
                >
                  Next
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

        {step === 'language' && (
          <div className="h-full w-full relative flex items-center justify-center overflow-hidden">
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <DoveMascot isCheering={doveCheering} size="22vh" relative={true} />
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
              <MuteButton />
            </div>
            <motion.div 
              key="language-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto max-h-[80vh] m-auto relative z-10"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-[85%] text-center mt-4">
              <h1 className="text-xl font-black text-blue-500 mb-6">What language do you speak?</h1>
              <div className="flex flex-col gap-4">
                {LANGUAGES.map((lang) => (
                  <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`${lang.color} ${lang.shadow} text-white text-lg font-black py-4 px-6 rounded-2xl flex items-center justify-start gap-4 border-2 border-white/30 active:translate-y-1 active:shadow-none transition-all w-full`}
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    {lang.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

        {step === 'app' && (
          <motion.div 
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-screen flex flex-col bg-sky-50 overflow-hidden"
          >
            {/* Top Header (10vh) */}
            <div className="h-[10vh] shrink-0 bg-white/80 backdrop-blur-md shadow-sm z-50 flex items-center justify-between px-4 relative">
              <div className="flex items-center gap-2">
                <MuteButton />
                <div className="w-[6vh] h-[6vh] min-w-[40px] min-h-[40px] bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 border-2 border-white shadow-sm">
                  {kidName.charAt(0).toUpperCase()}
                </div>
                <span className="font-black text-gray-700 text-sm hidden xs:block truncate max-w-[80px]">{kidName}</span>
              </div>

              {/* Centered Dove Mascot */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  <DoveMascot relative size="7vh" isCheering={doveCheering} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-full border-2 border-white shadow-sm">
                  <span className="text-yellow-500 text-xl">⭐</span>
                  <span className="font-black text-yellow-600 text-sm">{stars}</span>
                </div>
                <button 
                  onClick={() => {
                    voiceCoach.playClick();
                    setIsSettingsOpen(true);
                  }}
                  className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform border-2 border-white"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Play Arena (78vh) */}
            <div className="h-[78vh] relative w-full overflow-hidden">
              <motion.div
                key="main-app"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full w-full"
              >
                {renderTabContent()}
              </motion.div>
            </div>

            {/* Bottom Navigation (12vh) */}
            <div className="h-[12vh] shrink-0 w-full bg-white/90 backdrop-blur-md border-t-4 border-gray-100 flex items-center justify-center gap-3 px-4 z-50">
              <button 
                onClick={() => {
                  voiceCoach.playClick();
                  if (currentGame) {
                    setCurrentGame(null);
                  } else {
                    setCurrentTab('games');
                  }
                }}
                className="flex-1 max-w-[80px] h-[8vh] min-h-[48px] bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-1 shadow-sm hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>BACK</span>
              </button>

              <button 
                onClick={() => {
                  voiceCoach.playClick();
                  setCurrentGame(null);
                  setCurrentWorld(null);
                  setCurrentTab('games');
                }}
                className={`flex-1 max-w-[80px] h-[8vh] min-h-[48px] rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-1 transition-all ${
                  currentTab === 'games'
                    ? 'bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)]' 
                    : 'bg-white text-blue-500 border-2 border-blue-50'
                }`}
              >
                <Play size={20} fill={currentTab === 'games' ? 'currentColor' : 'none'} />
                <span>PLAY</span>
              </button>

              <button 
                onClick={() => {
                  voiceCoach.playClick();
                  setCurrentGame(null);
                  setCurrentTab('learn');
                }}
                className={`flex-1 max-w-[80px] h-[8vh] min-h-[48px] rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-1 transition-all ${
                  currentTab === 'learn' 
                    ? 'bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)]' 
                    : 'bg-white text-green-500 border-2 border-green-50'
                }`}
              >
                <BookOpen size={20} />
                <span>LEARN</span>
              </button>

              <button 
                onClick={() => {
                  voiceCoach.playClick();
                  setCurrentGame(null);
                  setCurrentTab('trophy');
                }}
                className={`flex-1 max-w-[80px] h-[8vh] min-h-[48px] rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-1 transition-all ${
                  currentTab === 'trophy' 
                    ? 'bg-yellow-500 text-white shadow-[0_4px_0_rgb(202,138,4)]' 
                    : 'bg-white text-yellow-500 border-2 border-yellow-50'
                }`}
              >
                <TrophyIcon size={20} />
                <span>PROGRESS</span>
              </button>
            </div>
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
