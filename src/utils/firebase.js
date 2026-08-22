import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Paste your Firebase Credentials inside the fallback strings below.
// This allows you to configure your database without Vercel Environment Variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDXT6MoLrqLEuvdBaZmyfQOasMkJlrCRcM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bit-practice-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bit-practice-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bit-practice-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "55091853237",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:55091853237:web:dd0f2a683418b1dbfd483c"
};

let db = null;
const isConfigured = firebaseConfig.projectId && firebaseConfig.projectId.trim() !== "";

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.warn("Firebase credentials are not set. The portal is running in offline LocalStorage mode.");
}

export { db, isConfigured };
