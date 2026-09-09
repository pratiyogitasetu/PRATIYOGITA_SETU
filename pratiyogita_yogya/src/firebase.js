import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAr58e4xF48oqB_CxQ9GZDqgIEVGN_17d0",
  authDomain: "pratiyogita-gyan.firebaseapp.com",
  projectId: "pratiyogita-gyan",
  storageBucket: "pratiyogita-gyan.firebasestorage.app",
  messagingSenderId: "593475930652",
  appId: "1:593475930652:web:89ebb82f08fd45e2b0add9",
  measurementId: "G-6S0RS484JY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
