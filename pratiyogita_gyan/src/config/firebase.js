// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config or use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAr58e4xF48oqB_CxQ9GZDqgIEVGN_17d0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pratiyogita-gyan.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pratiyogita-gyan",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pratiyogita-gyan.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "593475930652",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:593475930652:web:89ebb82f08fd45e2b0add9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6S0RS484JY"
};

// Validate Firebase configuration in production
if (import.meta.env.PROD) {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => 
    !firebaseConfig[key] || firebaseConfig[key].startsWith('your-')
  );
  
  if (missingKeys.length > 0) {
    const errorMsg = `Firebase configuration incomplete. Missing: ${missingKeys.join(', ')}. ` +
      'Please set VITE_FIREBASE_* environment variables in Vercel settings.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
}

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Use modern bounded local cache (5MB limit) instead of deprecated unbounded IndexedDB
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: 5 * 1024 * 1024 // 5 MB maximum cache limit
    })
  });
  
  if (import.meta.env.DEV) {
    console.log('✅ Firebase initialized successfully for project:', firebaseConfig.projectId);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Fallback to standard getFirestore if initializeFirestore already called
  db = getFirestore(app);
}

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔧 Connected to Firebase emulators');
}

export { auth, db };
export default app;
