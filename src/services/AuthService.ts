import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { User, AuthService, AuthenticationError } from "../types";

class AuthServiceImpl implements AuthService {
  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update the user profile with email as display name if not set
      if (!firebaseUser.displayName) {
        await updateProfile(firebaseUser, {
          displayName: email.split("@")[0],
        });
      }

      return this.mapFirebaseUserToUser(firebaseUser);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: unknown) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    return this.mapFirebaseUserToUser(firebaseUser);
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(this.mapFirebaseUserToUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  }

  /**
   * Map Firebase User to our User interface
   */
  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      createdAt: firebaseUser.metadata.creationTime
        ? new Date(firebaseUser.metadata.creationTime)
        : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime
        ? new Date(firebaseUser.metadata.lastSignInTime)
        : new Date(),
    };
  }

  /**
   * Handle Firebase authentication errors and convert to our error types
   */
  private handleAuthError(error: unknown): AuthenticationError {
    let message = "An authentication error occurred";

    // Type guard to check if error has the expected structure
    const isFirebaseError = (
      err: unknown
    ): err is { code: string; message?: string } => {
      return typeof err === "object" && err !== null && "code" in err;
    };

    const code = isFirebaseError(error) ? error.code : "unknown";

    switch (code) {
      case "auth/user-not-found":
        message = "No account found with this email address";
        break;
      case "auth/wrong-password":
        message = "Incorrect password";
        break;
      case "auth/email-already-in-use":
        message = "An account with this email already exists";
        break;
      case "auth/weak-password":
        message = "Password should be at least 6 characters";
        break;
      case "auth/invalid-email":
        message = "Please enter a valid email address";
        break;
      case "auth/user-disabled":
        message = "This account has been disabled";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your connection";
        break;
      case "auth/invalid-credential":
        message = "Invalid email or password";
        break;
      default:
        // For errors without codes or unknown codes, use the original message if available
        if (isFirebaseError(error) && error.message) {
          message = error.message;
        } else if (error instanceof Error && error.message) {
          message = error.message;
        }
    }

    return new AuthenticationError(message, code, { originalError: error });
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();
export default authService;
