import { Game } from '../types/Game';

export function cleanupAndSortGames(): void {
  const storedGames = localStorage.getItem('texasTailgatersGames');
  
  if (!storedGames) {
    console.log('No games to cleanup');
    return;
  }
  
  try {
    const games: Game[] = JSON.parse(storedGames);
    
    // Remove duplicates based on date and opponent
    const uniqueGames = new Map<string, Game>();
    
    games.forEach(game => {
      const key = `${game.date}-${game.opponent}`;
      // Keep the first occurrence or the one with more data
      if (!uniqueGames.has(key)) {
        uniqueGames.set(key, game);
      } else {
        const existing = uniqueGames.get(key)!;
        // Keep the one with more information (non-TBD values)
        if ((game.tvNetwork && game.tvNetwork !== 'TBD' && (!existing.tvNetwork || existing.tvNetwork === 'TBD')) ||
            (game.time && game.time !== 'TBD' && (!existing.time || existing.time === 'TBD'))) {
          uniqueGames.set(key, { ...existing, ...game });
        }
      }
    });
    
    // Convert back to array and sort by date
    const cleanedGames = Array.from(uniqueGames.values());
    cleanedGames.sort((a, b) => a.date.localeCompare(b.date));
    
    // Save back to localStorage
    localStorage.setItem('texasTailgatersGames', JSON.stringify(cleanedGames));
    
    // Trigger storage event
    window.dispatchEvent(new Event('storage'));
    
    console.log(`Cleaned up games: ${games.length} -> ${cleanedGames.length} games`);
    
    // Log first few games to verify order
    console.log('First 3 games after cleanup:');
    cleanedGames.slice(0, 3).forEach((game, index) => {
      console.log(`${index + 1}. ${game.date} - ${game.isHome ? 'vs' : '@'} ${game.opponent}`);
    });
    
  } catch (error) {
    console.error('Error cleaning up games:', error);
  }
}

// Run cleanup automatically when this module is imported
if (typeof window !== 'undefined') {
  cleanupAndSortGames();
}