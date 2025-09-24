import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Year, YearContextType, NetworkError, ValidationError } from '../types';
import { useAuth } from './AuthContext';
import firestoreService from '../services/FirestoreService';
import storageService from '../services/StorageService';

// Year context state
interface YearState {
  years: Year[];
  selectedYear: Year | null;
  loading: boolean;
  error: string | null;
}

// Year context actions
type YearAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_YEARS'; payload: Year[] }
  | { type: 'SET_SELECTED_YEAR'; payload: Year | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_YEAR'; payload: Year }
  | { type: 'UPDATE_YEAR'; payload: { yearId: string; updates: Partial<Year> } }
  | { type: 'DELETE_YEAR'; payload: string }
  | { type: 'RESET' };

// Initial state
const initialState: YearState = {
  years: [],
  selectedYear: null,
  loading: false,
  error: null,
};

// Year reducer
const yearReducer = (state: YearState, action: YearAction): YearState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_YEARS':
      return { ...state, years: action.payload, error: null };
    case 'SET_SELECTED_YEAR':
      return { ...state, selectedYear: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_YEAR':
      return {
        ...state,
        years: [action.payload, ...state.years],
        error: null,
      };
    case 'UPDATE_YEAR': {
      const updatedYears = state.years.map((year) =>
        year.id === action.payload.yearId
          ? { ...year, ...action.payload.updates, updatedAt: new Date() }
          : year
      );
      const updatedSelectedYear =
        state.selectedYear?.id === action.payload.yearId
          ? { ...state.selectedYear, ...action.payload.updates, updatedAt: new Date() }
          : state.selectedYear;
      return {
        ...state,
        years: updatedYears,
        selectedYear: updatedSelectedYear,
        error: null,
      };
    }
    case 'DELETE_YEAR': {
      const filteredYears = state.years.filter((year) => year.id !== action.payload);
      const newSelectedYear =
        state.selectedYear?.id === action.payload ? null : state.selectedYear;
      return {
        ...state,
        years: filteredYears,
        selectedYear: newSelectedYear,
        error: null,
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

// Create context
const YearContext = createContext<YearContextType | undefined>(undefined);

// Year provider props
interface YearProviderProps {
  children: ReactNode;
}

/**
 * YearProvider manages year selection state and operations
 * Handles year CRUD operations, selection persistence, and data loading
 */
export const YearProvider: React.FC<YearProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(yearReducer, initialState);

  /**
   * Load years from Firestore and restore last selected year
   */
  const loadYears = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'RESET' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load years from Firestore
      const years = await firestoreService.getYears(user.uid);
      dispatch({ type: 'SET_YEARS', payload: years });

      // Restore last selected year from local storage
      const lastSelectedYearId = await storageService.getLastSelectedYear();
      let selectedYear: Year | null = null;

      if (lastSelectedYearId) {
        // Try to find the last selected year
        selectedYear = years.find((year) => year.id === lastSelectedYearId) || null;
      }

      // If no valid last selected year, select the first available year
      if (!selectedYear && years.length > 0) {
        selectedYear = years[0];
        // Save the selection to storage
        await storageService.setLastSelectedYear(selectedYear.id);
      }

      dispatch({ type: 'SET_SELECTED_YEAR', payload: selectedYear });
    } catch (error) {
      console.error('Error loading years:', error);
      let errorMessage = 'Failed to load years';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  /**
   * Select a year and persist the selection
   */
  const selectYear = useCallback(async (yearId: string) => {
    const year = state.years.find((y) => y.id === yearId);
    if (!year) {
      dispatch({ type: 'SET_ERROR', payload: 'Year not found' });
      return;
    }

    try {
      dispatch({ type: 'SET_SELECTED_YEAR', payload: year });
      await storageService.setLastSelectedYear(yearId);
    } catch (error) {
      console.error('Error selecting year:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save year selection' });
    }
  }, [state.years]);

  /**
   * Add a new year
   */
  const addYear = useCallback(async (name: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      const yearData = {
        userId: user.uid,
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const yearId = await firestoreService.addYear(user.uid, yearData);
      
      const newYear: Year = {
        id: yearId,
        ...yearData,
      };

      dispatch({ type: 'ADD_YEAR', payload: newYear });

      // Auto-select the new year if it's the first one
      if (state.years.length === 0) {
        dispatch({ type: 'SET_SELECTED_YEAR', payload: newYear });
        await storageService.setLastSelectedYear(yearId);
      }
    } catch (error) {
      console.error('Error adding year:', error);
      let errorMessage = 'Failed to add year';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user, state.years.length]);

  /**
   * Update an existing year
   */
  const updateYear = useCallback(async (yearId: string, updates: Partial<Year>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      await firestoreService.updateYear(user.uid, yearId, updates);
      dispatch({ type: 'UPDATE_YEAR', payload: { yearId, updates } });
    } catch (error) {
      console.error('Error updating year:', error);
      let errorMessage = 'Failed to update year';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user]);

  /**
   * Delete a year
   */
  const deleteYear = useCallback(async (yearId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      await firestoreService.deleteYear(user.uid, yearId);
      dispatch({ type: 'DELETE_YEAR', payload: yearId });

      // If we deleted the selected year, select another one
      if (state.selectedYear?.id === yearId) {
        const remainingYears = state.years.filter((year) => year.id !== yearId);
        if (remainingYears.length > 0) {
          const newSelectedYear = remainingYears[0];
          dispatch({ type: 'SET_SELECTED_YEAR', payload: newSelectedYear });
          await storageService.setLastSelectedYear(newSelectedYear.id);
        } else {
          dispatch({ type: 'SET_SELECTED_YEAR', payload: null });
          await storageService.setLastSelectedYear('');
        }
      }
    } catch (error) {
      console.error('Error deleting year:', error);
      let errorMessage = 'Failed to delete year';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user, state.selectedYear, state.years]);

  /**
   * Refresh years data
   */
  const refreshYears = useCallback(async () => {
    await loadYears();
  }, [loadYears]);

  // Load years when user changes
  useEffect(() => {
    loadYears();
  }, [loadYears]);

  // Context value
  const contextValue: YearContextType = {
    years: state.years,
    selectedYear: state.selectedYear,
    loading: state.loading,
    addYear,
    updateYear,
    deleteYear,
    selectYear,
    refreshYears,
  };

  return (
    <YearContext.Provider value={contextValue}>
      {children}
    </YearContext.Provider>
  );
};

/**
 * Hook to use year context
 */
export const useYear = (): YearContextType => {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
};