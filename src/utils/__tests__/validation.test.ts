import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateAuthForm,
  sanitizeInput,
  isEmptyOrWhitespace,
} from "../validation";
import { AuthFormData } from "../../types";

describe("Validation Utilities", () => {
  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "123@example.com",
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "",
        " ",
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("should return appropriate error messages", () => {
      const emptyResult = validateEmail("");
      expect(emptyResult.errors).toContain("Email is required");

      const invalidResult = validateEmail("invalid-email");
      expect(invalidResult.errors).toContain(
        "Please enter a valid email address"
      );
    });
  });

  describe("validatePassword", () => {
    it("should validate strong passwords", () => {
      const validPasswords = [
        "password123",
        "strongPassword!",
        "123456",
        "abcdef",
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("should reject weak passwords", () => {
      const weakPasswords = ["", "12345", "abc", " "];

      weakPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("should return appropriate error messages", () => {
      const emptyResult = validatePassword("");
      expect(emptyResult.errors).toContain("Password is required");

      const shortResult = validatePassword("123");
      expect(shortResult.errors).toContain(
        "Password must be at least 6 characters long"
      );
    });
  });

  describe("validateConfirmPassword", () => {
    it("should validate matching passwords", () => {
      const result = validateConfirmPassword("password123", "password123");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-matching passwords", () => {
      const result = validateConfirmPassword("password123", "different");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Passwords do not match");
    });

    it("should reject empty confirm password", () => {
      const result = validateConfirmPassword("password123", "");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Please confirm your password");
    });
  });

  describe("validateAuthForm", () => {
    const validFormData: AuthFormData = {
      email: "test@example.com",
      password: "password123",
    };

    it("should validate correct sign in form", () => {
      const result = validateAuthForm(validFormData, false);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should validate correct sign up form with matching passwords", () => {
      const result = validateAuthForm(validFormData, true, "password123");
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should reject sign up form with non-matching passwords", () => {
      const result = validateAuthForm(validFormData, true, "different");
      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe("Passwords do not match");
    });

    it("should reject form with invalid email", () => {
      const invalidFormData: AuthFormData = {
        email: "invalid-email",
        password: "password123",
      };

      const result = validateAuthForm(invalidFormData, false);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address");
    });

    it("should reject form with weak password", () => {
      const invalidFormData: AuthFormData = {
        email: "test@example.com",
        password: "123",
      };

      const result = validateAuthForm(invalidFormData, false);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe(
        "Password must be at least 6 characters long"
      );
    });

    it("should reject form with multiple errors", () => {
      const invalidFormData: AuthFormData = {
        email: "invalid-email",
        password: "123",
      };

      const result = validateAuthForm(invalidFormData, true, "different");
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address");
      expect(result.errors.password).toBe(
        "Password must be at least 6 characters long"
      );
      expect(result.errors.confirmPassword).toBe("Passwords do not match");
    });
  });

  describe("sanitizeInput", () => {
    it("should trim whitespace", () => {
      expect(sanitizeInput("  test  ")).toBe("test");
      expect(sanitizeInput("\n\ttest\n\t")).toBe("test");
    });

    it("should remove dangerous characters", () => {
      expect(sanitizeInput("test<script>")).toBe("testscript");
      expect(sanitizeInput("test>alert")).toBe("testalert");
      expect(sanitizeInput("<>test<>")).toBe("test");
    });

    it("should handle empty strings", () => {
      expect(sanitizeInput("")).toBe("");
      expect(sanitizeInput("   ")).toBe("");
    });

    it("should preserve safe characters", () => {
      const safeInput = "test@example.com with spaces & symbols!";
      expect(sanitizeInput(safeInput)).toBe(
        "test@example.com with spaces & symbols!"
      );
    });
  });

  describe("isEmptyOrWhitespace", () => {
    it("should return true for empty or whitespace strings", () => {
      expect(isEmptyOrWhitespace("")).toBe(true);
      expect(isEmptyOrWhitespace("   ")).toBe(true);
      expect(isEmptyOrWhitespace("\n\t")).toBe(true);
    });

    it("should return false for non-empty strings", () => {
      expect(isEmptyOrWhitespace("test")).toBe(false);
      expect(isEmptyOrWhitespace("  test  ")).toBe(false);
      expect(isEmptyOrWhitespace("0")).toBe(false);
    });
  });
});
