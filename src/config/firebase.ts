import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import type { Database } from 'firebase/database';

// Firebase configuration using Vite environment variables with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCricketPulseMockKeyForLocalDev',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cricpulse-cricket-app.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://cricpulse-cricket-app-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cricpulse-cricket-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cricpulse-cricket-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcd1234efgh5678',
};

// Singleton App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Realtime Database Instance
export const db: Database = getDatabase(app);

// Check if actual custom credentials have been supplied by user
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_DATABASE_URL
);

// Connection status listener helper
export const subscribeConnectionStatus = (onStatusChange: (connected: boolean) => void) => {
  const connectedRef = ref(db, '.info/connected');
  return onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    onStatusChange(isConnected);
  });
};

export default db;
