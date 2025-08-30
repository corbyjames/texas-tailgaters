import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const database = admin.database();

/**
 * Scheduled function that runs daily at 6 AM Central Time
 * Syncs game schedules, scores, and TV network updates
 */
export const dailyScheduleSync = functions.pubsub
  .schedule('0 6 * * *') // 6 AM daily
  .timeZone('America/Chicago') // Central Time
  .onRun(async (context) => {
    console.log('Starting daily schedule sync at', context.timestamp);
    
    try {
      const result = await performSync();
      console.log('Sync completed:', result);
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  });

/**
 * HTTP function for manual sync trigger
 */
export const manualScheduleSync = functions.https.onRequest(async (req, res) => {
  // Check for admin authentication (implement your auth check)
  const authToken = req.headers.authorization;
  if (!authToken || !authToken.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized');
    return;
  }
  
  try {
    const result = await performSync();
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Manual sync failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Main sync logic
 */
async function performSync() {
  const result = {
    updated: 0,
    added: 0,
    errors: [] as string[],
    timestamp: new Date().toISOString()
  };
  
  try {
    // Get existing games
    const gamesSnapshot = await database.ref('games').once('value');
    const existingGames = gamesSnapshot.val() || {};
    const gamesMap = new Map<string, any>();
    
    Object.entries(existingGames).forEach(([id, game]: [string, any]) => {
      const key = `${game.date}_${game.opponent}`;
      gamesMap.set(key, { id, ...game });
    });
    
    // Fetch from ESPN
    const espnGames = await fetchESPNSchedule();
    
    // Process ESPN games
    for (const espnGame of espnGames) {
      const key = `${espnGame.date}_${espnGame.opponent}`;
      const existing = gamesMap.get(key);
      
      if (existing) {
        // Check for updates
        const updates: any = {};
        let hasUpdates = false;
        
        // Check time update
        if (espnGame.time && espnGame.time !== 'TBD' && existing.time !== espnGame.time) {
          updates.time = espnGame.time;
          hasUpdates = true;
          console.log(`Time update for ${espnGame.opponent}: ${existing.time} -> ${espnGame.time}`);
        }
        
        // Check TV network update
        if (espnGame.tvNetwork && espnGame.tvNetwork !== 'TBD' && existing.tvNetwork !== espnGame.tvNetwork) {
          updates.tvNetwork = espnGame.tvNetwork;
          hasUpdates = true;
          console.log(`TV update for ${espnGame.opponent}: ${existing.tvNetwork} -> ${espnGame.tvNetwork}`);
        }
        
        // Check if game completed
        if (espnGame.status === 'completed' && existing.status !== 'completed') {
          updates.status = 'completed';
          updates.homeScore = espnGame.homeScore;
          updates.awayScore = espnGame.awayScore;
          updates.result = espnGame.result;
          hasUpdates = true;
          console.log(`Game completed: ${espnGame.opponent} - ${espnGame.result} (${espnGame.homeScore}-${espnGame.awayScore})`);
        }
        
        if (hasUpdates) {
          updates.updatedAt = new Date().toISOString();
          updates.lastSyncedAt = new Date().toISOString();
          await database.ref(`games/${existing.id}`).update(updates);
          result.updated++;
        }
      } else if (espnGame.isBowlGame) {
        // Add new bowl game
        const newGame = {
          date: espnGame.date,
          time: espnGame.time || 'TBD',
          opponent: espnGame.opponent,
          location: espnGame.location || '',
          isHome: espnGame.isHome || false,
          status: 'unplanned',
          tvNetwork: espnGame.tvNetwork || 'TBD',
          isBowlGame: true,
          bowlName: espnGame.bowlName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          expectedAttendance: 0
        };
        
        await database.ref('games').push(newGame);
        result.added++;
        console.log(`Added bowl game: ${espnGame.bowlName} vs ${espnGame.opponent}`);
      }
    }
    
    // Log sync result
    await database.ref('syncLogs').push({
      timestamp: result.timestamp,
      updated: result.updated,
      added: result.added,
      errors: result.errors
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  return result;
}

/**
 * Fetch schedule from ESPN API
 */
async function fetchESPNSchedule() {
  const TEXAS_TEAM_ID = '251';
  const year = new Date().getFullYear();
  
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${TEXAS_TEAM_ID}/schedule?season=${year}`
    );
    
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }
    
    const data = await response.json();
    const games = [];
    
    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      if (!competition) continue;
      
      const texasTeam = competition.competitors.find((c: any) => c.team.id === TEXAS_TEAM_ID);
      const opponent = competition.competitors.find((c: any) => c.team.id !== TEXAS_TEAM_ID);
      
      if (!texasTeam || !opponent) continue;
      
      const gameDate = new Date(competition.date);
      const isCompleted = competition.status?.type?.completed;
      
      const game: any = {
        date: gameDate.toISOString().split('T')[0],
        opponent: opponent.team.displayName,
        isHome: texasTeam.homeAway === 'home',
        time: gameDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        tvNetwork: competition.broadcasts?.[0]?.names?.join(', ') || 'TBD',
        status: isCompleted ? 'completed' : 'unplanned',
        espnGameId: event.id
      };
      
      // Add location
      if (competition.venue) {
        const venue = competition.venue;
        game.location = venue.fullName;
        if (venue.address) {
          game.location += `, ${venue.address.city}, ${venue.address.state}`;
        }
      }
      
      // Add scores if completed
      if (isCompleted) {
        const texasScore = parseInt(texasTeam.score) || 0;
        const opponentScore = parseInt(opponent.score) || 0;
        
        if (game.isHome) {
          game.homeScore = texasScore;
          game.awayScore = opponentScore;
        } else {
          game.homeScore = opponentScore;
          game.awayScore = texasScore;
        }
        
        if (texasScore > opponentScore) game.result = 'W';
        else if (texasScore < opponentScore) game.result = 'L';
        else game.result = 'T';
      }
      
      // Check for bowl game
      const month = gameDate.getMonth();
      if ((month === 11 || month === 0) && 
          (event.name?.toLowerCase().includes('bowl') || 
           event.name?.toLowerCase().includes('playoff'))) {
        game.isBowlGame = true;
        game.bowlName = event.name;
      }
      
      games.push(game);
    }
    
    return games;
  } catch (error) {
    console.error('ESPN fetch error:', error);
    return [];
  }
}

/**
 * Function to check for live game updates (runs more frequently during games)
 */
export const liveGameUpdates = functions.pubsub
  .schedule('*/15 * * * 6') // Every 15 minutes on Saturdays
  .timeZone('America/Chicago')
  .onRun(async (context) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Only run between 11 AM and 11 PM on game days
    if (hour < 11 || hour > 23) {
      console.log('Outside game hours, skipping live update');
      return null;
    }
    
    console.log('Checking for live game updates at', context.timestamp);
    
    try {
      // Check if there's a game today
      const gamesSnapshot = await database.ref('games').once('value');
      const games = gamesSnapshot.val() || {};
      
      const today = now.toISOString().split('T')[0];
      let hasGameToday = false;
      let todaysGame = null;
      
      for (const [id, game] of Object.entries(games) as any) {
        if (game.date === today && game.status !== 'completed') {
          hasGameToday = true;
          todaysGame = { id, ...game };
          break;
        }
      }
      
      if (!hasGameToday || !todaysGame) {
        console.log('No game today, skipping');
        return null;
      }
      
      // Fetch live score
      const espnGames = await fetchESPNSchedule();
      const liveGame = espnGames.find(g => g.date === today);
      
      if (liveGame && liveGame.status === 'completed' && todaysGame.status !== 'completed') {
        // Update with final score
        await database.ref(`games/${todaysGame.id}`).update({
          status: 'completed',
          homeScore: liveGame.homeScore,
          awayScore: liveGame.awayScore,
          result: liveGame.result,
          updatedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString()
        });
        
        console.log(`Game completed: ${liveGame.opponent} - ${liveGame.result}`);
      }
      
      return { checked: true, gameUpdated: liveGame?.status === 'completed' };
    } catch (error) {
      console.error('Live update failed:', error);
      throw error;
    }
  });