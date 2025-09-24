---
inclusion: always
---

# TypeScript Test Setup Guidelines

## 🚨 CRITICAL: setupTests.ts Global Console Mocking

**URGENT**: The `src/setupTests.ts` file contains a specific TypeScript pattern that **MUST NEVER** be changed by autofix or formatting tools.

**THIS IS A RECURRING ISSUE** - Autofix keeps breaking this pattern causing TypeScript compilation failures.

### Required Pattern (Autofix-Resistant Version)

```typescript
// Silence console warnings in tests
// 🚨 CRITICAL: This console mocking pattern MUST NOT be changed by autofix tools!
// Using a more autofix-resistant pattern to prevent recurring TypeScript compilation failures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny = globalThis as any;
const originalConsole = globalAny.console;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalAny.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
};
```

### Legacy Pattern (Autofix Keeps Breaking This)

```typescript
// This pattern works but autofix keeps changing it:
const originalConsole = (globalThis as any).console;
(globalThis as any).console = { ... }
```

### ❌ DO NOT Change To

```typescript
// This will cause TypeScript errors:
(globalThis as unknown).console = { ... }  // ❌ WRONG
(global as any).console = { ... }          // ❌ WRONG  
global.console = { ... }                   // ❌ WRONG

// Also DO NOT change function parameter types:
({ children, visible, ...props }: unknown) => // ❌ WRONG
({ children, visible, ...props }: any) =>     // ✅ CORRECT
```

### Why This Pattern is Required

1. **TypeScript Compatibility**: `(globalThis as any)` is the only pattern that works across all TypeScript versions and Jest environments
2. **Jest Environment**: The Jest test environment requires this specific global object access pattern
3. **Console Mocking**: This pattern allows us to silence console warnings during tests without breaking functionality

### 🛑 Autofix Prevention - CRITICAL

**AUTOFIX KEEPS BREAKING THIS** - This is a recurring issue that has happened 10+ times.

**NEW SOLUTION**: We now use a more autofix-resistant pattern with explicit variable assignment to prevent autofix from changing the type casting.

**ADDITIONAL ISSUE**: Autofix also changes `any` to `unknown` in mock function parameters, which breaks TypeScript compilation. The validation script now catches both issues.

If autofix tools change `(globalThis as any)` to `(globalThis as unknown)`, it will cause TypeScript compilation errors:

```
error TS2571: Object is of type 'unknown'.
```

**ALWAYS CHECK** `src/setupTests.ts` after any autofix operation and immediately revert any changes to the console mocking pattern.

### 🔧 Immediate Resolution Steps

**When this error occurs (and it will):**

1. **IMMEDIATELY** open `src/setupTests.ts`
2. Find the console mocking section (around line 137)
3. Change `(globalThis as unknown)` back to `(globalThis as any)`
4. Verify with `pnpm type-check`
5. **DO NOT** let autofix run on this file again

### 🔒 Protection Strategy

- **Always check** setupTests.ts after autofix operations
- **Immediately revert** any changes to the globalThis pattern
- **Test immediately** with `pnpm type-check` after any changes

### Test Environment Variables

The setupTests.ts file also sets required environment variables for Firebase mocking:

```typescript
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef";
```

These must remain in place for tests to run properly.

## Quality Gates & Validation

### New Automated Validation

We now have automated validation to catch this issue:

```bash
# Run the validation script
pnpm validate-setup

# Run all quality checks (includes validation)
pnpm quality-check
```

**Note**: Always use `pnpm` (not `npm`) as specified in package.json packageManager field.

### Quality Gates

Before any commit, ensure:

1. `pnpm validate-setup` passes ✅ (catches setupTests.ts issues)
2. `pnpm type-check` passes ✅
3. `pnpm lint` passes ✅  
4. `pnpm test` passes ✅

**OR** use the combined command:

```bash
pnpm quality-check
```

### Validation Script

The `scripts/validate-setup-tests.js` script automatically detects:

- ❌ `(globalThis as unknown)` patterns (will fail build)
- ❌ `}: unknown)` in function parameters (will fail build)
- ✅ Correct `globalAny = globalThis as any` patterns
- ✅ Legacy `(globalThis as any)` patterns
- ✅ Correct `}: any)` in function parameters

If type-check fails with console-related errors, the validation script will catch it first.
