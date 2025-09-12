import { database } from '../config/firebase';
import { ref, update, get } from 'firebase/database';

export const addSampleScores = async () => {
  try {
    console.log('Adding sample scores to games...');
    
    // Get all games
    const gamesRef = ref(database, 'games');
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) {
      console.log('No games found');
      return { success: false, message: 'No games found' };
    }
    
    const games = snapshot.val();
    const gameIds = Object.keys(games);
    
    // Sample score data for different games
    const sampleScores = [
      { homeScore: 45, awayScore: 21, result: 'W', status: 'completed' }, // Win
      { homeScore: 17, awayScore: 24, result: 'L', status: 'completed' }, // Loss
      { homeScore: 28, awayScore: 24, status: 'in-progress', quarter: 'Q3', timeRemaining: '5:43' }, // Live
      { homeScore: 31, awayScore: 28, result: 'W', status: 'completed' }, // Close win
      { homeScore: 14, awayScore: 35, result: 'L', status: 'completed' }, // Big loss
      { homeScore: 21, awayScore: 21, result: 'T', status: 'completed' }, // Tie
    ];
    
    const updates: any = {};
    
    // Add scores to first few games
    gameIds.slice(0, Math.min(6, gameIds.length)).forEach((gameId, index) => {
      const game = games[gameId];
      const scoreData = sampleScores[index % sampleScores.length];
      
      // Only add scores to games that don't have them
      if (!game.homeScore && !game.awayScore) {
        updates[`games/${gameId}/homeScore`] = scoreData.homeScore;
        updates[`games/${gameId}/awayScore`] = scoreData.awayScore;
        updates[`games/${gameId}/status`] = scoreData.status;
        
        if (scoreData.result) {
          updates[`games/${gameId}/result`] = scoreData.result;
        }
        
        if (scoreData.quarter) {
          updates[`games/${gameId}/quarter`] = scoreData.quarter;
          updates[`games/${gameId}/timeRemaining`] = scoreData.timeRemaining;
        }
        
        console.log(`Adding scores to game ${gameId}: ${scoreData.homeScore} - ${scoreData.awayScore}`);
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      console.log(`Successfully added scores to ${Object.keys(updates).length / 3} games`);
      return { success: true, message: 'Sample scores added successfully' };
    } else {
      console.log('All games already have scores');
      return { success: true, message: 'All games already have scores' };
    }
    
  } catch (error) {
    console.error('Error adding sample scores:', error);
    return { success: false, message: 'Failed to add sample scores' };
  }
};

export default addSampleScores;