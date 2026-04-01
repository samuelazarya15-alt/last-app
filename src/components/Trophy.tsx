import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy as TrophyIcon, Flame, Coins, BookOpen, Star, Target, Plus, History } from 'lucide-react';
import { getUserStats, getGameHistory, getUserGoals, setGoal, UserStats, GameSession, Goal as UserGoal } from '../lib/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { voiceCoach } from '../lib/VoiceCoach';

export function Trophy() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<GameSession[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [s, h, g] = await Promise.all([
        getUserStats(),
        getGameHistory(7),
        getUserGoals()
      ]);
      setStats(s);
      setHistory(h);
      setGoals(g);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddGoal = async (type: UserGoal['type'], target: number) => {
    await setGoal(type, target);
    const updatedGoals = await getUserGoals();
    setGoals(updatedGoals);
    setShowGoalModal(false);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-sky-50">
        <div className="animate-bounce text-base">🏆</div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = history.map(session => ({
    name: (session.game_type || 'Game').charAt(0).toUpperCase() + (session.game_type || 'Game').slice(1),
    score: session.score,
    date: new Date(session.created_at || new Date()).toLocaleDateString()
  })).reverse();

  const COLORS = ['#4ade80', '#facc15', '#fb923c', '#60a5fa', '#a855f7'];

  return (
    <div className="w-full h-full flex flex-col p-6 bg-sky-50 pb-8 pt-[28vh] overflow-y-auto">
      <h2 className="text-xl font-black text-purple-600 mb-8 text-center tracking-tight">Your Progress</h2>
      
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-[2.5rem] shadow-md border-4 border-orange-100 flex flex-col items-center text-center"
        >
          <div className="bg-orange-50 p-3 rounded-2xl mb-3">
            <Flame className="text-orange-500" size={32} strokeWidth={3} fill="currentColor" />
          </div>
          <span className="text-xl font-black text-gray-800">{stats?.streak || 0}</span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-[2.5rem] shadow-md border-4 border-yellow-100 flex flex-col items-center text-center"
        >
          <div className="bg-yellow-50 p-3 rounded-2xl mb-3">
            <Coins className="text-yellow-500" size={32} strokeWidth={3} fill="currentColor" />
          </div>
          <span className="text-xl font-black text-gray-800">{stats?.coins || 0}</span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coins</span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-[2.5rem] shadow-md border-4 border-blue-100 flex flex-col items-center text-center"
        >
          <div className="bg-blue-50 p-3 rounded-2xl mb-3">
            <BookOpen className="text-blue-500" size={32} strokeWidth={3} fill="currentColor" />
          </div>
          <span className="text-xl font-black text-gray-800">{Math.min(100, Math.floor((stats?.total_xp || 0) / 100))}%</span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mastery</span>
        </motion.div>
      </div>

      {/* Level Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[3rem] shadow-md border-4 border-white mb-8 relative overflow-hidden"
      >
        <div className="absolute -right-4 -top-4 text-8xl opacity-10">🌟</div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-base font-black text-gray-400 uppercase tracking-widest mb-1">Level {stats?.level || 1}</h3>
            <p className="text-lg font-black text-blue-500">Explorer</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-gray-800">{(stats?.total_xp || 0) % 1000}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase ml-1">/ 1000 XP</span>
          </div>
        </div>
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden border-4 border-gray-50 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((stats?.total_xp || 0) % 1000) / 10}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          />
        </div>
      </motion.div>

      {/* Performance Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-[3rem] shadow-md border-4 border-white mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 p-2 rounded-xl">
            <History className="text-purple-500" size={24} strokeWidth={3} />
          </div>
          <h3 className="text-base font-black text-gray-800 uppercase tracking-widest">Recent Performance</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontWeight: 800, fontSize: 14 }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  fontWeight: 900
                }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="score" radius={[10, 10, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Goals Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-[3rem] shadow-md border-4 border-white mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-xl">
              <Target className="text-red-500" size={24} strokeWidth={3} />
            </div>
            <h3 className="text-base font-black text-gray-800 uppercase tracking-widest">Your Goals</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              voiceCoach.playClick();
              setShowGoalModal(true);
            }}
            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all min-w-[50px] min-h-[50px] flex items-center justify-center"
          >
            <Plus size={24} strokeWidth={3} />
          </motion.button>
        </div>

        <div className="space-y-6">
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 font-black text-base mb-2">No goals set yet! 🎯</p>
              <p className="text-gray-400 font-bold text-sm">Add one to stay motivated!</p>
            </div>
          ) : (
            goals.map((goal, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-[2rem] border-4 border-gray-100 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-gray-700 text-base capitalize tracking-tight">
                    {goal.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    {goal.current} / {goal.target}
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                    className="h-full bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.3)]"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Goal Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl border-4 border-blue-50"
            >
              <h3 className="text-lg font-black text-gray-800 mb-2 text-center">Set a New Goal</h3>
              <p className="text-gray-400 font-bold text-center mb-8 text-base">Choose your next challenge!</p>
              
              <div className="grid grid-cols-1 gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    voiceCoach.playClick();
                    handleAddGoal('daily_xp', 500);
                  }}
                  className="p-6 bg-orange-50 border-4 border-orange-100 rounded-[2rem] text-left hover:border-orange-400 transition-all group"
                >
                  <div className="font-black text-orange-600 text-base mb-1 group-hover:text-orange-700">Daily XP Master</div>
                  <div className="text-sm text-orange-400 font-bold">Earn 500 XP in 24 hours</div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    voiceCoach.playClick();
                    handleAddGoal('games_played', 5);
                  }}
                  className="p-6 bg-blue-50 border-4 border-blue-100 rounded-[2rem] text-left hover:border-blue-400 transition-all group"
                >
                  <div className="font-black text-blue-600 text-base mb-1 group-hover:text-blue-700">Game Enthusiast</div>
                  <div className="text-sm text-blue-400 font-bold">Play 5 games today</div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    voiceCoach.playClick();
                    setShowGoalModal(false);
                  }}
                  className="mt-4 w-full py-4 bg-gray-100 text-gray-500 font-black rounded-[1.5rem] hover:bg-gray-200 transition-colors text-base"
                >
                  CANCEL
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
