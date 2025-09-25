#!/usr/bin/env node

/**
 * Firebase Emulator Cleanup Utilities
 * 
 * This script provides comprehensive cleanup utilities for Firebase emulators
 * to ensure test isolation and consistent development environments.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EMULATOR_DATA_DIR = './emulator-data';
const FIREBASE_DEBUG_LOG = './firebase-debug.log';
const FIRESTORE_DEBUG_LOG = './firestore-debug.log';
const UI_DEBUG_LOG = './ui-debug.log';

/**
 * Check if emulators are running
 */
function areEmulatorsRunning() {
    try {
        execSync('curl -s http://localhost:4000 > /dev/null', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Force kill emulator processes
 */
function forceKillEmulators() {
    console.log('🔪 Force killing emulator processes...');

    const ports = [9099, 8080, 4000]; // auth, firestore, ui

    ports.forEach(port => {
        try {
            // Find and kill processes on each port
            const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: 'pipe' });
            const pids = result.trim().split('\n').filter(pid => pid);

            pids.forEach(pid => {
                try {
                    execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
                    console.log(`  ✅ Killed process ${pid} on port ${port}`);
                } catch {
                    // Process might already be dead
                }
            });
        } catch {
            // No processes found on this port
        }
    });
}

/**
 * Clean up emulator data files
 */
function cleanupDataFiles() {
    console.log('🧹 Cleaning up emulator data files...');

    const filesToClean = [
        EMULATOR_DATA_DIR,
        FIREBASE_DEBUG_LOG,
        FIRESTORE_DEBUG_LOG,
        UI_DEBUG_LOG,
    ];

    filesToClean.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                if (fs.statSync(file).isDirectory()) {
                    fs.rmSync(file, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(file);
                }
                console.log(`  ✅ Removed ${file}`);
            } catch (error) {
                console.warn(`  ⚠️  Could not remove ${file}: ${error.message}`);
            }
        }
    });
}

/**
 * Clean up temporary files and caches
 */
function cleanupTempFiles() {
    console.log('🗑️  Cleaning up temporary files...');

    const tempDirs = [
        './node_modules/.cache',
        './.expo',
        './dist',
        './build',
    ];

    tempDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`  ✅ Removed ${dir}`);
            } catch (error) {
                console.warn(`  ⚠️  Could not remove ${dir}: ${error.message}`);
            }
        }
    });
}

/**
 * Graceful shutdown of emulators
 */
function gracefulShutdown() {
    console.log('⏹️  Attempting graceful emulator shutdown...');

    try {
        execSync('firebase emulators:stop', { stdio: 'inherit', timeout: 10000 });
        console.log('✅ Emulators stopped gracefully');
        return true;
    } catch (error) {
        console.warn('⚠️  Graceful shutdown failed:', error.message);
        return false;
    }
}

/**
 * Complete cleanup process
 */
function fullCleanup() {
    console.log('🧽 Starting full emulator cleanup...');

    // Try graceful shutdown first
    if (areEmulatorsRunning()) {
        const gracefulSuccess = gracefulShutdown();

        if (!gracefulSuccess) {
            // Force kill if graceful shutdown failed
            forceKillEmulators();
        }

        // Wait a moment for processes to fully terminate
        setTimeout(() => {
            cleanupDataFiles();
            cleanupTempFiles();
            console.log('✅ Full cleanup complete');
        }, 2000);
    } else {
        cleanupDataFiles();
        cleanupTempFiles();
        console.log('✅ Full cleanup complete');
    }
}

/**
 * Quick cleanup (data only)
 */
function quickCleanup() {
    console.log('⚡ Starting quick cleanup...');
    cleanupDataFiles();
    console.log('✅ Quick cleanup complete');
}

/**
 * Reset for testing (includes process restart)
 */
function testReset() {
    console.log('🔄 Resetting emulators for testing...');

    fullCleanup();

    setTimeout(() => {
        console.log('🚀 Starting fresh emulators...');
        const child = spawn('firebase', ['emulators:start'], {
            stdio: 'inherit',
            detached: true
        });

        child.unref();
        console.log('✅ Test reset complete - emulators starting in background');
    }, 3000);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'quick':
        quickCleanup();
        break;
    case 'full':
        fullCleanup();
        break;
    case 'test-reset':
        testReset();
        break;
    case 'kill':
        forceKillEmulators();
        break;
    default:
        console.log('Firebase Emulator Cleanup Utilities');
        console.log('');
        console.log('Usage: node scripts/emulator-cleanup.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  quick      - Clean data files only');
        console.log('  full       - Full cleanup including graceful shutdown');
        console.log('  test-reset - Full reset and restart for testing');
        console.log('  kill       - Force kill emulator processes');
        console.log('');
        console.log('Default: full cleanup');
        fullCleanup();
        break;
}