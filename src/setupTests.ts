// Setup file for Jest tests

// Global test environment setup
// __DEV__ is already declared by React Native types, just assign it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__DEV__ = true;

// Mock process.env for tests
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-project.firebaseapp.com";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef123456";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));
