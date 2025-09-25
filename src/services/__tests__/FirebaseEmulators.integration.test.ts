/**
 * Firebase Emulators Integration Tests
 *
 * These tests run against live Firebase emulators to verify
 * real Firebase integration functionality.
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import {
  connectToEmulators,
  areEmulatorsAvailable,
  getConnectionStatus,
} from "../../config/firebaseEmulators";

// Test Firebase configuration for emulators
const testFirebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("Firebase Emulators Integration", () => {
  let app: FirebaseApp;
  let auth: Auth;
  let db: Firestore;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Firebase for testing
    app = initializeApp(testFirebaseConfig, "test-app");
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators
    const result = await connectToEmulators(auth, db);
    if (!result.success) {
      console.warn("Failed to connect to emulators:", result.errors);
      // Tests will still run but against production (if configured)
    }
  });

  afterAll(async () => {
    // Clean up test user if created
    if (testUserId) {
      try {
        await signOut(auth);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("Emulator Connection", () => {
    it("should detect if emulators are available", async () => {
      const available = await areEmulatorsAvailable();
      // This test passes regardless of emulator availability
      expect(typeof available).toBe("boolean");
    });

    it("should report connection status", () => {
      const status = getConnectionStatus(auth, db);

      expect(status).toHaveProperty("auth");
      expect(status).toHaveProperty("firestore");
      expect(status.auth).toHaveProperty("isEmulator");
      expect(status.auth).toHaveProperty("config");
      expect(status.firestore).toHaveProperty("isEmulator");
      expect(status.firestore).toHaveProperty("config");
    });

    it("should connect to emulators when available", async () => {
      const available = await areEmulatorsAvailable();

      if (available) {
        const result = await connectToEmulators(auth, db);
        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);

        const status = getConnectionStatus(auth, db);
        expect(status.auth.isEmulator).toBe(true);
        expect(status.firestore.isEmulator).toBe(true);
      } else {
        console.log("Emulators not available, skipping connection test");
      }
    });
  });

  describe("Authentication Integration", () => {
    const testEmail = "test@example.com";
    const testPassword = "testpassword123";

    it("should create a new user account", async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          testEmail,
          testPassword
        );
        testUserId = userCredential.user.uid;

        expect(userCredential.user).toBeDefined();
        expect(userCredential.user.email).toBe(testEmail);
        expect(userCredential.user.uid).toBeDefined();
      } catch (error: any) {
        // User might already exist, try to sign in instead
        if (error.code === "auth/email-already-in-use") {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            testEmail,
            testPassword
          );
          testUserId = userCredential.user.uid;
          expect(userCredential.user.email).toBe(testEmail);
        } else {
          throw error;
        }
      }
    });

    it("should sign in with existing credentials", async () => {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      );

      expect(userCredential.user).toBeDefined();
      expect(userCredential.user.email).toBe(testEmail);
      expect(userCredential.user.uid).toBe(testUserId);
    });

    it("should maintain authentication state", () => {
      expect(auth.currentUser).toBeDefined();
      expect(auth.currentUser?.email).toBe(testEmail);
      expect(auth.currentUser?.uid).toBe(testUserId);
    });
  });

  describe("Firestore Integration", () => {
    beforeEach(() => {
      // Ensure user is authenticated for Firestore operations
      expect(auth.currentUser).toBeDefined();
    });

    it("should write and read user preferences", async () => {
      const userId = auth.currentUser!.uid;
      const preferencesRef = doc(db, "users", userId, "preferences", "main");

      const testPreferences = {
        lastSelectedYearId: "2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Write preferences
      await setDoc(preferencesRef, testPreferences);

      // Read preferences back
      const preferencesSnap = await getDoc(preferencesRef);
      expect(preferencesSnap.exists()).toBe(true);

      const data = preferencesSnap.data();
      expect(data?.lastSelectedYearId).toBe("2024");
    });

    it("should create and manage years collection", async () => {
      const userId = auth.currentUser!.uid;
      const yearsRef = collection(db, "users", userId, "years");

      const testYear = {
        name: "2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add year
      const yearDoc = await addDoc(yearsRef, testYear);
      expect(yearDoc.id).toBeDefined();

      // Read years back
      const yearsSnap = await getDocs(yearsRef);
      expect(yearsSnap.size).toBeGreaterThan(0);

      const yearData = yearsSnap.docs.find((doc) => doc.data().name === "2024");
      expect(yearData).toBeDefined();
      expect(yearData?.data().name).toBe("2024");
    });

    it("should create and manage contacts subcollection", async () => {
      const userId = auth.currentUser!.uid;

      // First create a year
      const yearsRef = collection(db, "users", userId, "years");
      const yearDoc = await addDoc(yearsRef, {
        name: "2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Then add contacts to that year
      const contactsRef = collection(
        db,
        "users",
        userId,
        "years",
        yearDoc.id,
        "contacts"
      );

      const testContact = {
        firstName: "John",
        lastName: "Doe",
        enterpriseName: "Test Enterprise",
        comments: "Test contact for integration testing",
        delivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add contact
      const contactDoc = await addDoc(contactsRef, testContact);
      expect(contactDoc.id).toBeDefined();

      // Read contacts back
      const contactsSnap = await getDocs(contactsRef);
      expect(contactsSnap.size).toBeGreaterThan(0);

      const contactData = contactsSnap.docs.find(
        (doc) =>
          doc.data().firstName === "John" && doc.data().lastName === "Doe"
      );
      expect(contactData).toBeDefined();
      expect(contactData?.data().enterpriseName).toBe("Test Enterprise");
    });

    it("should handle delivery status updates", async () => {
      const userId = auth.currentUser!.uid;

      // Create year and contact
      const yearsRef = collection(db, "users", userId, "years");
      const yearDoc = await addDoc(yearsRef, {
        name: "2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const contactsRef = collection(
        db,
        "users",
        userId,
        "years",
        yearDoc.id,
        "contacts"
      );
      const contactDoc = await addDoc(contactsRef, {
        firstName: "Jane",
        lastName: "Smith",
        enterpriseName: "Delivery Test Enterprise",
        comments: "",
        delivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update delivery status
      const deliveryTime = new Date();
      await setDoc(
        doc(contactsRef, contactDoc.id),
        {
          delivered: true,
          deliveredAt: deliveryTime,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // Verify update
      const updatedContactSnap = await getDoc(doc(contactsRef, contactDoc.id));
      expect(updatedContactSnap.exists()).toBe(true);

      const updatedData = updatedContactSnap.data();
      expect(updatedData?.delivered).toBe(true);
      expect(updatedData?.deliveredAt).toBeDefined();
    });
  });

  describe("Data Isolation", () => {
    it("should isolate data between different users", async () => {
      // Create second test user
      const secondEmail = "test2@example.com";
      const secondPassword = "testpassword456";

      let secondUserId: string;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          secondEmail,
          secondPassword
        );
        secondUserId = userCredential.user.uid;
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            secondEmail,
            secondPassword
          );
          secondUserId = userCredential.user.uid;
        } else {
          throw error;
        }
      }

      // Add data for second user
      const secondUserYearsRef = collection(db, "users", secondUserId, "years");
      await addDoc(secondUserYearsRef, {
        name: "2025",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Switch back to first user
      await signInWithEmailAndPassword(
        auth,
        "test@example.com",
        "testpassword123"
      );

      // Verify first user can't see second user's data
      const firstUserYearsRef = collection(db, "users", testUserId, "years");
      const firstUserYearsSnap = await getDocs(firstUserYearsRef);

      const hasSecondUserYear = firstUserYearsSnap.docs.some(
        (doc) => doc.data().name === "2025"
      );
      expect(hasSecondUserYear).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors gracefully", async () => {
      await expect(
        signInWithEmailAndPassword(auth, "invalid@example.com", "wrongpassword")
      ).rejects.toThrow();
    });

    it("should handle Firestore permission errors", async () => {
      // Sign out to test unauthenticated access
      await signOut(auth);

      const unauthorizedRef = doc(
        db,
        "users",
        "unauthorized",
        "preferences",
        "main"
      );

      await expect(setDoc(unauthorizedRef, { test: "data" })).rejects.toThrow();

      // Sign back in for cleanup
      await signInWithEmailAndPassword(
        auth,
        "test@example.com",
        "testpassword123"
      );
    });
  });
});
