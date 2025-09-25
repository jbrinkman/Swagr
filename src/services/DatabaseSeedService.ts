import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Year, Contact } from "../types";
import { DatabaseInitService } from "./DatabaseInitService";

/**
 * Sample data for seeding the database during development and testing
 */
interface SeedData {
  years: Omit<Year, "id" | "userId" | "createdAt" | "updatedAt">[];
  contacts: Record<
    string,
    Omit<Contact, "id" | "userId" | "yearId" | "createdAt" | "updatedAt">[]
  >;
}

/**
 * Database seeding service for creating sample data for development and testing
 */
export class DatabaseSeedService {
  private static instance: DatabaseSeedService;

  private constructor() {}

  /**
   * Get singleton instance of DatabaseSeedService
   */
  public static getInstance(): DatabaseSeedService {
    if (!DatabaseSeedService.instance) {
      DatabaseSeedService.instance = new DatabaseSeedService();
    }
    return DatabaseSeedService.instance;
  }

  /**
   * Get sample seed data for testing and development
   */
  private getSampleSeedData(): SeedData {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    return {
      years: [
        { name: currentYear.toString() },
        { name: lastYear.toString() },
        { name: "2022" },
      ],
      contacts: {
        [currentYear.toString()]: [
          {
            firstName: "John",
            lastName: "Smith",
            enterpriseName: "Tech Solutions Inc",
            comments: "Interested in cloud migration services",
            delivered: true,
            deliveredAt: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            firstName: "Sarah",
            lastName: "Johnson",
            enterpriseName: "Digital Marketing Pro",
            comments: "Looking for automation tools",
            delivered: false,
            deliveredAt: null,
          },
          {
            firstName: "Michael",
            lastName: "Brown",
            enterpriseName: "Innovation Labs",
            comments: "Potential partnership opportunity",
            delivered: true,
            deliveredAt: new Date(Date.now() - 172800000), // 2 days ago
          },
          {
            firstName: "Emily",
            lastName: "Davis",
            enterpriseName: "StartupHub",
            comments: "",
            delivered: false,
            deliveredAt: null,
          },
          {
            firstName: "David",
            lastName: "Wilson",
            enterpriseName: "Enterprise Solutions",
            comments: "Needs custom development work",
            delivered: true,
            deliveredAt: new Date(Date.now() - 259200000), // 3 days ago
          },
        ],
        [lastYear.toString()]: [
          {
            firstName: "Lisa",
            lastName: "Anderson",
            enterpriseName: "Global Consulting",
            comments: "Completed project successfully",
            delivered: true,
            deliveredAt: new Date(Date.now() - 31536000000), // 1 year ago
          },
          {
            firstName: "Robert",
            lastName: "Taylor",
            enterpriseName: "Finance Corp",
            comments: "Long-term client",
            delivered: true,
            deliveredAt: new Date(Date.now() - 31449600000), // ~1 year ago
          },
          {
            firstName: "Jennifer",
            lastName: "Martinez",
            enterpriseName: "Healthcare Systems",
            comments: "Compliance requirements discussion",
            delivered: false,
            deliveredAt: null,
          },
        ],
        "2022": [
          {
            firstName: "Christopher",
            lastName: "Garcia",
            enterpriseName: "Retail Solutions",
            comments: "E-commerce platform implementation",
            delivered: true,
            deliveredAt: new Date(Date.now() - 63072000000), // ~2 years ago
          },
          {
            firstName: "Amanda",
            lastName: "Rodriguez",
            enterpriseName: "Manufacturing Plus",
            comments: "IoT integration project",
            delivered: true,
            deliveredAt: new Date(Date.now() - 62985600000), // ~2 years ago
          },
        ],
      },
    };
  }

  /**
   * Seed database with sample data for a user
   * This will create years and contacts for development and testing purposes
   */
  public async seedUserData(
    userId: string,
    options: {
      clearExisting?: boolean;
      customSeedData?: SeedData;
    } = {}
  ): Promise<{
    success: boolean;
    yearsCreated: number;
    contactsCreated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let yearsCreated = 0;
    let contactsCreated = 0;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      errors.push("User ID is required and must be a non-empty string");
      return { success: false, yearsCreated, contactsCreated, errors };
    }

