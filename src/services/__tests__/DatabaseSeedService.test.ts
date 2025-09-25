import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { DatabaseSeedService } from "../DatabaseSeedService";
import { DatabaseInitService } from "../DatabaseInitService";

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
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
  },
}));

// Mock DatabaseInitService
jest.mock("../DatabaseInitService", () => ({
  __esModule: true,
  DatabaseInitService: {
    getInstance: jest.fn(),
  },
}));

describe("DatabaseSeedService", () => {
  let service: ReturnType<typeof DatabaseSeedService.getInstance>;
  let mockBatch: any;
  let mockDbInitService: any;

  beforeEach(() => {
    service = DatabaseSeedService.getInstance();

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
    (Timestamp.fromDate as jest.Mock).mockImplementation((date) => ({
      toDate: () => date,
    }));

    // Mock DatabaseInitService
    mockDbInitService = {
      ensureCollectionsExist: jest.fn().mockResolvedValue(undefined),
    };
    (DatabaseInitService.getInstance as jest.Mock).mockReturnValue(
      mockDbInitService
    );
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = DatabaseSeedService.getInstance();
      const instance2 = DatabaseSeedService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("seedUserData", () => {
    it("should seed user data with sample data", async () => {
      const userId = "test-user-id";
      const mockYearRef = { id: "year-id-1" };
      const mockContactRef = { id: "contact-id-1" };

      (collection as jest.Mock).mockReturnValue({ id: "collection" });
      (doc as jest.Mock)
        .mockReturnValueOnce(mockYearRef)
        .mockReturnValueOnce(mockYearRef)
        .mockReturnValueOnce(mockYearRef)
        .mockReturnValue(mockContactRef);

      const result = await service.seedUserData(userId);

      expect(result.success).toBe(true);
      expect(result.yearsCreated).toBeGreaterThan(0);
      expect(result.contactsCreated).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDbInitService.ensureCollectionsExist).toHaveBeenCalledWith(
        userId
      );
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it("should throw error for invalid userId", async () => {
      const result = await service.seedUserData("");

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "User ID is required and must be a non-empty string"
      );
    });
  });
});
