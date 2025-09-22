// Core data models for the Swagr app

export interface User {
  uid: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Year {
  id: string;
  userId: string;
  name: string; // e.g., "2024", "2025"
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  yearId: string;
  firstName: string;
  lastName: string;
  enterpriseName: string;
  comments: string;
  delivered: boolean;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  lastSelectedYearId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ContactForm: { contact?: Contact; isEdit?: boolean };
  ContactDetail: { contact: Contact };
  YearManagement: undefined;
};
