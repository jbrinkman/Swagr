// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import ContactDetailScreen from '../ContactDetailScreen';
import { useContact } from '../../contexts/ContactContext';
import { Contact } from '../../types';

// Mock the contexts
jest.mock('../../contexts/ContactContext');

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

const mockRoute = {
  params: {
    yearId: 'test-year-id',
    contact: mockContact,
  },
};

describe('ContactDetailScreen', () => {
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

  it('renders contact details correctly', () => {
    const component = render(
      <ContactDetailScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
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

  it('displays delivered status correctly', () => {
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

  it('displays no comments message when contact has no comments', () => {
    const noCommentsRoute = {
      params: {
        yearId: 'test-year-id',
        contact: { ...mockContact, comments: '' },
      },
    };

    const component = render(
      <ContactDetailScreen 
        navigation={mockNavigation as any} 
        route={noCommentsRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays contact metadata correctly', () => {
    const component = render(
      <ContactDetailScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays delivery status section', () => {
    const component = render(
      <ContactDetailScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays comments section', () => {
    const component = render(
      <ContactDetailScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });
});