// Core Data Models

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

// Service Interface Types

export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

export interface FirestoreService {
  // Year Management
  getYears(userId: string): Promise<Year[]>;
  addYear(userId: string, year: Omit<Year, "id">): Promise<string>;
  updateYear(
    userId: string,
    yearId: string,
    updates: Partial<Year>
  ): Promise<void>;
  deleteYear(userId: string, yearId: string): Promise<void>;

  // Contact Management
  getContacts(userId: string, yearId: string): Promise<Contact[]>;
  addContact(
    userId: string,
    yearId: string,
    contact: Omit<Contact, "id">
  ): Promise<string>;
  updateContact(
    userId: string,
    yearId: string,
    contactId: string,
    updates: Partial<Contact>
  ): Promise<void>;
  deleteContact(
    userId: string,
    yearId: string,
    contactId: string
  ): Promise<void>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences>;
  updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void>;
}

export interface StorageService {
  getLastSelectedYear(): Promise<string | null>;
  setLastSelectedYear(yearId: string): Promise<void>;
  clearStorage(): Promise<void>;
}

// Error Type Definitions

export enum ErrorType {
  AUTHENTICATION = "AUTHENTICATION",
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  PERMISSION = "PERMISSION",
  NOT_FOUND = "NOT_FOUND",
  UNKNOWN = "UNKNOWN",
}

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  details?: Record<string, any>;
}

export class AuthenticationError extends Error implements AppError {
  type = ErrorType.AUTHENTICATION as const;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error implements AppError {
  type = ErrorType.VALIDATION as const;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error implements AppError {
  type = ErrorType.NETWORK as const;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = "NetworkError";
    this.code = code;
    this.details = details;
  }
}

export class PermissionError extends Error implements AppError {
  type = ErrorType.PERMISSION as const;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = "PermissionError";
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends Error implements AppError {
  type = ErrorType.NOT_FOUND as const;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = "NotFoundError";
    this.code = code;
    this.details = details;
  }
}

// Validation Schemas and Types

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  enterpriseName: string;
  comments?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface YearFormData {
  name: string;
}

// Validation Schema Types
export type ValidationSchema<T> = {
  [K in keyof T]: (value: T[K]) => ValidationResult;
};

// Form State Types
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  YearManagement: undefined;
  ContactList: { yearId: string };
  ContactForm: {
    yearId: string;
    contact?: Contact;
    isEdit?: boolean;
  };
  ContactDetail: {
    yearId: string;
    contact: Contact;
  };
};

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface YearContextType {
  years: Year[];
  selectedYear: Year | null;
  loading: boolean;
  addYear: (name: string) => Promise<void>;
  updateYear: (yearId: string, updates: Partial<Year>) => Promise<void>;
  deleteYear: (yearId: string) => Promise<void>;
  selectYear: (yearId: string) => Promise<void>;
  refreshYears: () => Promise<void>;
}

export interface ContactContextType {
  contacts: Contact[];
  loading: boolean;
  addContact: (contact: ContactFormData) => Promise<void>;
  updateContact: (
    contactId: string,
    updates: Partial<Contact>
  ) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  toggleDelivery: (contactId: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
}

// Utility Types
export type CreateContactInput = Omit<
  Contact,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateContactInput = Partial<
  Omit<Contact, "id" | "userId" | "yearId" | "createdAt">
>;
export type CreateYearInput = Omit<Year, "id" | "createdAt" | "updatedAt">;
export type UpdateYearInput = Partial<
  Omit<Year, "id" | "userId" | "createdAt">
>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: AppError | null;
}

// Network State
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}
