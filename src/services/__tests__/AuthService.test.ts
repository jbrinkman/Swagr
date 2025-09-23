import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { authService } from "../AuthService";
import { AuthenticationError } from "../../types";

// Mock Firebase Auth
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

// Mock Firebase config
jest.mock("../../config/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

const mockSignInWithEmailAndPassword =
  signInWithEmailAndPassword as jest.MockedFunction<
    typeof signInWithEmailAndPassword
  >;
const mockCreateUserWithEmailAndPassword =
  createUserWithEmailAndPassword as jest.MockedFunction<
    typeof createUserWithEmailAndPassword
  >;
const mockFirebaseSignOut = firebaseSignOut as jest.MockedFunction<
  typeof firebaseSignOut
>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<
  typeof onAuthStateChanged
>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<
  typeof updateProfile
>;

describe("AuthService", () => {
  const mockFirebaseUser = {
    uid: "test-uid",
    email: "test@example.com",
    displayName: "Test User",
    metadata: {
      creationTime: "2024-01-01T00:00:00.000Z",
      lastSignInTime: "2024-01-01T00:00:00.000Z",
    },
  };

  const expectedUser = {
    uid: "test-uid",
    email: "test@example.com",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    lastLoginAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signIn", () => {
    it("should sign in user successfully", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      } as any);

      const result = await authService.signIn("test@example.com", "password");

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password"
      );
      expect(result).toEqual(expectedUser);
    });

    it("should throw AuthenticationError for invalid credentials", async () => {
      const firebaseError = {
        code: "auth/invalid-credential",
        message: "Invalid credentials",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("test@example.com", "wrongpassword")
      ).rejects.toThrow(AuthenticationError);

      await expect(
        authService.signIn("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw AuthenticationError for user not found", async () => {
      const firebaseError = {
        code: "auth/user-not-found",
        message: "User not found",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("nonexistent@example.com", "password")
      ).rejects.toThrow("No account found with this email address");
    });

    it("should throw AuthenticationError for network errors", async () => {
      const firebaseError = {
        code: "auth/network-request-failed",
        message: "Network error",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("test@example.com", "password")
      ).rejects.toThrow("Network error. Please check your connection");
    });
  });

  describe("signUp", () => {
    it("should sign up user successfully", async () => {
      const mockUserWithoutDisplayName = {
        ...mockFirebaseUser,
        displayName: null,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockUserWithoutDisplayName,
      } as any);
      mockUpdateProfile.mockResolvedValue(undefined);

      const result = await authService.signUp("test@example.com", "password");

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password"
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockUserWithoutDisplayName,
        { displayName: "test" }
      );
      expect(result).toEqual({
        ...expectedUser,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        lastLoginAt: new Date("2024-01-01T00:00:00.000Z"),
      });
    });

    it("should not update profile if displayName already exists", async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      } as any);

      await authService.signUp("test@example.com", "password");

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("should throw AuthenticationError for email already in use", async () => {
      const firebaseError = {
        code: "auth/email-already-in-use",
        message: "Email already in use",
      };
      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signUp("existing@example.com", "password")
      ).rejects.toThrow("An account with this email already exists");
    });

    it("should throw AuthenticationError for weak password", async () => {
      const firebaseError = {
        code: "auth/weak-password",
        message: "Weak password",
      };
      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signUp("test@example.com", "123")
      ).rejects.toThrow("Password should be at least 6 characters");
    });

    it("should throw AuthenticationError for invalid email", async () => {
      const firebaseError = {
        code: "auth/invalid-email",
        message: "Invalid email",
      };
      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signUp("invalid-email", "password")
      ).rejects.toThrow("Please enter a valid email address");
    });
  });

  describe("signOut", () => {
    it("should sign out user successfully", async () => {
      mockFirebaseSignOut.mockResolvedValue(undefined);

      await authService.signOut();

      expect(mockFirebaseSignOut).toHaveBeenCalledWith(expect.anything());
    });

    it("should throw AuthenticationError on sign out failure", async () => {
      const firebaseError = {
        code: "auth/network-request-failed",
        message: "Network error",
      };
      mockFirebaseSignOut.mockRejectedValue(firebaseError);

      await expect(authService.signOut()).rejects.toThrow(
        "Network error. Please check your connection"
      );
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user when authenticated", () => {
      // Mock the auth.currentUser
      const mockAuth = require("../../config/firebase").auth;
      mockAuth.currentUser = mockFirebaseUser;

      const result = authService.getCurrentUser();

      expect(result).toEqual(expectedUser);
    });

    it("should return null when not authenticated", () => {
      const mockAuth = require("../../config/firebase").auth;
      mockAuth.currentUser = null;

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("onAuthStateChanged", () => {
    it("should call callback with user when authenticated", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockFirebaseUser);
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expectedUser);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("should call callback with null when not authenticated", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const unsubscribe = authService.onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe("error handling", () => {
    it("should handle unknown error codes", async () => {
      const firebaseError = {
        code: "auth/unknown-error",
        message: "Unknown error occurred",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("test@example.com", "password")
      ).rejects.toThrow("Unknown error occurred");
    });

    it("should handle errors without codes", async () => {
      const firebaseError = new Error("Generic error");
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("test@example.com", "password")
      ).rejects.toThrow("Generic error");
    });

    it("should handle too many requests error", async () => {
      const firebaseError = {
        code: "auth/too-many-requests",
        message: "Too many requests",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("test@example.com", "password")
      ).rejects.toThrow("Too many failed attempts. Please try again later");
    });

    it("should handle user disabled error", async () => {
      const firebaseError = {
        code: "auth/user-disabled",
        message: "User disabled",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(
        authService.signIn("test@example.com", "password")
      ).rejects.toThrow("This account has been disabled");
    });
  });
});
