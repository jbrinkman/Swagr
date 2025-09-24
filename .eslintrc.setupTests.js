// ESLint configuration specifically for setupTests.ts to prevent autofix issues
module.exports = {
    overrides: [
        {
            files: ['src/setupTests.ts'],
            rules: {
                // Prevent autofix from changing globalThis patterns
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                // Custom rule to prevent globalThis as unknown
                'no-restricted-syntax': [
                    'error',
                    {
                        selector: 'TSAsExpression[expression.name="globalThis"][typeAnnotation.typeName.name="unknown"]',
                        message: 'CRITICAL: Do not use (globalThis as unknown) - use (globalThis as any) for Jest compatibility'
                    }
                ]
            }
        }
    ]
};