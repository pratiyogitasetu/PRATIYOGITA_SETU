import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmsjQj0rGHp6kPCfimBCcRkynChhY7apw",
  authDomain: "pratiyogita-yogya.firebaseapp.com",
  projectId: "pratiyogita-yogya",
  storageBucket: "pratiyogita-yogya.firebasestorage.app",
  messagingSenderId: "1055617472744",
  appId: "1:1055617472744:web:ca1db5bc62e4ed7888115d",
  measurementId: "G-4X5QQ686VH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
