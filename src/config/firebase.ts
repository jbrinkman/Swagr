import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

// Firebase configuration
// In production, these should be set via environment variables or Expo config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "your-messaging-sender-id",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

// Validate configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];
  const missingFields = requiredFields.filter(
    (field) =>
      !firebaseConfig[field as keyof typeof firebaseConfig] ||
      firebaseConfig[field as keyof typeof firebaseConfig]
        ?.toString()
        .startsWith("your-")
  );

  if (missingFields.length > 0) {
    console.warn(
      "Firebase configuration incomplete. Missing or placeholder values for:",
      missingFields
    );
    console.warn(
      "Please set proper environment variables or update the configuration."
    );
  }
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Validate configuration
  validateFirebaseConfig();

  // Initialize Firebase app
  app = initializeApp(firebaseConfig);

  // Initialize Firebase Authentication
  auth = getAuth(app);

  // Initialize Cloud Firestore
  db = getFirestore(app);

  // Connect to emulators in development if available
  if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
    try {
      // Connect to Auth emulator (only if not already connected)
      connectAuthEmulator(auth, "http://localhost:9099");

      // Connect to Firestore emulator (only if not already connected)
      connectFirestoreEmulator(db, "localhost", 8080);

      console.log("Connected to Firebase emulators");
    } catch {
      // Emulator connection will throw if already connected or if emulators are not available
      console.log(
        "Firebase emulators not available or already connected, using current configuration"
      );
    }
  }

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw new Error(
    "Failed to initialize Firebase. Please check your configuration."
  );
}

// Export Firebase services
export { auth, db };
export default app;
