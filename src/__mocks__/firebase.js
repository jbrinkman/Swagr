module.exports = {
    app: {
        initializeApp: jest.fn(() => ({
            options: {
                projectId: 'test-project',
                authDomain: 'test-project.firebaseapp.com',
            },
        })),
    },
    auth: {
        getAuth: jest.fn(() => ({
            app: {
                options: {
                    projectId: 'test-project',
                    authDomain: 'test-project.firebaseapp.com',
                },
            },
            currentUser: null,
        })),
        connectAuthEmulator: jest.fn(),
    },
    firestore: {
        getFirestore: jest.fn(() => ({
            app: {
                options: {
                    projectId: 'test-project',
                },
            },
        })),
        connectFirestoreEmulator: jest.fn(),
    },
};