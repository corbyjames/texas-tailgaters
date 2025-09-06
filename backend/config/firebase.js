const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // Get service account path from environment or use default
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                              path.join(__dirname, '../firebase-admin-sdk.json');

    // Initialize with service account
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 
                   'https://texas-tailgaters-default-rtdb.firebaseio.com'
    });

    console.log('Firebase Admin initialized successfully');
    return admin.app();
    
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    
    // Initialize with default credentials as fallback
    try {
      admin.initializeApp();
      console.log('Firebase Admin initialized with default credentials');
      return admin.app();
    } catch (fallbackError) {
      console.error('Failed to initialize Firebase Admin:', fallbackError);
      throw fallbackError;
    }
  }
}

// Initialize on module load
initializeFirebase();

module.exports = admin;