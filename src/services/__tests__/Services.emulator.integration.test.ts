/**
 * Services Integration Tests with Firebase Emulators
 *
 * These tests verify that our service classes work correctly
 * with live Firebase emulators.
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import {
  connectToEmulators,
  areEmulatorsAvailable,
} from "../../config/firebaseEmulators";
import authService from "../AuthService";
import firestoreService from "../FirestoreService";
import storageService from "../StorageService";
import { User, Year, Contact } from "../../types";

// Test Firebase configuration
const testFirebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

describe("Services Integration with Emulators", () => {
  let app: FirebaseApp;
  let auth: Auth;
  let db: Firestore;
  // Services are imported as singletons
  let testUser: User | null = null;

  beforeAll(async () => {
    // Initialize Firebase for testing
    app = initializeApp(testFirebaseConfig, "services-test-app");
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators
    const result = await connectToEmulators(auth, db);
    if (!result.success) {
      console.warn("Failed to connect to emulators:", result.errors);
    }

    // Services are already initialized as singletons
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser) {
      try {
        await authService.signOut();
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("AuthService Integration", () => {
    const testEmail = "servicetest@example.com";
    const testPassword = "servicetest123";

    it("should sign up a new user", async () => {
      try {
        testUser = await authService.signUp(testEmail, testPassword);

        expect(testUser).toBeDefined();
        expect(testUser!.email).toBe(testEmail);
        expect(testUser!.uid).toBeDefined();
      } catch (error: any) {
        // User might already exist
        if (error.code === "auth/email-already-in-use") {
          testUser = await authService.signIn(testEmail, testPassword);
          expect(testUser!.email).toBe(testEmail);
        } else {
          throw error;
        }
      }
    });

    it("should sign in existing user", async () => {
      const user = await authService.signIn(testEmail, testPassword);

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.uid).toBe(testUser?.uid);
    });

    it("should get current user", () => {
      const currentUser = authService.getCurrentUser();

      expect(currentUser).toBeDefined();
      expect(currentUser?.email).toBe(testEmail);
      expect(currentUser?.uid).toBe(testUser?.uid);
    });

    it("should handle authentication state changes", (done) => {
      const unsubscribe = authService.onAuthStateChanged((user: any) => {
        expect(user).toBeDefined();
        expect(user?.email).toBe(testEmail);
        unsubscribe();
        done();
      });
    });
  });

  describe("FirestoreService Integration", () => {
    let testYearId: string;
    let testContactId: string;

    beforeEach(() => {
      expect(testUser).toBeDefined();
    });

    describe("Year Management", () => {
      it("should add a new year", async () => {
        const yearData: Omit<Year, "id"> = {
          userId: testUser!.uid,
          name: "2024",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        testYearId = await firestoreService.addYear(testUser!.uid, yearData);

        expect(testYearId).toBeDefined();
        expect(typeof testYearId).toBe("string");
      });

      it("should get years for user", async () => {
        const years = await firestoreService.getYears(testUser!.uid);

        expect(Array.isArray(years)).toBe(true);
        expect(years.length).toBeGreaterThan(0);

        const testYear = years.find((year) => year.id === testYearId);
        expect(testYear).toBeDefined();
        expect(testYear?.name).toBe("2024");
        expect(testYear?.userId).toBe(testUser!.uid);
      });

      it("should update a year", async () => {
        const updates = {
          name: "2024 Updated",
          updatedAt: new Date(),
        };

        await firestoreService.updateYear(testUser!.uid, testYearId, updates);

        const years = await firestoreService.getYears(testUser!.uid);
        const updatedYear = years.find((year) => year.id === testYearId);

        expect(updatedYear?.name).toBe("2024 Updated");
      });
    });

    describe("Contact Management", () => {
      it("should add a new contact", async () => {
        const contactData: Omit<Contact, "id"> = {
          userId: testUser!.uid,
          yearId: testYearId,
          firstName: "John",
          lastName: "Doe",
          enterpriseName: "Test Enterprise",
          comments: "Test contact for integration",
          delivered: false,
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        testContactId = await firestoreService.addContact(
          testUser!.uid,
          testYearId,
          contactData
        );

        expect(testContactId).toBeDefined();
        expect(typeof testContactId).toBe("string");
      });

      it("should get contacts for year", async () => {
        const contacts = await firestoreService.getContacts(
          testUser!.uid,
          testYearId
        );

        expect(Array.isArray(contacts)).toBe(true);
        expect(contacts.length).toBeGreaterThan(0);

        const testContact = contacts.find(
          (contact) => contact.id === testContactId
        );
        expect(testContact).toBeDefined();
        expect(testContact?.firstName).toBe("John");
        expect(testContact?.lastName).toBe("Doe");
        expect(testContact?.enterpriseName).toBe("Test Enterprise");
      });

      it("should update contact delivery status", async () => {
        const deliveryTime = new Date();
        const updates = {
          delivered: true,
          deliveredAt: deliveryTime,
          updatedAt: new Date(),
        };

        await firestoreService.updateContact(
          testUser!.uid,
          testYearId,
          testContactId,
          updates
        );

        const contacts = await firestoreService.getContacts(
          testUser!.uid,
          testYearId
        );
        const updatedContact = contacts.find(
          (contact) => contact.id === testContactId
        );

        expect(updatedContact?.delivered).toBe(true);
        expect(updatedContact?.deliveredAt).toBeDefined();
      });

      it("should update contact comments", async () => {
        const updates = {
          comments: "Updated comments for integration test",
          updatedAt: new Date(),
        };

        await firestoreService.updateContact(
          testUser!.uid,
          testYearId,
          testContactId,
          updates
        );

        const contacts = await firestoreService.getContacts(
          testUser!.uid,
          testYearId
        );
        const updatedContact = contacts.find(
          (contact) => contact.id === testContactId
        );

        expect(updatedContact?.comments).toBe(
          "Updated comments for integration test"
        );
      });

      it("should delete a contact", async () => {
        await firestoreService.deleteContact(
          testUser!.uid,
          testYearId,
          testContactId
        );

        const contacts = await firestoreService.getContacts(
          testUser!.uid,
          testYearId
        );
        const deletedContact = contacts.find(
          (contact) => contact.id === testContactId
        );

        expect(deletedContact).toBeUndefined();
      });
    });

    describe("User Preferences", () => {
      it("should save and retrieve user preferences", async () => {
        const preferences = {
          lastSelectedYearId: testYearId,
        };

        await firestoreService.updateUserPreferences(
          testUser!.uid,
          preferences
        );

        const retrievedPreferences = await firestoreService.getUserPreferences(
          testUser!.uid
        );

        expect(retrievedPreferences.lastSelectedYearId).toBe(testYearId);
        expect(retrievedPreferences.userId).toBe(testUser!.uid);
      });
    });

    describe("Data Cleanup", () => {
      it("should delete the test year", async () => {
        await firestoreService.deleteYear(testUser!.uid, testYearId);

        const years = await firestoreService.getYears(testUser!.uid);
        const deletedYear = years.find((year) => year.id === testYearId);

        expect(deletedYear).toBeUndefined();
      });
    });
  });

  describe("StorageService Integration", () => {
    it("should store and retrieve last selected year", async () => {
      const testYearId = "test-year-2024";

      await storageService.setLastSelectedYear(testYearId);
      const retrievedYearId = await storageService.getLastSelectedYear();

      expect(retrievedYearId).toBe(testYearId);
    });

    it("should handle null values", async () => {
      await storageService.clearStorage();
      const retrievedYearId = await storageService.getLastSelectedYear();

      expect(retrievedYearId).toBeNull();
    });

    it("should clear storage", async () => {
      await storageService.setLastSelectedYear("test-year");
      await storageService.clearStorage();

      const retrievedYearId = await storageService.getLastSelectedYear();
      expect(retrievedYearId).toBeNull();
    });
  });

  describe("Cross-Service Integration", () => {
    it("should handle complete user workflow", async () => {
      // This test simulates a complete user workflow:
      // 1. User signs in
      // 2. Creates a year
      // 3. Adds contacts
      // 4. Updates delivery status
      // 5. Saves preferences

      expect(testUser).toBeDefined();

      // Create year
      const yearData: Omit<Year, "id"> = {
        userId: testUser!.uid,
        name: "Workflow Test 2024",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const yearId = await firestoreService.addYear(testUser!.uid, yearData);

      // Add multiple contacts
      const contacts = [
        {
          firstName: "Alice",
          lastName: "Johnson",
          enterpriseName: "Enterprise A",
        },
        {
          firstName: "Bob",
          lastName: "Smith",
          enterpriseName: "Enterprise B",
        },
      ];

      const contactIds: string[] = [];

      for (const contact of contacts) {
        const contactData: Omit<Contact, "id"> = {
          userId: testUser!.uid,
          yearId,
          ...contact,
          comments: "",
          delivered: false,
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const contactId = await firestoreService.addContact(
          testUser!.uid,
          yearId,
          contactData
        );
        contactIds.push(contactId);
      }

      // Mark first contact as delivered
      await firestoreService.updateContact(
        testUser!.uid,
        yearId,
        contactIds[0],
        {
          delivered: true,
          deliveredAt: new Date(),
          updatedAt: new Date(),
        }
      );

      // Add comment to second contact
      await firestoreService.updateContact(
        testUser!.uid,
        yearId,
        contactIds[1],
        {
          comments: "Follow up needed",
          updatedAt: new Date(),
        }
      );

      // Save preferences
      await firestoreService.updateUserPreferences(testUser!.uid, {
        lastSelectedYearId: yearId,
      });

      await storageService.setLastSelectedYear(yearId);

      // Verify everything was saved correctly
      const savedContacts = await firestoreService.getContacts(
        testUser!.uid,
        yearId
      );
      expect(savedContacts).toHaveLength(2);

      const deliveredContact = savedContacts.find(
        (c) => c.firstName === "Alice"
      );
      expect(deliveredContact?.delivered).toBe(true);
      expect(deliveredContact?.deliveredAt).toBeDefined();

      const commentedContact = savedContacts.find((c) => c.firstName === "Bob");
      expect(commentedContact?.comments).toBe("Follow up needed");

      const preferences = await firestoreService.getUserPreferences(
        testUser!.uid
      );
      expect(preferences.lastSelectedYearId).toBe(yearId);

      const localYearId = await storageService.getLastSelectedYear();
      expect(localYearId).toBe(yearId);

      // Cleanup
      await firestoreService.deleteYear(testUser!.uid, yearId);
    });
  });
});
