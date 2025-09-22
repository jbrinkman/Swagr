---
inclusion: always
---

# Development Standards

## Package Manager

This project uses **PNPM** as the package manager. This is specified in `package.json` with `"packageManager": "pnpm@10.15.0"`.

### Required Commands

**ALWAYS use PNPM commands, never npm or yarn:**

```bash
# Install dependencies
pnpm install

# Add dependencies
pnpm add <package-name>
pnpm add -D <package-name>  # for dev dependencies

# Remove dependencies
pnpm remove <package-name>

# Run scripts
pnpm start
pnpm test
pnpm build

# Update dependencies
pnpm update
```

### Why PNPM?

- **Disk efficiency**: Uses hard links and symlinks to save disk space
- **Speed**: Faster installation than npm/yarn
- **Strict**: Better dependency resolution and prevents phantom dependencies
- **Monorepo support**: Excellent workspace support

### Installation

If PNPM is not installed:

```bash
# Install via npm (one-time only)
npm install -g pnpm

# Or via Homebrew on macOS
brew install pnpm

# Or via curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## React Native & Expo Standards

This is a React Native project using Expo. Follow these guidelines:

### Development Commands

```bash
# Start development server
pnpm start

# Run on specific platforms
pnpm android
pnpm ios  
pnpm web

# Testing
pnpm test
pnpm test:watch

# Code quality
pnpm lint
pnpm type-check
```

### File Structure

- `src/` - All source code
- `src/components/` - Reusable UI components
- `src/screens/` - Screen components
- `src/services/` - Business logic and API calls
- `src/config/` - Configuration files
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

### TypeScript Standards

- Use TypeScript for all new files
- Define proper interfaces and types
- Avoid `any` type - use proper typing
- Export types from dedicated type files

### Component Standards

- Use functional components with hooks
- Follow React Native naming conventions
- Use React Native Paper for UI components
- Implement proper error boundaries
- Use proper prop typing with TypeScript

## Firebase Integration

### Environment Variables

Use environment variables for Firebase configuration:

```bash
# Copy template and fill in values
cp .env.example .env
```

Required environment variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

### Security Rules

- All Firestore data must be user-scoped
- Use proper authentication checks in security rules
- Test security rules before deployment

## Testing Standards

### Test Files

- Place test files in `__tests__` directories
- Use `.test.ts` or `.test.tsx` extensions
- Test both happy path and error cases
- Mock external dependencies

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/components/__tests__/ContactForm.test.tsx
```

## Code Quality

### Linting

```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

### Type Checking

```bash
# Run TypeScript compiler check
pnpm type-check
```

### Pre-commit Checklist

Before committing code:

- [ ] All tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] Code follows project conventions
- [ ] Commit message follows conventional commits format
- [ ] Commit includes DCO signoff (`git commit -s`)

## Common Mistakes to Avoid

### ❌ Don't Do This

```bash
# Wrong package manager
npm install
yarn add package-name

# Missing signoff
git commit -m "fix: something"

# Poor commit messages
git commit -s -m "fix stuff"
git commit -s -m "WIP"
```

### ✅ Do This Instead

```bash
# Correct package manager
pnpm install
pnpm add package-name

# Proper commit with signoff
git commit -s -m "fix(contacts): resolve duplicate contact creation issue"

# Descriptive commit messages
git commit -s -m "feat(auth): implement Firebase authentication service

Add user login/logout functionality with proper error handling.
Includes form validation and loading states.

Closes #123"
```

## Troubleshooting

### PNPM Issues

If you encounter PNPM issues:

```bash
# Clear PNPM cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Expo Issues

```bash
# Clear Expo cache
pnpm start --clear

# Reset Metro bundler cache
pnpm start --reset-cache
```

### Firebase Issues

- Check environment variables are set correctly
- Verify Firebase project configuration
- Check network connectivity for emulator connections
