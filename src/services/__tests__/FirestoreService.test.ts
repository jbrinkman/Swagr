import { FirestoreService } from "../FirestoreService";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
  PermissionError,
  Year,
  Contact,
  UserPreferences,
} from "../../types";

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  writeBatch: jest.fn(),
  onSnapshot: jest.fn(),
  enableNetwork: jest.fn(),
  disableNetwork: jest.fn(),
}));

// Mock Firebase config
jest.mock("../../config/firebase", () => ({
  db: {},
}));

describe("FirestoreService", () => {
  let firestoreService: FirestoreService;
  const mockUserId = "test-user-id";
  const mockYearId = "test-year-id";
  const mockContactId = "test-contact-id";

  beforeEach(() => {
    firestoreService = FirestoreService.getInstance();
    jest.clearAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = FirestoreService.getInstance();
      const instance2 = FirestoreService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("Input Validation", () => {
    it("should throw ValidationError for empty userId", async () => {
      await expect(firestoreService.getYears("")).rejects.toThrow(
        ValidationError
      );
      await expect(firestoreService.getYears("   ")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError for invalid userId type", async () => {
      await expect(firestoreService.getYears(null as any)).rejects.toThrow(
        ValidationError
      );
      await expect(firestoreService.getYears(undefined as any)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError for empty yearId", async () => {
      await expect(
        firestoreService.getContacts(mockUserId, "")
      ).rejects.toThrow(ValidationError);
      await expect(
        firestoreService.getContacts(mockUserId, "   ")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for empty contactId", async () => {
      await expect(
        firestoreService.deleteContact(mockUserId, mockYearId, "")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Year Management", () => {
    describe("getYears", () => {
      it("should return years for a user", async () => {
        const mockQuerySnapshot = {
          forEach: jest.fn((callback) => {
            callback({
              id: "year1",
              data: () => ({
                name: "2024",
                createdAt: { toDate: () => new Date("2024-01-01") },
                updatedAt: { toDate: () => new Date("2024-01-01") },
              }),
            });
            callback({
              id: "year2",
              data: () => ({
                name: "2023",
                createdAt: { toDate: () => new Date("2023-01-01") },
                updatedAt: { toDate: () => new Date("2023-01-01") },
              }),
            });
          }),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
        (collection as jest.Mock).mockReturnValue({});
        (query as jest.Mock).mockReturnValue({});
        (orderBy as jest.Mock).mockReturnValue({});

        const years = await firestoreService.getYears(mockUserId);

        expect(years).toHaveLength(2);
        expect(years[0]).toEqual({
          id: "year1",
          userId: mockUserId,
          name: "2024",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        });
        expect(collection).toHaveBeenCalledWith(
          {},
          "users",
          mockUserId,
          "years"
        );
        expect(query).toHaveBeenCalled();
        expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
      });

      it("should return empty array when no years exist", async () => {
        const mockQuerySnapshot = {
          forEach: jest.fn(),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
        (collection as jest.Mock).mockReturnValue({});
        (query as jest.Mock).mockReturnValue({});

        const years = await firestoreService.getYears(mockUserId);

        expect(years).toHaveLength(0);
      });

      it("should handle Firestore errors", async () => {
        const firestoreError = {
          code: "permission-denied",
          message: "Access denied",
        };
        (getDocs as jest.Mock).mockRejectedValue(firestoreError);

        await expect(firestoreService.getYears(mockUserId)).rejects.toThrow(
          PermissionError
        );
      });
    });

    describe("addYear", () => {
      it("should add a new year", async () => {
        const mockDocRef = { id: "new-year-id" };
        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const yearData = {
          userId: mockUserId,
          name: "2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const yearId = await firestoreService.addYear(mockUserId, yearData);

        expect(yearId).toBe("new-year-id");
        expect(addDoc).toHaveBeenCalledWith(
          {},
          {
            userId: mockUserId,
            name: "2025",
            createdAt: { seconds: 1234567890, nanoseconds: 0 },
            updatedAt: { seconds: 1234567890, nanoseconds: 0 },
          }
        );
      });

      it("should trim year name", async () => {
        const mockDocRef = { id: "new-year-id" };
        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const yearData = {
          userId: mockUserId,
          name: "  2025  ",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await firestoreService.addYear(mockUserId, yearData);

        expect(addDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            name: "2025",
          })
        );
      });

      it("should throw ValidationError for empty year name", async () => {
        const yearData = {
          userId: mockUserId,
          name: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await expect(
          firestoreService.addYear(mockUserId, yearData)
        ).rejects.toThrow(ValidationError);
      });

      it("should handle Firestore errors", async () => {
        const firestoreError = {
          code: "unavailable",
          message: "Service unavailable",
        };
        (addDoc as jest.Mock).mockRejectedValue(firestoreError);

        const yearData = {
          userId: mockUserId,
          name: "2025",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await expect(
          firestoreService.addYear(mockUserId, yearData)
        ).rejects.toThrow(NetworkError);
      });
    });

    describe("updateYear", () => {
      it("should update a year", async () => {
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = { name: "Updated 2024" };
        await firestoreService.updateYear(mockUserId, mockYearId, updates);

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          {
            name: "Updated 2024",
            updatedAt: { seconds: 1234567890, nanoseconds: 0 },
          }
        );
      });

      it("should trim updated year name", async () => {
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = { name: "  Updated 2024  " };
        await firestoreService.updateYear(mockUserId, mockYearId, updates);

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            name: "Updated 2024",
          })
        );
      });

      it("should throw ValidationError for empty year name", async () => {
        const updates = { name: "" };
        await expect(
          firestoreService.updateYear(mockUserId, mockYearId, updates)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe("deleteYear", () => {
      it("should delete a year and all its contacts", async () => {
        const mockBatch = {
          delete: jest.fn(),
          commit: jest.fn().mockResolvedValue(undefined),
        };
        const mockContactsSnapshot = {
          forEach: jest.fn((callback) => {
            callback({ ref: "contact1-ref" });
            callback({ ref: "contact2-ref" });
          }),
        };

        (writeBatch as jest.Mock).mockReturnValue(mockBatch);
        (getDocs as jest.Mock).mockResolvedValue(mockContactsSnapshot);
        (collection as jest.Mock).mockReturnValue({});
        (doc as jest.Mock).mockReturnValue("year-ref");

        await firestoreService.deleteYear(mockUserId, mockYearId);

        expect(mockBatch.delete).toHaveBeenCalledTimes(3); // 2 contacts + 1 year
        expect(mockBatch.delete).toHaveBeenCalledWith("contact1-ref");
        expect(mockBatch.delete).toHaveBeenCalledWith("contact2-ref");
        expect(mockBatch.delete).toHaveBeenCalledWith("year-ref");
        expect(mockBatch.commit).toHaveBeenCalled();
      });
    });
  });

  describe("Contact Management", () => {
    describe("getContacts", () => {
      it("should return contacts for a year", async () => {
        const mockQuerySnapshot = {
          forEach: jest.fn((callback) => {
            callback({
              id: "contact1",
              data: () => ({
                firstName: "John",
                lastName: "Doe",
                enterpriseName: "Acme Corp",
                comments: "Test comment",
                delivered: true,
                deliveredAt: { toDate: () => new Date("2024-01-15") },
                createdAt: { toDate: () => new Date("2024-01-01") },
                updatedAt: { toDate: () => new Date("2024-01-01") },
              }),
            });
          }),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
        (collection as jest.Mock).mockReturnValue({});
        (query as jest.Mock).mockReturnValue({});

        const contacts = await firestoreService.getContacts(
          mockUserId,
          mockYearId
        );

        expect(contacts).toHaveLength(1);
        expect(contacts[0]).toEqual({
          id: "contact1",
          userId: mockUserId,
          yearId: mockYearId,
          firstName: "John",
          lastName: "Doe",
          enterpriseName: "Acme Corp",
          comments: "Test comment",
          delivered: true,
          deliveredAt: new Date("2024-01-15"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        });
      });

      it("should handle contacts with missing optional fields", async () => {
        const mockQuerySnapshot = {
          forEach: jest.fn((callback) => {
            callback({
              id: "contact1",
              data: () => ({
                firstName: "John",
                lastName: "Doe",
                enterpriseName: "Acme Corp",
                // Missing comments, delivered, deliveredAt
                createdAt: { toDate: () => new Date("2024-01-01") },
                updatedAt: { toDate: () => new Date("2024-01-01") },
              }),
            });
          }),
        };

        (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

        const contacts = await firestoreService.getContacts(
          mockUserId,
          mockYearId
        );

        expect(contacts[0]).toEqual(
          expect.objectContaining({
            comments: "",
            delivered: false,
            deliveredAt: null,
          })
        );
      });
    });

    describe("addContact", () => {
      it("should add a new contact", async () => {
        const mockDocRef = { id: "new-contact-id" };
        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const contactData = {
          userId: mockUserId,
          yearId: mockYearId,
          firstName: "Jane",
          lastName: "Smith",
          enterpriseName: "Tech Corp",
          comments: "New contact",
          delivered: false,
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const contactId = await firestoreService.addContact(
          mockUserId,
          mockYearId,
          contactData
        );

        expect(contactId).toBe("new-contact-id");
        expect(addDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            firstName: "Jane",
            lastName: "Smith",
            enterpriseName: "Tech Corp",
            comments: "New contact",
            delivered: false,
          })
        );
      });

      it("should trim contact fields", async () => {
        const mockDocRef = { id: "new-contact-id" };
        (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (collection as jest.Mock).mockReturnValue({});

        const contactData = {
          userId: mockUserId,
          yearId: mockYearId,
          firstName: "  Jane  ",
          lastName: "  Smith  ",
          enterpriseName: "  Tech Corp  ",
          comments: "  New contact  ",
          delivered: false,
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await firestoreService.addContact(mockUserId, mockYearId, contactData);

        expect(addDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            firstName: "Jane",
            lastName: "Smith",
            enterpriseName: "Tech Corp",
            comments: "New contact",
          })
        );
      });

      it("should throw ValidationError for missing required fields", async () => {
        const contactData = {
          userId: mockUserId,
          yearId: mockYearId,
          firstName: "",
          lastName: "Smith",
          enterpriseName: "Tech Corp",
          comments: "",
          delivered: false,
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await expect(
          firestoreService.addContact(mockUserId, mockYearId, contactData)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe("updateContact", () => {
      it("should update a contact", async () => {
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = {
          firstName: "Updated Jane",
          comments: "Updated comment",
        };

        await firestoreService.updateContact(
          mockUserId,
          mockYearId,
          mockContactId,
          updates
        );

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            firstName: "Updated Jane",
            comments: "Updated comment",
            updatedAt: { seconds: 1234567890, nanoseconds: 0 },
          })
        );
      });

      it("should handle delivery status updates", async () => {
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = { delivered: true };

        await firestoreService.updateContact(
          mockUserId,
          mockYearId,
          mockContactId,
          updates
        );

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            delivered: true,
            deliveredAt: { seconds: 1234567890, nanoseconds: 0 },
          })
        );
      });

      it("should clear deliveredAt when marking as undelivered", async () => {
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = { delivered: false };

        await firestoreService.updateContact(
          mockUserId,
          mockYearId,
          mockContactId,
          updates
        );

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            delivered: false,
            deliveredAt: null,
          })
        );
      });

      it("should throw ValidationError for empty required fields", async () => {
        const updates = { firstName: "" };

        await expect(
          firestoreService.updateContact(
            mockUserId,
            mockYearId,
            mockContactId,
            updates
          )
        ).rejects.toThrow(ValidationError);
      });
    });

    describe("deleteContact", () => {
      it("should delete a contact", async () => {
        (doc as jest.Mock).mockReturnValue({});
        (deleteDoc as jest.Mock).mockResolvedValue(undefined);

        await firestoreService.deleteContact(
          mockUserId,
          mockYearId,
          mockContactId
        );

        expect(deleteDoc).toHaveBeenCalledWith({});
        expect(doc).toHaveBeenCalledWith(
          {},
          "users",
          mockUserId,
          "years",
          mockYearId,
          "contacts",
          mockContactId
        );
      });
    });
  });

  describe("User Preferences", () => {
    describe("getUserPreferences", () => {
      it("should return existing user preferences", async () => {
        const mockDocSnapshot = {
          exists: () => true,
          data: () => ({
            lastSelectedYearId: "year-123",
            createdAt: { toDate: () => new Date("2024-01-01") },
            updatedAt: { toDate: () => new Date("2024-01-01") },
          }),
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
        (doc as jest.Mock).mockReturnValue({});

        const preferences = await firestoreService.getUserPreferences(
          mockUserId
        );

        expect(preferences).toEqual({
          userId: mockUserId,
          lastSelectedYearId: "year-123",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        });
      });

      it("should create default preferences if they don't exist", async () => {
        const mockDocSnapshot = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const preferences = await firestoreService.getUserPreferences(
          mockUserId
        );

        expect(preferences.userId).toBe(mockUserId);
        expect(preferences.lastSelectedYearId).toBeNull();
        expect(updateDoc).toHaveBeenCalled();
      });
    });

    describe("updateUserPreferences", () => {
      it("should update existing preferences", async () => {
        const mockDocSnapshot = {
          exists: () => true,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = { lastSelectedYearId: "new-year-id" };
        await firestoreService.updateUserPreferences(mockUserId, updates);

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            userId: mockUserId,
            lastSelectedYearId: "new-year-id",
            updatedAt: { seconds: 1234567890, nanoseconds: 0 },
          })
        );
      });

      it("should set createdAt for new preferences", async () => {
        const mockDocSnapshot = {
          exists: () => false,
        };

        (getDoc as jest.Mock).mockResolvedValue(mockDocSnapshot);
        (doc as jest.Mock).mockReturnValue({});
        (updateDoc as jest.Mock).mockResolvedValue(undefined);

        const updates = { lastSelectedYearId: "new-year-id" };
        await firestoreService.updateUserPreferences(mockUserId, updates);

        expect(updateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            createdAt: { seconds: 1234567890, nanoseconds: 0 },
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should convert permission-denied to PermissionError", async () => {
      const firestoreError = {
        code: "permission-denied",
        message: "Access denied",
      };
      (getDocs as jest.Mock).mockRejectedValue(firestoreError);

      await expect(firestoreService.getYears(mockUserId)).rejects.toThrow(
        PermissionError
      );
    });

    it("should convert not-found to NotFoundError", async () => {
      const firestoreError = {
        code: "not-found",
        message: "Document not found",
      };
      (updateDoc as jest.Mock).mockRejectedValue(firestoreError);

      await expect(
        firestoreService.updateYear(mockUserId, mockYearId, { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should convert unavailable to NetworkError", async () => {
      const firestoreError = {
        code: "unavailable",
        message: "Service unavailable",
      };
      (getDocs as jest.Mock).mockRejectedValue(firestoreError);

      await expect(firestoreService.getYears(mockUserId)).rejects.toThrow(
        NetworkError
      );
    });

    it("should convert invalid-argument to ValidationError", async () => {
      const firestoreError = {
        code: "invalid-argument",
        message: "Invalid data",
      };
      (addDoc as jest.Mock).mockRejectedValue(firestoreError);

      const yearData = {
        userId: mockUserId,
        name: "2025",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        firestoreService.addYear(mockUserId, yearData)
      ).rejects.toThrow(ValidationError);
    });

    it("should convert unknown errors to NetworkError", async () => {
      const firestoreError = {
        code: "unknown-error",
        message: "Unknown error",
      };
      (getDocs as jest.Mock).mockRejectedValue(firestoreError);

      await expect(firestoreService.getYears(mockUserId)).rejects.toThrow(
        NetworkError
      );
    });
  });

  describe("Real-time Subscriptions", () => {
    describe("subscribeToYears", () => {
      it("should set up years subscription", () => {
        const mockUnsubscribe = jest.fn();
        const mockCallback = jest.fn();

        (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);
        (collection as jest.Mock).mockReturnValue({});
        (query as jest.Mock).mockReturnValue({});

        const unsubscribe = firestoreService.subscribeToYears(
          mockUserId,
          mockCallback
        );

        expect(onSnapshot).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      it("should handle subscription errors", () => {
        const mockCallback = jest.fn();
        const mockError = {
          code: "permission-denied",
          message: "Access denied",
        };

        (onSnapshot as jest.Mock).mockImplementation(
          (query, successCallback, errorCallback) => {
            errorCallback(mockError);
            return jest.fn();
          }
        );

        expect(() => {
          firestoreService.subscribeToYears(mockUserId, mockCallback);
        }).toThrow(PermissionError);
      });
    });

    describe("subscribeToContacts", () => {
      it("should set up contacts subscription", () => {
        const mockUnsubscribe = jest.fn();
        const mockCallback = jest.fn();

        (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);
        (collection as jest.Mock).mockReturnValue({});
        (query as jest.Mock).mockReturnValue({});

        const unsubscribe = firestoreService.subscribeToContacts(
          mockUserId,
          mockYearId,
          mockCallback
        );

        expect(onSnapshot).toHaveBeenCalled();
        expect(unsubscribe).toBe(mockUnsubscribe);
      });
    });
  });

  describe("Offline Support", () => {
    it("should enable offline support", async () => {
      const { enableNetwork } = require("firebase/firestore");
      await firestoreService.enableOfflineSupport();
      expect(enableNetwork).toHaveBeenCalled();
    });

    it("should disable offline support", async () => {
      const { disableNetwork } = require("firebase/firestore");
      await firestoreService.disableOfflineSupport();
      expect(disableNetwork).toHaveBeenCalled();
    });

    it("should handle offline support errors gracefully", async () => {
      const { enableNetwork } = require("firebase/firestore");
      enableNetwork.mockRejectedValue(new Error("Network error"));

      // Should not throw, just log warning
      await expect(
        firestoreService.enableOfflineSupport()
      ).resolves.toBeUndefined();
    });
  });
});
