import AsyncStorage from "@react-native-async-storage/async-storage";
import StorageService from "../StorageService";

const storageService = StorageService;

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("StorageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLastSelectedYear", () => {
    it("should return the stored year ID when it exists", async () => {
      const mockYearId = "year-123";
      mockAsyncStorage.getItem.mockResolvedValue(mockYearId);

      const result = await storageService.getLastSelectedYear();

      expect(result).toBe(mockYearId);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year"
      );
    });

    it("should return null when no year ID is stored", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.getLastSelectedYear();

      expect(result).toBeNull();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year"
      );
    });

    it("should return null and log error when AsyncStorage throws", async () => {
      const mockError = new Error("Storage error");
      mockAsyncStorage.getItem.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await storageService.getLastSelectedYear();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error getting last selected year from storage:",
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("setLastSelectedYear", () => {
    it("should store the year ID successfully", async () => {
      const mockYearId = "year-456";
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.setLastSelectedYear(mockYearId);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year",
        mockYearId
      );
    });

    it("should throw error when AsyncStorage fails", async () => {
      const mockError = new Error("Storage write error");
      const mockYearId = "year-789";
      mockAsyncStorage.setItem.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        storageService.setLastSelectedYear(mockYearId)
      ).rejects.toThrow("Storage write error");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error setting last selected year in storage:",
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("clearStorage", () => {
    it("should clear all storage keys successfully", async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();

      await storageService.clearStorage();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        "@marketing_checklist:last_selected_year",
      ]);
    });

    it("should throw error when AsyncStorage multiRemove fails", async () => {
      const mockError = new Error("Storage clear error");
      mockAsyncStorage.multiRemove.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(storageService.clearStorage()).rejects.toThrow(
        "Storage clear error"
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error clearing storage:",
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("integration scenarios", () => {
    it("should handle setting and getting year ID in sequence", async () => {
      const mockYearId = "year-integration-test";
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(mockYearId);

      // Set the year ID
      await storageService.setLastSelectedYear(mockYearId);

      // Get the year ID
      const result = await storageService.getLastSelectedYear();

      expect(result).toBe(mockYearId);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year",
        mockYearId
      );
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year"
      );
    });

    it("should handle clearing storage after setting data", async () => {
      const mockYearId = "year-clear-test";
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.multiRemove.mockResolvedValue();

      // Set some data
      await storageService.setLastSelectedYear(mockYearId);

      // Clear storage
      await storageService.clearStorage();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year",
        mockYearId
      );
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        "@marketing_checklist:last_selected_year",
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string year ID", async () => {
      const emptyYearId = "";
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.setLastSelectedYear(emptyYearId);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year",
        emptyYearId
      );
    });

    it("should handle very long year ID strings", async () => {
      const longYearId = "a".repeat(1000);
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.setLastSelectedYear(longYearId);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@marketing_checklist:last_selected_year",
        longYearId
      );
    });
  });
});
