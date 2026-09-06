import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db 
} from '../config/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';

const AuthContext = createContext();
const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions';
const AUTH_SYNC_COLLECTION = 'authSync';
const AUTH_SYNC_DOC = 'state';
const AUTH_SYNC_SOURCE = 'main-frontend';

function getAuthSyncRef(uid) {
  return doc(db, 'users', uid, AUTH_SYNC_COLLECTION, AUTH_SYNC_DOC);
}

async function updateAuthSyncState(uid, loggedIn) {
  if (!uid) return;

  try {
    await setDoc(
      getAuthSyncRef(uid),
      {
        loggedIn,
        source: AUTH_SYNC_SOURCE,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('⚠️ Could not update auth sync state:', error);
  }
}

function readLocalStarredPyqs() {
  try {
    const raw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalStarredPyqs(items) {
  try {
    localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(items || []));
    return true;
  } catch {
    return false;
  }
}

function isPermissionDeniedError(error) {
  return error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions');
}

function isIndexRequiredError(error) {
  return error?.code === 'failed-precondition' || error?.message?.includes('The query requires an index');
}

function normalizeSubjectName(subject) {
  const raw = String(
    typeof subject === 'string'
      ? subject
      : (subject?.name || subject?.subject || '')
  )
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!raw || raw === 'all' || raw === 'all subjects') return 'Others';

  // Strong priority guards for known overlaps
  if (raw.includes('political science') || raw.includes('indian polity') || raw.includes('public administration')) {
    return 'Polity';
  }

  const has = (key) => raw.includes(key);

  const scores = {
    Geography: 0,
    Polity: 0,
    History: 0,
    Economics: 0,
    Science: 0,
  };

  const buckets = {
    Geography: ['geography', 'geo', 'latitude', 'longitude', 'map', 'climate', 'monsoon', 'soil', 'resources'],
    Polity: ['polity', 'politics', 'political', 'constitution', 'constitutional', 'civics', 'governance', 'parliament', 'judiciary', 'legislature', 'rights'],
    History: ['history', 'ancient', 'medieval', 'modern', 'freedom struggle', 'revolt', 'civilization'],
    Economics: ['economics', 'economy', 'economic', 'gdp', 'inflation', 'fiscal', 'monetary', 'budget', 'banking', 'poverty', 'unemployment'],
    Science: ['science', 'physics', 'chemistry', 'biology', 'botany', 'zoology'],
  };

  Object.entries(buckets).forEach(([name, keys]) => {
    keys.forEach((key) => {
      if (has(key)) scores[name] += 1;
    });
  });

  // Prevent "political science" / "economic science" from being pulled into generic Science
  if (scores.Polity > 0 || scores.Economics > 0) {
    scores.Science = Math.max(0, scores.Science - 1);
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] > 0) return best[0];

  return 'Others';
}

function getDefaultSubjectStats() {
  return [
    { name: 'Geography', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#06B6D4' },
    { name: 'Polity', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#8B5CF6' },
    { name: 'History', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#10B981' },
    { name: 'Economics', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#F59E0B' },
    { name: 'Science', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#EF4444' },
    { name: 'Others', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#6B7280' }
  ];
}

function sanitizeSubjectStats(subjects = []) {
  const template = getDefaultSubjectStats();
  const byName = new Map(template.map((item) => [item.name, { ...item }]));

  (Array.isArray(subjects) ? subjects : []).forEach((entry) => {
    const canonical = normalizeSubjectName(entry?.name || entry?.subject || 'Others');
    const existing = byName.get(canonical) || byName.get('Others');
    if (!existing) return;

    existing.questions += Number(entry?.questions || entry?.questionCount || 0) || 0;
    existing.mcqAttempted += Number(entry?.mcqAttempted || entry?.attempted || 0) || 0;
    existing.mcqCorrect += Number(entry?.mcqCorrect || entry?.correct || 0) || 0;
  });

  return template.map((item) => byName.get(item.name) || item);
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: displayName
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        totalChats: 0,
        totalQueries: 0
      });

      await updateAuthSyncState(user.uid, true);

      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Sign in with email and password
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.displayName) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const docDisplayName = userDoc.exists() ? String(userDoc.data()?.displayName || '').trim() : '';

        if (docDisplayName) {
          await updateProfile(user, {
            displayName: docDisplayName,
          });
        }
      }

      await updateAuthSyncState(userCredential.user.uid, true);
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Sign in with Google
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      let result;
      
      try {
        // Try popup first
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        // If popup is blocked, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.message.includes('popup')) {
          console.log('Popup blocked, trying redirect...');
          
          // Use redirect as fallback
          await signInWithRedirect(auth, provider);
          return; // The redirect will handle the rest
        }
        
        // Re-throw other errors
        throw popupError;
      }
      
      const user = result.user;
      
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          totalChats: 0,
          totalQueries: 0,
          provider: 'google'
        });
      }

      await updateAuthSyncState(user.uid, true);
      
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Login was cancelled. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      
      throw error;
    }
  }

  // Sign in with GitHub
  async function loginWithGithub() {
    try {
      const provider = new GithubAuthProvider();
      provider.setCustomParameters({
        allow_signup: 'true'
      });
      
      let result;
      
      try {
        // Try popup first
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        // If popup is blocked, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.message.includes('popup')) {
          console.log('Popup blocked, trying redirect...');
          
          // Use redirect as fallback
          await signInWithRedirect(auth, provider);
          return; // The redirect will handle the rest
        }
        
        // Re-throw other errors
        throw popupError;
      }
      
      const user = result.user;
      
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          totalChats: 0,
          totalQueries: 0,
          provider: 'github'
        });
      }

      await updateAuthSyncState(user.uid, true);
      
      return result;
    } catch (error) {
      console.error('GitHub login error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Login was cancelled. Please try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email. Try signing in with a different method.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      
      throw error;
    }
  }

  // Sign out
  async function logout() {
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateAuthSyncState(uid, false);
      }
      return await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Create new chat session
  async function createNewChat(title = 'New Chat') {
    if (!currentUser) {
      console.log('❌ createNewChat: No currentUser')
      return null
    }

    try {
      console.log('🆕 createNewChat: Creating chat with title:', title)
      const chatData = {
        userId: currentUser.uid,
        title: title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messageCount: 0
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      console.log('✅ createNewChat: Created chat with ID:', docRef.id)
      return docRef.id;
    } catch (error) {
      console.error('❌ createNewChat error:', error);
      throw error;
    }
  }

// Helper to clean undefined values and prepare objects for Firestore
function sanitizeForFirestore(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (obj._methodName || (obj.constructor && obj.constructor.name === 'FieldValue')) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

  // Save message to chat
  async function saveMessage(chatId, message) {
    if (!currentUser) return null;

    try {
      const rawMessageData = {
        chatId: chatId,
        userId: currentUser.uid,
        type: message.type, // 'user' or 'bot'
        content: message.content || '',
        sources: message.sources || null,
        related_pyqs: message.related_pyqs || null,
        timestamp: serverTimestamp(),
        createdAt: new Date()
      };

      const cleanMessageData = sanitizeForFirestore(rawMessageData);
      const docRef = await addDoc(collection(db, 'messages'), cleanMessageData);
      console.log('✅ Message saved to Firebase with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Get user's chat history
  async function getChatHistory() {
    if (!currentUser) {
      console.log('❌ getChatHistory: No currentUser')
      return []
    }

    try {
      console.log('📂 getChatHistory: Querying chats for user:', currentUser.uid)
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const chats = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || data.createdAt || new Date())
        });
      });

      // Client-side sort prevents Firestore composite index error
      chats.sort((a, b) => {
        const timeB = new Date(b.updatedAt || 0).getTime();
        const timeA = new Date(a.updatedAt || 0).getTime();
        return timeB - timeA;
      });

      console.log('✅ getChatHistory: Found', chats.length, 'chats:', chats)
      return chats;
    } catch (error) {
      console.error('❌ getChatHistory error:', error);
      return [];
    }
  }

  // Get messages for a specific chat
  async function getChatMessages(chatId) {
    if (!currentUser) {
      console.log('❌ getChatMessages: No currentUser')
      return []
    }

    try {
      console.log('📝 getChatMessages: Loading messages for chatId:', chatId)
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId)
      );

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || data.createdAt || new Date())
        });
      });

      // Client-side sort prevents Firestore composite index error
      messages.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      const dedupedMessages = [];
      for (const message of messages) {
        const last = dedupedMessages[dedupedMessages.length - 1];
        const sameType = last?.type === message?.type;
        const sameContent = String(last?.content || '').trim() === String(message?.content || '').trim();
        const lastTime = new Date(last?.timestamp || 0).getTime();
        const currentTime = new Date(message?.timestamp || 0).getTime();
        const isCloseInTime = Math.abs(currentTime - lastTime) <= 10_000;

        if (sameType && sameContent && isCloseInTime) {
          continue;
        }
        dedupedMessages.push(message);
      }

      if (dedupedMessages.length !== messages.length) {
        console.log('🧹 getChatMessages: Deduped', messages.length - dedupedMessages.length, 'duplicate messages for chatId:', chatId)
      }
      console.log('✅ getChatMessages: Found', dedupedMessages.length, 'messages for chatId:', chatId)
      return dedupedMessages;
    } catch (error) {
      console.error('❌ getChatMessages error:', error);
      return [];
    }
  }

  // Update user stats
  async function updateUserStats(statsUpdate) {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentStats = userDoc.data();
        await setDoc(userRef, {
          ...currentStats,
          ...statsUpdate,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // Save/Update dashboard stats in Firebase
  async function saveDashboardStats(stats) {
    if (!currentUser) return;

    try {
      const statsRef = doc(db, 'userStats', currentUser.uid);
      await setDoc(statsRef, {
        ...stats,
        userId: currentUser.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Dashboard stats saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving dashboard stats:', error);
      throw error;
    }
  }

  // Save/Update subject-wise stats in Firebase
  async function saveSubjectStats(subjectStats) {
    if (!currentUser) return;

    try {
      const subjectStatsRef = doc(db, 'userSubjectStats', currentUser.uid);
      await setDoc(subjectStatsRef, {
        subjects: subjectStats,
        userId: currentUser.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Subject stats saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving subject stats:', error);
      throw error;
    }
  }

  // Get subject-wise stats from Firebase
  async function getSubjectStats() {
    if (!currentUser) return [];

    try {
      const subjectStatsRef = doc(db, 'userSubjectStats', currentUser.uid);
      const subjectStatsDoc = await getDoc(subjectStatsRef);
      
      if (subjectStatsDoc.exists()) {
        const normalized = sanitizeSubjectStats(subjectStatsDoc.data().subjects || []);
        // Self-heal older schema silently
        await saveSubjectStats(normalized);
        return normalized;
      } else {
        // Initialize default subject stats if none exist
        const defaultSubjectStats = getDefaultSubjectStats();
        await saveSubjectStats(defaultSubjectStats);
        return defaultSubjectStats;
      }
    } catch (error) {
      console.error('❌ Error getting subject stats:', error);
      return [];
    }
  }

  // Get dashboard stats from Firebase
  async function getDashboardStats() {
    if (!currentUser) return null;

    try {
      const statsRef = doc(db, 'userStats', currentUser.uid);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data();
      } else {
        // Initialize default stats if none exist
        const defaultStats = {
          totalChats: 0,
          totalQuestions: 0,
          totalMcqAttempted: 0,
          mcqCorrect: 0,
          mcqWrong: 0,
          mcqAccuracy: 0,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(statsRef, defaultStats);
        return defaultStats;
      }
    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      return null;
    }
  }

  // Track user interaction
  async function trackUserInteraction(interaction) {
    if (!currentUser) return;

    try {
      const interactionData = {
        ...interaction,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'userInteractions'), interactionData);
      console.log('✅ User interaction tracked:', interaction.type);
    } catch (error) {
      console.error('❌ Error tracking user interaction:', error);
    }
  }

  // Track subject-specific interaction and update stats
  async function trackSubjectInteraction(subject, interactionType, data = {}) {
    if (!currentUser) return;

    try {
      const normalizedSubject = normalizeSubjectName(subject);

      const normalizedSubjectLower = String(normalizedSubject || 'Others').toLowerCase();

      // Get current subject stats
      const currentSubjectStats = await getSubjectStats();
      
      // Find the subject in the stats
      const subjectIndex = currentSubjectStats.findIndex(s => 
        String(s.name || s.subject || '').toLowerCase() === normalizedSubjectLower
      );
      
      let targetSubject = null;
      if (subjectIndex !== -1) {
        targetSubject = currentSubjectStats[subjectIndex];
      } else {
        // If subject not found, add to "Others"
        const othersIndex = currentSubjectStats.findIndex(s => String(s.name || s.subject || '') === 'Others');
        if (othersIndex !== -1) {
          targetSubject = currentSubjectStats[othersIndex];
        }
      }

      if (targetSubject) {
        // Update the specific subject stats
        const updatedSubjectStats = [...currentSubjectStats];
        const updateIndex = subjectIndex !== -1 ? subjectIndex : 
          currentSubjectStats.findIndex(s => String(s.name || s.subject || '') === 'Others');
        
        if (updateIndex !== -1) {
          updatedSubjectStats[updateIndex].questions = Number(updatedSubjectStats[updateIndex].questions || 0);
          updatedSubjectStats[updateIndex].mcqAttempted = Number(updatedSubjectStats[updateIndex].mcqAttempted || 0);
          updatedSubjectStats[updateIndex].mcqCorrect = Number(updatedSubjectStats[updateIndex].mcqCorrect || 0);

          switch (interactionType) {
            case 'question':
              updatedSubjectStats[updateIndex].questions += 1;
              break;
            case 'mcq_attempt':
              updatedSubjectStats[updateIndex].mcqAttempted += 1;
              break;
            case 'mcq_correct':
              updatedSubjectStats[updateIndex].mcqAttempted += 1;
              updatedSubjectStats[updateIndex].mcqCorrect += 1;
              break;
            case 'mcq_wrong':
              updatedSubjectStats[updateIndex].mcqAttempted += 1;
              break;
          }
          
          // Save updated subject stats
          await saveSubjectStats(updatedSubjectStats);
        }
      }

      // Also track the general interaction
      await trackUserInteraction({
        type: interactionType,
        subject: normalizedSubject,
        ...data
      });

      console.log('✅ Subject interaction tracked:', interactionType, 'for', normalizedSubject);
    } catch (error) {
      console.error('❌ Error tracking subject interaction:', error);
    }
  }

  // Get recent user interactions
  async function getRecentActivity(limitCount = 10) {
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'userInteractions'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || doc.data().createdAt
        });
      });

      return activities;
    } catch (error) {
      // Fallback when composite index is not present
      try {
        const fallbackQ = query(
          collection(db, 'userInteractions'),
          where('userId', '==', currentUser.uid),
          limit(limitCount)
        );
        const fallbackSnapshot = await getDocs(fallbackQ);
        const fallbackActivities = [];
        fallbackSnapshot.forEach((item) => {
          const data = item.data();
          fallbackActivities.push({
            id: item.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || data.createdAt
          });
        });
        fallbackActivities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        return fallbackActivities.slice(0, limitCount);
      } catch (fallbackError) {
        console.error('❌ Error getting recent activity:', fallbackError);
        return [];
      }
    }
  }

  // Save user achievement
  async function saveAchievement(achievement) {
    if (!currentUser) return;

    try {
      const achievementData = {
        ...achievement,
        userId: currentUser.uid,
        earnedAt: serverTimestamp(),
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'userAchievements'), achievementData);
      console.log('✅ Achievement saved:', achievement.title);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving achievement:', error);
      throw error;
    }
  }

  // Get user achievements
  async function getUserAchievements() {
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'userAchievements'),
        where('userId', '==', currentUser.uid),
        orderBy('earnedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const achievements = [];
      
      querySnapshot.forEach((doc) => {
        achievements.push({
          id: doc.id,
          ...doc.data(),
          earnedAt: doc.data().earnedAt?.toDate() || doc.data().createdAt
        });
      });

      return achievements;
    } catch (error) {
      // Fallback when composite index is not present
      try {
        const fallbackQ = query(
          collection(db, 'userAchievements'),
          where('userId', '==', currentUser.uid)
        );
        const fallbackSnapshot = await getDocs(fallbackQ);
        const achievements = [];
        fallbackSnapshot.forEach((item) => {
          const data = item.data();
          achievements.push({
            id: item.id,
            ...data,
            earnedAt: data.earnedAt?.toDate?.() || data.createdAt
          });
        });
        achievements.sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0));
        return achievements;
      } catch (fallbackError) {
        console.error('❌ Error getting achievements:', fallbackError);
        return [];
      }
    }
  }

  // Save learning goal
  async function saveLearningGoal(goal) {
    if (!currentUser) return;

    try {
      const goalData = {
        ...goal,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'learningGoals'), goalData);
      console.log('✅ Learning goal saved:', goal.title);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving learning goal:', error);
      throw error;
    }
  }

  // Get user learning goals
  async function getUserLearningGoals() {
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'learningGoals'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const goals = [];
      
      querySnapshot.forEach((doc) => {
        goals.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });

      return goals;
    } catch (error) {
      // Fallback when composite index is not present
      try {
        const fallbackQ = query(
          collection(db, 'learningGoals'),
          where('userId', '==', currentUser.uid)
        );
        const fallbackSnapshot = await getDocs(fallbackQ);
        const goals = [];
        fallbackSnapshot.forEach((item) => {
          const data = item.data();
          goals.push({
            id: item.id,
            ...data,
            createdAt: data.createdAt?.toDate?.(),
            updatedAt: data.updatedAt?.toDate?.()
          });
        });
        goals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return goals;
      } catch (fallbackError) {
        console.error('❌ Error getting learning goals:', fallbackError);
        return [];
      }
    }
  }

  // Update learning goal progress
  async function updateLearningGoalProgress(goalId, progress) {
    if (!currentUser) return;

    try {
      const goalRef = doc(db, 'learningGoals', goalId);
      await updateDoc(goalRef, {
        progress: progress,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Learning goal progress updated');
    } catch (error) {
      console.error('❌ Error updating learning goal progress:', error);
      throw error;
    }
  }

  // Save quiz result
  async function saveQuizResult(quizData) {
    if (!currentUser) return null;

    try {
      const quizResult = {
        ...quizData,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'quizResults'), quizResult);
      console.log('✅ Quiz result saved:', docRef.id);
      
      // Update user stats
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentStats = userDoc.data() || {};
      
      await updateDoc(userRef, {
        totalQuizzes: (currentStats.totalQuizzes || 0) + 1,
        totalQuizQuestions: (currentStats.totalQuizQuestions || 0) + quizData.totalQuestions,
        totalCorrectAnswers: (currentStats.totalCorrectAnswers || 0) + quizData.correct,
        lastQuizDate: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving quiz result:', error);
      throw error;
    }
  }

  // Get user quiz history
  async function getUserQuizHistory(limitCount = 10) {
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'quizResults'),
        where('userId', '==', currentUser.uid),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const quizzes = [];
      
      querySnapshot.forEach((doc) => {
        quizzes.push({
          id: doc.id,
          ...doc.data(),
          completedAt: doc.data().completedAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });

      return quizzes;
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        console.warn('⚠️ Quiz history permission denied. Returning empty history.');
        return [];
      }

      if (isIndexRequiredError(error)) {
        console.warn('⚠️ Quiz history index missing. Using fallback query without orderBy.');
        try {
          const fallbackQ = query(
            collection(db, 'quizResults'),
            where('userId', '==', currentUser.uid),
            limit(Math.max(limitCount, 20))
          );

          const fallbackSnapshot = await getDocs(fallbackQ);
          const fallbackQuizzes = [];

          fallbackSnapshot.forEach((item) => {
            const data = item.data();
            fallbackQuizzes.push({
              id: item.id,
              ...data,
              completedAt: data.completedAt?.toDate?.(),
              createdAt: data.createdAt?.toDate?.(),
            });
          });

          fallbackQuizzes.sort((a, b) => {
            const aTime = new Date(a.completedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.completedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });

          return fallbackQuizzes.slice(0, limitCount);
        } catch (fallbackError) {
          console.error('❌ Quiz history fallback failed:', fallbackError);
          return [];
        }
      }

      console.error('❌ Error getting quiz history:', error);
      return [];
    }
  }

  // Get quiz statistics
  async function getQuizStatistics() {
    if (!currentUser) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data() || {};
      
      return {
        totalQuizzes: userData.totalQuizzes || 0,
        totalQuizQuestions: userData.totalQuizQuestions || 0,
        totalCorrectAnswers: userData.totalCorrectAnswers || 0,
        averageScore: userData.totalQuizQuestions > 0 
          ? ((userData.totalCorrectAnswers / userData.totalQuizQuestions) * 100).toFixed(2)
          : 0,
        lastQuizDate: userData.lastQuizDate?.toDate()
      };
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        console.warn('⚠️ Quiz statistics permission denied. Returning empty stats.');
        return {
          totalQuizzes: 0,
          totalQuizQuestions: 0,
          totalCorrectAnswers: 0,
          averageScore: 0,
          lastQuizDate: null
        };
      }
      console.error('❌ Error getting quiz statistics:', error);
      return null;
    }
  }

  // Update user's auth profile and Firestore user document
  async function updateProfileDetails({ displayName, photoURL }) {
    if (!currentUser) return null;

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName || auth.currentUser.displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });

      // Update Firestore users document (merge to preserve other fields)
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          displayName: displayName || auth.currentUser.displayName,
          photoURL: photoURL || auth.currentUser.photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Refresh local currentUser state
      setCurrentUser(auth.currentUser);

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  // Update chat title
  async function updateChatTitle(chatId, title) {
    if (!currentUser) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        title: title,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  // Delete chat and all its messages
  async function deleteChat(chatId) {
    if (!currentUser) return;

    try {
      // First delete all messages in the chat
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('userId', '==', currentUser.uid)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Then delete the chat document
      await deleteDoc(doc(db, 'chats', chatId));
      
      // Trigger dashboard refresh
      window.dispatchEvent(new Event('refreshDashboard'));
      console.log('Dashboard refresh triggered after chat deletion');
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // Update message count for chat
  async function updateChatMessageCount(chatId, increment = 1) {
    if (!currentUser) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const currentCount = chatDoc.data().messageCount || 0;
        await updateDoc(chatRef, {
          messageCount: currentCount + increment,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating chat message count:', error);
    }
  }

  // ===== PYQ Practice - Starred Questions (user-scoped) =====
  async function getStarredPyqQuestions() {
    if (!currentUser) return [];

    try {
      const starredRef = collection(db, 'users', currentUser.uid, 'starredPyqs');
      const snapshot = await getDocs(starredRef);
      const starred = [];

      snapshot.forEach((starredDoc) => {
        const data = starredDoc.data();
        starred.push({
          id: String(data?.id || starredDoc.id),
          ...data,
        });
      });

      return starred;
    } catch (error) {
      console.error('Error getting starred PYQs:', error);
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Firestore permission denied for starred PYQs. Falling back to local cache.');
        return readLocalStarredPyqs();
      }
      return [];
    }
  }

  async function saveStarredPyqQuestion(question, questionId = null) {
    const resolvedId = String(questionId || question?.id || '').trim();
    if (!currentUser || !resolvedId) return false;

    try {
      const starredDocRef = doc(db, 'users', currentUser.uid, 'starredPyqs', resolvedId);
      await setDoc(starredDocRef, {
        ...question,
        id: resolvedId,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving starred PYQ:', error);
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Firestore permission denied for saving starred PYQ. Saving locally only.');
        const existing = readLocalStarredPyqs();
        const map = {};
        existing.forEach((item) => {
          const id = String(item?.id || '').trim();
          if (id) map[id] = item;
        });
        map[resolvedId] = {
          ...question,
          id: resolvedId,
          userId: currentUser.uid,
          updatedAt: new Date().toISOString(),
          localOnly: true,
        };
        return writeLocalStarredPyqs(Object.values(map));
      }
      return false;
    }
  }

  async function removeStarredPyqQuestion(questionId) {
    const resolvedId = String(questionId || '').trim();
    if (!currentUser || !resolvedId) return false;

    try {
      const starredDocRef = doc(db, 'users', currentUser.uid, 'starredPyqs', resolvedId);
      await deleteDoc(starredDocRef);
      return true;
    } catch (error) {
      console.error('Error removing starred PYQ:', error);
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Firestore permission denied for removing starred PYQ. Removing from local cache only.');
        const existing = readLocalStarredPyqs();
        const next = existing.filter((item) => String(item?.id || '').trim() !== resolvedId);
        return writeLocalStarredPyqs(next);
      }
      return false;
    }
  }

  async function clearAllStarredPyqQuestions() {
    if (!currentUser) return false;

    try {
      const starredRef = collection(db, 'users', currentUser.uid, 'starredPyqs');
      const snapshot = await getDocs(starredRef);
      const deletePromises = snapshot.docs.map((starredDoc) => deleteDoc(starredDoc.ref));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error clearing starred PYQs:', error);
      return false;
    }
  }

  // Helper to sanitize Firestore field keys
  function makeSafeFirestoreKey(rawId) {
    return String(rawId || '')
      .replace(/[./\\~*\[\]]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 150);
  }

  // ===== User Practice Answers (Cross-device sync under users/{uid}) =====
  async function saveUserPracticeAnswer(param1, param2) {
    if (!currentUser) return false;

    let questionId = null;
    let selectedOption = null;
    let isCorrect = null;
    let extra = {};

    if (param1 && typeof param1 === 'object') {
      questionId = param1.questionId || param1.id;
      selectedOption = param1.selectedOption;
      isCorrect = param1.isCorrect;
      extra = param1;
    } else {
      questionId = param1;
      selectedOption = param2;
    }

    if (!questionId || selectedOption === undefined) return false;

    const safeKey = makeSafeFirestoreKey(questionId);
    const answerPayload = isCorrect !== null && isCorrect !== undefined
      ? { selectedOption, isCorrect, timestamp: Date.now() }
      : selectedOption;

    try {
      // 1. Update users/{uid} document with practiceAnswers map
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        practiceAnswers: {
          [safeKey]: answerPayload
        },
        lastPracticeAt: serverTimestamp()
      }, { merge: true });

      // 2. Also save into users/{uid}/practiceAnswers/{safeKey} subcollection for persistence
      try {
        const answerDocRef = doc(db, 'users', currentUser.uid, 'practiceAnswers', safeKey);
        const subcollData = sanitizeForFirestore({
          questionId: String(questionId),
          safeKey: safeKey,
          selectedOption: selectedOption,
          isCorrect: isCorrect,
          examName: extra.examName || null,
          subject: extra.subject || null,
          updatedAt: serverTimestamp()
        });
        await setDoc(answerDocRef, subcollData, { merge: true });
      } catch (subErr) {
        console.warn('Subcollection answer write notice:', subErr);
      }

      return true;
    } catch (error) {
      console.warn('⚠️ Could not sync practice answer to user doc:', error);
      // Fallback: try practiceData subdoc
      try {
        const fallbackRef = doc(db, 'users', currentUser.uid, 'practiceData', 'answers');
        await setDoc(fallbackRef, {
          [safeKey]: selectedOption,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
      } catch (err2) {
        console.warn('⚠️ Fallback cloud sync failed:', err2);
        return false;
      }
    }
  }

  async function getUserPracticeAnswers() {
    if (!currentUser) return {};

    const answers = {};

    // 1. Read from users/{uid} document (fastest)
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData?.practiceAnswers && typeof userData.practiceAnswers === 'object') {
          Object.entries(userData.practiceAnswers).forEach(([k, v]) => {
            answers[k] = typeof v === 'object' && v !== null ? v.selectedOption : v;
          });
        }
      }
    } catch (e) {
      console.warn('Could not read practice answers from user document:', e);
    }

    // 2. Read from users/{uid}/practiceData/answers subdoc
    try {
      const practiceDataRef = doc(db, 'users', currentUser.uid, 'practiceData', 'answers');
      const pSnap = await getDoc(practiceDataRef);
      if (pSnap.exists()) {
        const pData = pSnap.data();
        Object.entries(pData).forEach(([k, v]) => {
          if (k !== 'updatedAt') {
            answers[k] = typeof v === 'object' && v !== null ? v.selectedOption : v;
          }
        });
      }
    } catch (e) {
      // Ignored
    }

    // 3. Read from users/{uid}/practiceAnswers subcollection
    try {
      const collRef = collection(db, 'users', currentUser.uid, 'practiceAnswers');
      const snap = await getDocs(collRef);
      snap.forEach((docItem) => {
        const data = docItem.data();
        const qId = data.questionId || docItem.id;
        if (qId && data.selectedOption !== undefined) {
          answers[qId] = data.selectedOption;
          answers[docItem.id] = data.selectedOption;
        }
      });
    } catch (e) {
      // Harmless if subcollection doesn't exist
    }

    return answers;
  }

  // Migrate guest data (chats, messages, and starred PYQs) from localStorage to Firebase
  async function migrateGuestDataToFirebase(user) {
    if (!user) return;
    const uid = user.uid;

    // 1. Migrate Guest Chats and Messages
    const guestChatsRaw = localStorage.getItem('guestChatHistory');
    if (guestChatsRaw) {
      try {
        const guestChats = JSON.parse(guestChatsRaw);
        if (Array.isArray(guestChats) && guestChats.length > 0) {
          console.log(`⏳ Migrating ${guestChats.length} guest chats to Firebase...`);
          for (const chat of guestChats) {
            // Create chat document in 'chats' collection
            const chatRef = await addDoc(collection(db, 'chats'), {
              title: chat.title || 'New Chat',
              userId: uid,
              createdAt: chat.createdAt ? new Date(chat.createdAt) : serverTimestamp(),
              lastUpdatedAt: chat.updatedAt ? new Date(chat.updatedAt) : serverTimestamp(),
              messageCount: chat.messageCount || (chat.messages || []).length
            });

            // Create message documents in 'messages' collection
            if (Array.isArray(chat.messages) && chat.messages.length > 0) {
              for (const msg of chat.messages) {
                await addDoc(collection(db, 'messages'), {
                  chatId: chatRef.id,
                  content: msg.content || '',
                  type: msg.type || 'user', // 'user' or 'bot'
                  senderId: msg.type === 'user' ? uid : 'bot',
                  timestamp: msg.timestamp ? new Date(msg.timestamp) : serverTimestamp(),
                  sources: msg.sources || []
                });
              }
            }
          }
          // Clear guest chat history from localStorage
          localStorage.removeItem('guestChatHistory');
          console.log('✅ Guest chats successfully migrated to Firebase.');
        }
      } catch (error) {
        console.error('❌ Error migrating guest chats to Firebase:', error);
      }
    }

    // 2. Migrate Starred PYQs
    const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions';
    const guestStarredRaw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY);
    if (guestStarredRaw) {
      try {
        const guestStarred = JSON.parse(guestStarredRaw);
        if (Array.isArray(guestStarred) && guestStarred.length > 0) {
          console.log(`⏳ Migrating ${guestStarred.length} guest starred PYQs to Firebase...`);
          for (const item of guestStarred) {
            const resolvedId = String(item?.id || '').trim();
            if (resolvedId) {
              const starredDocRef = doc(db, 'users', uid, 'starredPyqs', resolvedId);
              await setDoc(starredDocRef, {
                ...item,
                userId: uid,
                updatedAt: serverTimestamp()
              });
            }
          }
          // Clear local starred PYQs
          localStorage.removeItem(STARRED_PYQ_LOCAL_STORAGE_KEY);
          console.log('✅ Guest starred PYQs successfully migrated to Firebase.');
        }
      } catch (error) {
        console.error('❌ Error migrating guest starred PYQs to Firebase:', error);
      }
    }

    // 3. Migrate Guest Paper Practice History
    const guestPaperRaw = localStorage.getItem('pyqPaperPracticeHistory');
    if (guestPaperRaw) {
      try {
        const guestPapers = JSON.parse(guestPaperRaw);
        if (Array.isArray(guestPapers) && guestPapers.length > 0) {
          console.log(`⏳ Migrating ${guestPapers.length} guest paper practice records to Firebase...`);
          for (const paper of guestPapers) {
            const safeId = paper.id || `paper_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const paperDocRef = doc(db, 'users', uid, 'paperPracticeHistory', safeId);
            await setDoc(paperDocRef, {
              ...paper,
              userId: uid,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
          console.log('✅ Guest paper practice history successfully migrated.');
        }
      } catch (error) {
        console.error('❌ Error migrating guest paper practice history to Firebase:', error);
      }
    }
  }

  // ===== Save & Get Paper Practice History (Year-Wise PYQ Practice Breakdown) =====
  async function savePaperPracticeReport(reportData) {
    if (!reportData) return false;

    const reportId = reportData.id || `paper_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullReport = {
      ...reportData,
      id: reportId,
      timestamp: reportData.timestamp || Date.now(),
      createdAt: new Date().toISOString()
    };

    // 1. Always save in localStorage for instant offline & guest access
    try {
      const localRaw = localStorage.getItem('pyqPaperPracticeHistory');
      const list = localRaw ? JSON.parse(localRaw) : [];
      const updatedList = [fullReport, ...list.filter(item => item.id !== reportId)];
      localStorage.setItem('pyqPaperPracticeHistory', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Could not save paper report to localStorage:', e);
    }

    // 2. Save in Firestore if logged in
    if (currentUser?.uid) {
      try {
        const paperDocRef = doc(db, 'users', currentUser.uid, 'paperPracticeHistory', reportId);
        await setDoc(paperDocRef, {
          ...fullReport,
          userId: currentUser.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('⚠️ Could not save paper practice history to Firestore:', err);
      }
    }

    // Dispatch global event so Dashboard updates in real time
    window.dispatchEvent(new CustomEvent('paperPracticeUpdated', { detail: fullReport }));
    return true;
  }

  async function getPaperPracticeHistory() {
    let list = [];

    // If logged in, fetch from Firestore
    if (currentUser?.uid) {
      try {
        const collRef = collection(db, 'users', currentUser.uid, 'paperPracticeHistory');
        const q = query(collRef, orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (err) {
        console.warn('Firestore fetch for paperPracticeHistory fallback to local:', err);
      }
    }

    // Fallback/merge with localStorage
    try {
      const localRaw = localStorage.getItem('pyqPaperPracticeHistory');
      if (localRaw) {
        const localList = JSON.parse(localRaw);
        if (Array.isArray(localList)) {
          const map = new Map();
          list.forEach(item => map.set(item.id, item));
          localList.forEach(item => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          list = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
      }
    } catch (e) {
      console.warn('Error reading paper practice history from localStorage:', e);
    }

    return list;
  }

  useEffect(() => {
    let unsubscribeSync = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSync) {
        unsubscribeSync();
        unsubscribeSync = null;
      }

      setCurrentUser(user);
      setLoading(false);

      if (user) {
        migrateGuestDataToFirebase(user);
      }

      if (!user) return;

      const lastSignInMs = user.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).getTime()
        : Date.now();

      unsubscribeSync = onSnapshot(getAuthSyncRef(user.uid), async (snapshot) => {
        const data = snapshot.data();
        if (!data || data.loggedIn !== false) return;

        const updatedAtMs = data?.updatedAt?.toMillis?.() || 0;
        if (updatedAtMs >= lastSignInMs - 5000 && auth.currentUser) {
          await signOut(auth);
        }
      });
    });

    // Handle redirect result for Google login
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          
          // Check if user document exists, if not create it
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              totalChats: 0,
              totalQueries: 0,
              provider: 'google'
            });
          }

          await updateAuthSyncState(user.uid, true);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    handleRedirectResult();

    return () => {
      unsubscribe();
      if (unsubscribeSync) unsubscribeSync();
    };
  }, []);

  // Handle Firebase configuration errors
  useEffect(() => {
    const checkFirebaseConfig = async () => {
      try {
        if (!auth.app) {
          throw new Error('Firebase not properly configured');
        }
      } catch (error) {
        console.error('Firebase configuration error:', error);
        // Could show a notification to user about configuration issue
      }
    };
    
    checkFirebaseConfig();
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    createNewChat,
    saveMessage,
    getChatHistory,
    getChatMessages,
    updateUserStats,
    updateChatTitle,
    deleteChat,
    updateChatMessageCount,
    saveDashboardStats,
    getDashboardStats,
    trackUserInteraction,
    trackSubjectInteraction,
    saveSubjectStats,
    getSubjectStats,
    getRecentActivity,
    saveAchievement,
    getUserAchievements,
    saveLearningGoal,
    getUserLearningGoals,
    updateLearningGoalProgress,
    updateProfileDetails,
    saveQuizResult,
    getUserQuizHistory,
    getQuizStatistics,
    getStarredPyqQuestions,
    saveStarredPyqQuestion,
    removeStarredPyqQuestion,
    clearAllStarredPyqQuestions,
    saveUserPracticeAnswer,
    getUserPracticeAnswers,
    savePaperPracticeReport,
    getPaperPracticeHistory,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
