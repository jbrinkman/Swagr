import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { DatabaseInitService } from "../DatabaseInitService";
import { ValidationError, NetworkError } from "../../types";

// Mock Firebase
jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(),
}));

describe("DatabaseInitService", () => {
  let service: ReturnType<typeof DatabaseInitService.getInstance>;
  let mockBatch: any;

  beforeEach(() => {
    service = DatabaseInitService.getInstance();

    // Reset mocks
    jest.clearAllMocks();

    // Mock batch operations
    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    (writeBatch as jest.Mock).mockReturnValue(mockBatch);
    (serverTimestamp as jest.Mock).mockReturnValue({
      _methodName: "serverTimestamp",
    });
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = DatabaseInitService.getInstance();
      const instance2 = DatabaseInitService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("initializeUserSchema", () => {
    it("should initialize schema for new user", async () => {
      const userId = "test-user-id";
      const mockYearRef = { id: "year-id" };

      (doc as jest.Mock).mockImplementation((db, ...path) => {
        if (path.includes("preferences")) {
          return { id: "preferences-ref" };
        }
        return mockYearRef;
      });
      (collection as jest.Mock).mockReturnValue({ id: "years-collection" });

      await service.initializeUserSchema(userId);

      expect(writeBatch).toHaveBeenCalledWith(db);
      expect(mockBatch.set).toHaveBeenCalledTimes(2); // preferences + year
      expect(mockBatch.update).toHaveBeenCalledTimes(1); // update preferences with yearId
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError for invalid userId", async () => {
      await expect(service.initializeUserSchema("")).rejects.toThrow(
        ValidationError
      );
      await expect(service.initializeUserSchema("   ")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw NetworkError on Firebase error", async () => {
      const userId = "test-user-id";
      mockBatch.commit.mockRejectedValue(new Error("Firebase error"));

      await expect(service.initializeUserSchema(userId)).rejects.toThrow(
        NetworkError
      );
    });
  });

  describe("validateUserSchema", () => {
    it("should return validation errors for missing preferences", async () => {
      const userId = "test-user-id";
      const mockPreferencesDoc = { exists: () => false };

      (getDoc as jest.Mock).mockResolvedValue(mockPreferencesDoc);
      (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

      const result = await service.validateUserSchema(userId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "User preferences document does not exist"
      );
    });
  });

  describe("getUserDatabaseStats", () => {
    it("should handle invalid userId", async () => {
      await expect(service.getUserDatabaseStats("")).rejects.toThrow(
        "User ID is required and must be a non-empty string"
      );
    });
  });
});
