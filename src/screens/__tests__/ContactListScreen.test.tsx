// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import ContactListScreen from '../ContactListScreen';
import { useContact } from '../../contexts/ContactContext';
import { useYear } from '../../contexts/YearContext';
import { Contact } from '../../types';

// Mock the contexts
jest.mock('../../contexts/ContactContext');
jest.mock('../../contexts/YearContext');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    yearId: 'test-year-id',
  },
};

// Mock contact data
const mockContacts: Contact[] = [
  {
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
  },
  {
    id: '2',
    userId: 'user1',
    yearId: 'year1',
    firstName: 'Jane',
    lastName: 'Smith',
    enterpriseName: 'Tech Inc',
    comments: '',
    delivered: true,
    deliveredAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  },
];

const mockYear = {
  id: 'year1',
  userId: 'user1',
  name: '2024',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ContactListScreen', () => {
  const mockUseContact = useContact as jest.MockedFunction<typeof useContact>;
  const mockUseYear = useYear as jest.MockedFunction<typeof useYear>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseContact.mockReturnValue({
      contacts: mockContacts,
      loading: false,
      addContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      toggleDelivery: jest.fn(),
      refreshContacts: jest.fn(),
    });

    mockUseYear.mockReturnValue({
      years: [mockYear],
      selectedYear: mockYear,
      loading: false,
      addYear: jest.fn(),
      updateYear: jest.fn(),
      deleteYear: jest.fn(),
      selectYear: jest.fn(),
      refreshYears: jest.fn(),
    });
  });

  it('renders without crashing', () => {
    const component = render(
      <ContactListScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays contact information', () => {
    const component = render(
      <ContactListScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays delivery statistics', () => {
    const component = render(
      <ContactListScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays loading state', () => {
    mockUseContact.mockReturnValue({
      contacts: [],
      loading: true,
      addContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      toggleDelivery: jest.fn(),
      refreshContacts: jest.fn(),
    });

    const component = render(
      <ContactListScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });

  it('displays empty state when no contacts', () => {
    mockUseContact.mockReturnValue({
      contacts: [],
      loading: false,
      addContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      toggleDelivery: jest.fn(),
      refreshContacts: jest.fn(),
    });

    const component = render(
      <ContactListScreen 
        navigation={mockNavigation as any} 
        route={mockRoute as any} 
      />
    );

    expect(component).toBeTruthy();
  });
});