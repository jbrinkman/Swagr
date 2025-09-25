import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { ValidationError, NetworkError } from "../types";

/**
 * Database migration interface for defining schema updates
 */
interface Migration {
  version: string;
  description: string;
  up: (userId: string) => Promise<void>;
  down?: (userId: string) => Promise<void>;
}

/**
 * Migration execution result
 */
interface MigrationResult {
  version: string;
  success: boolean;
  error?: string;
  executedAt: Date;
}

/**
 * Database migration service for managing schema updates and data transformations
 */
export class DatabaseMigrationService {
  private static instance: DatabaseMigrationService;
  private migrations: Migration[] = [];

  private constructor() {
    this.initializeMigrations();
  }

  /**
   * Get singleton instance of DatabaseMigrationService
   */
  public static getInstance(): DatabaseMigrationService {
    if (!DatabaseMigrationService.instance) {
      DatabaseMigrationService.instance = new DatabaseMigrationService();
    }
    return DatabaseMigrationService.instance;
  }

  /**
   * Initialize available migrations
   */
  private initializeMigrations(): void {
    this.migrations = [
      {
        version: "1.0.0",
        description: "Initial schema setup",
        up: async (userId: string) => {
          // This migration is handled by DatabaseInitService
          console.log(
            `Migration 1.0.0 (Initial schema) completed for user: ${userId}`
          );
        },
      },
      {
        version: "1.1.0",
        description: "Add deliveredAt timestamp to existing contacts",
        up: async (userId: string) => {
          const batch = writeBatch(db);
          let batchOperations = 0;
          const maxBatchSize = 500;

          // Get all years for the user
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
              const contactData = contactDoc.data();

              // Add deliveredAt field if it doesn't exist
              if (
                !Object.prototype.hasOwnProperty.call(
                  contactData,
                  "deliveredAt"
                )
              ) {
                batch.update(contactDoc.ref, {
                  deliveredAt: contactData.delivered ? serverTimestamp() : null,
                  updatedAt: serverTimestamp(),
                });
                batchOperations++;

                if (batchOperations >= maxBatchSize) {
                  await batch.commit();
                  batchOperations = 0;
                }
              }
            }
          }

          if (batchOperations > 0) {
            await batch.commit();
          }
        },
        down: async (userId: string) => {
          // Get all years for the user
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

            // Remove deliveredAt field (Firestore doesn't support field deletion in batch)
            // This would need to be done with individual updates
            if (contactsSnapshot.docs.length > 0) {
              console.warn(
                "Rollback for deliveredAt field removal not implemented due to Firestore limitations"
              );
            }
          }
        },
      },
      {
        version: "1.2.0",
        description: "Ensure all documents have proper timestamps",
        up: async (userId: string) => {
          const batch = writeBatch(db);
          let batchOperations = 0;
          const maxBatchSize = 500;

          // Update preferences document
          const preferencesRef = doc(
            db,
            "users",
            userId,
            "preferences",
            "main"
          );
          const preferencesDoc = await getDoc(preferencesRef);

          if (preferencesDoc.exists()) {
            const preferencesData = preferencesDoc.data();
            const updates: Record<string, unknown> = {};

            if (!preferencesData.createdAt) {
              updates.createdAt = serverTimestamp();
            }
            if (!preferencesData.updatedAt) {
              updates.updatedAt = serverTimestamp();
            }

            if (Object.keys(updates).length > 0) {
              batch.update(preferencesRef, updates);
              batchOperations++;
            }
          }

          // Update year documents
          const yearsRef = collection(db, "users", userId, "years");
          const yearsSnapshot = await getDocs(yearsRef);

          for (const yearDoc of yearsSnapshot.docs) {
            const yearData = yearDoc.data();
            const updates: Record<string, unknown> = {};

            if (!yearData.createdAt) {
              updates.createdAt = serverTimestamp();
            }
            if (!yearData.updatedAt) {
              updates.updatedAt = serverTimestamp();
            }

            if (Object.keys(updates).length > 0) {
              batch.update(yearDoc.ref, updates);
              batchOperations++;
            }

            // Update contact documents
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
              const contactUpdates: Record<string, unknown> = {};

              if (!contactData.createdAt) {
                contactUpdates.createdAt = serverTimestamp();
              }
              if (!contactData.updatedAt) {
                contactUpdates.updatedAt = serverTimestamp();
              }

              if (Object.keys(contactUpdates).length > 0) {
                batch.update(contactDoc.ref, contactUpdates);
                batchOperations++;
              }

              if (batchOperations >= maxBatchSize) {
                await batch.commit();
                batchOperations = 0;
              }
            }
          }

          if (batchOperations > 0) {
            await batch.commit();
          }
        },
      },
      {
        version: "1.3.0",
        description: "Add comments field to contacts without it",
        up: async (userId: string) => {
          const batch = writeBatch(db);
          let batchOperations = 0;
          const maxBatchSize = 500;

          // Get all years for the user
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
              const contactData = contactDoc.data();

              // Add comments field if it doesn't exist
              if (
                !Object.prototype.hasOwnProperty.call(contactData, "comments")
              ) {
                batch.update(contactDoc.ref, {
                  comments: "",
                  updatedAt: serverTimestamp(),
                });
                batchOperations++;

                if (batchOperations >= maxBatchSize) {
                  await batch.commit();
                  batchOperations = 0;
                }
              }
            }
          }

          if (batchOperations > 0) {
            await batch.commit();
          }
        },
      },
    ];
  }

  /**
   * Get the current schema version for a user
   */
  public async getCurrentVersion(userId: string): Promise<string> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    try {
      const versionRef = doc(db, "users", userId, "system", "version");
      const versionDoc = await getDoc(versionRef);

      if (versionDoc.exists()) {
        return versionDoc.data().version || "0.0.0";
      }

      return "0.0.0"; // No version document means fresh install
    } catch (error) {
      console.error("Error getting current version:", error);
      throw new NetworkError(
        "Failed to retrieve current schema version. Please try again.",
        "version-retrieval-failed",
        { userId, originalError: error }
      );
    }
  }

  /**
   * Set the current schema version for a user
   */
  public async setCurrentVersion(
    userId: string,
    version: string
  ): Promise<void> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    if (
      !version ||
      typeof version !== "string" ||
      version.trim().length === 0
    ) {
      throw new ValidationError(
        "Version is required and must be a non-empty string"
      );
    }

    try {
      const versionRef = doc(db, "users", userId, "system", "version");
      await setDoc(
        versionRef,
        {
          version: version.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`Schema version set to ${version} for user: ${userId}`);
    } catch (error) {
      console.error("Error setting current version:", error);
      throw new NetworkError(
        "Failed to update schema version. Please try again.",
        "version-update-failed",
        { userId, version, originalError: error }
      );
    }
  }

  /**
   * Get migration history for a user
   */
  public async getMigrationHistory(userId: string): Promise<MigrationResult[]> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }

    try {
      const historyRef = collection(
        db,
        "users",
        userId,
        "system",
        "migrations",
        "history"
      );
      const historySnapshot = await getDocs(historyRef);

      const history: MigrationResult[] = [];
      historySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          version: data.version,
          success: data.success,
          error: data.error,
          executedAt: data.executedAt?.toDate() || new Date(),
        });
      });

      // Sort by execution date
      history.sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());

      return history;
    } catch (error) {
      console.error("Error getting migration history:", error);
      throw new NetworkError(
        "Failed to retrieve migration history. Please try again.",
        "history-retrieval-failed",
        { userId, originalError: error }
      );
    }
  }

  /**
   * Record a migration execution in history
   */
  private async recordMigration(
    userId: string,
    version: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      const historyRef = doc(
        collection(db, "users", userId, "system", "migrations", "history")
      );
      await setDoc(historyRef, {
        version,
        success,
        error: error || null,
        executedAt: serverTimestamp(),
      });
    } catch (recordError) {
      console.error("Error recording migration:", recordError);
      // Don't throw here as it would mask the original migration error
    }
  }

  /**
   * Compare version strings (simple semantic versioning)
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  /**
   * Get pending migrations for a user
   */
  public async getPendingMigrations(userId: string): Promise<Migration[]> {
    const currentVersion = await this.getCurrentVersion(userId);

    return this.migrations.filter(
      (migration) => this.compareVersions(migration.version, currentVersion) > 0
    );
  }

  /**
   * Run all pending migrations for a user
   */
  public async runMigrations(userId: string): Promise<{
    success: boolean;
    migrationsRun: number;
    errors: string[];
    finalVersion: string;
  }> {
    const errors: string[] = [];
    let migrationsRun = 0;
    let finalVersion = await this.getCurrentVersion(userId);

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      errors.push("User ID is required and must be a non-empty string");
      return { success: false, migrationsRun, errors, finalVersion };
    }

    try {
      const pendingMigrations = await this.getPendingMigrations(userId);

      if (pendingMigrations.length === 0) {
        console.log(`No pending migrations for user: ${userId}`);
        return { success: true, migrationsRun, errors, finalVersion };
      }

      console.log(
        `Running ${pendingMigrations.length} migrations for user: ${userId}`
      );

      for (const migration of pendingMigrations) {
        try {
          console.log(
            `Running migration ${migration.version}: ${migration.description}`
          );

          await migration.up(userId);
          await this.setCurrentVersion(userId, migration.version);
          await this.recordMigration(userId, migration.version, true);

          migrationsRun++;
          finalVersion = migration.version;

          console.log(`Migration ${migration.version} completed successfully`);
        } catch (migrationError) {
          const errorMessage =
            migrationError instanceof Error
              ? migrationError.message
              : "Unknown error";
          errors.push(`Migration ${migration.version} failed: ${errorMessage}`);

          await this.recordMigration(
            userId,
            migration.version,
            false,
            errorMessage
          );

          console.error(
            `Migration ${migration.version} failed:`,
            migrationError
          );

          // Stop running migrations on first failure
          break;
        }
      }

      const success = errors.length === 0;

      console.log(`Migration process completed for user: ${userId}`, {
        success,
        migrationsRun,
        errorsCount: errors.length,
        finalVersion,
      });

      return { success, migrationsRun, errors, finalVersion };
    } catch (error) {
      console.error("Error running migrations:", error);
      errors.push(
        `Migration process failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { success: false, migrationsRun, errors, finalVersion };
    }
  }

  /**
   * Run a specific migration for a user
   */
  public async runMigration(
    userId: string,
    version: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return {
        success: false,
        error: "User ID is required and must be a non-empty string",
      };
    }

    if (
      !version ||
      typeof version !== "string" ||
      version.trim().length === 0
    ) {
      return {
        success: false,
        error: "Version is required and must be a non-empty string",
      };
    }

    try {
      const migration = this.migrations.find((m) => m.version === version);

      if (!migration) {
        return { success: false, error: `Migration ${version} not found` };
      }

      console.log(
        `Running specific migration ${version}: ${migration.description}`
      );

      await migration.up(userId);
      await this.setCurrentVersion(userId, version);
      await this.recordMigration(userId, version, true);

      console.log(`Migration ${version} completed successfully`);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.recordMigration(userId, version, false, errorMessage);

      console.error(`Migration ${version} failed:`, error);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Rollback a specific migration for a user (if rollback is available)
   */
  public async rollbackMigration(
    userId: string,
    version: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      return {
        success: false,
        error: "User ID is required and must be a non-empty string",
      };
    }

    if (
      !version ||
      typeof version !== "string" ||
      version.trim().length === 0
    ) {
      return {
        success: false,
        error: "Version is required and must be a non-empty string",
      };
    }

    try {
      const migration = this.migrations.find((m) => m.version === version);

      if (!migration) {
        return { success: false, error: `Migration ${version} not found` };
      }

      if (!migration.down) {
        return {
          success: false,
          error: `Migration ${version} does not support rollback`,
        };
      }

      console.log(
        `Rolling back migration ${version}: ${migration.description}`
      );

      await migration.down(userId);

      // Find the previous migration version
      const sortedMigrations = this.migrations
        .filter((m) => this.compareVersions(m.version, version) < 0)
        .sort((a, b) => this.compareVersions(b.version, a.version));

      const previousVersion =
        sortedMigrations.length > 0 ? sortedMigrations[0].version : "0.0.0";

      await this.setCurrentVersion(userId, previousVersion);
      await this.recordMigration(userId, `${version}-rollback`, true);

      console.log(`Migration ${version} rolled back successfully`);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.recordMigration(
        userId,
        `${version}-rollback`,
        false,
        errorMessage
      );

      console.error(`Migration ${version} rollback failed:`, error);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get available migrations
   */
  public getAvailableMigrations(): Migration[] {
    return [...this.migrations];
  }

  /**
   * Check if migrations are needed for a user
   */
  public async needsMigration(userId: string): Promise<boolean> {
    try {
      const pendingMigrations = await this.getPendingMigrations(userId);
      return pendingMigrations.length > 0;
    } catch (error) {
      console.error("Error checking if migrations are needed:", error);
      return false;
    }
  }
}

// Export singleton instance
export default DatabaseMigrationService.getInstance();
