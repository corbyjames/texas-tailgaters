import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, push, set } from 'firebase/database';

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
const database = getDatabase(app);

async function fixOhioStateGame() {
  console.log('🔧 Fixing Ohio State game time in Firebase...\n');
  
  try {
    // Get all games
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) {
      console.log('❌ No games found in database');
      return;
    }
    
    const games = snapshot.val();
    let ohioStateGameId = null;
    let ohioStateGame = null;
    
    // Find Ohio State game
    for (const [gameId, game] of Object.entries(games)) {
      if (game.opponent === 'Ohio State') {
        ohioStateGameId = gameId;
        ohioStateGame = game;
        console.log('Found Ohio State game:');
        console.log(`  ID: ${gameId}`);
        console.log(`  Current date: ${game.date}`);
        console.log(`  Current time: ${game.time}`);
        console.log(`  Location: ${game.location}`);
        console.log(`  TV: ${game.tvNetwork}\n`);
        break;
      }
    }
    
    if (!ohioStateGameId) {
      console.log('⚠️  Ohio State game not found. Creating it...');
      
      // Create Ohio State game with correct data
      const newGameRef = push(gamesRef);
      const newGame = {
        date: '2025-08-30',
        time: '11:00 AM',
        opponent: 'Ohio State',
        location: 'Columbus, OH',
        isHome: false,
        status: 'unplanned',
        tvNetwork: 'FOX',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expectedAttendance: 0
      };
      
      await set(newGameRef, newGame);
      console.log('✅ Created Ohio State game with correct time (11:00 AM)');
      
    } else {
      // Update existing game
      const updates = {
        date: '2025-08-30',  // Correct date (Saturday, not Friday)
        time: '11:00 AM',    // Correct time (not 7:30 PM)
        tvNetwork: 'FOX',    // Correct network
        location: 'Columbus, OH',
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updating to:');
      console.log(`  Date: ${updates.date} (Saturday)`);
      console.log(`  Time: ${updates.time}`);
      console.log(`  TV: ${updates.tvNetwork}\n`);
      
      const gameRef = ref(database, `games/${ohioStateGameId}`);
      await update(gameRef, updates);
      
      console.log('✅ Successfully updated Ohio State game!');
    }
    
    // Verify the update
    console.log('\n📋 Verifying all 2025 games:');
    const verifySnapshot = await get(gamesRef);
    const allGames = verifySnapshot.val();
    
    const games2025 = [];
    for (const [id, game] of Object.entries(allGames)) {
      if (game.date && game.date.startsWith('2025')) {
        games2025.push(game);
      }
    }
    
    // Sort by date
    games2025.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Display key games
    const keyGames = ['Ohio State', 'Oklahoma', 'Georgia', 'Texas A&M'];
    console.log('\nKey games:');
    for (const game of games2025) {
      if (keyGames.includes(game.opponent)) {
        const date = new Date(game.date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        console.log(`  ${game.opponent}: ${dayOfWeek} ${game.date} at ${game.time || 'TBD'} on ${game.tvNetwork || 'TBD'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixOhioStateGame();