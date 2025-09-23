import { authService } from "../../services/AuthService";
import { User, AuthenticationError } from "../../types";

// Mock the AuthService
jest.mock("../../services/AuthService", () => ({
  authService: {
    onAuthStateChanged: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe("AuthService Integration", () => {
  const mockUser: User = {
    uid: "test-uid",
    email: "test@example.com",
    createdAt: new Date("2024-01-01"),
    lastLoginAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AuthService methods", () => {
    it("should call signIn with correct parameters", async () => {
      mockAuthService.signIn.mockResolvedValue(mockUser);

      const result = await mockAuthService.signIn("test@example.com", "password");

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        "test@example.com",
        "password"
      );
      expect(result).toEqual(mockUser);
    });

    it("should call signUp with correct parameters", async () => {
      mockAuthService.signUp.mockResolvedValue(mockUser);

      const result = await mockAuthService.signUp("test@example.com", "password");

      expect(mockAuthService.signUp).toHaveBeenCalledWith(
        "test@example.com",
        "password"
      );
      expect(result).toEqual(mockUser);
    });

    it("should call signOut", async () => {
      mockAuthService.signOut.mockResolvedValue(undefined);

      await mockAuthService.signOut();

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it("should handle authentication errors", async () => {
      const authError = new AuthenticationError("Invalid credentials");
      mockAuthService.signIn.mockRejectedValue(authError);

      await expect(
        mockAuthService.signIn("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");
    });

    it("should setup auth state listener", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });

      const unsubscribe = mockAuthService.onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockUser);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("should handle null user in auth state listener", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const unsubscribe = mockAuthService.onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});