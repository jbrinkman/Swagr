# Testing Database Initialization

## Prerequisites

1. **Firebase Auth User**: You need a user created in Firebase Authentication
   - Go to Firebase Console → Authentication → Users
   - Create a user with email/password
   - Note the email and password for testing

## Testing Steps

### 1. Test with Email/Password (Recommended)

```bash
pnpm run init-db-real --email=your-test-user@example.com --password=your-password --seed
```

**Expected Output**:

```
🚀 Starting database initialization...

✅ Firebase configuration validated
🔥 Initializing Firebase...
✅ Connected to Firebase project: your-project-id
🔐 Authenticating user: your-test-user@example.com
✅ Authenticated as: AbCdEf123456789 (Firebase Auth UID)
🏗️  Initializing database schema for user: AbCdEf123456789
✅ Authentication verified for user: AbCdEf123456789
✅ Database schema initialized
🌱 Seeding database with sample data for user: AbCdEf123456789
✅ Database seeding completed: 3 contacts created

🎉 Database initialization completed successfully!
📊 User: AbCdEf123456789
📅 Default year created: 2024
🌱 Sample data seeded
```

### 2. Verify in Firebase Console

After successful initialization, check Firebase Console:

1. **Firestore Database** → Data
2. Look for collection: `users/{your-auth-uid}/`
3. You should see:

   ```
   users/
   └── AbCdEf123456789/  (your Firebase Auth UID)
       ├── preferences/
       │   └── main
       └── years/
           └── {year-id}/
               └── contacts/
                   ├── {contact-1}
                   ├── {contact-2}
                   └── {contact-3}
   ```

### 3. Common Issues and Solutions

#### Issue: "Permission Denied"

**Cause**: User not properly authenticated or UID mismatch
**Solution**:

- Ensure user exists in Firebase Auth
- Use correct email/password
- Don't mix `--user-id` with `--email/--password`

#### Issue: "Authentication failed"

**Cause**: Invalid credentials
**Solution**:

- Check email/password in Firebase Console
- Ensure user account is enabled
- Check for typos in email/password

#### Issue: "Missing environment variables"

**Cause**: `.env` file not properly configured
**Solution**:

- Check `.env` file exists
- Verify all Firebase config variables are set
- Restart terminal after updating `.env`

### 4. Security Rules Verification

The permission denied error you experienced was actually **correct behavior**! Here's why:

1. **Security Rules Require Authentication**:

   ```javascript
   allow read, write: if request.auth != null && request.auth.uid == userId;
   ```

2. **UID Must Match Path**: The authenticated user's UID must match the `userId` in the document path

3. **Previous Issue**: The script wasn't properly linking authentication to database operations

### 5. What Changed in the Fix

1. **Authentication First**: Script now authenticates before any database operations
2. **UID Verification**: Verifies the authenticated user's UID matches the expected user ID
3. **Clear Error Messages**: Better error messages for authentication issues
4. **Security Compliance**: Ensures operations comply with Firestore security rules

### 6. Testing Different Scenarios

#### Scenario A: Email/Password Authentication (Recommended)

```bash
pnpm run init-db-real --email=user@example.com --password=password123 --seed
```

- ✅ Authenticates user
- ✅ Uses authenticated UID for database operations
- ✅ Complies with security rules

#### Scenario B: User ID Only (Development/Emulator)

```bash
pnpm run init-db-real --user-id=some-user-id --seed
```

- ⚠️ No authentication
- ❌ Will fail with production security rules
- ✅ May work with emulators or relaxed rules

#### Scenario C: Mixed Parameters

```bash
pnpm run init-db-real --email=user@example.com --password=password123 --user-id=different-id --seed
```

- ✅ Authenticates with email/password
- ⚠️ Warns about UID mismatch
- ✅ Uses authenticated UID (ignores provided user-id)

## Next Steps

1. **Create Firebase Auth User**: If you haven't already
2. **Test the Script**: Use your real email/password
3. **Verify Results**: Check Firebase Console
4. **Integrate with App**: Use the same authentication in your React Native app

The database initialization should now work correctly with proper Firebase Authentication!
