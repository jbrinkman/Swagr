const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                __DEV__: 'readonly',
                global: 'readonly',
                globalThis: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            // TypeScript recommended rules
            ...typescript.configs.recommended.rules,

            // Custom rules
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',

            // General JavaScript rules
            'no-console': 'off', // Allow console for React Native development
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },
    {
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __DEV__: 'readonly',
                global: 'readonly',
                globalThis: 'readonly',
            },
        },
    },
    {
        files: ['**/__tests__/**/*', '**/*.test.{ts,tsx,js,jsx}'],
        languageOptions: {
            globals: {
                jest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
        },
    },
    {
        ignores: [
            'node_modules/**',
            '.expo/**',
            'dist/**',
            'build/**',
            '*.config.js',
            'babel.config.js',
            'jest.config.js',
        ],
    },
];