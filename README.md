# Marketing Checklist App

A React Native mobile application built with Expo that enables marketing professionals to manage yearly contact lists for Improving Inc. employees across different enterprises. The app provides secure authentication, year-based contact organization, delivery tracking with timestamps, and comment management.

## Features

- 🔐 **Secure Authentication** - Firebase Authentication with email/password
- 📅 **Year Management** - Organize contacts by marketing campaign years
- 👥 **Contact Management** - Add, edit, and delete employee contacts
- ✅ **Delivery Tracking** - Mark contacts as delivered with timestamps
- 💬 **Comments System** - Add contextual notes to contacts
- 📱 **iOS Optimized** - Native iOS experience with offline support

## Tech Stack

- **Frontend**: Expo SDK with React Native
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **State Management**: React Context API with useReducer
- **Navigation**: React Navigation v6
- **UI Components**: React Native Elements
- **Date/Time**: date-fns library
- **Language**: TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/) (for development)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jbrinkman/marketing-checklist-app.git
   cd marketing-checklist-app
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore Database
   - Download the `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) files
   - Add your Firebase configuration to the project

4. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

## Development

Start the development server:

```bash
npm start
# or
yarn start
```

Run on iOS simulator:

```bash
npm run ios
# or
yarn ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # API and business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── contexts/           # React Context providers
└── navigation/         # Navigation configuration
```

## Firebase Configuration

1. Create a Firebase project
2. Enable Authentication with Email/Password provider
3. Create a Firestore database with the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /years/{yearId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /contacts/{contactId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

## Testing

Run the test suite:

```bash
npm test
# or
yarn test
```

Run tests in watch mode:

```bash
npm run test:watch
# or
yarn test:watch
```

## Building

Build for production:

```bash
npm run build
# or
yarn build
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/jbrinkman/marketing-checklist-app/issues).
