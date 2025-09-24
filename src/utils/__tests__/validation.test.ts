import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateAuthForm,
  validateContactForm,
  sanitizeInput,
  isEmptyOrWhitespace,
} from "../validation";
import { AuthFormData, ContactFormData } from "../../types";

describe("Validation Utilities", () => {
  describe("validateEmail", () => {
    it("validates correct email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user123@test-domain.com",
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("rejects invalid email addresses", () => {
      const invalidEmails = [
        "",
        "invalid",
        "invalid@",
        "@invalid.com",
        "invalid.com",
        "invalid@.com",
        "invalid@com.",
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("returns appropriate error messages", () => {
      const emptyResult = validateEmail("");
      expect(emptyResult.errors[0]).toBe("Email is required");

      const invalidResult = validateEmail("invalid-email");
      expect(invalidResult.errors[0]).toBe(
        "Please enter a valid email address"
      );
    });
  });

  describe("validatePassword", () => {
    it("validates correct passwords", () => {
      const validPasswords = [
        "password123",
        "mySecurePass",
        "123456",
        "a".repeat(50),
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("rejects invalid passwords", () => {
      const invalidPasswords = ["", "12345", "short"];

      invalidPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("returns appropriate error messages", () => {
      const emptyResult = validatePassword("");
      expect(emptyResult.errors[0]).toBe("Password is required");

      const shortResult = validatePassword("123");
      expect(shortResult.errors[0]).toBe(
        "Password must be at least 6 characters long"
      );
    });
  });

  describe("validateConfirmPassword", () => {
    it("validates matching passwords", () => {
      const result = validateConfirmPassword("password123", "password123");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects non-matching passwords", () => {
      const result = validateConfirmPassword("password123", "different");
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe("Passwords do not match");
    });

    it("rejects empty confirm password", () => {
      const result = validateConfirmPassword("password123", "");
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe("Please confirm your password");
    });
  });

  describe("validateAuthForm", () => {
    const validFormData: AuthFormData = {
      email: "test@example.com",
      password: "password123",
    };

    it("validates correct sign in form", () => {
      const result = validateAuthForm(validFormData, false);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("validates correct sign up form", () => {
      const result = validateAuthForm(validFormData, true, "password123");
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("rejects invalid email in form", () => {
      const invalidFormData = { ...validFormData, email: "invalid" };
      const result = validateAuthForm(invalidFormData, false);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address");
    });

    it("rejects invalid password in form", () => {
      const invalidFormData = { ...validFormData, password: "123" };
      const result = validateAuthForm(invalidFormData, false);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe(
        "Password must be at least 6 characters long"
      );
    });

    it("rejects non-matching confirm password in sign up", () => {
      const result = validateAuthForm(validFormData, true, "different");
      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe("Passwords do not match");
    });
  });

  describe("validateContactForm", () => {
    const validFormData: ContactFormData = {
      firstName: "John",
      lastName: "Doe",
      enterpriseName: "Acme Corp",
      comments: "Test comment",
    };

    it("validates correct contact form", () => {
      const result = validateContactForm(validFormData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("validates form without comments", () => {
      const formWithoutComments = { ...validFormData, comments: "" };
      const result = validateContactForm(formWithoutComments);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("rejects empty first name", () => {
      const invalidFormData = { ...validFormData, firstName: "" };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe("First name is required");
    });

    it("rejects empty last name", () => {
      const invalidFormData = { ...validFormData, lastName: "   " };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.lastName).toBe("Last name is required");
    });

    it("rejects empty enterprise name", () => {
      const invalidFormData = { ...validFormData, enterpriseName: "" };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.enterpriseName).toBe("Enterprise name is required");
    });

    it("rejects too long first name", () => {
      const invalidFormData = { ...validFormData, firstName: "a".repeat(51) };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe(
        "First name must be 50 characters or less"
      );
    });

    it("rejects too long last name", () => {
      const invalidFormData = { ...validFormData, lastName: "b".repeat(51) };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.lastName).toBe(
        "Last name must be 50 characters or less"
      );
    });

    it("rejects too long enterprise name", () => {
      const invalidFormData = {
        ...validFormData,
        enterpriseName: "c".repeat(101),
      };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.enterpriseName).toBe(
        "Enterprise name must be 100 characters or less"
      );
    });

    it("rejects too long comments", () => {
      const invalidFormData = { ...validFormData, comments: "d".repeat(501) };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.comments).toBe(
        "Comments must be 500 characters or less"
      );
    });

    it("validates all required fields together", () => {
      const invalidFormData: ContactFormData = {
        firstName: "",
        lastName: "",
        enterpriseName: "",
        comments: "e".repeat(501),
      };
      const result = validateContactForm(invalidFormData);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe("First name is required");
      expect(result.errors.lastName).toBe("Last name is required");
      expect(result.errors.enterpriseName).toBe("Enterprise name is required");
      expect(result.errors.comments).toBe(
        "Comments must be 500 characters or less"
      );
    });
  });

  describe("sanitizeInput", () => {
    it("trims whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
      expect(sanitizeInput("\t\ntest\t\n")).toBe("test");
    });

    it("removes XSS characters", () => {
      expect(sanitizeInput('hello<script>alert("xss")</script>')).toBe(
        'helloscriptalert("xss")/script'
      );
      expect(sanitizeInput("test<>content")).toBe("testcontent");
    });

    it("handles empty strings", () => {
      expect(sanitizeInput("")).toBe("");
      expect(sanitizeInput("   ")).toBe("");
    });

    it("preserves normal content", () => {
      expect(sanitizeInput("John Doe")).toBe("John Doe");
      expect(sanitizeInput("test@example.com")).toBe("test@example.com");
      expect(sanitizeInput("Company & Co.")).toBe("Company & Co.");
    });
  });

  describe("isEmptyOrWhitespace", () => {
    it("returns true for empty or whitespace strings", () => {
      expect(isEmptyOrWhitespace("")).toBe(true);
      expect(isEmptyOrWhitespace("   ")).toBe(true);
      expect(isEmptyOrWhitespace("\t\n")).toBe(true);
      expect(isEmptyOrWhitespace("  \t  \n  ")).toBe(true);
    });

    it("returns false for strings with content", () => {
      expect(isEmptyOrWhitespace("hello")).toBe(false);
      expect(isEmptyOrWhitespace("  hello  ")).toBe(false);
      expect(isEmptyOrWhitespace("a")).toBe(false);
      expect(isEmptyOrWhitespace("0")).toBe(false);
    });

    it("handles undefined and null gracefully", () => {
      expect(isEmptyOrWhitespace(undefined as any)).toBe(true);
      expect(isEmptyOrWhitespace(null as any)).toBe(true);
    });
  });
});
