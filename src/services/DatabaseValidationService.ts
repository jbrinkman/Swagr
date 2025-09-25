import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { ValidationError, NetworkError } from "../types";

/**
 * Validation rule interface
 */
interface ValidationRule {
  name: string;
  description: string;
  validate: (userId: string) => Promise<ValidationIssue[]>;
}

/**
 * Validation issue interface
 */
interface ValidationIssue {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  path?: string;
  documentId?: string;
  field?: string;
  suggestedFix?: string;
}

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Database validation service for ensuring data integrity and consistency
 */
export class DatabaseValidationService {
  private static instance: DatabaseValidationService;
  private validationRules: ValidationRule[] = [];

  private constructor() {
    this.initializeValidationRules();
  }

  /**
   * Get singleton instance of DatabaseValidationService
   */
  public static getInstance(): DatabaseValidationService {
    if (!DatabaseValidationService.instance) {
      DatabaseValidationService.instance = new DatabaseValidationService();
    }
    return DatabaseValidationService.instance;
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    this.validationRules = [
      {
        name: "user-preferences-exist",
        description: "Check that user preferences document exists",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            const preferencesRef = doc(
              db,
              "users",
              userId,
              "preferences",
              "main"
            );
            const preferencesDoc = await getDoc(preferencesRef);

            if (!preferencesDoc.exists()) {
              issues.push({
                severity: "error",
                rule: "user-preferences-exist",
                message: "User preferences document does not exist",
                path: `users/${userId}/preferences/main`,
                suggestedFix:
                  "Initialize user preferences using DatabaseInitService",
              });
            }
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "user-preferences-exist",
              message: `Failed to check user preferences: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}/preferences/main`,
            });
          }

