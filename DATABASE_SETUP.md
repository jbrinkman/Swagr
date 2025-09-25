# Database Setup Guide

This guide covers the complete setup of the Firestore database for the Marketing Checklist application, including security rules, indexes, and initial data.

## 🏗️ Database Architecture

### Collection Structure

```
users/{userId}/
├── preferences/main (UserPreferences)
│   ├── userId: string
│   ├── lastSelectedYearId: string | null
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
├── years/{yearId} (Year documents)
│   ├── userId: string
│   ├── name: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── contacts/{contactId} (Contact documents)
│       ├── userId: string
│       ├── yearId: string
│       ├── firstName: string
│       ├── lastName: string
│       ├── enterpriseName: string
│       ├── comments: string
│       ├── delivered: boolean
│       ├── deliveredAt: timestamp | null
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
└── system/
    ├── version (Migration version tracking)
    │   ├── version: string
    │   └── updatedAt: timestamp
    └── migrations/history/{migrationId} (Migration execution history)
        ├── version: string
        ├── success: boolean
        ├── error: string | null
        └── executedAt: timestamp
```

## 🔐 Security Rules

The database uses comprehensive security rules that ensure:

- **User Isolation**: Users can only access their own data
- **Data Validation**: All writes are validated for proper structure
- **Type Safety**: Field types are enforced at the database level
- **Migration Support**: System collections for schema versioning

### Key Security Features

1. **Authentication Required**: All operations require valid authentication
2. **User Scoping**: Data is scoped to `request.auth.uid`
3. **Data Structure Validation**: Helper functions validate document structure
4. **Timestamp Enforcement**: Created/updated timestamps are required
5. **Migration Tracking**: System collections for database versioning

## 📊 Database Indexes

Optimized indexes for efficient querying:

### Collection Group Indexes

- **Years**: `userId + createdAt (DESC)` - For chronological year listing
- **Contacts**: `userId + yearId + lastName + firstName` - For alphabetical contact sorting
- **Contacts**: `userId + yearId + delivered` - For filtering by delivery status
- **Contacts**: `userId + yearId + createdAt (DESC)` - For chronological contact listing

### Automatic Single-Field Indexes

Firestore automatically creates single-field indexes for:

- **deliveredAt**: For delivery date queries
- **updatedAt**: For recent updates
- **executedAt**: For migration timeline queries

## 🚀 Setup Instructions

### Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project set up
2. **Environment Variables**: Configure your `.env` file with Firebase credentials
3. **Firebase CLI**: Install and authenticate with Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 1. Deploy Security Rules and Indexes

Deploy the database configuration to Firebase:

```bash
# Deploy security rules
pnpm run deploy-rules

# Deploy indexes
pnpm run deploy-indexes

# Deploy both rules and indexes
pnpm run deploy-db
```

### 2. Initialize Database Schema

For development/testing, you have two options:

#### Quick Demo (No Firebase Setup Required)

```bash
# View database services and schema information
pnpm run init-db
```

#### Full Database Initialization (Requires Firebase Setup)

**Prerequisites**:

- Firebase project configured with Authentication enabled
- User account created in Firebase Auth
- Environment variables set in `.env` file

```bash
# Initialize with authenticated user (recommended)
pnpm run init-db-real --email=<your-email> --password=<your-password> --seed

# Initialize with known authenticated user ID
pnpm run init-db-real --user-id=<authenticated-user-id> --seed
```

**Important Notes**:

- **Recommended**: Use `--email` and `--password` with an existing Firebase Auth user
- The script will authenticate and use the authenticated user's UID for database operations
- **Security**: Firestore security rules require that the authenticated user's UID matches the document path
- If you get "Permission Denied" errors, ensure:
  1. The user exists in Firebase Authentication
  2. You're using the correct email/password
  3. The user has been created through Firebase Auth (not just Firestore)

### 3. Verify Setup

After initialization, verify the setup:

