import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { ValidationError, NetworkError } from "../types";

/**
 * Database initialization service for setting up Firestore collections structure
 * and managing database schema operations
 */
export class DatabaseInitService {
  private static instance: DatabaseInitService;

  private constructor() {}

  /**
   * Get singleton instance of DatabaseInitService
   */
  public static getInstance(): DatabaseInitService {
    if (!DatabaseInitService.instance) {
      DatabaseInitService.instance = new DatabaseInitService();
    }
    return DatabaseInitService.instance;
  }

  /**
   * Initialize database schema for a new user
   * Creates the required collection structure and default documents
   */
  public async initializeUserSchema(userId: string): Promise<void> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    try {
      const batch = writeBatch(db);

      // Create user preferences document
      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      batch.set(preferencesRef, {
        userId,
        lastSelectedYearId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create a default year for the current year
      const currentYear = new Date().getFullYear().toString();
      const yearRef = doc(collection(db, "users", userId, "years"));
      batch.set(yearRef, {
        userId,
        name: currentYear,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update preferences to point to the new year
      batch.update(preferencesRef, {
        lastSelectedYearId: yearRef.id,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      console.log(`Database schema initialized for user: ${userId}`);
    } catch (error) {
      console.error("Error initializing user schema:", error);
      throw new NetworkError(
        "Failed to initialize database schema. Please try again.",
        "initialization-failed",
        { userId, originalError: error }
      );
    }
  }

  /**
   * Create collections structure for a user if they don't exist
   * This is a safe operation that won't overwrite existing data
   */
  public async ensureCollectionsExist(userId: string): Promise<void> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    try {
      // Check if user preferences exist
      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      const preferencesDoc = await getDoc(preferencesRef);

      if (!preferencesDoc.exists()) {
        // Initialize schema if preferences don't exist
        await this.initializeUserSchema(userId);
      } else {
        // Ensure user has at least one year
        const yearsRef = collection(db, "users", userId, "years");
        const yearsSnapshot = await getDocs(yearsRef);

        if (yearsSnapshot.empty) {
          // Create default year if none exist
          const currentYear = new Date().getFullYear().toString();
          const yearRef = doc(yearsRef);

          await setDoc(yearRef, {
            userId,
            name: currentYear,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Update preferences to point to the new year
          await setDoc(
            preferencesRef,
            {
              lastSelectedYearId: yearRef.id,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      console.log(`Collections verified for user: ${userId}`);
    } catch (error) {
      console.error("Error ensuring collections exist:", error);
      throw new NetworkError(
        "Failed to verify database collections. Please try again.",
        "collections-verification-failed",
        { userId, originalError: error }
      );
    }
  }

  /**
   * Validate database schema for a user
   * Checks that all required collections and documents exist with proper structure
   */
  public async validateUserSchema(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      errors.push("User ID is required and must be a non-empty string");
      return { isValid: false, errors, warnings };
    }

    try {
      // Check user preferences document
      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      const preferencesDoc = await getDoc(preferencesRef);

      if (!preferencesDoc.exists()) {
        errors.push("User preferences document does not exist");
      } else {
        const preferencesData = preferencesDoc.data();

        // Validate preferences structure
        if (!preferencesData.userId || preferencesData.userId !== userId) {
          errors.push("Invalid or missing userId in preferences");
        }

        if (!preferencesData.createdAt) {
          warnings.push("Missing createdAt timestamp in preferences");
        }

        if (!preferencesData.updatedAt) {
          warnings.push("Missing updatedAt timestamp in preferences");
        }
      }

      // Check years collection
      const yearsRef = collection(db, "users", userId, "years");
      const yearsSnapshot = await getDocs(yearsRef);

      if (yearsSnapshot.empty) {
        warnings.push("No years found for user");
      } else {
        // Validate each year document
        yearsSnapshot.forEach((yearDoc) => {
          const yearData = yearDoc.data();

          if (!yearData.userId || yearData.userId !== userId) {
            errors.push(`Invalid or missing userId in year: ${yearDoc.id}`);
          }

          if (!yearData.name || typeof yearData.name !== "string") {
            errors.push(`Invalid or missing name in year: ${yearDoc.id}`);
          }

          if (!yearData.createdAt) {
            warnings.push(`Missing createdAt timestamp in year: ${yearDoc.id}`);
          }

          if (!yearData.updatedAt) {
            warnings.push(`Missing updatedAt timestamp in year: ${yearDoc.id}`);
          }
        });
      }

      // Check for orphaned contacts (contacts without valid year references)
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

        contactsSnapshot.forEach((contactDoc) => {
          const contactData = contactDoc.data();

          if (!contactData.userId || contactData.userId !== userId) {
            errors.push(
              `Invalid or missing userId in contact: ${contactDoc.id}`
            );
          }

          if (!contactData.yearId || contactData.yearId !== yearDoc.id) {
            errors.push(
              `Invalid or missing yearId in contact: ${contactDoc.id}`
            );
          }

          // Validate required contact fields
          const requiredFields = ["firstName", "lastName", "enterpriseName"];
          requiredFields.forEach((field) => {
            if (!contactData[field] || typeof contactData[field] !== "string") {
              errors.push(
                `Invalid or missing ${field} in contact: ${contactDoc.id}`
              );
            }
          });

          // Validate boolean fields
          if (typeof contactData.delivered !== "boolean") {
            errors.push(`Invalid delivered field in contact: ${contactDoc.id}`);
          }

          // Validate timestamps
          if (!contactData.createdAt) {
            warnings.push(
              `Missing createdAt timestamp in contact: ${contactDoc.id}`
            );
          }

          if (!contactData.updatedAt) {
            warnings.push(
              `Missing updatedAt timestamp in contact: ${contactDoc.id}`
            );
          }
        });
      }

      const isValid = errors.length === 0;

      console.log(`Schema validation completed for user: ${userId}`, {
        isValid,
        errorsCount: errors.length,
        warningsCount: warnings.length,
      });

      return { isValid, errors, warnings };
    } catch (error) {
      console.error("Error validating user schema:", error);
      errors.push(
        `Schema validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Clean up orphaned data and fix schema inconsistencies
   * This is a maintenance operation that should be used carefully
   */
  public async cleanupUserData(
    userId: string,
    options: {
      removeOrphanedContacts?: boolean;
      fixMissingTimestamps?: boolean;
      fixInvalidReferences?: boolean;
    } = {}
  ): Promise<{
    cleaned: boolean;
    operations: string[];
    errors: string[];
  }> {
    const operations: string[] = [];
    const errors: string[] = [];

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      errors.push("User ID is required and must be a non-empty string");
      return { cleaned: false, operations, errors };
    }

    try {
      const batch = writeBatch(db);
      let batchOperations = 0;
      const maxBatchSize = 500; // Firestore batch limit

      // Get all years for the user
      const yearsRef = collection(db, "users", userId, "years");
      const yearsSnapshot = await getDocs(yearsRef);
      const validYearIds = new Set(yearsSnapshot.docs.map((doc) => doc.id));

      // Check and clean contacts
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
          const contactData = contactDoc.data();
          const updates: Record<string, unknown> = {};
          let needsUpdate = false;

          // Fix missing or invalid userId
          if (
            options.fixInvalidReferences &&
            (!contactData.userId || contactData.userId !== userId)
          ) {
            updates.userId = userId;
            needsUpdate = true;
            operations.push(`Fixed userId for contact: ${contactDoc.id}`);
          }

          // Fix missing or invalid yearId
          if (
            options.fixInvalidReferences &&
            (!contactData.yearId || contactData.yearId !== yearDoc.id)
          ) {
            updates.yearId = yearDoc.id;
            needsUpdate = true;
            operations.push(`Fixed yearId for contact: ${contactDoc.id}`);
          }

          // Fix missing timestamps
          if (options.fixMissingTimestamps) {
            if (!contactData.createdAt) {
              updates.createdAt = serverTimestamp();
              needsUpdate = true;
              operations.push(
                `Added createdAt timestamp for contact: ${contactDoc.id}`
              );
            }

            if (!contactData.updatedAt) {
              updates.updatedAt = serverTimestamp();
              needsUpdate = true;
              operations.push(
                `Added updatedAt timestamp for contact: ${contactDoc.id}`
              );
            }
          }

          // Apply updates if needed
          if (needsUpdate) {
            batch.update(contactDoc.ref, updates);
            batchOperations++;

            // Commit batch if approaching limit
            if (batchOperations >= maxBatchSize) {
              await batch.commit();
              batchOperations = 0;
            }
          }
        }
      }

      // Fix year documents
      for (const yearDoc of yearsSnapshot.docs) {
        const yearData = yearDoc.data();
        const updates: Record<string, unknown> = {};
        let needsUpdate = false;

        // Fix missing or invalid userId
        if (
          options.fixInvalidReferences &&
          (!yearData.userId || yearData.userId !== userId)
        ) {
          updates.userId = userId;
          needsUpdate = true;
          operations.push(`Fixed userId for year: ${yearDoc.id}`);
        }

        // Fix missing timestamps
        if (options.fixMissingTimestamps) {
          if (!yearData.createdAt) {
            updates.createdAt = serverTimestamp();
            needsUpdate = true;
            operations.push(
              `Added createdAt timestamp for year: ${yearDoc.id}`
            );
          }

          if (!yearData.updatedAt) {
            updates.updatedAt = serverTimestamp();
            needsUpdate = true;
            operations.push(
              `Added updatedAt timestamp for year: ${yearDoc.id}`
            );
          }
        }

        // Apply updates if needed
        if (needsUpdate) {
          batch.update(yearDoc.ref, updates);
          batchOperations++;
        }
      }

      // Fix preferences document
      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      const preferencesDoc = await getDoc(preferencesRef);

      if (preferencesDoc.exists()) {
        const preferencesData = preferencesDoc.data();
        const updates: Record<string, unknown> = {};
        let needsUpdate = false;

        // Fix invalid lastSelectedYearId reference
        if (
          options.fixInvalidReferences &&
          preferencesData.lastSelectedYearId &&
          !validYearIds.has(preferencesData.lastSelectedYearId)
        ) {
          // Set to first available year or null
          updates.lastSelectedYearId =
            validYearIds.size > 0 ? Array.from(validYearIds)[0] : null;
          needsUpdate = true;
          operations.push("Fixed invalid lastSelectedYearId in preferences");
        }

        // Fix missing timestamps
        if (options.fixMissingTimestamps) {
          if (!preferencesData.createdAt) {
            updates.createdAt = serverTimestamp();
            needsUpdate = true;
            operations.push("Added createdAt timestamp for preferences");
          }

          if (!preferencesData.updatedAt) {
            updates.updatedAt = serverTimestamp();
            needsUpdate = true;
            operations.push("Added updatedAt timestamp for preferences");
          }
        }

        if (needsUpdate) {
          batch.update(preferencesRef, updates);
          batchOperations++;
        }
      }

      // Commit any remaining operations
      if (batchOperations > 0) {
        await batch.commit();
      }

      const cleaned = operations.length > 0;

      console.log(`Data cleanup completed for user: ${userId}`, {
        cleaned,
        operationsCount: operations.length,
        errorsCount: errors.length,
      });

      return { cleaned, operations, errors };
    } catch (error) {
      console.error("Error cleaning up user data:", error);
      errors.push(
        `Data cleanup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { cleaned: false, operations, errors };
    }
  }

  /**
   * Get database statistics for a user
   * Useful for monitoring and debugging
   */
  public async getUserDatabaseStats(userId: string): Promise<{
    yearsCount: number;
    contactsCount: number;
    totalContactsByYear: Record<string, number>;
    deliveredContactsCount: number;
    hasPreferences: boolean;
    lastUpdated: Date | null;
  }> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    try {
      const stats = {
        yearsCount: 0,
        contactsCount: 0,
        totalContactsByYear: {} as Record<string, number>,
        deliveredContactsCount: 0,
        hasPreferences: false,
        lastUpdated: null as Date | null,
      };

      // Check preferences
      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      const preferencesDoc = await getDoc(preferencesRef);
      stats.hasPreferences = preferencesDoc.exists();

      if (preferencesDoc.exists()) {
        const preferencesData = preferencesDoc.data();
        if (preferencesData.updatedAt) {
          stats.lastUpdated = preferencesData.updatedAt.toDate();
        }
      }

      // Get years and contacts
      const yearsRef = collection(db, "users", userId, "years");
      const yearsSnapshot = await getDocs(yearsRef);
      stats.yearsCount = yearsSnapshot.size;

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

        const yearContactsCount = contactsSnapshot.size;
        stats.totalContactsByYear[yearDoc.data().name || yearDoc.id] =
          yearContactsCount;
        stats.contactsCount += yearContactsCount;

        // Count delivered contacts
        contactsSnapshot.forEach((contactDoc) => {
          const contactData = contactDoc.data();
          if (contactData.delivered === true) {
            stats.deliveredContactsCount++;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error("Error getting user database stats:", error);
      throw new NetworkError(
        "Failed to retrieve database statistics. Please try again.",
        "stats-retrieval-failed",
        { userId, originalError: error }
      );
    }
  }
}

// Export singleton instance
export default DatabaseInitService.getInstance();
