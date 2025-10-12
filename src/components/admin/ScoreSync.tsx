import React, { useState } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '../../config/firebase';

const ScoreSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Hardcoded scores as fallback (same as in backend)
  const HARDCODED_SCORES = [
    {
      opponent: 'Ohio State',
      date: '2025-08-30',
      isHome: false,
      texasScore: 7,
      opponentScore: 14,
      result: 'L'
    },
    {
      opponent: 'San Jose State',
      date: '2025-09-06',
      isHome: true,
      texasScore: 59,
      opponentScore: 17,
      result: 'W'
    },
    {
      opponent: 'UTEP',
      date: '2025-09-13',
      isHome: true,
      texasScore: 42,
      opponentScore: 10,
      result: 'W'
    },
    {
      opponent: 'Sam Houston',
      date: '2025-09-20',
      isHome: true,
      texasScore: 45,
      opponentScore: 6,
      result: 'W'
    },
    {
      opponent: 'Florida',
      date: '2025-10-04',
      isHome: false,
      texasScore: 28,
      opponentScore: 35,
      result: 'L'
    }
  ];

  const syncScoresDirectly = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      // Get current games from Firebase
      const gamesRef = ref(database, 'games');
      const snapshot = await get(gamesRef);

      if (!snapshot.exists()) {
        setSyncResult({
          success: false,
          message: 'No games found in Firebase'
        });
        return;
      }

      const firebaseGames = snapshot.val();
      const updates: Record<string, any> = {};
      let updateCount = 0;

      // Match and update each game
      HARDCODED_SCORES.forEach(scoreData => {
        Object.entries(firebaseGames).forEach(([gameId, game]: [string, any]) => {
          const fbOpponent = game.opponent?.toLowerCase() || '';
          const scoreOpponent = scoreData.opponent.toLowerCase();

          // Match by opponent name
          if (
            fbOpponent.includes(scoreOpponent) ||
            scoreOpponent.includes(fbOpponent) ||
            (fbOpponent === 'ohio state' && scoreOpponent === 'ohio state') ||
            (fbOpponent === 'san jose state' && scoreOpponent === 'san jose state') ||
            (fbOpponent === 'utep' && scoreOpponent === 'utep') ||
            (fbOpponent === 'sam houston' && scoreOpponent === 'sam houston') ||
            (fbOpponent === 'florida' && scoreOpponent === 'florida')
          ) {
            // Update all score fields
            updates[`games/${gameId}/home_score`] = scoreData.isHome
              ? scoreData.texasScore
              : scoreData.opponentScore;
            updates[`games/${gameId}/away_score`] = scoreData.isHome
              ? scoreData.opponentScore
              : scoreData.texasScore;
            updates[`games/${gameId}/homeScore`] = scoreData.isHome
              ? scoreData.texasScore
              : scoreData.opponentScore;
            updates[`games/${gameId}/awayScore`] = scoreData.isHome
              ? scoreData.opponentScore
              : scoreData.texasScore;
            updates[`games/${gameId}/result`] = scoreData.result;
            updates[`games/${gameId}/status`] = 'completed';

            updateCount++;
            console.log(
              `Updating: ${game.opponent} with score ${scoreData.texasScore}-${scoreData.opponentScore}`
            );
          }
        });
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        setSyncResult({
          success: true,
          message: `Successfully updated ${updateCount} games with scores!`
        });
      } else {
        setSyncResult({
          success: false,
          message: 'No matching games found to update'
        });
      }
    } catch (error) {
      console.error('Error syncing scores:', error);
      setSyncResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncScoresViaBackend = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      // Try to sync via backend service first
      const backendUrl = process.env.REACT_APP_SCORE_SYNC_URL || 'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/sync-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message || 'Scores synced successfully'
        });
      } else {
        // Fall back to direct sync if backend fails
        console.log('Backend sync failed, trying direct sync...');
        await syncScoresDirectly();
      }
    } catch (error) {
      // Fall back to direct sync if backend is not available
      console.log('Backend not available, using direct sync...');
      await syncScoresDirectly();
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Score Sync</h3>

      <div className="space-y-4">
        <button
          onClick={syncScoresViaBackend}
          disabled={syncing}
          className={`px-4 py-2 rounded ${
            syncing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {syncing ? 'Syncing...' : 'Sync Scores'}
        </button>

        {syncResult && (
          <div
            className={`p-4 rounded ${
              syncResult.success
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {syncResult.success ? '✅' : '❌'} {syncResult.message}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>This will sync scores for completed games from ESPN.</p>
          <p>If the ESPN API is unavailable, it will use hardcoded scores as a fallback.</p>
        </div>
      </div>
    </div>
  );
};

export default ScoreSync;