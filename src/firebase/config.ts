import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// Placeholder config — replace with your own Firebase project's values
// (Firebase Console → Project settings → General → "Your apps" → SDK setup and configuration).
// This is a SEPARATE project from Drushe's (kidemy-83a17) — never point Triple Pay at that project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REPLACE_ME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "REPLACE_ME.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://REPLACE_ME-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "REPLACE_ME",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "REPLACE_ME.firebasestorage.app",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);

// When running against the local Firebase Emulator Suite (npm run emulators),
// point the SDK at the emulators instead of a real project.
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
}
