#!/usr/bin/env node

/**
 * Firebase Emulator Reset Script
 * 
 * This script provides utilities to reset Firebase emulators for test isolation.
 * It can clear all data from Auth and Firestore emulators.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EMULATOR_DATA_DIR = './emulator-data';
const EMULATOR_PORTS = {
    auth: 9099,
    firestore: 8080,
    ui: 4000
};

/**
 * Check if emulators are running
 */
function areEmulatorsRunning() {
    try {
        // Check if emulator UI port is accessible
        execSync(`curl -s http://localhost:${EMULATOR_PORTS.ui} > /dev/null`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Clear emulator data directory
 */
function clearEmulatorData() {
    if (fs.existsSync(EMULATOR_DATA_DIR)) {
        console.log('🗑️  Clearing emulator data directory...');
        fs.rmSync(EMULATOR_DATA_DIR, { recursive: true, force: true });
        console.log('✅ Emulator data directory cleared');
    }
}

/**
 * Reset emulators by stopping and starting them
 */
function resetEmulators() {
    console.log('🔄 Resetting Firebase emulators...');

    try {
        // Stop emulators if running
        if (areEmulatorsRunning()) {
            console.log('⏹️  Stopping emulators...');
            execSync('firebase emulators:stop', { stdio: 'inherit' });
        }

        // Clear data
        clearEmulatorData();

        console.log('✅ Emulators reset complete');
        console.log('💡 Run "pnpm emulators:start" to start fresh emulators');

    } catch (error) {
        console.error('❌ Error resetting emulators:', error.message);
        process.exit(1);
    }
}

/**
 * Clear only the data without stopping emulators
 */
function clearDataOnly() {
    console.log('🧹 Clearing emulator data only...');
    clearEmulatorData();
    console.log('✅ Data cleared. Restart emulators to apply changes.');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'clear':
        clearDataOnly();
        break;
    case 'reset':
    default:
        resetEmulators();
        break;
}