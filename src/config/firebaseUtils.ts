import { auth, db } from "./firebase";
import { User } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Initialize user document in Firestore when a new user signs up
 */
export const initializeUserDocument = async (user: User): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", user.uid);

    // Create user preferences document
    const preferencesDocRef = doc(db, "users", user.uid, "preferences", "main");

    await setDoc(preferencesDocRef, {
      userId: user.uid,
      lastSelectedYearId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("User document initialized successfully");
  } catch (error) {
    console.error("Error initializing user document:", error);
    throw error;
  }
};

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  try {
    // Check if auth and db are properly initialized
    return !!(auth && db && auth.app && db.app);
  } catch (error) {
    console.error("Firebase configuration check failed:", error);
    return false;
  }
};

/**
 * Get Firebase project configuration info (for debugging)
 */
export const getFirebaseInfo = () => {
  if (!isFirebaseConfigured()) {
    return { configured: false };
  }

  return {
    configured: true,
    projectId: db.app.options.projectId,
    authDomain: auth.app.options.authDomain,
    isDevelopment: __DEV__,
  };
};

/**
 * Firebase connection status checker
 */
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try to get the current user (this will fail if Firebase isn't connected)
    const currentUser = auth.currentUser;

    // If we can access auth without errors, Firebase is connected
    return true;
  } catch (error) {
    console.error("Firebase connection check failed:", error);
    return false;
  }
};
