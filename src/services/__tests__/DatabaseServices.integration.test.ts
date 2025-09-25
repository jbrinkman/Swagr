/**
 * Integration tests for database services
 * These tests focus on the core functionality without complex mocking
 */

import { DatabaseInitService } from "../DatabaseInitService";
import { DatabaseSeedService } from "../DatabaseSeedService";
import { DatabaseMigrationService } from "../DatabaseMigrationService";
import { DatabaseValidationService } from "../DatabaseValidationService";

// Mock Firebase completely for integration tests
jest.mock("../../config/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
  },
}));

describe("Database Services Integration", () => {
  describe("Service Initialization", () => {
    it("should create singleton instances", () => {
      const initService1 = DatabaseInitService.getInstance();
      const initService2 = DatabaseInitService.getInstance();
      expect(initService1).toBe(initService2);

      const seedService1 = DatabaseSeedService.getInstance();
      const seedService2 = DatabaseSeedService.getInstance();
      expect(seedService1).toBe(seedService2);

      const migrationService1 = DatabaseMigrationService.getInstance();
      const migrationService2 = DatabaseMigrationService.getInstance();
      expect(migrationService1).toBe(migrationService2);

      const validationService1 = DatabaseValidationService.getInstance();
      const validationService2 = DatabaseValidationService.getInstance();
      expect(validationService1).toBe(validationService2);
    });
  });

  describe("Service Methods Exist", () => {
    it("should have all required methods on DatabaseInitService", () => {
      const service = DatabaseInitService.getInstance();

      expect(typeof service.initializeUserSchema).toBe("function");
      expect(typeof service.ensureCollectionsExist).toBe("function");
      expect(typeof service.validateUserSchema).toBe("function");
      expect(typeof service.cleanupUserData).toBe("function");
      expect(typeof service.getUserDatabaseStats).toBe("function");
    });

    it("should have all required methods on DatabaseSeedService", () => {
      const service = DatabaseSeedService.getInstance();

      expect(typeof service.seedUserData).toBe("function");
      expect(typeof service.seedMinimalData).toBe("function");
      expect(typeof service.seedCustomData).toBe("function");
    });

    it("should have all required methods on DatabaseMigrationService", () => {
      const service = DatabaseMigrationService.getInstance();

      expect(typeof service.getCurrentVersion).toBe("function");
      expect(typeof service.setCurrentVersion).toBe("function");
      expect(typeof service.getMigrationHistory).toBe("function");
      expect(typeof service.getPendingMigrations).toBe("function");
      expect(typeof service.runMigrations).toBe("function");
      expect(typeof service.runMigration).toBe("function");
      expect(typeof service.rollbackMigration).toBe("function");
      expect(typeof service.getAvailableMigrations).toBe("function");
      expect(typeof service.needsMigration).toBe("function");
    });

    it("should have all required methods on DatabaseValidationService", () => {
      const service = DatabaseValidationService.getInstance();

      expect(typeof service.validateUserData).toBe("function");
      expect(typeof service.validateDocument).toBe("function");
      expect(typeof service.getValidationRules).toBe("function");
      expect(typeof service.quickValidate).toBe("function");
    });
  });

  describe("Service Configuration", () => {
    it("should have migration definitions", () => {
      const service = DatabaseMigrationService.getInstance();
      const migrations = service.getAvailableMigrations();

      expect(migrations.length).toBeGreaterThan(0);
      expect(migrations[0]).toHaveProperty("version");
      expect(migrations[0]).toHaveProperty("description");
      expect(migrations[0]).toHaveProperty("up");
    });

    it("should have validation rules", () => {
      const service = DatabaseValidationService.getInstance();
      const rules = service.getValidationRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty("name");
      expect(rules[0]).toHaveProperty("description");
      expect(rules[0]).toHaveProperty("validate");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid user IDs consistently", async () => {
      const initService = DatabaseInitService.getInstance();
      const seedService = DatabaseSeedService.getInstance();
      const migrationService = DatabaseMigrationService.getInstance();
      const validationService = DatabaseValidationService.getInstance();

      // All services should reject empty user IDs
      await expect(initService.initializeUserSchema("")).rejects.toThrow();
      await expect(migrationService.getCurrentVersion("")).rejects.toThrow();
      await expect(validationService.validateUserData("")).rejects.toThrow();

      // Seed service returns error object instead of throwing
      const seedResult = await seedService.seedUserData("");
      expect(seedResult.success).toBe(false);
      expect(seedResult.errors.length).toBeGreaterThan(0);
    });
  });
});
