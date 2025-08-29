// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// You'll need to replace these with your own Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyBvQpzXZvL8qY5T9fKq6UfQH8M8EgB9yLo",
  authDomain: "texas-tailgaters.firebaseapp.com",
  databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com",
  projectId: "texas-tailgaters",
  storageBucket: "texas-tailgaters.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;