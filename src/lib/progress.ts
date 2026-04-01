import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface GameSession {
  id?: string;
  userId: string;
  gameId: string;
  score: number;
  duration: number;
  timestamp?: any;
  game_type?: string; // Mapped for UI
  created_at?: string; // Mapped for UI
}

export interface UserStats {
  uid: string;
  name: string;
  language: string;
  stars: number;
  level: number;
  streak: number;
  total_xp: number;
  role: 'admin' | 'user';
  coins?: number; // Mapped for UI
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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export const logGameSession = async (gameType: string, score: number, duration: number) => {
  const user = auth.currentUser;
  if (!user) return;
  
  const path = 'sessions';
  try {
    const sessionRef = doc(collection(db, path));
    const sessionData: GameSession = {
      userId: user.uid,
      gameId: gameType,
      score,
      duration,
      timestamp: serverTimestamp()
    };
    await setDoc(sessionRef, sessionData);

    // Update Stats
    await updateStats(score);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const updateStats = async (xpGain: number = 0) => {
  const user = auth.currentUser;
  if (!user) return;
  
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const newStats: UserStats = {
        uid: user.uid,
        name: user.displayName || 'Player',
        language: 'english',
        stars: 0,
        level: 1,
        streak: 1,
        total_xp: Math.max(0, xpGain),
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userRef, newStats);
    } else {
      const stats = userDoc.data() as UserStats;
      const newTotalXp = (stats.total_xp || 0) + xpGain;
      const newStars = Math.floor(newTotalXp / 10);
      const newLevel = Math.floor(newTotalXp / 1000) + 1;

      await setDoc(userRef, {
        ...stats,
        total_xp: newTotalXp,
        stars: newStars,
        level: newLevel,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getUserStats = async (): Promise<UserStats | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const path = `users/${user.uid}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserStats;
      // Map coins for Trophy component
      return { ...data, coins: data.stars } as any;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

export const getGameHistory = async (limitCount = 10): Promise<GameSession[]> => {
  const user = auth.currentUser;
  if (!user) return [];
  
  const path = 'sessions';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        game_type: data.gameId, // Map for Trophy component
        created_at: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as any;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const getUserGoals = async (): Promise<Goal[]> => {
  const user = auth.currentUser;
  if (!user) return [];
  
  const path = 'goals';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const setGoal = async (goalType: string, targetValue: number) => {
  const user = auth.currentUser;
  if (!user) return;
  
  const path = 'goals';
  try {
    const goalRef = doc(collection(db, path));
    const goalData: Goal = {
      userId: user.uid,
      type: goalType,
      target: targetValue,
      current: 0,
      completed: false,
      createdAt: serverTimestamp()
    };
    await setDoc(goalRef, goalData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};
