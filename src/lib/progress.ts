import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

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

export const getUserId = () => {
  return auth.currentUser?.uid || 'anonymous';
};

export const logGameSession = async (gameType: string, score: number, duration: number) => {
  const userId = getUserId();
  if (userId === 'anonymous') return;
  
  try {
    await addDoc(collection(db, 'sessions'), {
      userId: userId,
      gameId: gameType,
      score: score,
      duration: duration,
      timestamp: serverTimestamp()
    });

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
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create initial stats
      await setDoc(userRef, {
        uid: userId,
        name: auth.currentUser?.displayName || 'Player',
        language: 'english',
        stars: starsGain,
        level: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing stats
      const stats = userSnap.data() as UserStats;
      const newStars = (stats.stars || 0) + starsGain;
      const newLevel = Math.floor(newStars / 1000) + 1;

      await updateDoc(userRef, {
        stars: newStars,
        level: newLevel,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.error('Error updating stats:', err);
  }
};

export const getUserStats = async (): Promise<UserStats | null> => {
  const userId = getUserId();
  if (userId === 'anonymous') return null;
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserStats;
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
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
  } catch (err) {
    console.error('Error fetching game history:', err);
    return [];
  }
};

export interface Goal {
  id?: string;
  userId: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  createdAt?: any;
}

export const getUserGoals = async (): Promise<Goal[]> => {
  const userId = getUserId();
  if (userId === 'anonymous') return [];
  
  try {
    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
  } catch (err) {
    console.error('Error fetching user goals:', err);
    return [];
  }
};

export const setGoal = async (goalType: string, targetValue: number) => {
  const userId = getUserId();
  if (userId === 'anonymous') return;
  
  try {
    await addDoc(collection(db, 'goals'), {
      userId: userId,
      type: goalType,
      target: targetValue,
      current: 0,
      completed: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Error setting goal:', err);
  }
};
