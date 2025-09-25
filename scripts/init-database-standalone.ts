#!/usr/bin/env tsx

/**
 * Standalone database initialization script
 *
 * This script sets up the Firestore database without importing existing services
 * to avoid Firebase configuration conflicts.
 *
 * Usage:
 *   pnpm run init-db-real --user-id=<uid>              # Initialize database structure only
 *   pnpm run init-db-real --user-id=<uid> --seed       # Initialize with sample data
 *   pnpm run init-db-real --email=<email> --password=<password> --seed
 */

// Load environment variables from .env file
import { config } from "dotenv";
config();

// Set up Node.js environment variables BEFORE any imports
process.env.NODE_ENV = process.env.NODE_ENV || "development";
(globalThis as any).__DEV__ = process.env.NODE_ENV === "development";

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface InitOptions {
  seed?: boolean;
  userId?: string;
  email?: string;
  password?: string;
}

// Firebase configuration (use environment variables)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

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
    console.error("\nExample .env file:");
    console.error("EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key");
    console.error(
      "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com"
    );
    console.error("EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id");
    console.error(
      "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com"
    );
    console.error("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789");
    console.error("EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef");
    process.exit(1);
  }

  console.log("✅ Firebase configuration validated");
}

async function initializeFirebase() {
  console.log("🔥 Initializing Firebase...");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Connect to emulators if in development and enabled
  if (
    process.env.NODE_ENV === "development" &&
    process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "true"
  ) {
    try {
      connectFirestoreEmulator(db, "localhost", 8080);
      console.log("✅ Connected to Firestore emulator");
    } catch (error) {
      console.log("ℹ️  Firestore emulator not available or already connected");
    }
  }

  console.log(`✅ Connected to Firebase project: ${firebaseConfig.projectId}`);

  return { app, auth, db };
}

async function authenticateUser(
  auth: ReturnType<typeof getAuth>,
  options: InitOptions
): Promise<string> {
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

      // If user also provided --user-id, verify it matches the authenticated user
      if (options.userId && options.userId !== userId) {
        console.warn(
          `⚠️  Provided user ID (${options.userId}) doesn't match authenticated user (${userId})`
        );
        console.log(`📋 Using authenticated user ID: ${userId}`);
      }

      return userId;
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      console.error(
        "Please check your email and password, and ensure the user exists in Firebase Auth."
      );
      process.exit(1);
    }
  }

  if (options.userId) {
    console.log(`📋 Using provided user ID: ${options.userId}`);
    console.warn("⚠️  WARNING: Using user ID without authentication.");
    console.warn("   This will only work if:");
    console.warn(
      "   1. You're using Firebase emulators with relaxed security rules, OR"
    );
    console.warn("   2. The user is already authenticated in another session");
    console.warn("   For production, use --email and --password instead.");
    return options.userId;
  }

  console.error("❌ No user authentication provided.");
  console.error("Please provide either:");
  console.error("  --email=<email> --password=<password> (recommended)");
  console.error("  --user-id=<uid> (for development/emulator use only)");
  process.exit(1);
}

async function verifyAuthentication(
  auth: ReturnType<typeof getAuth>,
  expectedUserId: string
) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("❌ No authenticated user found.");
    console.error(
      "Please ensure you're using --email and --password for authentication."
    );
    process.exit(1);
  }

  if (currentUser.uid !== expectedUserId) {
    console.error(`❌ Authentication mismatch:`);
    console.error(`   Expected user ID: ${expectedUserId}`);
    console.error(`   Authenticated user ID: ${currentUser.uid}`);
    process.exit(1);
  }

  console.log(`✅ Authentication verified for user: ${currentUser.uid}`);
}

async function initializeUserSchema(
  db: ReturnType<typeof getFirestore>,
  auth: ReturnType<typeof getAuth>,
  userId: string
) {
  console.log(`🏗️  Initializing database schema for user: ${userId}`);

  // Verify authentication before proceeding
  await verifyAuthentication(auth, userId);

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

    console.log("✅ Database schema initialized");
    return yearRef.id;
  } catch (error) {
    console.error("❌ Failed to initialize database schema:", error);
    process.exit(1);
  }
}

async function seedDatabase(
  db: ReturnType<typeof getFirestore>,
  auth: ReturnType<typeof getAuth>,
  userId: string,
  defaultYearId: string
) {
  console.log(`🌱 Seeding database with sample data for user: ${userId}`);

  try {
    const batch = writeBatch(db);
    let batchOperations = 0;
    const maxBatchSize = 500;

    // Sample contacts for the current year
    const sampleContacts = [
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
    ];

    // Add sample contacts
    for (const contactData of sampleContacts) {
      const contactRef = doc(
        collection(db, "users", userId, "years", defaultYearId, "contacts")
      );

      batch.set(contactRef, {
        userId,
        yearId: defaultYearId,
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

      batchOperations++;

      if (batchOperations >= maxBatchSize) {
        await batch.commit();
        batchOperations = 0;
      }
    }

    if (batchOperations > 0) {
      await batch.commit();
    }

    console.log(
      `✅ Database seeding completed: ${sampleContacts.length} contacts created`
    );
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
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
    const { auth, db } = await initializeFirebase();

    // Authenticate or get user ID
    const userId = await authenticateUser(auth, options);

    // Initialize database schema
    const defaultYearId = await initializeUserSchema(db, auth, userId);

    // Seed database if requested
    if (options.seed) {
      await seedDatabase(db, auth, userId, defaultYearId);
    }

    console.log("\n🎉 Database initialization completed successfully!");
    console.log(`📊 User: ${userId}`);
    console.log(`📅 Default year created: ${new Date().getFullYear()}`);
    if (options.seed) {
      console.log("🌱 Sample data seeded");
    }

    // Clean exit
    console.log("\n✅ Cleaning up and exiting...");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Database initialization failed:", error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
