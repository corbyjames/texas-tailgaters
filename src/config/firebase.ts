// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJascYs4rXD4uL5Z8F7RDkMOBhQtjehic",
  authDomain: "texas-tailgaters.firebaseapp.com",
  databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com",
  projectId: "texas-tailgaters",
  storageBucket: "texas-tailgaters.appspot.com",
  messagingSenderId: "517392756353",
  appId: "1:517392756353:web:texas-tailgaters-web"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;