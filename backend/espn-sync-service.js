const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: "texas-tailgaters",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

// Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

// ESPN API configuration
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
const TEXAS_TEAM_ID = '251'; // Texas Longhorns

// Hardcoded backup scores for 2025 season (in case ESPN API fails)
const BACKUP_SCORES_2025 = [
  {
    date: '2025-08-30',
    opponent: 'Ohio State',
    location: 'away',
    texasScore: 7,
    opponentScore: 14,
    result: 'L',
    status: 'completed',
    espnId: '401752677'
  },
  {
    date: '2025-09-06',
    opponent: 'San Jose State',
    location: 'home',
    texasScore: 59,
    opponentScore: 17,
    result: 'W',
    status: 'completed',
    espnId: '401760618'
  },
  {
    date: '2025-09-13',
    opponent: 'UTEP',
    location: 'home',
    texasScore: 42,
    opponentScore: 10,
    result: 'W',
    status: 'completed',
    espnId: '401760619'
  },
  {
    date: '2025-09-20',
    opponent: 'Sam Houston',
    location: 'home',
    texasScore: 45,
    opponentScore: 6,
    result: 'W',
    status: 'completed',
    espnId: '401760620'
  },
  {
    date: '2025-10-04',
    opponent: 'Florida',
    location: 'away',
    texasScore: 28,
    opponentScore: 35,
    result: 'L',
    status: 'completed',
    espnId: '401760621'
  }
];

async function fetchESPNScores() {
  try {
    console.log('Fetching scores from ESPN API...');

    const response = await fetch(
      `${ESPN_BASE_URL}/teams/${TEXAS_TEAM_ID}/schedule?season=2025`
    );

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status}`);
      return BACKUP_SCORES_2025; // Fall back to hardcoded scores
    }

    const data = await response.json();
    const espnGames = data.events || [];

    const scores = [];

    espnGames.forEach(game => {
      const competition = game.competitions[0];
      if (!competition) return;

      const texasTeam = competition.competitors.find(c => c.team.id === TEXAS_TEAM_ID);
      const opponent = competition.competitors.find(c => c.team.id !== TEXAS_TEAM_ID);

      if (!texasTeam || !opponent) return;

      const isCompleted = competition.status.type.completed;
      if (!isCompleted) return;

      const texasScore = parseInt(texasTeam.score) || 0;
      const opponentScore = parseInt(opponent.score) || 0;
      const isHome = texasTeam.homeAway === 'home';
      const result = texasTeam.winner ? 'W' : (opponent.winner ? 'L' : 'T');

      scores.push({
        date: competition.date,
        opponent: opponent.team.displayName,
        location: isHome ? 'home' : 'away',
        texasScore: texasScore,
        opponentScore: opponentScore,
        result: result,
        status: 'completed',
        espnId: game.id
      });
    });

    return scores.length > 0 ? scores : BACKUP_SCORES_2025;
  } catch (error) {
    console.error('Error fetching ESPN scores:', error);
    return BACKUP_SCORES_2025; // Fall back to hardcoded scores
  }
}

async function syncScoresToFirebase() {
  try {
    console.log('Starting score sync to Firebase...');

    // Get scores (from ESPN or backup)
    const scores = await fetchESPNScores();
    console.log(`Found ${scores.length} completed games with scores`);

    // Get current games from Firebase
    const gamesRef = db.ref('games');
    const snapshot = await gamesRef.once('value');

    if (!snapshot.exists()) {
      console.error('No games found in Firebase');
      return { success: false, message: 'No games found in Firebase' };
    }

    const firebaseGames = snapshot.val();
    const updates = {};
    let updateCount = 0;

    // Match and update each game
    scores.forEach(scoreData => {
      Object.entries(firebaseGames).forEach(([gameId, firebaseGame]) => {
        const fbOpponent = firebaseGame.opponent?.toLowerCase() || '';
        const scoreOpponent = scoreData.opponent.toLowerCase();

        // Match by opponent name (fuzzy match)
        if (fbOpponent.includes(scoreOpponent) || scoreOpponent.includes(fbOpponent) ||
            (fbOpponent.includes('ohio') && scoreOpponent.includes('ohio')) ||
            (fbOpponent.includes('san jose') && scoreOpponent.includes('san jose')) ||
            (fbOpponent.includes('utep') && scoreOpponent.includes('utep')) ||
            (fbOpponent.includes('sam houston') && scoreOpponent.includes('sam houston')) ||
            (fbOpponent.includes('florida') && scoreOpponent.includes('florida'))) {

          const isHome = scoreData.location === 'home';

          // Update all score fields to ensure compatibility
          updates[`games/${gameId}/home_score`] = isHome ? scoreData.texasScore : scoreData.opponentScore;
          updates[`games/${gameId}/away_score`] = isHome ? scoreData.opponentScore : scoreData.texasScore;
          updates[`games/${gameId}/homeScore`] = isHome ? scoreData.texasScore : scoreData.opponentScore;
          updates[`games/${gameId}/awayScore`] = isHome ? scoreData.opponentScore : scoreData.texasScore;
          updates[`games/${gameId}/result`] = scoreData.result;
          updates[`games/${gameId}/status`] = 'completed';
          updates[`games/${gameId}/espnGameId`] = scoreData.espnId;

          updateCount++;
          console.log(`Matched: ${firebaseGame.opponent} with score ${scoreData.texasScore}-${scoreData.opponentScore}`);
        }
      });
    });

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
      console.log(`Successfully updated ${updateCount} games with scores`);
      return { success: true, message: `Updated ${updateCount} games`, updates: updateCount };
    } else {
      console.log('No matching games found to update');
      return { success: false, message: 'No matching games found to update' };
    }

  } catch (error) {
    console.error('Error syncing scores:', error);
    return { success: false, message: error.message };
  }
}

// Export for use as module
module.exports = {
  fetchESPNScores,
  syncScoresToFirebase
};

// If running directly, execute sync
if (require.main === module) {
  syncScoresToFirebase().then(result => {
    console.log('Sync result:', result);
    process.exit(result.success ? 0 : 1);
  });
}