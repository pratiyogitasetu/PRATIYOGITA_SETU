import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';

const AuthContext = createContext();

const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions';
const STATS_LOCAL_STORAGE_KEY = 'sawalJawabDashboardStats';
const SUBJECT_STATS_LOCAL_STORAGE_KEY = 'sawalJawabSubjectStats';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Auth functions
  async function signup(email, password, displayName) {
    if (!auth) throw new Error("Firebase Auth not initialized");
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    // Try setting firestore user info
    if (db) {
      try {
        await setDoc(doc(db, 'users', credentials.user.uid), {
          email,
          displayName,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Could not save profile to firestore:", e);
      }
    }
    return credentials;
  }

  async function login(email, password) {
    if (!auth) throw new Error("Firebase Auth not initialized");
    return await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (!auth) return;
    return await signOut(auth);
  }

  // Starred Questions (PYQ Bookmarks)
  async function getStarredPyqQuestions() {
    // 1. Read from localStorage first
    let localStarred = [];
    try {
      const raw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY);
      if (raw) localStarred = JSON.parse(raw);
    } catch (e) {
      console.warn("Failed reading local starred questions:", e);
    }

    // 2. If logged in and Firestore exists, try to sync/fetch
    if (currentUser && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'starredPyqs'));
        const firebaseStarred = [];
        querySnapshot.forEach((doc) => {
          firebaseStarred.push({ id: doc.id, ...doc.data() });
        });
        
        if (firebaseStarred.length > 0) {
          // Merge local and firebase starred, preferring firebase
          const merged = [...firebaseStarred];
          localStarred.forEach(l => {
            if (!merged.find(m => m.id === l.id)) {
              merged.push(l);
            }
          });
          localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      } catch (e) {
        console.warn("Failed fetching starred questions from Firebase:", e);
      }
    }

    return localStarred;
  }

  async function saveStarredPyqQuestion(question, id) {
    // 1. Save to local storage
    try {
      const raw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY);
      const starred = raw ? JSON.parse(raw) : [];
      if (!starred.find(q => q.id === id)) {
        starred.push({ ...question, id });
        localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(starred));
      }
    } catch (e) {
      console.warn("Failed writing local starred question:", e);
    }

    // 2. Write to Firestore if available
    if (currentUser && db) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'starredPyqs', id), {
          ...question,
          updatedAt: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.warn("Failed saving starred question to Firestore:", e);
      }
    }
    return true;
  }

  async function removeStarredPyqQuestion(id) {
    // 1. Remove from local storage
    try {
      const raw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY);
      if (raw) {
        const starred = JSON.parse(raw);
        const filtered = starred.filter(q => q.id !== id);
        localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn("Failed removing local starred question:", e);
    }

    // 2. Remove from Firestore if available
    if (currentUser && db) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'starredPyqs', id);
        // Note: import deleteDoc in standard Firestore
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(docRef);
        return true;
      } catch (e) {
        console.warn("Failed deleting starred question from Firestore:", e);
      }
    }
    return true;
  }

  // Dashboard Stats
  async function getDashboardStats() {
    let localStats = {
      totalChats: 0,
      totalQuestions: 0,
      totalMcqAttempted: 0,
      mcqCorrect: 0,
      mcqWrong: 0,
      mcqAccuracy: 0
    };
    try {
      const raw = localStorage.getItem(STATS_LOCAL_STORAGE_KEY);
      if (raw) localStats = JSON.parse(raw);
    } catch (e) {}

    if (currentUser && db) {
      try {
        const statsDoc = await getDoc(doc(db, 'users', currentUser.uid, 'stats', 'dashboard'));
        if (statsDoc.exists()) {
          const fbStats = statsDoc.data();
          localStorage.setItem(STATS_LOCAL_STORAGE_KEY, JSON.stringify(fbStats));
          return fbStats;
        }
      } catch (e) {}
    }
    return localStats;
  }

  async function saveDashboardStats(stats) {
    try {
      localStorage.setItem(STATS_LOCAL_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {}

    if (currentUser && db) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'stats', 'dashboard'), stats);
      } catch (e) {}
    }
  }

  async function trackUserInteraction(interaction) {
    // Save locally or call backend track endpoint
    try {
      const { default: apiService } = await import('../services/api');
      await apiService.trackUserInteraction(interaction);
    } catch (e) {
      console.warn("Failed tracking interaction:", e);
    }
  }

  async function trackSubjectInteraction(subject, type, data) {
    try {
      const { default: apiService } = await import('../services/api');
      await apiService.trackUserInteraction({
        type,
        data: { subject, ...data }
      });
    } catch (e) {}
  }

  async function getSubjectStats() {
    let localSubjects = [
      { name: 'Geography', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#06B6D4' },
      { name: 'Polity', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#8B5CF6' },
      { name: 'History', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#10B981' },
      { name: 'Economics', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#F59E0B' },
      { name: 'Science', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#EF4444' },
      { name: 'Others', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#6B7280' }
    ];
    try {
      const raw = localStorage.getItem(SUBJECT_STATS_LOCAL_STORAGE_KEY);
      if (raw) localSubjects = JSON.parse(raw);
    } catch (e) {}
    return localSubjects;
  }

  async function saveSubjectStats(subjectStats) {
    try {
      localStorage.setItem(SUBJECT_STATS_LOCAL_STORAGE_KEY, JSON.stringify(subjectStats));
    } catch (e) {}
  }

  async function getRecentActivity(limitCount = 10) {
    return [];
  }

  async function getUserAchievements() {
    return [];
  }

  async function getUserLearningGoals() {
    return [];
  }

  async function saveAchievement() {
    return null;
  }

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    getStarredPyqQuestions,
    saveStarredPyqQuestion,
    removeStarredPyqQuestion,
    getDashboardStats,
    saveDashboardStats,
    trackUserInteraction,
    trackSubjectInteraction,
    getSubjectStats,
    saveSubjectStats,
    getRecentActivity,
    getUserAchievements,
    getUserLearningGoals,
    saveAchievement
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
