const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const databaseURL = process.env.FIREBASE_DATABASE_URL ||
                        'https://texas-tailgaters-default-rtdb.firebaseio.com';

    // Method 1: Try environment variables (for Render Cron Jobs)
    if (process.env.FIREBASE_PRIVATE_KEY_ID && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Initializing Firebase with environment variables...');

      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID || 'texas-tailgaters',
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL
      });

      console.log('Firebase Admin initialized with environment variables');
      return admin.app();
    }

    // Method 2: Try JSON file (for local development)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
                              path.join(__dirname, '../firebase-admin-sdk.json');

    if (fs.existsSync(serviceAccountPath)) {
      console.log('Initializing Firebase with service account file...');
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL
      });

      console.log('Firebase Admin initialized with service account file');
      return admin.app();
    }

    // Method 3: Try default credentials as fallback
    console.log('Attempting Firebase initialization with default credentials...');
    admin.initializeApp({
      databaseURL
    });
    console.log('Firebase Admin initialized with default credentials');
    return admin.app();

  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Available env vars:', {
      hasPrivateKeyId: !!process.env.FIREBASE_PRIVATE_KEY_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasDatabaseUrl: !!process.env.FIREBASE_DATABASE_URL
    });
    throw error;
  }
}

// Initialize on module load
initializeFirebase();

module.exports = admin;