/**
 * Firebase Emulator Configuration Utilities
 *
 * This module provides utilities for managing Firebase emulator connections
 * with proper fallback to production Firebase services.
 */

import { Auth, connectAuthEmulator } from "firebase/auth";
import { Firestore, connectFirestoreEmulator } from "firebase/firestore";

export interface EmulatorConfig {
  auth: {
    host: string;
    port: number;
  };
  firestore: {
    host: string;
    port: number;
  };
  ui: {
    host: string;
    port: number;
  };
}

export const DEFAULT_EMULATOR_CONFIG: EmulatorConfig = {
  auth: {
    host: "localhost",
    port: 9099,
  },
  firestore: {
    host: "localhost",
    port: 8080,
  },
  ui: {
    host: "localhost",
    port: 4000,
  },
};

/**
 * Check if emulators are available by testing connection to UI
 */
export async function areEmulatorsAvailable(
  config: EmulatorConfig = DEFAULT_EMULATOR_CONFIG
): Promise<boolean> {
  // In test/development environments, check if emulator UI is accessible
  if (typeof globalThis.fetch === "undefined") {
    // No fetch available, assume emulators are not available
    return false;
  }

  try {
    const response = await globalThis.fetch(
      `http://${config.ui.host}:${config.ui.port}`,
      {
        method: "HEAD",
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if Auth emulator is already connected
 */
export function isAuthEmulatorConnected(_auth: Auth): boolean {
  try {
    // Check if auth is using emulator URL by checking the config
    // This is a best-effort check since Firebase doesn't expose this directly
    return process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "true";
  } catch {
    return false;
  }
}

/**
 * Check if Firestore emulator is already connected
 */
export function isFirestoreEmulatorConnected(_db: Firestore): boolean {
  try {
    // Check if firestore is using emulator host by checking the config
    // This is a best-effort check since Firebase doesn't expose this directly
    return process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === "true";
  } catch {
    return false;
  }
}

/**
 * Connect to Firebase emulators with proper error handling
 */
export async function connectToEmulators(
  auth: Auth,
  db: Firestore,
  config: EmulatorConfig = DEFAULT_EMULATOR_CONFIG
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  let success = true;

  // Check if emulators are available
  const emulatorsAvailable = await areEmulatorsAvailable(config);
  if (!emulatorsAvailable) {
    errors.push("Firebase emulators are not running or not accessible");
    return { success: false, errors };
  }

  // Connect to Auth emulator
  try {
    if (!isAuthEmulatorConnected(auth)) {
      connectAuthEmulator(
        auth,
        `http://${config.auth.host}:${config.auth.port}`,
        {
          disableWarnings: true,
        }
      );
      console.log(
        `🔧 Connected to Auth emulator at ${config.auth.host}:${config.auth.port}`
      );
    } else {
      console.log("🔧 Auth emulator already connected");
    }
  } catch (error) {
    const errorMsg = `Failed to connect to Auth emulator: ${error}`;
    errors.push(errorMsg);
    console.warn(errorMsg);
    success = false;
  }

  // Connect to Firestore emulator
  try {
    if (!isFirestoreEmulatorConnected(db)) {
      connectFirestoreEmulator(
        db,
        config.firestore.host,
        config.firestore.port
      );
      console.log(
        `🔧 Connected to Firestore emulator at ${config.firestore.host}:${config.firestore.port}`
      );
    } else {
      console.log("🔧 Firestore emulator already connected");
    }
  } catch (error) {
    const errorMsg = `Failed to connect to Firestore emulator: ${error}`;
    errors.push(errorMsg);
    console.warn(errorMsg);
    success = false;
  }

  return { success, errors };
}

/**
 * Get current Firebase connection status
 */
export function getConnectionStatus(auth: Auth, db: Firestore) {
  return {
    auth: {
      isEmulator: isAuthEmulatorConnected(auth),
      config: isAuthEmulatorConnected(auth) ? "emulator" : "production",
    },
    firestore: {
      isEmulator: isFirestoreEmulatorConnected(db),
      config: isFirestoreEmulatorConnected(db) ? "emulator" : "production",
    },
  };
}
