/**
 * Jest configuration for integration tests that run against Firebase emulators
 */

module.exports = {
    testEnvironment: 'node', // Use node environment for Firebase integration
    testMatch: [
        '**/*.integration.test.(ts|tsx|js)',
        '**/*.emulator.integration.test.(ts|tsx|js)'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', {
                    targets: { node: 'current' },
                    modules: 'commonjs'
                }],
                '@babel/preset-typescript',
            ],
        }],
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(firebase|@firebase)/)'
    ],
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupIntegrationTests.ts'],
    globals: {
        __DEV__: true,
    },
    // Integration tests may take longer
    testTimeout: 30000,
    // Run tests serially to avoid emulator conflicts
    maxWorkers: 1,
    // Verbose output for debugging
    verbose: true,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/__mocks__/**',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
    ],
};