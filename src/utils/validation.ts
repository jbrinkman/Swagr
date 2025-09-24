import { ValidationResult, AuthFormData, ContactFormData } from "../types";

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Please enter a valid email address");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate confirm password matches original password
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  const errors: string[] = [];

  if (!confirmPassword) {
    errors.push("Please confirm your password");
  } else if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate complete authentication form data
 */
export const validateAuthForm = (
  formData: AuthFormData,
  isSignUp: boolean = false,
  confirmPassword?: string
): {
  isValid: boolean;
  errors: Partial<Record<keyof AuthFormData | "confirmPassword", string>>;
} => {
  const errors: Partial<
    Record<keyof AuthFormData | "confirmPassword", string>
  > = {};

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0];
  }

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0];
  }

  // Validate confirm password for sign up
  if (isSignUp && confirmPassword !== undefined) {
    const confirmPasswordValidation = validateConfirmPassword(
      formData.password,
      confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      errors.confirmPassword = confirmPasswordValidation.errors[0];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input text to prevent XSS and other issues
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

/**
 * Check if string contains only whitespace
 */
export const isEmptyOrWhitespace = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Validate contact form data
 */
export const validateContactForm = (
  formData: ContactFormData
): {
  isValid: boolean;
  errors: Partial<Record<keyof ContactFormData, string>>;
} => {
  const errors: Partial<Record<keyof ContactFormData, string>> = {};

  // Validate first name
  if (isEmptyOrWhitespace(formData.firstName)) {
    errors.firstName = "First name is required";
  } else if (formData.firstName.trim().length > 50) {
    errors.firstName = "First name must be 50 characters or less";
  }

  // Validate last name
  if (isEmptyOrWhitespace(formData.lastName)) {
    errors.lastName = "Last name is required";
  } else if (formData.lastName.trim().length > 50) {
    errors.lastName = "Last name must be 50 characters or less";
  }

  // Validate enterprise name
  if (isEmptyOrWhitespace(formData.enterpriseName)) {
    errors.enterpriseName = "Enterprise name is required";
  } else if (formData.enterpriseName.trim().length > 100) {
    errors.enterpriseName = "Enterprise name must be 100 characters or less";
  }

  // Validate comments (optional but has length limit)
  if (formData.comments && formData.comments.trim().length > 500) {
    errors.comments = "Comments must be 500 characters or less";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
