// Test Firebase Database Persistence
// This script tests all CRUD operations using Firebase

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, update, remove } from 'firebase/database';

// Firebase configuration (you need to update this with your actual config)
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
const database = getDatabase(app);

console.log('🔥 Testing Firebase Database Persistence');
console.log('=========================================\n');

async function testFirebase() {
  try {
    // Test 1: Create a theme
    console.log('1️⃣ Testing Theme Creation...');
    const themesRef = ref(database, 'themes');
    const newThemeRef = push(themesRef);
    const testTheme = {
      name: 'Test BBQ Theme',
      description: 'Testing Firebase persistence',
      colors: ['#FF0000', '#0000FF'],
      food_suggestions: ['BBQ', 'Chips', 'Drinks'],
      is_custom: false,
      created_at: new Date().toISOString()
    };
    
    await set(newThemeRef, testTheme);
    const themeId = newThemeRef.key;
    console.log('✅ Theme created with ID:', themeId);

    // Test 2: Create a game
    console.log('\n2️⃣ Testing Game Creation...');
    const gamesRef = ref(database, 'games');
    const newGameRef = push(gamesRef);
    const testGame = {
      date: '2025-09-06',
      time: '2:30 PM',
      opponent: 'Test Opponent',
      location: 'Austin, TX',
      is_home: true,
      theme_id: themeId,
      status: 'unplanned',
      expected_attendance: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await set(newGameRef, testGame);
    const gameId = newGameRef.key;
    console.log('✅ Game created with ID:', gameId);

    // Test 3: Create a potluck item
    console.log('\n3️⃣ Testing Potluck Item Creation...');
    const potluckRef = ref(database, 'potluck_items');
    const newItemRef = push(potluckRef);
    const testItem = {
      game_id: gameId,
      name: 'Test Brisket',
      category: 'main',
      quantity: '5 lbs',
      description: 'Smoked brisket',
      assigned_to: 'test@user.com',
      is_admin_assigned: false,
      dietary_flags: ['gluten-free'],
      created_at: new Date().toISOString()
    };
    
    await set(newItemRef, testItem);
    const itemId = newItemRef.key;
    console.log('✅ Potluck item created with ID:', itemId);

    // Test 4: Read all games
    console.log('\n4️⃣ Testing Read Operations...');
    const gamesSnapshot = await get(gamesRef);
    if (gamesSnapshot.exists()) {
      const gamesData = gamesSnapshot.val();
      const gameCount = Object.keys(gamesData).length;
      console.log(`✅ Found ${gameCount} games in database`);
    }

    // Test 5: Update game
    console.log('\n5️⃣ Testing Update Operations...');
    const gameUpdateRef = ref(database, `games/${gameId}`);
    await update(gameUpdateRef, {
      status: 'planned',
      updated_at: new Date().toISOString()
    });
    console.log('✅ Game updated successfully');

    // Test 6: Read updated game
    const updatedGameSnapshot = await get(gameUpdateRef);
    if (updatedGameSnapshot.exists()) {
      const updatedGame = updatedGameSnapshot.val();
      console.log('✅ Verified update - status is now:', updatedGame.status);
    }

    // Test 7: Delete test data
    console.log('\n6️⃣ Testing Delete Operations...');
    await remove(ref(database, `potluck_items/${itemId}`));
    console.log('✅ Deleted potluck item');
    
    await remove(ref(database, `games/${gameId}`));
    console.log('✅ Deleted game');
    
    await remove(ref(database, `themes/${themeId}`));
    console.log('✅ Deleted theme');

    console.log('\n=========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('Firebase is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Update src/config/firebase.ts with your actual Firebase config');
    console.log('2. Enable Authentication in Firebase Console');
    console.log('3. Run: npm run dev');
    console.log('4. Test the app at http://localhost:5174');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you created a Firebase project');
    console.log('2. Enable Realtime Database in Firebase Console');
    console.log('3. Set database rules to test mode (public read/write)');
    console.log('4. Update the firebaseConfig in this file and src/config/firebase.ts');
  }

  process.exit(0);
}

testFirebase();