const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase config from your app
const firebaseConfig = {
  apiKey: "AIzaSyBJascYs4rXD4uL5Z8F7RDkMOBhQtjehic",
  authDomain: "texas-tailgaters.firebaseapp.com",
  databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com",
  projectId: "texas-tailgaters",
  storageBucket: "texas-tailgaters.appspot.com",
  messagingSenderId: "517392756353",
  appId: "1:517392756353:web:texas-tailgaters-web"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  console.log('Testing Firebase Authentication...\n');
  
  // Test credentials - trying different passwords from SESSION_CONTEXT.md
  const credentials = [
    { email: 'test@texastailgaters.com', password: 'TestPassword123!' },
    { email: 'test@texastailgaters.com', password: 'TestMember123!' },
    { email: 'corbyjames@gmail.com', password: '$4Xanadu4M3e' },
    { email: 'testmember@texastailgaters.com', password: 'TestMember123!' }
  ];
  
  for (const cred of credentials) {
    console.log(`Testing ${cred.email}...`);
    try {
      // Try to sign in
      const userCredential = await signInWithEmailAndPassword(auth, cred.email, cred.password);
      console.log(`✅ Login successful for ${cred.email}`);
      console.log(`   User ID: ${userCredential.user.uid}`);
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        console.log(`❌ Login failed for ${cred.email}: ${error.code}`);
        console.log('   Attempting to create user...');
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cred.email, cred.password);
          console.log(`✅ User created: ${cred.email}`);
          console.log(`   User ID: ${userCredential.user.uid}`);
        } catch (createError) {
          console.log(`❌ Failed to create user: ${createError.code} - ${createError.message}`);
        }
      } else {
        console.log(`❌ Login failed for ${cred.email}: ${error.code} - ${error.message}`);
      }
    }
    console.log('');
  }
  
  process.exit(0);
}

testAuth().catch(console.error);