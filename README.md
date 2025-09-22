# Swagr

A mobile iOS application for managing marketing contact checklists. Built with Expo and React Native.

## Features

- Secure user authentication with Firebase
- Year-based contact organization
- Contact management with delivery tracking
- Comments and notes for each contact
- Offline support with data synchronization

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm package manager
- Expo CLI
- iOS Simulator or physical iOS device

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure Firebase:
   - Update `src/config/firebase.ts` with your Firebase configuration

### Running the App

```bash
# Start the development server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Linting

```bash
# Run ESLint
pnpm lint

# Type checking
pnpm type-check
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API and business logic services
├── types/          # TypeScript type definitions
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── contexts/       # React contexts
└── config/         # Configuration files
```

## Technologies Used

- **Expo SDK** - React Native development platform
- **TypeScript** - Type-safe JavaScript
- **Firebase** - Authentication and database
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design UI component library
- **@expo/vector-icons** - Icon library for Expo projects
- **pnpm** - Fast, disk space efficient package manager

## License

Private project - All rights reserved.
