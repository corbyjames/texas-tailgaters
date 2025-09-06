import { schedule2025 } from '../data/schedule2025';
import GameService from '../services/gameService';

export async function sync2025Schedule() {
  console.log('Starting 2025 schedule sync...');
  
  try {
    // Get existing games
    const existingGames = await GameService.getGames();
    
    // Update or create games for 2025 season
    for (const game of schedule2025) {
      // Check if game exists (by opponent and date year)
      const existingGame = existingGames.find(
        g => g.opponent === game.opponent && g.date.startsWith('2025')
      );
      
      if (existingGame) {
        // Update existing game
        await GameService.updateGame({
          id: existingGame.id,
          date: game.date,
          time: game.time,
          opponent: game.opponent,
          location: game.location,
          isHome: game.isHome,
          tvNetwork: game.tvNetwork,
          status: game.status,
          result: game.result,
          homeScore: game.homeScore,
          awayScore: game.awayScore
        });
        console.log(`Updated: ${game.opponent} on ${game.date}`);
      } else {
        // Create new game
        await GameService.createGame({
          date: game.date,
          time: game.time,
          opponent: game.opponent,
          location: game.location,
          isHome: game.isHome,
          tvNetwork: game.tvNetwork,
          status: game.status || 'unplanned'
        });
        console.log(`Created: ${game.opponent} on ${game.date}`);
      }
    }
    
    // Remove old 2024 games
    const oldGames = existingGames.filter(g => g.date.startsWith('2024'));
    for (const oldGame of oldGames) {
      await GameService.deleteGame(oldGame.id);
      console.log(`Removed old 2024 game: ${oldGame.opponent}`);
    }
    
    console.log('✅ 2025 schedule sync complete!');
    return { success: true, message: 'Schedule updated to 2025 season' };
  } catch (error) {
    console.error('Error syncing 2025 schedule:', error);
    return { success: false, message: `Error: ${error}` };
  }
}

export default sync2025Schedule;