import { useCallback, useState } from "react";
import { useYear } from "../contexts/YearContext";
import { Year } from "../types";

/**
 * Custom hook for managing year selection with loading states
 * Provides year switching functionality with data loading coordination
 */
export const useYearSelection = () => {
  const { years, selectedYear, selectYear, loading } = useYear();
  const [switching, setSwitching] = useState(false);

  /**
   * Handle year selection with loading state management
   * @param year - The year to select
   * @param onDataLoad - Optional callback to load data for the selected year
   */
  const handleYearSelect = useCallback(
    async (year: Year, onDataLoad?: (yearId: string) => Promise<void>) => {
      if (selectedYear?.id === year.id) {
        // Already selected, no need to switch
        return;
      }

      try {
        setSwitching(true);

        // Select the year first
        await selectYear(year.id);

        // Load data for the selected year if callback provided
        if (onDataLoad) {
          await onDataLoad(year.id);
        }
      } catch (error) {
        console.error("Error switching year:", error);
        throw error;
      } finally {
        setSwitching(false);
      }
    },
    [selectedYear, selectYear]
  );

  /**
   * Check if dropdown should be visible
   * Dropdown is shown when there are multiple years
   */
  const shouldShowDropdown = years.length > 1;

  /**
   * Check if year selection is currently loading
   */
  const isLoading = loading || switching;

  return {
    years,
    selectedYear,
    handleYearSelect,
    shouldShowDropdown,
    isLoading,
  };
};
