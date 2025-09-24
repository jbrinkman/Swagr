import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import {
  Contact,
  ContactContextType,
  ContactFormData,
  NetworkError,
  ValidationError,
} from '../types';
import { useAuth } from './AuthContext';
import { useYear } from './YearContext';
import firestoreService from '../services/FirestoreService';

// Contact context state
interface ContactState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

// Contact context actions
type ContactAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: { contactId: string; updates: Partial<Contact> } }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'RESET' };

// Initial state
const initialState: ContactState = {
  contacts: [],
  loading: false,
  error: null,
};

// Contact reducer
const contactReducer = (state: ContactState, action: ContactAction): ContactState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_CONTACT':
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
        error: null,
      };
    case 'UPDATE_CONTACT': {
      const updatedContacts = state.contacts.map((contact) =>
        contact.id === action.payload.contactId
          ? { ...contact, ...action.payload.updates, updatedAt: new Date() }
          : contact
      );
      return {
        ...state,
        contacts: updatedContacts,
        error: null,
      };
    }
    case 'DELETE_CONTACT': {
      const filteredContacts = state.contacts.filter(
        (contact) => contact.id !== action.payload
      );
      return {
        ...state,
        contacts: filteredContacts,
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
const ContactContext = createContext<ContactContextType | undefined>(undefined);

// Contact provider props
interface ContactProviderProps {
  children: ReactNode;
}

/**
 * ContactProvider manages contact state and operations for the selected year
 * Automatically loads contacts when the selected year changes
 */
export const ContactProvider: React.FC<ContactProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { selectedYear } = useYear();
  const [state, dispatch] = useReducer(contactReducer, initialState);

  /**
   * Load contacts for the selected year
   */
  const loadContacts = useCallback(async (yearId?: string) => {
    if (!user) {
      dispatch({ type: 'RESET' });
      return;
    }

    const targetYearId = yearId || selectedYear?.id;
    if (!targetYearId) {
      dispatch({ type: 'SET_CONTACTS', payload: [] });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const contacts = await firestoreService.getContacts(user.uid, targetYearId);
      dispatch({ type: 'SET_CONTACTS', payload: contacts });
    } catch (error) {
      console.error('Error loading contacts:', error);
      let errorMessage = 'Failed to load contacts';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, selectedYear?.id]);

  /**
   * Add a new contact
   */
  const addContact = useCallback(async (contactData: ContactFormData) => {
    if (!user || !selectedYear) {
      throw new Error('User not authenticated or no year selected');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      const contact = {
        userId: user.uid,
        yearId: selectedYear.id,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        enterpriseName: contactData.enterpriseName,
        comments: contactData.comments || '',
        delivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const contactId = await firestoreService.addContact(
        user.uid,
        selectedYear.id,
        contact
      );

      const newContact: Contact = {
        id: contactId,
        ...contact,
      };

      dispatch({ type: 'ADD_CONTACT', payload: newContact });
    } catch (error) {
      console.error('Error adding contact:', error);
      let errorMessage = 'Failed to add contact';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user, selectedYear]);

  /**
   * Update an existing contact
   */
  const updateContact = useCallback(async (
    contactId: string,
    updates: Partial<Contact>
  ) => {
    if (!user || !selectedYear) {
      throw new Error('User not authenticated or no year selected');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      await firestoreService.updateContact(
        user.uid,
        selectedYear.id,
        contactId,
        updates
      );

      dispatch({ type: 'UPDATE_CONTACT', payload: { contactId, updates } });
    } catch (error) {
      console.error('Error updating contact:', error);
      let errorMessage = 'Failed to update contact';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof ValidationError) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user, selectedYear]);

  /**
   * Delete a contact
   */
  const deleteContact = useCallback(async (contactId: string) => {
    if (!user || !selectedYear) {
      throw new Error('User not authenticated or no year selected');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      await firestoreService.deleteContact(user.uid, selectedYear.id, contactId);
      dispatch({ type: 'DELETE_CONTACT', payload: contactId });
    } catch (error) {
      console.error('Error deleting contact:', error);
      let errorMessage = 'Failed to delete contact';
      
      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [user, selectedYear]);

  /**
   * Toggle delivery status of a contact
   */
  const toggleDelivery = useCallback(async (contactId: string) => {
    const contact = state.contacts.find((c) => c.id === contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    const updates = {
      delivered: !contact.delivered,
      deliveredAt: !contact.delivered ? new Date() : null,
    };

    await updateContact(contactId, updates);
  }, [state.contacts, updateContact]);

  /**
   * Refresh contacts data
   */
  const refreshContacts = useCallback(async () => {
    await loadContacts();
  }, [loadContacts]);

  // Load contacts when selected year changes
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Context value
  const contextValue: ContactContextType = {
    contacts: state.contacts,
    loading: state.loading,
    addContact,
    updateContact,
    deleteContact,
    toggleDelivery,
    refreshContacts,
  };

  return (
    <ContactContext.Provider value={contextValue}>
      {children}
    </ContactContext.Provider>
  );
};

/**
 * Hook to use contact context
 */
export const useContact = (): ContactContextType => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContact must be used within a ContactProvider');
  }
  return context;
};