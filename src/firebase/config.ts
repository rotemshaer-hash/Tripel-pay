import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// The Firebase project is still named triplepay-prod, from before the product was
// renamed to Work It. That is deliberate: it is a real infrastructure id holding real
// accounts, and "renaming" it means migrating to a new project and losing the data —
// it is not a text edit. Never point this at Drushe's project (kidemy-83a17) either.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtXCf1yM7I45qeskazLsxUFDniq5X2deQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "triplepay-prod.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://triplepay-prod-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "triplepay-prod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "triplepay-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "764749021722",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:764749021722:web:a78361dac9b8d059e287a3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZKW8SKK0YH",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);
export const storage = getStorage(firebaseApp);

// When running against the local Firebase Emulator Suite (npm run emulators),
// point the SDK at the emulators instead of a real project.
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
