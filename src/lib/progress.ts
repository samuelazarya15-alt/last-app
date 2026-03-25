export interface GameSession {
  id?: string;
  userId: string;
  gameId: string;
  score: number;
  duration: number;
  timestamp?: any;
}

export interface UserStats {
  uid: string;
  name: string;
  language: string;
  stars: number;
  level: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Goal {
  id?: string;
  userId: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  createdAt?: any;
}

export const getUserId = () => {
  return localStorage.getItem('selam_user_id') || 'anonymous';
};

export const setUserId = (id: string) => {
  localStorage.setItem('selam_user_id', id);
};

export const logGameSession = async (gameType: string, score: number, duration: number) => {
  const userId = getUserId();
  if (userId === 'anonymous') return;
  
  try {
    const sessions = JSON.parse(localStorage.getItem('selam_sessions') || '[]');
    sessions.push({
      id: Date.now().toString(),
      userId,
      gameId: gameType,
      score,
      duration,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('selam_sessions', JSON.stringify(sessions));

    // Update XP and Coins (Stars)
    await updateStats(score, Math.floor(score / 10));
  } catch (err) {
    console.error('Error logging game session:', err);
  }
};

export const updateStats = async (score: number, starsGain: number = 0) => {
  const userId = getUserId();
  if (userId === 'anonymous') return;
  
  try {
    const statsStr = localStorage.getItem(`selam_user_${userId}`);
    if (!statsStr) {
      // Create initial stats
      const newStats: UserStats = {
        uid: userId,
        name: localStorage.getItem('selam_user_name') || 'Player',
        language: localStorage.getItem('selam_user_language') || 'english',
        stars: starsGain,
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`selam_user_${userId}`, JSON.stringify(newStats));
    } else {
      // Update existing stats
      const stats = JSON.parse(statsStr) as UserStats;
      const newStars = (stats.stars || 0) + starsGain;
      const newLevel = Math.floor(newStars / 1000) + 1;

      stats.stars = newStars;
      stats.level = newLevel;
      stats.updatedAt = new Date().toISOString();
      localStorage.setItem(`selam_user_${userId}`, JSON.stringify(stats));
    }
  } catch (err) {
    console.error('Error updating stats:', err);
  }
};

export const getUserStats = async (): Promise<UserStats | null> => {
  const userId = getUserId();
  if (userId === 'anonymous') return null;
  
  try {
    const statsStr = localStorage.getItem(`selam_user_${userId}`);
    if (statsStr) {
      return JSON.parse(statsStr) as UserStats;
    }
    return null;
  } catch (err) {
    console.error('Error fetching stats:', err);
    return null;
  }
};

export const getGameHistory = async (limitCount = 10): Promise<GameSession[]> => {
  const userId = getUserId();
  if (userId === 'anonymous') return [];
  
  try {
    const sessions = JSON.parse(localStorage.getItem('selam_sessions') || '[]') as GameSession[];
    return sessions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  } catch (err) {
    console.error('Error fetching game history:', err);
    return [];
  }
};

export const getUserGoals = async (): Promise<Goal[]> => {
  const userId = getUserId();
  if (userId === 'anonymous') return [];
  
  try {
    const goals = JSON.parse(localStorage.getItem('selam_goals') || '[]') as Goal[];
    return goals
      .filter(g => g.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching user goals:', err);
    return [];
  }
};

export const setGoal = async (goalType: string, targetValue: number) => {
  const userId = getUserId();
  if (userId === 'anonymous') return;
  
  try {
    const goals = JSON.parse(localStorage.getItem('selam_goals') || '[]');
    goals.push({
      id: Date.now().toString(),
      userId,
      type: goalType,
      target: targetValue,
      current: 0,
      completed: false,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('selam_goals', JSON.stringify(goals));
  } catch (err) {
    console.error('Error setting goal:', err);
  }
};
