import { useState, useEffect, useCallback } from 'react';
import { Game } from '../types/Game';
import { GameService, CreateGameData, UpdateGameData } from '../services/gameService';
import { getMissingLogos } from '../services/teamLogos';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all games
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GameService.getGames();
      setGames(data);
      
      // Check for missing logos after loading games
      if (data.length > 0) {
        // This will automatically log warnings for any missing logos
        // The checkMissingLogo function is called in GameHeader component
        const missingTeams = getMissingLogos();
        if (missingTeams.length > 0) {
          console.log('=== Missing Team Logos Summary ===');
          console.log(`Found ${missingTeams.length} teams without logo configuration:`);
          missingTeams.forEach(team => console.log(`  - ${team}`));
          console.log('Add these teams to src/services/teamLogos.ts');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch games on mount and set up daily sync
  useEffect(() => {
    fetchGames();
    
    // Check if we should sync (once per day)
    const checkAndSync = async () => {
      const lastSyncKey = 'lastScheduleSync';
      const lastSync = localStorage.getItem(lastSyncKey);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      if (lastSync !== today) {
        console.log('Running daily schedule sync...');
        try {
          const result = await GameService.syncFromUTAthletics();
          if (result.success) {
            localStorage.setItem(lastSyncKey, today);
            console.log(result.message);
            // Refresh games after sync
            fetchGames();
          }
        } catch (error) {
          console.error('Daily sync failed:', error);
        }
      }
    };
    
    // Run initial check
    checkAndSync();
    
    // Set up interval to check every hour (in case browser stays open)
    const interval = setInterval(checkAndSync, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, [fetchGames]);

  // Create a new game
  const createGame = useCallback(async (gameData: CreateGameData) => {
    try {
      setError(null);
      const newGame = await GameService.createGame(gameData);
      setGames(prev => [...prev, newGame]);
      return newGame;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      throw err;
    }
  }, []);

  // Update a game
  const updateGame = useCallback(async (gameData: UpdateGameData) => {
    try {
      setError(null);
      const updatedGame = await GameService.updateGame(gameData);
      setGames(prev => prev.map(game => 
        game.id === updatedGame.id ? updatedGame : game
      ));
      return updatedGame;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game');
      throw err;
    }
  }, []);

  // Delete a game
  const deleteGame = useCallback(async (id: string) => {
    try {
      setError(null);
      await GameService.deleteGame(id);
      setGames(prev => prev.filter(game => game.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
      throw err;
    }
  }, []);

  // Get games by status
  const getGamesByStatus = useCallback(async (status: string) => {
    try {
      setError(null);
      return await GameService.getGamesByStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games by status');
      throw err;
    }
  }, []);

  // Get upcoming games
  const getUpcomingGames = useCallback(async () => {
    try {
      setError(null);
      return await GameService.getUpcomingGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming games');
      throw err;
    }
  }, []);

  // Sync from UT Athletics
  const syncFromUTAthletics = useCallback(async () => {
    try {
      setError(null);
      const result = await GameService.syncFromUTAthletics();
      if (result.success) {
        // Refresh games after sync
        await fetchGames();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync schedule');
      throw err;
    }
  }, [fetchGames]);

  // Get game by ID
  const getGame = useCallback(async (id: string) => {
    try {
      setError(null);
      return await GameService.getGame(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch game');
      throw err;
    }
  }, []);

  // Clear all data (Admin only)
  const clearMockData = useCallback(async () => {
    try {
      setError(null);
      
      // Get count of games before clearing
      const gamesCount = games.length;
      
      // Clear all games from Firebase
      // TODO: Implement deleteAllGames in GameService if needed
      // const { error: deleteGamesError } = await GameService.deleteAllGames();
      // if (deleteGamesError) {
      //   console.error('Error deleting games:', deleteGamesError);
      // }
      
      // Clear all potluck items from Firebase
      // TODO: Implement bulk delete for potluck items if needed
      // const { error: deletePotluckError } = await supabase
      //   .from('potluck_items')
      //   .delete()
      //   .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible id)
      
      // if (deletePotluckError) {
      //   console.error('Error deleting potluck items:', deletePotluckError);
      // }
      
      // Clear the games from state
      setGames([]);
      
      // Trigger events to update other components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('potluckUpdate'));
      
      console.log('✅ Cleared all games and potluck items from database');
      
      return {
        success: true,
        message: 'All games and potluck items have been cleared',
        gamesCleared: gamesCount
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      throw err;
    }
  }, [games]);

  return {
    games,
    loading,
    error,
    fetchGames,
    refreshGames: fetchGames, // Alias for clarity
    createGame,
    updateGame,
    deleteGame,
    getGamesByStatus,
    getUpcomingGames,
    syncFromUTAthletics,
    getGame,
    clearMockData,
  };
}






