/**
 * Setup file for integration tests that run against Firebase emulators
 */

// Set environment variables for Firebase emulators
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef";
process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR = "true";

// Set development mode
process.env.NODE_ENV = "test";

// Mock AsyncStorage for StorageService tests
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Mock AsyncStorage module
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

// Reset AsyncStorage mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Set up default AsyncStorage behavior
  mockAsyncStorage.getItem.mockImplementation((key: string) => {
    return Promise.resolve(null);
  });

  mockAsyncStorage.setItem.mockImplementation((key: string, value: string) => {
    return Promise.resolve();
  });

  mockAsyncStorage.removeItem.mockImplementation((key: string) => {
    return Promise.resolve();
  });

  mockAsyncStorage.clear.mockImplementation(() => {
    return Promise.resolve();
  });
});

// Global test timeout for integration tests
jest.setTimeout(30000);

// Suppress console warnings during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.warn = jest.fn();
  console.error = jest.fn();

  // Restore console for specific test debugging
  (global as any).restoreConsole = () => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  };
}

// Helper to check if emulators are running
export const checkEmulatorsRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch("http://localhost:4000", {
      method: "HEAD",
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Skip tests if emulators are not running
beforeAll(async () => {
  const emulatorsRunning = await checkEmulatorsRunning();

  if (!emulatorsRunning) {
    console.warn("⚠️  Firebase emulators are not running!");
    console.warn("   Start emulators with: pnpm emulators:start");
    console.warn("   Or run tests with emulators: pnpm test:emulators");
    console.warn("   Skipping integration tests...");

    // Skip all tests in this suite
    process.exit(0);
  } else {
    console.log("✅ Firebase emulators detected, running integration tests");
  }
});