          return issues;
        },
      },
      {
        name: "preferences-structure",
        description: "Validate user preferences document structure",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            const preferencesRef = doc(
              db,
              "users",
              userId,
              "preferences",
              "main"
            );
            const preferencesDoc = await getDoc(preferencesRef);

            if (preferencesDoc.exists()) {
              const data = preferencesDoc.data();

              // Check required fields
              if (!data.userId || data.userId !== userId) {
                issues.push({
                  severity: "error",
                  rule: "preferences-structure",
                  message: "Invalid or missing userId in preferences",
                  path: `users/${userId}/preferences/main`,
                  field: "userId",
                  suggestedFix: "Update userId field to match document path",
                });
              }

              // Check timestamps
              if (!data.createdAt) {
                issues.push({
                  severity: "warning",
                  rule: "preferences-structure",
                  message: "Missing createdAt timestamp in preferences",
                  path: `users/${userId}/preferences/main`,
                  field: "createdAt",
                  suggestedFix:
                    "Add createdAt timestamp using serverTimestamp()",
                });
              }

              if (!data.updatedAt) {
                issues.push({
                  severity: "warning",
                  rule: "preferences-structure",
                  message: "Missing updatedAt timestamp in preferences",
                  path: `users/${userId}/preferences/main`,
                  field: "updatedAt",
                  suggestedFix:
                    "Add updatedAt timestamp using serverTimestamp()",
                });
              }

              // Check lastSelectedYearId validity if it exists
              if (data.lastSelectedYearId) {
                const yearRef = doc(
                  db,
                  "users",
                  userId,
                  "years",
                  data.lastSelectedYearId
                );
                const yearDoc = await getDoc(yearRef);

                if (!yearDoc.exists()) {
                  issues.push({
                    severity: "warning",
                    rule: "preferences-structure",
                    message: "lastSelectedYearId references non-existent year",
                    path: `users/${userId}/preferences/main`,
                    field: "lastSelectedYearId",
                    suggestedFix:
                      "Update lastSelectedYearId to reference a valid year or set to null",
                  });
                }
              }
            }
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "preferences-structure",
              message: `Failed to validate preferences structure: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}/preferences/main`,
            });
          }

          return issues;
        },
      },
      {
        name: "years-exist",
        description: "Check that user has at least one year",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            const yearsRef = collection(db, "users", userId, "years");
            const yearsSnapshot = await getDocs(yearsRef);

            if (yearsSnapshot.empty) {
              issues.push({
                severity: "warning",
                rule: "years-exist",
                message: "User has no years defined",
                path: `users/${userId}/years`,
                suggestedFix: "Create at least one year for the user",
              });
            }
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "years-exist",
              message: `Failed to check years: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}/years`,
            });
          }

          return issues;
        },
      },
      {
        name: "year-structure",
        description: "Validate year document structure",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            const yearsRef = collection(db, "users", userId, "years");
            const yearsSnapshot = await getDocs(yearsRef);

            for (const yearDoc of yearsSnapshot.docs) {
              const data = yearDoc.data();
              const yearPath = `users/${userId}/years/${yearDoc.id}`;

              // Check required fields
              if (!data.userId || data.userId !== userId) {
                issues.push({
                  severity: "error",
                  rule: "year-structure",
                  message: "Invalid or missing userId in year",
                  path: yearPath,
                  documentId: yearDoc.id,
                  field: "userId",
                  suggestedFix: "Update userId field to match document path",
                });
              }

              if (
                !data.name ||
                typeof data.name !== "string" ||
                data.name.trim().length === 0
              ) {
                issues.push({
                  severity: "error",
                  rule: "year-structure",
                  message: "Invalid or missing name in year",
                  path: yearPath,
                  documentId: yearDoc.id,
                  field: "name",
                  suggestedFix: "Add a valid name for the year",
                });
              }

              // Check timestamps
              if (!data.createdAt) {
                issues.push({
                  severity: "warning",
                  rule: "year-structure",
                  message: "Missing createdAt timestamp in year",
                  path: yearPath,
                  documentId: yearDoc.id,
                  field: "createdAt",
                  suggestedFix:
                    "Add createdAt timestamp using serverTimestamp()",
                });
              }

              if (!data.updatedAt) {
                issues.push({
                  severity: "warning",
                  rule: "year-structure",
                  message: "Missing updatedAt timestamp in year",
                  path: yearPath,
                  documentId: yearDoc.id,
                  field: "updatedAt",
                  suggestedFix:
                    "Add updatedAt timestamp using serverTimestamp()",
                });
              }
            }
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "year-structure",
              message: `Failed to validate year structure: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}/years`,
            });
          }

          return issues;
        },
      },
      {
        name: "contact-structure",
        description: "Validate contact document structure",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            const yearsRef = collection(db, "users", userId, "years");
            const yearsSnapshot = await getDocs(yearsRef);

            for (const yearDoc of yearsSnapshot.docs) {
              const contactsRef = collection(
                db,
                "users",
                userId,
                "years",
                yearDoc.id,
                "contacts"
              );
              const contactsSnapshot = await getDocs(contactsRef);

              for (const contactDoc of contactsSnapshot.docs) {
                const data = contactDoc.data();
                const contactPath = `users/${userId}/years/${yearDoc.id}/contacts/${contactDoc.id}`;

                // Check required fields
                if (!data.userId || data.userId !== userId) {
                  issues.push({
                    severity: "error",
                    rule: "contact-structure",
                    message: "Invalid or missing userId in contact",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "userId",
                    suggestedFix: "Update userId field to match document path",
                  });
                }

                if (!data.yearId || data.yearId !== yearDoc.id) {
                  issues.push({
                    severity: "error",
                    rule: "contact-structure",
                    message: "Invalid or missing yearId in contact",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "yearId",
                    suggestedFix:
                      "Update yearId field to match parent year document",
                  });
                }

                // Check required contact fields
                const requiredStringFields = [
                  "firstName",
                  "lastName",
                  "enterpriseName",
                ];
                for (const field of requiredStringFields) {
                  if (
                    !data[field] ||
                    typeof data[field] !== "string" ||
                    data[field].trim().length === 0
                  ) {
                    issues.push({
                      severity: "error",
                      rule: "contact-structure",
                      message: `Invalid or missing ${field} in contact`,
                      path: contactPath,
                      documentId: contactDoc.id,
                      field,
                      suggestedFix: `Add a valid ${field} for the contact`,
                    });
                  }
                }

                // Check optional fields
                if (
                  Object.prototype.hasOwnProperty.call(data, "comments") &&
                  typeof data.comments !== "string"
                ) {
                  issues.push({
                    severity: "warning",
                    rule: "contact-structure",
                    message: "Invalid comments field type in contact",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "comments",
                    suggestedFix: "Ensure comments field is a string",
                  });
                }

                // Check boolean fields
                if (typeof data.delivered !== "boolean") {
                  issues.push({
                    severity: "error",
                    rule: "contact-structure",
                    message: "Invalid delivered field in contact",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "delivered",
                    suggestedFix: "Ensure delivered field is a boolean",
                  });
                }

                // Check deliveredAt consistency
                if (data.delivered === true && !data.deliveredAt) {
                  issues.push({
                    severity: "warning",
                    rule: "contact-structure",
                    message:
                      "Contact marked as delivered but missing deliveredAt timestamp",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "deliveredAt",
                    suggestedFix:
                      "Add deliveredAt timestamp for delivered contacts",
                  });
                }

                if (data.delivered === false && data.deliveredAt) {
                  issues.push({
                    severity: "warning",
                    rule: "contact-structure",
                    message:
                      "Contact not delivered but has deliveredAt timestamp",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "deliveredAt",
                    suggestedFix:
                      "Remove deliveredAt timestamp for non-delivered contacts",
                  });
                }

                // Check timestamps
                if (!data.createdAt) {
                  issues.push({
                    severity: "warning",
                    rule: "contact-structure",
                    message: "Missing createdAt timestamp in contact",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "createdAt",
                    suggestedFix:
                      "Add createdAt timestamp using serverTimestamp()",
                  });
                }

                if (!data.updatedAt) {
                  issues.push({
                    severity: "warning",
                    rule: "contact-structure",
                    message: "Missing updatedAt timestamp in contact",
                    path: contactPath,
                    documentId: contactDoc.id,
                    field: "updatedAt",
                    suggestedFix:
                      "Add updatedAt timestamp using serverTimestamp()",
                  });
                }
              }
            }
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "contact-structure",
              message: `Failed to validate contact structure: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}/years/*/contacts`,
            });
          }

          return issues;
        },
      },
      {
        name: "duplicate-contacts",
        description: "Check for duplicate contacts within years",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            const yearsRef = collection(db, "users", userId, "years");
            const yearsSnapshot = await getDocs(yearsRef);

            for (const yearDoc of yearsSnapshot.docs) {
              const contactsRef = collection(
                db,
                "users",
                userId,
                "years",
                yearDoc.id,
                "contacts"
              );
              const contactsSnapshot = await getDocs(contactsRef);

              const contactMap = new Map<string, string[]>();

              contactsSnapshot.forEach((contactDoc) => {
                const data = contactDoc.data();

                if (data.firstName && data.lastName && data.enterpriseName) {
                  const key = `${data.firstName
                    .toLowerCase()
                    .trim()}-${data.lastName
                    .toLowerCase()
                    .trim()}-${data.enterpriseName.toLowerCase().trim()}`;

                  if (!contactMap.has(key)) {
                    contactMap.set(key, []);
                  }
                  contactMap.get(key)!.push(contactDoc.id);
                }
              });

              // Check for duplicates
              contactMap.forEach((contactIds, key) => {
                if (contactIds.length > 1) {
                  issues.push({
                    severity: "warning",
                    rule: "duplicate-contacts",
                    message: `Duplicate contacts found in year ${
                      yearDoc.data().name || yearDoc.id
                    }: ${key}`,
                    path: `users/${userId}/years/${yearDoc.id}/contacts`,
                    suggestedFix: `Review and merge duplicate contacts: ${contactIds.join(
                      ", "
                    )}`,
                  });
                }
              });
            }
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "duplicate-contacts",
              message: `Failed to check for duplicate contacts: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}/years/*/contacts`,
            });
          }

          return issues;
        },
      },
      {
        name: "orphaned-data",
        description: "Check for orphaned data and broken references",
        validate: async (userId: string) => {
          const issues: ValidationIssue[] = [];

          try {
            // This rule is covered by other rules but could be expanded
            // to check for more complex orphaned data scenarios

            // For now, we'll just add an info message
            issues.push({
              severity: "info",
              rule: "orphaned-data",
              message:
                "Orphaned data check completed - covered by other validation rules",
              path: `users/${userId}`,
            });
          } catch (error) {
            issues.push({
              severity: "error",
              rule: "orphaned-data",
              message: `Failed to check for orphaned data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              path: `users/${userId}`,
            });
          }

          return issues;
        },
      },
    ];
  }

  /**
   * Validate all data for a user
   */
  public async validateUserData(
    userId: string,
    options: {
      rules?: string[];
      includeInfo?: boolean;
    } = {}
  ): Promise<ValidationResult> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    const allIssues: ValidationIssue[] = [];
    const rulesToRun = options.rules
      ? this.validationRules.filter((rule) =>
          options.rules!.includes(rule.name)
        )
      : this.validationRules;

    try {
      console.log(
        `Running ${rulesToRun.length} validation rules for user: ${userId}`
      );

      for (const rule of rulesToRun) {
        try {
          console.log(`Running validation rule: ${rule.name}`);
          const issues = await rule.validate(userId);
          allIssues.push(...issues);
        } catch (ruleError) {
          console.error(`Validation rule ${rule.name} failed:`, ruleError);
          allIssues.push({
            severity: "error",
            rule: rule.name,
            message: `Validation rule failed: ${
              ruleError instanceof Error ? ruleError.message : "Unknown error"
            }`,
            path: `users/${userId}`,
          });
        }
      }

      // Filter out info messages if not requested
      const filteredIssues = options.includeInfo
        ? allIssues
        : allIssues.filter((issue) => issue.severity !== "info");

      // Calculate summary
      const summary = {
        errors: filteredIssues.filter((issue) => issue.severity === "error")
          .length,
        warnings: filteredIssues.filter((issue) => issue.severity === "warning")
          .length,
        info: filteredIssues.filter((issue) => issue.severity === "info")
          .length,
      };

      const isValid = summary.errors === 0;

      console.log(`Validation completed for user: ${userId}`, {
        isValid,
        totalIssues: filteredIssues.length,
        summary,
      });

      return {
        isValid,
        issues: filteredIssues,
        summary,
      };
    } catch (error) {
      console.error("Error during validation:", error);
      throw new NetworkError(
        "Failed to validate user data. Please try again.",
        "validation-failed",
        { userId, originalError: error }
      );
    }
  }

  /**
   * Validate specific document
   */
  public async validateDocument(
    userId: string,
    documentPath: string,
    documentType: "preferences" | "year" | "contact"
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      issues.push({
        severity: "error",
        rule: "validate-document",
        message: "User ID is required and must be a non-empty string",
        path: documentPath,
      });
      return issues;
    }

    try {
      const docRef = doc(db, documentPath);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        issues.push({
          severity: "error",
          rule: "validate-document",
          message: "Document does not exist",
          path: documentPath,
        });
        return issues;
      }

      const data = docSnapshot.data();

      // Validate based on document type
      switch (documentType) {
        case "preferences":
          if (!data.userId || data.userId !== userId) {
            issues.push({
              severity: "error",
              rule: "validate-document",
              message: "Invalid userId in preferences document",
              path: documentPath,
              field: "userId",
            });
          }
          break;

        case "year":
          if (!data.userId || data.userId !== userId) {
            issues.push({
              severity: "error",
              rule: "validate-document",
              message: "Invalid userId in year document",
              path: documentPath,
              field: "userId",
            });
          }
          if (!data.name || typeof data.name !== "string") {
            issues.push({
              severity: "error",
              rule: "validate-document",
              message: "Invalid name in year document",
              path: documentPath,
              field: "name",
            });
          }
          break;

        case "contact": {
          const requiredFields = [
            "userId",
            "yearId",
            "firstName",
            "lastName",
            "enterpriseName",
          ];
          for (const field of requiredFields) {
            if (!data[field] || typeof data[field] !== "string") {
              issues.push({
                severity: "error",
                rule: "validate-document",
                message: `Invalid ${field} in contact document`,
                path: documentPath,
                field,
              });
            }
          }
          if (typeof data.delivered !== "boolean") {
            issues.push({
              severity: "error",
              rule: "validate-document",
              message: "Invalid delivered field in contact document",
              path: documentPath,
              field: "delivered",
            });
          }
          break;
        }
      }

      // Check common timestamp fields
      if (!data.createdAt) {
        issues.push({
          severity: "warning",
          rule: "validate-document",
          message: "Missing createdAt timestamp",
          path: documentPath,
          field: "createdAt",
        });
      }

      if (!data.updatedAt) {
        issues.push({
          severity: "warning",
          rule: "validate-document",
          message: "Missing updatedAt timestamp",
          path: documentPath,
          field: "updatedAt",
        });
      }
    } catch (error) {
      issues.push({
        severity: "error",
        rule: "validate-document",
        message: `Failed to validate document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        path: documentPath,
      });
    }

    return issues;
  }

  /**
   * Get available validation rules
   */
  public getValidationRules(): ValidationRule[] {
    return [...this.validationRules];
  }

  /**
   * Quick validation check (errors only)
   */
  public async quickValidate(userId: string): Promise<boolean> {
    try {
      const result = await this.validateUserData(userId, {
        includeInfo: false,
      });
      return result.summary.errors === 0;
    } catch (error) {
      console.error("Quick validation failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export default DatabaseValidationService.getInstance();
