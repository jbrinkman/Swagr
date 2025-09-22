module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.(ts|tsx|js)',
        '**/*.(test|spec).(ts|tsx|js)'
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
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@babel|babel-jest)/)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Mock problematic modules
        '^expo/(.*)$': '<rootDir>/src/__mocks__/expo.js',
        '^firebase/(.*)$': '<rootDir>/src/__mocks__/firebase.js',
    },
    globals: {
        __DEV__: true,
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/__mocks__/**',
    ],
};