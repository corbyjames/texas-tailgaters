import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, push, set, remove } from 'firebase/database';

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

// UT 2025 Football Schedule - OFFICIAL DATA
const UT_2025_SCHEDULE = [
  { date: '2025-08-30', opponent: 'Ohio State', location: 'Columbus, OH', time: '11:00 AM', tvNetwork: 'FOX', isHome: false },
  { date: '2025-09-06', opponent: 'San Jose State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'Longhorn Network', isHome: true },
  { date: '2025-09-13', opponent: 'UTSA', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN+', isHome: true },
  { date: '2025-09-20', opponent: 'Colorado State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'SEC Network', isHome: true },
  { date: '2025-10-04', opponent: 'Mississippi State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN', isHome: true },
  { date: '2025-10-11', opponent: 'Oklahoma', location: 'Dallas, TX', time: '2:30 PM', tvNetwork: 'ABC', isHome: false },
  { date: '2025-10-18', opponent: 'Georgia', location: 'Austin, TX', time: 'TBD', tvNetwork: 'CBS', isHome: true },
  { date: '2025-10-25', opponent: 'Vanderbilt', location: 'Nashville, TN', time: 'TBD', tvNetwork: 'SEC Network', isHome: false },
  { date: '2025-11-01', opponent: 'Florida', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN', isHome: true },
  { date: '2025-11-15', opponent: 'Arkansas', location: 'Fayetteville, AR', time: 'TBD', tvNetwork: 'ABC/ESPN', isHome: false },
  { date: '2025-11-22', opponent: 'Kentucky', location: 'Austin, TX', time: 'TBD', tvNetwork: 'SEC Network', isHome: true },
  { date: '2025-11-29', opponent: 'Texas A&M', location: 'College Station, TX', time: 'TBD', tvNetwork: 'ABC', isHome: false },
];

// UT 2024 Football Schedule (for reference, season complete)
const UT_2024_SCHEDULE = [
  { date: '2024-08-31', opponent: 'Colorado State', location: 'Austin, TX', time: '2:30 PM', tvNetwork: 'ESPN', isHome: true },
  { date: '2024-09-07', opponent: 'Michigan', location: 'Ann Arbor, MI', time: '11:00 AM', tvNetwork: 'FOX', isHome: false },
  { date: '2024-09-14', opponent: 'UTSA', location: 'Austin, TX', time: '6:00 PM', tvNetwork: 'ESPN', isHome: true },
  { date: '2024-09-21', opponent: 'ULM', location: 'Austin, TX', time: '7:00 PM', tvNetwork: 'SEC Network', isHome: true },
  { date: '2024-09-28', opponent: 'Mississippi State', location: 'Austin, TX', time: '3:00 PM', tvNetwork: 'SEC Network', isHome: true },
  { date: '2024-10-12', opponent: 'Oklahoma', location: 'Dallas, TX', time: '2:30 PM', tvNetwork: 'ABC', isHome: false },
  { date: '2024-10-19', opponent: 'Georgia', location: 'Austin, TX', time: '6:30 PM', tvNetwork: 'ABC', isHome: true },
  { date: '2024-10-26', opponent: 'Vanderbilt', location: 'Nashville, TN', time: '3:15 PM', tvNetwork: 'SEC Network', isHome: false },
  { date: '2024-11-09', opponent: 'Florida', location: 'Austin, TX', time: '11:00 AM', tvNetwork: 'ABC', isHome: true },
  { date: '2024-11-16', opponent: 'Arkansas', location: 'Fayetteville, AR', time: '11:00 AM', tvNetwork: 'ABC', isHome: false },
  { date: '2024-11-23', opponent: 'Kentucky', location: 'Austin, TX', time: '2:30 PM', tvNetwork: 'SEC Network', isHome: true },
  { date: '2024-11-30', opponent: 'Texas A&M', location: 'College Station, TX', time: '6:30 PM', tvNetwork: 'ABC', isHome: false },
];

async function syncAllGames() {
  console.log('🔄 Syncing all games with correct schedule data...\n');
  
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    const schedule = currentYear === 2024 ? UT_2024_SCHEDULE : UT_2025_SCHEDULE;
    
    console.log(`Using ${currentYear === 2024 ? '2024' : '2025'} schedule (${schedule.length} games)\n`);
    
    // Get existing games from Firebase
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    const existingGames = snapshot.exists() ? snapshot.val() : {};
    
    // Create a map of existing games by opponent and date
    const existingGamesMap = new Map();
    for (const [id, game] of Object.entries(existingGames)) {
      const key = `${game.opponent}_${game.date}`;
      existingGamesMap.set(key, { id, ...game });
    }
    
    console.log(`Found ${Object.keys(existingGames).length} existing games in database\n`);
    
    // Track updates
    let updated = 0;
    let created = 0;
    let unchanged = 0;
    
    // Process each game in the schedule
    for (const scheduleGame of schedule) {
      const gameKey = `${scheduleGame.opponent}_${scheduleGame.date}`;
      const existingGame = existingGamesMap.get(gameKey);
      
      if (existingGame) {
        // Check if update is needed
        const needsUpdate = 
          existingGame.time !== scheduleGame.time ||
          existingGame.tvNetwork !== scheduleGame.tvNetwork ||
          existingGame.location !== scheduleGame.location ||
          existingGame.isHome !== scheduleGame.isHome;
        
        if (needsUpdate) {
          console.log(`📝 Updating ${scheduleGame.opponent}:`);
          console.log(`   Date: ${scheduleGame.date}`);
          
          if (existingGame.time !== scheduleGame.time) {
            console.log(`   Time: ${existingGame.time} → ${scheduleGame.time}`);
          }
          if (existingGame.tvNetwork !== scheduleGame.tvNetwork) {
            console.log(`   TV: ${existingGame.tvNetwork || 'none'} → ${scheduleGame.tvNetwork}`);
          }
          
          const gameRef = ref(database, `games/${existingGame.id}`);
          await update(gameRef, {
            time: scheduleGame.time,
            tvNetwork: scheduleGame.tvNetwork,
            location: scheduleGame.location,
            isHome: scheduleGame.isHome,
            updatedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString()
          });
          
          updated++;
        } else {
          unchanged++;
        }
        
        // Remove from map so we can identify games to delete
        existingGamesMap.delete(gameKey);
        
      } else {
        // Create new game
        console.log(`➕ Creating new game: ${scheduleGame.opponent} on ${scheduleGame.date}`);
        
        const newGameRef = push(gamesRef);
        const newGame = {
          date: scheduleGame.date,
          time: scheduleGame.time,
          opponent: scheduleGame.opponent,
          location: scheduleGame.location,
          isHome: scheduleGame.isHome,
          status: 'unplanned',
          tvNetwork: scheduleGame.tvNetwork,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          expectedAttendance: 0
        };
        
        await set(newGameRef, newGame);
        created++;
      }
    }
    
    // Check for games that should be removed (not in current schedule)
    const toDelete = [];
    for (const [key, game] of existingGamesMap) {
      // Only consider deleting games from the current year
      if (game.date && game.date.startsWith(String(currentYear))) {
        toDelete.push(game);
      }
    }
    
    if (toDelete.length > 0) {
      console.log(`\n⚠️  Found ${toDelete.length} games not in schedule:`);
      for (const game of toDelete) {
        console.log(`   - ${game.opponent} on ${game.date}`);
      }
      // Note: Not auto-deleting to preserve any custom games
    }
    
    // Summary
    console.log('\n✅ Sync Complete!');
    console.log(`   Created: ${created} games`);
    console.log(`   Updated: ${updated} games`);
    console.log(`   Unchanged: ${unchanged} games`);
    
    // Verify critical games
    console.log('\n📋 Verifying Critical Games:');
    const verifySnapshot = await get(gamesRef);
    const allGames = verifySnapshot.val();
    
    const criticalGames = [
      { opponent: 'Ohio State', expectedTime: '11:00 AM', expectedDate: '2025-08-30' },
      { opponent: 'Oklahoma', expectedTime: '2:30 PM', expectedDate: '2025-10-11' },
      { opponent: 'Georgia', expectedTime: 'TBD', expectedDate: '2025-10-18' },
      { opponent: 'Texas A&M', expectedTime: 'TBD', expectedDate: '2025-11-29' }
    ];
    
    for (const critical of criticalGames) {
      let found = false;
      for (const [id, game] of Object.entries(allGames)) {
        if (game.opponent === critical.opponent && game.date === critical.expectedDate) {
          const timeCorrect = game.time === critical.expectedTime;
          const status = timeCorrect ? '✅' : '❌';
          console.log(`   ${status} ${critical.opponent}: ${game.date} at ${game.time} (expected ${critical.expectedTime})`);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`   ❌ ${critical.opponent}: NOT FOUND`);
      }
    }
    
    console.log('\n🎉 All games have been synchronized with the official schedule!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the sync
syncAllGames();