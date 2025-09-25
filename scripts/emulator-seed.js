#!/usr/bin/env node

/**
 * Firebase Emulator Seeding Script
 * 
 * This script seeds the Firebase emulators with test data for consistent
 * development and testing environments.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EMULATOR_DATA_DIR = './emulator-data';
const SEED_DATA_DIR = './scripts/seed-data';

/**
 * Check if emulators are running
 */
function areEmulatorsRunning() {
    try {
        execSync(`curl -s http://localhost:4000 > /dev/null`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Create seed data directory structure
 */
function createSeedDataStructure() {
    if (!fs.existsSync(SEED_DATA_DIR)) {
        fs.mkdirSync(SEED_DATA_DIR, { recursive: true });

        // Create sample auth export
        const authExport = {
            users: [
                {
                    localId: "test-user-1",
                    email: "test@example.com",
                    emailVerified: true,
                    passwordHash: "fakeHash",
                    salt: "fakeSalt",
                    createdAt: "2024-01-01T00:00:00.000Z",
                    lastLoginAt: "2024-01-01T00:00:00.000Z"
                }
            ]
        };

        fs.writeFileSync(
            path.join(SEED_DATA_DIR, 'auth_export.json'),
            JSON.stringify(authExport, null, 2)
        );

        // Create sample firestore export structure
        const firestoreDir = path.join(SEED_DATA_DIR, 'firestore_export');
        if (!fs.existsSync(firestoreDir)) {
            fs.mkdirSync(firestoreDir, { recursive: true });
        }

        // Create metadata file
        const metadata = {
            version: "1.0.0",
            firestore: {
                version: "1.0.0",
                metadata: {
                    collections: ["users"]
                }
            }
        };

        fs.writeFileSync(
            path.join(firestoreDir, 'firestore_export.overall_export_metadata'),
            JSON.stringify(metadata, null, 2)
        );

        console.log('📁 Created seed data structure');
    }
}

/**
 * Import seed data to emulators
 */
function importSeedData() {
    if (!areEmulatorsRunning()) {
        console.log('❌ Emulators are not running. Start them first with: pnpm emulators:start');
        process.exit(1);
    }

    console.log('🌱 Seeding emulators with test data...');

    try {
        // Use the init-database script to seed with proper data
        console.log('📊 Running database initialization...');
        execSync('pnpm init-db', { stdio: 'inherit' });

        console.log('✅ Emulators seeded successfully');
        console.log('💡 Access the Emulator UI at http://localhost:4000');

    } catch (error) {
        console.error('❌ Error seeding emulators:', error.message);
        process.exit(1);
    }
}

/**
 * Export current emulator data
 */
function exportEmulatorData() {
    if (!areEmulatorsRunning()) {
        console.log('❌ Emulators are not running. Start them first with: pnpm emulators:start');
        process.exit(1);
    }

    console.log('📤 Exporting emulator data...');

    try {
        execSync(`firebase emulators:export ${EMULATOR_DATA_DIR}`, { stdio: 'inherit' });
        console.log('✅ Emulator data exported successfully');
        console.log(`📁 Data saved to: ${EMULATOR_DATA_DIR}`);

    } catch (error) {
        console.error('❌ Error exporting emulator data:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'export':
        exportEmulatorData();
        break;
    case 'import':
    case 'seed':
    default:
        createSeedDataStructure();
        importSeedData();
        break;
}