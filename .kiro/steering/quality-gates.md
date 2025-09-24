# Quality Gates for Task Completion

## Overview

All tasks must pass comprehensive quality checks before being marked as complete. This ensures code quality, type safety, and prevents breaking changes to the existing system.

## Required Quality Checks

Before marking any task as complete, the following commands MUST all pass with zero errors:

### 1. Type Checking

```bash
pnpm type-check
```

- Must pass with no TypeScript errors
- Ensures type safety across the entire codebase
- Catches potential runtime errors at compile time

### 2. Linting

```bash
pnpm lint
```

- Must pass with no ESLint errors OR warnings
- Warnings are treated as errors to prevent technical debt accumulation
- Ensures code follows project standards
- Maintains consistent code style and best practices

### 3. Testing

```bash
pnpm test
```

- All tests must pass
- No failing test suites
- Ensures functionality works as expected

## Quality Gate Process

1. **Before Implementation**: Run all quality checks to establish baseline
2. **During Implementation**: Run checks frequently to catch issues early
3. **Before Task Completion**: Run all three commands and verify zero errors
4. **Task Completion**: Only mark task as complete after all checks pass

## Error Resolution

If any quality check fails:

1. **DO NOT** mark the task as complete
2. **DO** fix all errors before proceeding
3. **DO** re-run all quality checks after fixes
4. **DO** iterate until all checks pass

## Acceptable Exceptions

There are NO acceptable exceptions to this rule. All quality gates must pass.

## Implementation Guidelines

- Fix TypeScript errors by adding proper types, not by using `any`
- Fix linting errors by following the established code style
- Fix test failures by correcting the implementation or updating tests appropriately
- Ensure new code doesn't break existing functionality

## Benefits

- Maintains high code quality
- Prevents regression bugs
- Ensures type safety
- Maintains consistent code style
- Builds confidence in the codebase
- Reduces debugging time in the future

This quality gate process is non-negotiable and must be followed for every task completion.
