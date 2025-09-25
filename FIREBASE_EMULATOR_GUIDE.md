# Firebase Emulator Development Guide

This guide covers how to use Firebase emulators for local development and testing of the Marketing Checklist app.

## Overview

Firebase emulators provide a local development environment that mimics Firebase services without affecting your production data. This setup includes:

- **Firebase Auth Emulator** (port 9099) - User authentication
- **Cloud Firestore Emulator** (port 8080) - Database operations  
- **Firebase Emulator UI** (port 4000) - Web interface for managing emulated services

## Quick Start

### 1. Prerequisites

Ensure you have Firebase CLI installed:

```bash
npm install -g firebase-tools
```

### 2. Start Emulators

```bash
# Start all emulators with UI
pnpm emulators:start

# Start specific emulators only
pnpm emulators:start:detached
```

### 3. Configure App for Emulators

Set the environment variable to use emulators:

```bash
# In your .env file
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
```

### 4. Access Emulator UI

Open <http://localhost:4000> in your browser to access the Firebase Emulator UI.

## Available Scripts

### Emulator Management

```bash
# Start emulators
pnpm emulators:start              # Start with UI (blocking)
pnpm emulators:start:detached     # Start specific services

# Stop emulators
pnpm emulators:stop               # Graceful shutdown

# Reset emulators
pnpm emulators:reset              # Clear data and restart
pnpm emulators:cleanup            # Full cleanup
pnpm emulators:cleanup:quick      # Data cleanup only
pnpm emulators:test-reset         # Reset and restart for testing
```

### Data Management

```bash
# Seed with test data
pnpm emulators:seed               # Add sample users and data

# Export current data
pnpm emulators:export             # Save to ./emulator-data

# Import existing data
pnpm emulators:import             # Load from ./emulator-data
```

### Testing

```bash
# Run tests against emulators
pnpm test:emulators               # All tests with emulators

# Run integration tests only
pnpm test:integration             # Integration tests with emulators
```

## Development Workflow

### Daily Development

1. **Start your day:**

   ```bash
   pnpm emulators:start
   ```

2. **Develop with live reload:**

   ```bash
   # In another terminal
   pnpm start
   ```

3. **Run tests frequently:**

   ```bash
   pnpm test:emulators
   ```

4. **End of day:**

   ```bash
   pnpm emulators:stop
   ```

### Testing Workflow

1. **Reset for clean testing:**

   ```bash
   pnpm emulators:test-reset
   ```

2. **Seed with test data:**

   ```bash
   pnpm emulators:seed
   ```

3. **Run your tests:**

   ```bash
   pnpm test:integration
   ```

4. **Export data if needed:**

   ```bash
   pnpm emulators:export
   ```

### Debugging Workflow

1. **Start emulators with UI:**

   ```bash
   pnpm emulators:start
   ```

2. **Open Emulator UI:** <http://localhost:4000>

3. **Inspect data in real-time:**
   - View Firestore collections and documents
   - Check Auth users and tokens
   - Monitor real-time updates

4. **Use browser dev tools:**
   - Network tab for Firebase requests
   - Console for Firebase SDK logs

## Configuration

### Emulator Ports

The emulators use these default ports (configured in `firebase.json`):

- **Auth:** 9099
- **Firestore:** 8080  
- **UI:** 4000

### Environment Variables

```bash
# Enable emulator mode
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true

# Firebase project configuration (still needed for emulators)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
# ... other Firebase config
```

### App Configuration

The app automatically detects emulator mode and connects when:

1. `__DEV__` is true (development mode)
2. `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true` is set
3. Emulators are running and accessible

## Data Management

### Seeding Test Data

The `pnpm emulators:seed` command creates:

- Test user accounts
- Sample years (2023, 2024, 2025)
- Sample contacts for each year
- User preferences

### Data Persistence

- **Temporary:** Data is lost when emulators stop
- **Export/Import:** Use export/import for persistent test data
- **Seed Scripts:** Recreate consistent test data

### Data Structure

```
users/{userId}/
├── preferences (document)
├── years/{yearId} (subcollection)
│   └── contacts/{contactId} (subcollection)
```

## Testing

### Unit Tests

Unit tests run against mocked Firebase services and don't require emulators.

```bash
pnpm test
```

### Integration Tests

Integration tests run against live emulators for realistic testing.

```bash
pnpm test:integration
```

### Test Isolation

Each test suite should:

1. Start with clean emulator state
2. Seed required test data
3. Clean up after completion

Use the cleanup utilities:

```bash
# Before test suite
pnpm emulators:cleanup:quick

# Seed test data
pnpm emulators:seed
```

## Troubleshooting

### Common Issues

**Emulators won't start:**

```bash
# Check if ports are in use
lsof -i :4000 -i :8080 -i :9099

# Force cleanup
pnpm emulators:cleanup:full
```

**App not connecting to emulators:**

```bash
# Verify environment variable
echo $EXPO_PUBLIC_USE_FIREBASE_EMULATOR

# Check emulator status
curl http://localhost:4000
```

**Tests failing:**

```bash
# Reset emulators
pnpm emulators:test-reset

# Verify test data
pnpm emulators:seed
```

### Debug Logs

Emulator logs are saved to:

- `firebase-debug.log`
- `firestore-debug.log`  
- `ui-debug.log`

### Performance Issues

If emulators are slow:

1. **Reduce data size:** Clear old test data
2. **Restart emulators:** Fresh start often helps
3. **Check system resources:** Emulators are memory-intensive

## Security Rules Testing

Test Firestore security rules with emulators:

1. **Deploy rules to emulators:**

   ```bash
   firebase deploy --only firestore:rules --project demo-project
   ```

2. **Test with different users:**
   - Create test users in Auth emulator
   - Switch between users in tests
   - Verify access controls

3. **Use Emulator UI:**
   - Rules playground in Firestore tab
   - Test queries with different auth states

## Production vs Emulator

### Differences

- **Performance:** Emulators are slower than production
- **Features:** Some Firebase features not available in emulators
- **Data:** Emulator data is temporary by default
- **Security:** Emulators are more permissive for testing

### Best Practices

1. **Test with both:** Use emulators for development, production for staging
2. **Keep rules in sync:** Deploy same rules to both environments
3. **Monitor differences:** Some behaviors may differ between environments
4. **Use realistic data:** Seed emulators with production-like data

## Advanced Usage

### Custom Emulator Configuration

Modify `firebase.json` for custom ports or settings:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Programmatic Control

Use the emulator utilities in your code:

```typescript
import { areEmulatorsAvailable, connectToEmulators } from './src/config/firebaseEmulators';

// Check if emulators are running
const available = await areEmulatorsAvailable();

// Connect programmatically
const result = await connectToEmulators(auth, db);
```

### CI/CD Integration

For automated testing:

```bash
# Start emulators in background
firebase emulators:start --only auth,firestore &

# Wait for startup
sleep 5

# Run tests
pnpm test:integration

# Cleanup
firebase emulators:stop
```

## Support

For issues with this setup:

1. Check the troubleshooting section above
2. Review Firebase emulator documentation
3. Check project issues on GitHub
4. Verify your Firebase CLI version: `firebase --version`

---

**Happy developing with Firebase emulators! 🔥**
