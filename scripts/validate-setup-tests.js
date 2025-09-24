#!/usr/bin/env node

/**
 * Validation script to check for the recurring setupTests.ts autofix issue
 * This script checks if autofix has broken the globalThis pattern again
 */

const fs = require('fs');
const path = require('path');

const setupTestsPath = path.join(__dirname, '../src/setupTests.ts');

try {
    const content = fs.readFileSync(setupTestsPath, 'utf8');

    // Check for the problematic globalThis pattern
    if (content.includes('(globalThis as unknown)')) {
        console.error('🚨 CRITICAL ERROR: setupTests.ts contains (globalThis as unknown)');
        console.error('This will cause TypeScript compilation to fail!');
        console.error('');
        console.error('AUTOFIX HAS BROKEN THE PATTERN AGAIN!');
        console.error('');
        console.error('Fix: Change (globalThis as unknown) to (globalThis as any)');
        console.error('Or use the autofix-resistant pattern with explicit variable assignment');
        console.error('');
        console.error('See: .kiro/steering/typescript-test-setup.md');
        process.exit(1);
    }

    // Check for problematic 'unknown' types in mock functions
    if (content.includes('}: unknown)')) {
        console.error('🚨 CRITICAL ERROR: setupTests.ts contains function parameters with unknown type');
        console.error('This will cause TypeScript compilation to fail!');
        console.error('');
        console.error('AUTOFIX HAS CHANGED any TO unknown IN MOCK FUNCTIONS!');
        console.error('');
        console.error('Fix: Change }: unknown) to }: any) in mock function parameters');
        console.error('');
        console.error('See: .kiro/steering/typescript-test-setup.md');
        process.exit(1);
    }

    // Check for the correct patterns
    const hasCorrectPattern = content.includes('globalAny = globalThis as any') ||
        content.includes('(globalThis as any).console');

    if (!hasCorrectPattern) {
        console.error('🚨 WARNING: setupTests.ts may not have the correct globalThis pattern');
        console.error('Expected either:');
        console.error('  - globalAny = globalThis as any (preferred)');
        console.error('  - (globalThis as any).console (legacy)');
        console.error('');
        console.error('See: .kiro/steering/typescript-test-setup.md');
        process.exit(1);
    }

    console.log('✅ setupTests.ts globalThis pattern is correct');

} catch (error) {
    console.error('Error reading setupTests.ts:', error.message);
    process.exit(1);
}