# Firebase Setup Guide

This guide will help you set up Firebase for the Swagr app.

## Quick Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "Swagr")
4. Enable/disable Google Analytics as needed
5. Click "Create project"

### 2. Add Web App

1. Click the web icon (`</>`) in your project dashboard
2. Enter app nickname (e.g., "Swagr App")
3. Don't check "Also set up Firebase Hosting"
4. Click "Register app"
5. **Copy the configuration object** - you'll need these values!

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration values in `.env`:

   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

### 4. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Optionally enable **Google** sign-in

### 5. Set Up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **"Start in test mode"** (we'll deploy security rules later)
4. Select a location close to your users
5. Click "Done"

### 6. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore: Configure security rules and indexes files
# - Use existing project (select your project)
# - Accept default firestore.rules file
# - Accept default firestore.indexes.json file

# Deploy security rules
firebase deploy --only firestore:rules
```

## Where to Find Configuration Values

| Value | Location in Firebase Console |
|-------|------------------------------|
| **API Key** | Project Settings → General → Web apps → Config |
| **Auth Domain** | Project Settings → General → Web apps → Config |
| **Project ID** | Project Settings → General → Project ID |
| **Storage Bucket** | Project Settings → General → Web apps → Config |
| **Messaging Sender ID** | Project Settings → Cloud Messaging → Sender ID |
| **App ID** | Project Settings → General → Web apps → App ID |

## Testing Your Setup

Run the Firebase configuration test:

```bash
pnpm test src/config/__tests__/firebase.test.ts
```

## Development with Emulators (Optional)

For local development, you can use Firebase emulators:

```bash
# Install emulators
firebase init emulators

# Select Auth Emulator and Firestore Emulator
# Accept default ports (9099 for Auth, 8080 for Firestore)

# Start emulators
firebase emulators:start
```

Then update your `.env`:

```bash
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
```

## Troubleshooting

### Wrong Account Logged In

```bash
firebase logout
firebase login
```

### Clear Firebase Config

```bash
rm -rf ~/.config/firebase
rm -f .firebaserc
firebase login
```

### Test Configuration

```bash
pnpm test src/config/__tests__/firebase.test.ts
```

## Security Rules Overview

The deployed security rules ensure:

- Users can only access their own data
- All data is scoped to the authenticated user's ID
- Contact data structure is validated on writes
- Proper timestamps are enforced

## Next Steps

After Firebase is configured:

1. Run `pnpm start` to start the development server
2. Test authentication in the app
3. Verify data is being saved to Firestore
4. Deploy security rules to production when ready
