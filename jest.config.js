module.exports = {
    testEnvironment: 'jsdom',
    testMatch: [
        '**/__tests__/**/*.(ts|tsx|js)',
        '**/*.(test|spec).(ts|tsx|js)'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        // Integration tests are run separately with emulators
        '.*\\.integration\\.test\\.(ts|tsx|js)$',
        '.*\\.emulator\\.integration\\.test\\.(ts|tsx|js)$'
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
                '@babel/preset-react',
            ],
        }],
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-paper|react-native-vector-icons|@expo|expo|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler)/)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Mock problematic modules
        '^expo/(.*)$': '<rootDir>/src/__mocks__/expo.js',
        '^firebase/(.*)$': '<rootDir>/src/__mocks__/firebase.js',
        // Mock React Native modules
        '^react-native$': '<rootDir>/src/__mocks__/react-native.js',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    globals: {
        __DEV__: true,
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/__mocks__/**',
    ],
};