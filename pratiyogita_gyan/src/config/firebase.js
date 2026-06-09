// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config or use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined
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
  db = getFirestore(app);
  
  if (import.meta.env.DEV) {
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Re-throw with more context
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔧 Connected to Firebase emulators');
}

// Enable persistence for offline support
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Firestore persistence failed: Multiple tabs open');
    }
  } else if (err.code === 'unimplemented') {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Firestore persistence not available in this browser');
    }
  }
});

export { auth, db };
export default app;
