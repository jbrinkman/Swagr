import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { DatabaseMigrationService } from "../DatabaseMigrationService";
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
  serverTimestamp: jest.fn(),
}));

describe("DatabaseMigrationService", () => {
  let service: ReturnType<typeof DatabaseMigrationService.getInstance>;

  beforeEach(() => {
    service = DatabaseMigrationService.getInstance();

    // Reset mocks
    jest.clearAllMocks();

    (serverTimestamp as jest.Mock).mockReturnValue({
      _methodName: "serverTimestamp",
    });
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = DatabaseMigrationService.getInstance();
      const instance2 = DatabaseMigrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getCurrentVersion", () => {
    it("should return current version from document", async () => {
      const userId = "test-user-id";
      const mockVersionDoc = {
        exists: () => true,
        data: () => ({ version: "1.2.0" }),
      };

      (doc as jest.Mock).mockReturnValue({ id: "version-ref" });
      (getDoc as jest.Mock).mockResolvedValue(mockVersionDoc);

      const version = await service.getCurrentVersion(userId);

      expect(version).toBe("1.2.0");
      expect(doc).toHaveBeenCalledWith(
        db,
        "users",
        userId,
        "system",
        "version"
      );
    });

    it("should return 0.0.0 for new user without version document", async () => {
      const userId = "test-user-id";
      const mockVersionDoc = { exists: () => false };

      (getDoc as jest.Mock).mockResolvedValue(mockVersionDoc);

      const version = await service.getCurrentVersion(userId);

      expect(version).toBe("0.0.0");
    });

    it("should throw ValidationError for invalid userId", async () => {
      await expect(service.getCurrentVersion("")).rejects.toThrow(
        ValidationError
      );
      await expect(service.getCurrentVersion("   ")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("setCurrentVersion", () => {
    it("should set version document", async () => {
      const userId = "test-user-id";
      const version = "1.2.0";

      (doc as jest.Mock).mockReturnValue({ id: "version-ref" });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await service.setCurrentVersion(userId, version);

      expect(setDoc).toHaveBeenCalledWith(
        { id: "version-ref" },
        {
          version: "1.2.0",
          updatedAt: { _methodName: "serverTimestamp" },
        },
        { merge: true }
      );
    });
  });

  describe("getAvailableMigrations", () => {
    it("should return all available migrations", () => {
      const migrations = service.getAvailableMigrations();

      expect(migrations.length).toBeGreaterThan(0);
      expect(migrations[0]).toHaveProperty("version");
      expect(migrations[0]).toHaveProperty("description");
      expect(migrations[0]).toHaveProperty("up");
    });
  });
});
