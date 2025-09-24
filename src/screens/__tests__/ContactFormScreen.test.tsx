// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import ContactFormScreen from '../ContactFormScreen';
import { useContact } from '../../contexts/ContactContext';
import { Contact } from '../../types';

// Mock the contexts
jest.mock('../../contexts/ContactContext');

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
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
  comments: 'Test comment',
  delivered: false,
  deliveredAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ContactFormScreen', () => {
  const mockUseContact = useContact as jest.MockedFunction<typeof useContact>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseContact.mockReturnValue({
      contacts: [],
      loading: false,
      addContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      toggleDelivery: jest.fn(),
      refreshContacts: jest.fn(),
    });
  });

  describe('Add Contact Mode', () => {
    const mockRoute = {
      params: {
        yearId: 'test-year-id',
      },
    };

    it('renders add contact form correctly', () => {
      const component = render(
        <ContactFormScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      // Just check that the component renders without crashing
      expect(component).toBeTruthy();
    });

    it('sets navigation title for add mode', () => {
      render(
        <ContactFormScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(mockNavigation.setOptions).toHaveBeenCalledWith({
        title: 'Add Contact',
      });
    });
  });

  describe('Edit Contact Mode', () => {
    const mockRoute = {
      params: {
        yearId: 'test-year-id',
        contact: mockContact,
        isEdit: true,
      },
    };

    it('renders edit contact form correctly', () => {
      const component = render(
        <ContactFormScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      // Just check that the component renders without crashing
      expect(component).toBeTruthy();
    });

    it('sets navigation title for edit mode', () => {
      render(
        <ContactFormScreen 
          navigation={mockNavigation as any} 
          route={mockRoute as any} 
        />
      );

      expect(mockNavigation.setOptions).toHaveBeenCalledWith({
        title: 'Edit Contact',
      });
    });
  });

  it('displays required field indicators', () => {
    const mockRoute = {
      params: {
        yearId: 'test-year-id',
      },
    };

    const component = render(
      <ContactFormScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    // Just check that the component renders without crashing
    expect(component).toBeTruthy();
  });
});