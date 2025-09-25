#!/usr/bin/env tsx

/**
 * Database initialization script
 *
 * This script sets up the Firestore database with:
 * - Security rules deployment
 * - Index creation
 * - Initial data seeding (optional)
 *
 * Usage:
 *   pnpm run init-db              # Initialize database structure only
 *   pnpm run init-db --seed       # Initialize with sample data
 *   pnpm run init-db --user-id=<uid> --seed  # Initialize for specific user
 */

// Set up Node.js environment variables
process.env.NODE_ENV = process.env.NODE_ENV || "development";
(globalThis as any).__DEV__ = process.env.NODE_ENV === "development";

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { DatabaseInitService } from "../src/services/DatabaseInitService";
import { DatabaseSeedService } from "../src/services/DatabaseSeedService";
import { DatabaseMigrationService } from "../src/services/DatabaseMigrationService";

// Firebase configuration (use environment variables)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

interface InitOptions {
  seed?: boolean;
  userId?: string;
  email?: string;
  password?: string;
}

async function parseArgs(): Promise<InitOptions> {
  const args = process.argv.slice(2);
  const options: InitOptions = {};

  for (const arg of args) {
    if (arg === "--seed") {
      options.seed = true;
    } else if (arg.startsWith("--user-id=")) {
      options.userId = arg.split("=")[1];
    } else if (arg.startsWith("--email=")) {
      options.email = arg.split("=")[1];
    } else if (arg.startsWith("--password=")) {
      options.password = arg.split("=")[1];
    }
  }

  return options;
}

async function validateFirebaseConfig() {
  const requiredVars = [
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((varName) => console.error(`   ${varName}`));
    console.error("\nPlease set these in your .env file or environment.");
    process.exit(1);
  }

  console.log("✅ Firebase configuration validated");
}

async function initializeFirebase() {
  console.log("🔥 Initializing Firebase...");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`✅ Connected to Firebase project: ${firebaseConfig.projectId}`);

  return { app, auth, db };
}

async function authenticateUser(
  auth: ReturnType<typeof getAuth>,
  options: InitOptions
): Promise<string> {
  if (options.userId) {
    console.log(`📋 Using provided user ID: ${options.userId}`);
    return options.userId;
  }

  if (options.email && options.password) {
    console.log(`🔐 Authenticating user: ${options.email}`);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        options.email,
        options.password
      );
      const userId = userCredential.user.uid;
      console.log(`✅ Authenticated as: ${userId}`);
      return userId;
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      process.exit(1);
    }
  }

  console.error("❌ No user authentication provided.");
  console.error("Please provide either:");
  console.error("  --user-id=<uid>");
  console.error("  --email=<email> --password=<password>");
  process.exit(1);
  return ""; // This will never be reached but satisfies TypeScript
}

async function initializeUserSchema(userId: string) {
  console.log(`🏗️  Initializing database schema for user: ${userId}`);

  const initService = DatabaseInitService.getInstance();

  try {
    // Ensure collections exist
    await initService.ensureCollectionsExist(userId);
    console.log("✅ Database collections initialized");

    // Run any pending migrations
    const migrationService = DatabaseMigrationService.getInstance();
    const migrationResult = await migrationService.runMigrations(userId);

    if (migrationResult.success) {
      console.log(
        `✅ Migrations completed: ${migrationResult.migrationsRun} migrations run`
      );
      console.log(`📊 Final schema version: ${migrationResult.finalVersion}`);
    } else {
      console.warn(
        `⚠️  Migration issues: ${migrationResult.errors.length} errors`
      );
      migrationResult.errors.forEach((error) => console.warn(`   ${error}`));
    }

    // Validate schema
    const validationResult = await initService.validateUserSchema(userId);
    if (validationResult.isValid) {
      console.log("✅ Database schema validation passed");
    } else {
      console.warn(
        `⚠️  Schema validation issues: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`
      );
      validationResult.errors.forEach((error) =>
        console.warn(`   ERROR: ${error}`)
      );
      validationResult.warnings.forEach((warning) =>
        console.warn(`   WARNING: ${warning}`)
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize database schema:", error);
    process.exit(1);
  }
}

async function seedDatabase(userId: string) {
  console.log(`🌱 Seeding database with sample data for user: ${userId}`);

  const seedService = DatabaseSeedService.getInstance();

  try {
    const seedResult = await seedService.seedUserData(userId);

    if (seedResult.success) {
      console.log("✅ Database seeding completed successfully");
      console.log(
        `📊 Created: ${seedResult.yearsCreated} years, ${seedResult.contactsCreated} contacts`
      );
    } else {
      console.error("❌ Database seeding failed:");
      seedResult.errors.forEach((error) => console.error(`   ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

async function displayDatabaseStats(userId: string) {
  console.log(`📊 Database statistics for user: ${userId}`);

  const initService = DatabaseInitService.getInstance();

  try {
    const stats = await initService.getUserDatabaseStats(userId);

    console.log(`   Years: ${stats.yearsCount}`);
    console.log(`   Total contacts: ${stats.contactsCount}`);
    console.log(`   Delivered contacts: ${stats.deliveredContactsCount}`);
    console.log(`   Has preferences: ${stats.hasPreferences}`);
    console.log(
      `   Last updated: ${stats.lastUpdated?.toISOString() || "Never"}`
    );

    if (Object.keys(stats.totalContactsByYear).length > 0) {
      console.log("   Contacts by year:");
      Object.entries(stats.totalContactsByYear).forEach(([year, count]) => {
        console.log(`     ${year}: ${count} contacts`);
      });
    }
  } catch (error) {
    console.warn("⚠️  Could not retrieve database statistics:", error);
  }
}

async function main() {
  console.log("🚀 Starting database initialization...\n");

  try {
    // Parse command line arguments
    const options = await parseArgs();

    // Validate configuration
    await validateFirebaseConfig();

    // Initialize Firebase
    const { auth } = await initializeFirebase();

    // Authenticate or get user ID
    const userId = await authenticateUser(auth, options);

    // Initialize database schema
    await initializeUserSchema(userId);

    // Seed database if requested
    if (options.seed) {
      await seedDatabase(userId);
    }

    // Display final statistics
    await displayDatabaseStats(userId);

    console.log("\n🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("\n💥 Database initialization failed:", error);
    process.exit(1);
  }
}

// Run the script if executed directly
main().catch(console.error);

export { main as initializeDatabase };
