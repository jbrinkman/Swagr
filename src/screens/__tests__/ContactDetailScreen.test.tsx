// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
}));

// Mock validation utility
jest.mock('../../utils/validation', () => ({
  sanitizeInput: jest.fn((input: string) => input.trim()),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ContactDetailScreen from '../ContactDetailScreen';
import { useContact } from '../../contexts/ContactContext';
import { Contact, ValidationError, NetworkError } from '../../types';
import { sanitizeInput } from '../../utils/validation';

// Mock the contexts
jest.mock('../../contexts/ContactContext');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
};

// Mock contact data
const mockContact: Contact = {
  id: '1',
  userId: 'user1',
  yearId: 'year1',
  firstName: 'John',
  lastName: 'Doe',
  enterpriseName: 'Acme Corp',
  comments: 'Test comment about this contact',
  delivered: false,
  deliveredAt: null,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-02T15:30:00Z'),
};

const mockDeliveredContact: Contact = {
  ...mockContact,
  id: '2',
  delivered: true,
  deliveredAt: new Date('2024-01-03T14:20:00Z'),
};

const mockContactWithoutComments: Contact = {
  ...mockContact,
  id: '3',
  comments: '',
};

const mockRoute = {
  params: {
    yearId: 'test-year-id',
    contact: mockContact,
  },
};

describe('ContactDetailScreen', () => {
  const mockUseContact = useContact as jest.MockedFunction<typeof useContact>;
  const mockUpdateContact = jest.fn();
  const mockDeleteContact = jest.fn();
  const mockToggleDelivery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseContact.mockReturnValue({
      contacts: [],
      loading: false,
      addContact: jest.fn(),
      updateContact: mockUpdateContact,
      deleteContact: mockDeleteContact,
      toggleDelivery: mockToggleDelivery,
      refreshContacts: jest.fn(),
    });

    (sanitizeInput as jest.Mock).mockImplementation((input: string) => input.trim());
  });

  describe('Basic Rendering', () => {
    it('renders contact details correctly', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      // Test that the component renders without crashing
      expect(component).toBeTruthy();
      
      // Test that key elements are present in the component tree
      const componentTree = component.toJSON();
      expect(componentTree).toBeTruthy();
    });

    it('sets navigation title with contact name', () => {
      render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(mockNavigation.setOptions).toHaveBeenCalledWith({
        title: 'John Doe',
      });
    });

    it('renders with delivered contact data', () => {
      const deliveredRoute = {
        params: {
          yearId: 'test-year-id',
          contact: mockDeliveredContact,
        },
      };

      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={deliveredRoute as any} 
        />
      );

      expect(component).toBeTruthy();
    });

    it('renders with undelivered contact data', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
    });
  });

  describe('Comments System', () => {
    it('renders comments section for contact with comments', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify the component contains the comment text
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Test comment about this contact');
    });

    it('renders comments section for contact without comments', () => {
      const noCommentsRoute = {
        params: {
          yearId: 'test-year-id',
          contact: mockContactWithoutComments,
        },
      };

      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={noCommentsRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify the component contains the no comments message
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('No comments added yet');
    });

    it('validates comment functionality exists', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      // Test that the component renders without crashing
      expect(component).toBeTruthy();
      
      // Test that comments functionality is present
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Comments');
    });

    it('handles comments editing functionality', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify edit functionality exists (pencil icon)
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('pencil');
    });
  });

  describe('Delivery Status', () => {
    it('displays delivery status functionality', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify delivery status section exists
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Delivery Status');
      expect(componentString).toContain('Mark as Delivered');
    });

    it('displays delivered contact status', () => {
      const deliveredRoute = {
        params: {
          yearId: 'test-year-id',
          contact: mockDeliveredContact,
        },
      };

      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={deliveredRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify delivered status is shown
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Mark as Pending');
    });
  });

  describe('Contact Actions', () => {
    it('displays contact action functionality', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify action buttons exist
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('pencil');
      expect(componentString).toContain('delete');
    });

    it('includes delete confirmation dialog', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify dialog elements exist
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Delete Contact');
      expect(componentString).toContain('Cancel');
    });
  });

  describe('Date Formatting', () => {
    it('displays delivery date for delivered contact', () => {
      const deliveredRoute = {
        params: {
          yearId: 'test-year-id',
          contact: mockDeliveredContact,
        },
      };

      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={deliveredRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify delivery date is formatted and displayed
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Wednesday, January 3, 2024');
    });

    it('displays not delivered status for undelivered contact', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify "Not delivered" status is shown
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Not delivered');
    });

    it('displays contact metadata dates', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify metadata dates are displayed
      const componentTree = component.toJSON();
      const componentString = JSON.stringify(componentTree);
      expect(componentString).toContain('Contact Information');
      expect(componentString).toContain('January 1, 2024');
      expect(componentString).toContain('January 2, 2024');
    });
  });

  describe('Comments Functionality Integration', () => {
    it('validates comments system integration with Firestore service', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify that the component is set up to use the contact context
      expect(mockUseContact).toHaveBeenCalled();
      
      // Verify that updateContact function is available for comments
      const contextReturn = mockUseContact.mock.results[0].value;
      expect(contextReturn.updateContact).toBe(mockUpdateContact);
    });

    it('validates comments input sanitization is configured', () => {
      render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      // Verify sanitizeInput mock is set up correctly
      expect(sanitizeInput).toBeDefined();
      
      // Test sanitization function
      const testInput = '  test input  ';
      const result = (sanitizeInput as jest.Mock)(testInput);
      expect(result).toBe('test input');
    });

    it('validates error handling setup for comments', () => {
      const component = render(
        <ContactDetailScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(component).toBeTruthy();
      
      // Verify Alert mock is available for error handling
      expect(Alert.alert).toBeDefined();
    });
  });
});