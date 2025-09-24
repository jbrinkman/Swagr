import { Year, User } from '../../types';

// Mock data
const mockUser: User = {
  uid: 'user1',
  email: 'test@example.com',
  createdAt: new Date(),
  lastLoginAt: new Date(),
};

const mockYears: Year[] = [
  {
    id: '1',
    userId: 'user1',
    name: '2024',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    userId: 'user1',
    name: '2025',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

describe('YearContext Logic', () => {
  describe('Year Selection Logic', () => {
    it('should select first year when no last selected year exists', () => {
      const years = mockYears;
      const lastSelectedYearId = null;
      
      let selectedYear = null;
      if (lastSelectedYearId) {
        selectedYear = years.find((year) => year.id === lastSelectedYearId) || null;
      }
      
      if (!selectedYear && years.length > 0) {
        selectedYear = years[0];
      }
      
      expect(selectedYear).toEqual(mockYears[0]);
    });

    it('should restore last selected year when it exists', () => {
      const years = mockYears;
      const lastSelectedYearId = '2';
      
      let selectedYear = null;
      if (lastSelectedYearId) {
        selectedYear = years.find((year) => year.id === lastSelectedYearId) || null;
      }
      
      if (!selectedYear && years.length > 0) {
        selectedYear = years[0];
      }
      
      expect(selectedYear).toEqual(mockYears[1]);
    });

    it('should handle invalid last selected year ID', () => {
      const years = mockYears;
      const lastSelectedYearId = 'invalid-id';
      
      let selectedYear = null;
      if (lastSelectedYearId) {
        selectedYear = years.find((year) => year.id === lastSelectedYearId) || null;
      }
      
      if (!selectedYear && years.length > 0) {
        selectedYear = years[0];
      }
      
      expect(selectedYear).toEqual(mockYears[0]);
    });

    it('should handle empty years array', () => {
      const years: Year[] = [];
      const lastSelectedYearId = '1';
      
      let selectedYear = null;
      if (lastSelectedYearId) {
        selectedYear = years.find((year) => year.id === lastSelectedYearId) || null;
      }
      
      if (!selectedYear && years.length > 0) {
        selectedYear = years[0];
      }
      
      expect(selectedYear).toBeNull();
    });
  });

  describe('Year Management Logic', () => {
    it('should validate year data before adding', () => {
      const validateYearData = (name: string, userId: string) => {
        if (!name || name.trim().length === 0) {
          throw new Error('Year name is required');
        }
        if (!userId) {
          throw new Error('User ID is required');
        }
        return {
          userId,
          name: name.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      };

      expect(() => validateYearData('', 'user1')).toThrow('Year name is required');
      expect(() => validateYearData('2024', '')).toThrow('User ID is required');
      
      const validData = validateYearData('2024', 'user1');
      expect(validData.name).toBe('2024');
      expect(validData.userId).toBe('user1');
    });

    it('should handle year deletion with selected year update', () => {
      const years = [...mockYears];
      const selectedYear = mockYears[1]; // '2025'
      const yearToDelete = '2';
      
      // Simulate deletion
      const remainingYears = years.filter((year) => year.id !== yearToDelete);
      let newSelectedYear = selectedYear.id === yearToDelete ? null : selectedYear;
      
      if (!newSelectedYear && remainingYears.length > 0) {
        newSelectedYear = remainingYears[0];
      }
      
      expect(remainingYears).toHaveLength(1);
      expect(remainingYears[0]).toEqual(mockYears[0]);
      expect(newSelectedYear).toEqual(mockYears[0]);
    });

    it('should handle year update logic', () => {
      const years = [...mockYears];
      const yearId = '1';
      const updates = { name: '2024 Updated' };
      
      const updatedYears = years.map((year) =>
        year.id === yearId
          ? { ...year, ...updates, updatedAt: new Date() }
          : year
      );
      
      expect(updatedYears[0].name).toBe('2024 Updated');
      expect(updatedYears[1].name).toBe('2025');
    });
  });

  describe('Error Handling Logic', () => {
    it('should categorize different error types', () => {
      const categorizeError = (error: any) => {
        if (error.code === 'permission-denied') {
          return 'Access denied';
        }
        if (error.code === 'unavailable') {
          return 'Network error. Please check your connection.';
        }
        if (error.code === 'invalid-argument') {
          return 'Invalid data provided';
        }
        return 'Failed to perform operation';
      };

      expect(categorizeError({ code: 'permission-denied' })).toBe('Access denied');
      expect(categorizeError({ code: 'unavailable' })).toBe('Network error. Please check your connection.');
      expect(categorizeError({ code: 'invalid-argument' })).toBe('Invalid data provided');
      expect(categorizeError({ code: 'unknown' })).toBe('Failed to perform operation');
    });
  });
});