1. **Check Firebase Console**: Verify collections are created
2. **Test Security Rules**: Ensure proper access control
3. **Validate Indexes**: Confirm queries are optimized
4. **Run Application**: Test end-to-end functionality

## 🛠️ Database Services

The application includes comprehensive database services:

### DatabaseInitService

- **Schema Initialization**: Creates user collections and default data
- **Schema Validation**: Validates database structure and integrity
- **Data Cleanup**: Maintenance operations for data consistency
- **Statistics**: Database usage and health metrics

### DatabaseSeedService  

- **Sample Data**: Creates realistic test data for development
- **Custom Seeding**: Configurable data generation
- **Minimal Seeding**: Quick setup for testing

### DatabaseMigrationService

- **Version Tracking**: Manages database schema versions
- **Migration Execution**: Runs schema updates safely
- **Rollback Support**: Reverses migrations when possible
- **History Tracking**: Records all migration operations

### DatabaseValidationService

- **Data Integrity**: Validates document structure and relationships
- **Consistency Checks**: Detects duplicate and orphaned data
- **Issue Reporting**: Detailed validation results with severity levels
- **Quick Validation**: Fast error-only checks

## 🔧 Development Workflow

### Local Development with Emulators

1. **Start Emulators**:

   ```bash
   firebase emulators:start
   ```

2. **Configure Environment**:

   ```bash
   export EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

3. **Initialize Local Database**:

   ```bash
   pnpm run init-db-real --user-id=test-user --seed
   ```

### Production Deployment

1. **Deploy Database Configuration**:

   ```bash
   pnpm run deploy-db
   ```

2. **Initialize Production Data** (if needed):

   ```bash
   pnpm run init-db-real --email=<admin-email> --password=<admin-password>
   ```

## 📋 Maintenance Tasks

### Regular Maintenance

1. **Schema Validation**: Run periodic validation checks
2. **Data Cleanup**: Clean up orphaned or inconsistent data
3. **Migration Updates**: Apply new schema migrations
4. **Performance Monitoring**: Monitor query performance and index usage

### Troubleshooting

#### Common Issues

1. **Permission Denied**: Check security rules and user authentication
2. **Missing Indexes**: Deploy indexes or check Firestore console
3. **Schema Validation Errors**: Run cleanup operations or manual fixes
4. **Migration Failures**: Check migration history and rollback if needed

#### Debug Commands

```bash
# Validate user schema
node -e "
const { DatabaseValidationService } = require('./src/services/DatabaseValidationService');
DatabaseValidationService.getInstance().validateUserData('user-id').then(console.log);
"

# Check migration status
node -e "
const { DatabaseMigrationService } = require('./src/services/DatabaseMigrationService');
DatabaseMigrationService.getInstance().getCurrentVersion('user-id').then(console.log);
"

# Get database statistics
node -e "
const { DatabaseInitService } = require('./src/services/DatabaseInitService');
DatabaseInitService.getInstance().getUserDatabaseStats('user-id').then(console.log);
"
```

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit Firebase credentials to version control
2. **User Authentication**: Always verify user identity in security rules
3. **Data Validation**: Validate all data at both client and database level
4. **Minimal Permissions**: Grant only necessary access permissions
5. **Regular Audits**: Periodically review security rules and access patterns

## 📈 Performance Optimization

1. **Index Usage**: Monitor and optimize database indexes
2. **Query Patterns**: Design efficient query patterns
3. **Batch Operations**: Use batch writes for multiple operations
4. **Caching**: Implement appropriate caching strategies
5. **Connection Pooling**: Optimize Firebase connection usage

## 🧪 Testing

The database setup includes comprehensive testing:

- **Unit Tests**: Individual service functionality
- **Integration Tests**: Service interactions
- **Security Rule Tests**: Access control validation
- **Performance Tests**: Query optimization validation

Run tests with:

```bash
pnpm test
```

## 📚 Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
