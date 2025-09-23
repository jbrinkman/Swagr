import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageService as IStorageService } from "../types";

/**
 * StorageService handles local storage operations for user preferences
 * Uses AsyncStorage for persistent data storage on the device
 */
class StorageService implements IStorageService {
  private static readonly STORAGE_KEYS = {
    LAST_SELECTED_YEAR: "@marketing_checklist:last_selected_year",
  } as const;

  /**
   * Get the last selected year ID from local storage
   * @returns Promise<string | null> - The year ID or null if not found
   */
  async getLastSelectedYear(): Promise<string | null> {
    try {
      const yearId = await AsyncStorage.getItem(
        StorageService.STORAGE_KEYS.LAST_SELECTED_YEAR
      );
      return yearId;
    } catch (error) {
      console.error("Error getting last selected year from storage:", error);
      return null;
    }
  }

  /**
   * Set the last selected year ID in local storage
   * @param yearId - The year ID to store
   * @returns Promise<void>
   */
  async setLastSelectedYear(yearId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StorageService.STORAGE_KEYS.LAST_SELECTED_YEAR,
        yearId
      );
    } catch (error) {
      console.error("Error setting last selected year in storage:", error);
      throw error;
    }
  }

  /**
   * Clear all stored data from local storage
   * @returns Promise<void>
   */
  async clearStorage(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        StorageService.STORAGE_KEYS.LAST_SELECTED_YEAR,
      ]);
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();
export default StorageService;