    try {
      // Initialize user schema first
      const dbInitService = DatabaseInitService.getInstance();

      if (options.clearExisting) {
        // Note: In a real implementation, you might want to add a method to clear user data
        console.warn(
          "Clear existing data option is not implemented for safety reasons"
        );
      }

      await dbInitService.ensureCollectionsExist(userId);

      const seedData = options.customSeedData || this.getSampleSeedData();
      const batch = writeBatch(db);
      let batchOperations = 0;
      const maxBatchSize = 500;

      // Create years and collect their IDs
      const yearIdMap: Record<string, string> = {};

      for (const yearData of seedData.years) {
        const yearRef = doc(collection(db, "users", userId, "years"));
        batch.set(yearRef, {
          userId,
          name: yearData.name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        yearIdMap[yearData.name] = yearRef.id;
        yearsCreated++;
        batchOperations++;

        // Commit batch if approaching limit
        if (batchOperations >= maxBatchSize) {
          await batch.commit();
          batchOperations = 0;
        }
      }

      // Commit years first to ensure they exist before creating contacts
      if (batchOperations > 0) {
        await batch.commit();
        batchOperations = 0;
      }

      // Create contacts for each year
      for (const [yearName, contacts] of Object.entries(seedData.contacts)) {
        const yearId = yearIdMap[yearName];

        if (!yearId) {
          errors.push(`Year ID not found for year: ${yearName}`);
          continue;
        }

        for (const contactData of contacts) {
          const contactRef = doc(
            collection(db, "users", userId, "years", yearId, "contacts")
          );

          batch.set(contactRef, {
            userId,
            yearId,
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            enterpriseName: contactData.enterpriseName,
            comments: contactData.comments || "",
            delivered: contactData.delivered || false,
            deliveredAt: contactData.deliveredAt
              ? Timestamp.fromDate(contactData.deliveredAt)
              : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          contactsCreated++;
          batchOperations++;

          // Commit batch if approaching limit
          if (batchOperations >= maxBatchSize) {
            await batch.commit();
            batchOperations = 0;
          }
        }
      }

      // Commit remaining operations
      if (batchOperations > 0) {
        await batch.commit();
      }

      // Update user preferences to point to the current year
      const currentYearName = new Date().getFullYear().toString();
      const currentYearId = yearIdMap[currentYearName];

      if (currentYearId) {
        const preferencesRef = doc(db, "users", userId, "preferences", "main");
        const finalBatch = writeBatch(db);
        finalBatch.update(preferencesRef, {
          lastSelectedYearId: currentYearId,
          updatedAt: serverTimestamp(),
        });
        await finalBatch.commit();
      }

      const success = errors.length === 0;

      console.log(`Database seeding completed for user: ${userId}`, {
        success,
        yearsCreated,
        contactsCreated,
        errorsCount: errors.length,
      });

      return { success, yearsCreated, contactsCreated, errors };
    } catch (error) {
      console.error("Error seeding user data:", error);
      errors.push(
        `Database seeding failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { success: false, yearsCreated, contactsCreated, errors };
    }
  }

  /**
   * Create minimal seed data for testing
   * Creates just one year with one contact for quick testing
   */
  public async seedMinimalData(userId: string): Promise<{
    success: boolean;
    yearId: string | null;
    contactId: string | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    let yearId: string | null = null;
    let contactId: string | null = null;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      errors.push("User ID is required and must be a non-empty string");
      return { success: false, yearId, contactId, errors };
    }

    try {
      // Initialize user schema first
      const dbInitService = DatabaseInitService.getInstance();
      await dbInitService.ensureCollectionsExist(userId);

      const batch = writeBatch(db);

      // Create one year
      const yearRef = doc(collection(db, "users", userId, "years"));
      batch.set(yearRef, {
        userId,
        name: "Test Year",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      yearId = yearRef.id;

      // Create one contact
      const contactRef = doc(
        collection(db, "users", userId, "years", yearId, "contacts")
      );
      batch.set(contactRef, {
        userId,
        yearId,
        firstName: "Test",
        lastName: "Contact",
        enterpriseName: "Test Enterprise",
        comments: "This is a test contact for development",
        delivered: false,
        deliveredAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      contactId = contactRef.id;

      // Update preferences
      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      batch.update(preferencesRef, {
        lastSelectedYearId: yearId,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      console.log(`Minimal data seeded for user: ${userId}`, {
        yearId,
        contactId,
      });

      return { success: true, yearId, contactId, errors };
    } catch (error) {
      console.error("Error seeding minimal data:", error);
      errors.push(
        `Minimal data seeding failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { success: false, yearId, contactId, errors };
    }
  }

  /**
   * Create custom seed data with specified parameters
   */
  public async seedCustomData(
    userId: string,
    config: {
      yearNames: string[];
      contactsPerYear: number;
      deliveryRate: number; // 0.0 to 1.0
    }
  ): Promise<{
    success: boolean;
    yearsCreated: number;
    contactsCreated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let yearsCreated = 0;
    let contactsCreated = 0;

    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      errors.push("User ID is required and must be a non-empty string");
      return { success: false, yearsCreated, contactsCreated, errors };
    }

    if (!config.yearNames || config.yearNames.length === 0) {
      errors.push("At least one year name is required");
      return { success: false, yearsCreated, contactsCreated, errors };
    }

    if (config.contactsPerYear < 0 || config.contactsPerYear > 1000) {
      errors.push("Contacts per year must be between 0 and 1000");
      return { success: false, yearsCreated, contactsCreated, errors };
    }

    if (config.deliveryRate < 0 || config.deliveryRate > 1) {
      errors.push("Delivery rate must be between 0.0 and 1.0");
      return { success: false, yearsCreated, contactsCreated, errors };
    }

    try {
      // Initialize user schema first
      const dbInitService = DatabaseInitService.getInstance();
      await dbInitService.ensureCollectionsExist(userId);

      // Generate sample names and enterprises
      const firstNames = [
        "John",
        "Sarah",
        "Michael",
        "Emily",
        "David",
        "Lisa",
        "Robert",
        "Jennifer",
        "Christopher",
        "Amanda",
      ];
      const lastNames = [
        "Smith",
        "Johnson",
        "Brown",
        "Davis",
        "Wilson",
        "Anderson",
        "Taylor",
        "Martinez",
        "Garcia",
        "Rodriguez",
      ];
      const enterprises = [
        "Tech Solutions",
        "Digital Marketing",
        "Innovation Labs",
        "StartupHub",
        "Enterprise Solutions",
        "Global Consulting",
        "Finance Corp",
        "Healthcare Systems",
        "Retail Solutions",
        "Manufacturing Plus",
      ];

      const batch = writeBatch(db);
      let batchOperations = 0;
      const maxBatchSize = 500;

      // Create years and collect their IDs
      const yearIdMap: Record<string, string> = {};

      for (const yearName of config.yearNames) {
        const yearRef = doc(collection(db, "users", userId, "years"));
        batch.set(yearRef, {
          userId,
          name: yearName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        yearIdMap[yearName] = yearRef.id;
        yearsCreated++;
        batchOperations++;

        if (batchOperations >= maxBatchSize) {
          await batch.commit();
          batchOperations = 0;
        }
      }

      // Commit years first
      if (batchOperations > 0) {
        await batch.commit();
        batchOperations = 0;
      }

      // Create contacts for each year
      for (const yearName of config.yearNames) {
        const yearId = yearIdMap[yearName];

        for (let i = 0; i < config.contactsPerYear; i++) {
          const firstName =
            firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName =
            lastNames[Math.floor(Math.random() * lastNames.length)];
          const enterpriseName =
            enterprises[Math.floor(Math.random() * enterprises.length)] +
            " Inc";
          const delivered = Math.random() < config.deliveryRate;
          const deliveredAt = delivered
            ? new Date(Date.now() - Math.random() * 31536000000)
            : null; // Random date within last year

          const contactRef = doc(
            collection(db, "users", userId, "years", yearId, "contacts")
          );

          batch.set(contactRef, {
            userId,
            yearId,
            firstName,
            lastName,
            enterpriseName,
            comments:
              i % 3 === 0 ? `Generated contact #${i + 1} for ${yearName}` : "",
            delivered,
            deliveredAt: deliveredAt ? Timestamp.fromDate(deliveredAt) : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          contactsCreated++;
          batchOperations++;

          if (batchOperations >= maxBatchSize) {
            await batch.commit();
            batchOperations = 0;
          }
        }
      }

      // Commit remaining operations
      if (batchOperations > 0) {
        await batch.commit();
      }

      // Update preferences to point to the first year
      const firstYearId = yearIdMap[config.yearNames[0]];
      if (firstYearId) {
        const preferencesRef = doc(db, "users", userId, "preferences", "main");
        const finalBatch = writeBatch(db);
        finalBatch.update(preferencesRef, {
          lastSelectedYearId: firstYearId,
          updatedAt: serverTimestamp(),
        });
        await finalBatch.commit();
      }

      console.log(`Custom data seeded for user: ${userId}`, {
        yearsCreated,
        contactsCreated,
        config,
      });

      return { success: true, yearsCreated, contactsCreated, errors };
    } catch (error) {
      console.error("Error seeding custom data:", error);
      errors.push(
        `Custom data seeding failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { success: false, yearsCreated, contactsCreated, errors };
    }
  }
}

// Export singleton instance
export default DatabaseSeedService.getInstance();
