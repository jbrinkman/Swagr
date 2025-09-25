import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { DatabaseValidationService } from "../DatabaseValidationService";
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
}));

describe("DatabaseValidationService", () => {
  let service: ReturnType<typeof DatabaseValidationService.getInstance>;

  beforeEach(() => {
    service = DatabaseValidationService.getInstance();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = DatabaseValidationService.getInstance();
      const instance2 = DatabaseValidationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("validateUserData", () => {
    it("should handle validation with mocked Firebase calls", async () => {
      const userId = "test-user-id";

      // Simple test that just verifies the validation runs without throwing
      const mockPreferencesDoc = { exists: () => false };
      const mockYearsSnapshot = { empty: true, docs: [] };

      (getDoc as jest.Mock).mockResolvedValue(mockPreferencesDoc);
      (getDocs as jest.Mock).mockResolvedValue(mockYearsSnapshot);

      const result = await service.validateUserData(userId);

      // Should detect missing preferences as an error
      expect(result.isValid).toBe(false);
      expect(result.summary.errors).toBeGreaterThan(0);
      expect(
        result.issues.some((issue: any) =>
          issue.message.includes("User preferences document does not exist")
        )
      ).toBe(true);
    });

    it("should detect missing preferences document", async () => {
      const userId = "test-user-id";

      const mockPreferencesDoc = { exists: () => false };
      const mockYearsSnapshot = { empty: true, docs: [] };

      (getDoc as jest.Mock).mockResolvedValue(mockPreferencesDoc);
      (getDocs as jest.Mock).mockResolvedValue(mockYearsSnapshot);

      const result = await service.validateUserData(userId);

      expect(result.isValid).toBe(false);
      expect(result.summary.errors).toBeGreaterThan(0);
      expect(
        result.issues.some(
          (issue: any) =>
            issue.severity === "error" &&
            issue.message.includes("User preferences document does not exist")
        )
      ).toBe(true);
    });

    it("should throw ValidationError for invalid userId", async () => {
      await expect(service.validateUserData("")).rejects.toThrow(
        ValidationError
      );
      await expect(service.validateUserData("   ")).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("getValidationRules", () => {
    it("should return all validation rules", () => {
      const rules = service.getValidationRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty("name");
      expect(rules[0]).toHaveProperty("description");
      expect(rules[0]).toHaveProperty("validate");
    });
  });

  describe("quickValidate", () => {
    it("should return true for valid data", async () => {
      const userId = "test-user-id";

      jest.spyOn(service, "validateUserData").mockResolvedValue({
        isValid: true,
        issues: [],
        summary: { errors: 0, warnings: 0, info: 0 },
      });

      const isValid = await service.quickValidate(userId);

      expect(isValid).toBe(true);
    });

    it("should return false for invalid data", async () => {
      const userId = "test-user-id";

      jest.spyOn(service, "validateUserData").mockResolvedValue({
        isValid: false,
        issues: [],
        summary: { errors: 1, warnings: 0, info: 0 },
      });

      const isValid = await service.quickValidate(userId);

      expect(isValid).toBe(false);
    });
  });
});
