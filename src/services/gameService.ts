import firebaseService from './firebaseService';
import { Game, Theme, PotluckItem } from '../types/Game';
import ScheduleSyncService from './scheduleSync';

export interface CreateGameData {
  date: string;
  time?: string;
  opponent: string;
  location?: string;
  isHome: boolean;
  themeId?: string;
  status?: string;
  setupTime?: string;
  expectedAttendance?: number;
  tvNetwork?: string;
}

export interface UpdateGameData extends Partial<CreateGameData> {
  id: string;
}

export class GameService {
  // Get all games with themes
  static async getGames(): Promise<Game[]> {
    try {
      const games = await firebaseService.getGames();
      const themes = await firebaseService.getThemes();
      
      // Map database fields to frontend format and attach themes
      return games.map(game => {
        const theme = game.theme_id ? themes.find(t => t.id === game.theme_id) : undefined;
        return {
          id: game.id!,
          date: game.date,
          time: game.time,
          opponent: game.opponent,
          location: game.location,
          isHome: game.is_home,
          themeId: game.theme_id,
          status: game.status as 'planned' | 'unplanned' | 'watch-party',
          setupTime: game.setup_time,
          expectedAttendance: game.expected_attendance,
          tvNetwork: game.tv_network,
          createdAt: game.created_at,
          updatedAt: game.updated_at,
          theme: theme ? {
            id: theme.id!,
            name: theme.name,
            description: theme.description,
            opponent: theme.opponent,
            colors: theme.colors,
            foodSuggestions: theme.food_suggestions,
            isCustom: theme.is_custom,
            createdAt: theme.created_at
          } : undefined
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  // Get a single game by ID
  static async getGame(id: string): Promise<Game | null> {
    try {
      const games = await firebaseService.getGames();
      const game = games.find(g => g.id === id);
      
      if (!game) return null;
      
      const themes = await firebaseService.getThemes();
      const theme = game.theme_id ? themes.find(t => t.id === game.theme_id) : undefined;
      const potluckItems = await firebaseService.getPotluckItems(id);
      
      return {
        id: game.id!,
        date: game.date,
        time: game.time,
        opponent: game.opponent,
        location: game.location,
        isHome: game.is_home,
        themeId: game.theme_id,
        status: game.status as 'planned' | 'unplanned' | 'watch-party',
        setupTime: game.setup_time,
        expectedAttendance: game.expected_attendance,
        tvNetwork: game.tv_network,
        createdAt: game.created_at,
        updatedAt: game.updated_at,
        theme: theme ? {
          id: theme.id!,
          name: theme.name,
          description: theme.description,
          opponent: theme.opponent,
          colors: theme.colors,
          foodSuggestions: theme.food_suggestions,
          isCustom: theme.is_custom,
          createdAt: theme.created_at
        } : undefined,
        potluckItems: potluckItems as unknown as PotluckItem[]
      };
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  // Create a new game
  static async createGame(gameData: CreateGameData): Promise<Game> {
    try {
      const insertData = {
        date: gameData.date,
        time: gameData.time || 'TBD',
        opponent: gameData.opponent,
        location: gameData.location,
        is_home: gameData.isHome,
        theme_id: gameData.themeId,
        status: gameData.status || 'unplanned',
        setup_time: gameData.setupTime,
        expected_attendance: gameData.expectedAttendance || 0,
        tv_network: gameData.tvNetwork
      };

      const newGame = await firebaseService.createGame(insertData);

      // Map database fields to frontend format
      return {
        id: newGame.id!,
        date: newGame.date,
        time: newGame.time,
        opponent: newGame.opponent,
        location: newGame.location,
        isHome: newGame.is_home,
        themeId: newGame.theme_id,
        status: newGame.status as 'planned' | 'unplanned' | 'watch-party',
        setupTime: newGame.setup_time,
        expectedAttendance: newGame.expected_attendance,
        tvNetwork: newGame.tv_network,
        createdAt: newGame.created_at,
        updatedAt: newGame.updated_at
      };
    } catch (error) {
      console.error('Error creating game:', error);
      throw new Error(`Error creating game: ${error}`);
    }
  }

  // Update a game
  static async updateGame(gameData: UpdateGameData): Promise<Game> {
    try {
      const { id, ...updateData } = gameData;
      
      // Map frontend fields to database fields
      const dbUpdateData: any = {};
      if (updateData.date !== undefined) dbUpdateData.date = updateData.date;
      if (updateData.time !== undefined) dbUpdateData.time = updateData.time;
      if (updateData.opponent !== undefined) dbUpdateData.opponent = updateData.opponent;
      if (updateData.location !== undefined) dbUpdateData.location = updateData.location;
      if (updateData.isHome !== undefined) dbUpdateData.is_home = updateData.isHome;
      if (updateData.themeId !== undefined) dbUpdateData.theme_id = updateData.themeId;
      if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
      if (updateData.setupTime !== undefined) dbUpdateData.setup_time = updateData.setupTime;
      if (updateData.expectedAttendance !== undefined) dbUpdateData.expected_attendance = updateData.expectedAttendance;
      if (updateData.tvNetwork !== undefined) dbUpdateData.tv_network = updateData.tvNetwork;

      const updatedGame = await firebaseService.updateGame(id, dbUpdateData);
      
      if (!updatedGame) {
        throw new Error('Failed to update game');
      }

      // Map database fields to frontend format
      return {
        id: updatedGame.id!,
        date: updatedGame.date,
        time: updatedGame.time,
        opponent: updatedGame.opponent,
        location: updatedGame.location,
        isHome: updatedGame.is_home,
        themeId: updatedGame.theme_id,
        status: updatedGame.status as 'planned' | 'unplanned' | 'watch-party',
        setupTime: updatedGame.setup_time,
        expectedAttendance: updatedGame.expected_attendance,
        tvNetwork: updatedGame.tv_network,
        createdAt: updatedGame.created_at,
        updatedAt: updatedGame.updated_at
      };
    } catch (error) {
      console.error('Error updating game:', error);
      throw new Error(`Error updating game: ${error}`);
    }
  }

  // Delete a game
  static async deleteGame(id: string): Promise<boolean> {
    try {
      return await firebaseService.deleteGame(id);
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  }

  // Get all themes
  static async getThemes(): Promise<Theme[]> {
    try {
      const themes = await firebaseService.getThemes();
      
      return themes.map(theme => ({
        id: theme.id!,
        name: theme.name,
        description: theme.description,
        opponent: theme.opponent,
        colors: theme.colors,
        foodSuggestions: theme.food_suggestions,
        isCustom: theme.is_custom,
        createdAt: theme.created_at
      }));
    } catch (error) {
      console.error('Error fetching themes:', error);
      return [];
    }
  }

  // Create a new theme
  static async createTheme(theme: Omit<Theme, 'id' | 'createdAt'>): Promise<Theme> {
    try {
      const insertData = {
        name: theme.name,
        description: theme.description,
        opponent: theme.opponent,
        colors: theme.colors,
        food_suggestions: theme.foodSuggestions,
        is_custom: theme.isCustom
      };

      const newTheme = await firebaseService.createTheme(insertData);

      return {
        id: newTheme.id!,
        name: newTheme.name,
        description: newTheme.description,
        opponent: newTheme.opponent,
        colors: newTheme.colors,
        foodSuggestions: newTheme.food_suggestions,
        isCustom: newTheme.is_custom,
        createdAt: newTheme.created_at
      };
    } catch (error) {
      console.error('Error creating theme:', error);
      throw new Error(`Error creating theme: ${error}`);
    }
  }

  // Sync with external schedule (alias for backward compatibility)
  static async syncFromUTAthletics(): Promise<{ success: boolean; gamesAdded: number; message: string }> {
    try {
      const newGames = await this.syncSchedule();
      return {
        success: true,
        gamesAdded: newGames.length,
        message: `Successfully synced ${newGames.length} games from UT Athletics`
      };
    } catch (error) {
      return {
        success: false,
        gamesAdded: 0,
        message: `Sync failed: ${error}`
      };
    }
  }

  // Sync with external schedule
  static async syncSchedule(): Promise<Game[]> {
    try {
      console.log('Starting schedule sync...');
      const externalGames = await ScheduleSyncService.syncSchedule();
      const existingGames = await this.getGames();
      const newGames: Game[] = [];

      for (const externalGame of externalGames) {
        // Check if game already exists (by date and opponent)
        const exists = existingGames.some(
          g => g.date === externalGame.date && g.opponent === externalGame.opponent
        );

        if (!exists) {
          const createdGame = await this.createGame({
            date: externalGame.date,
            time: externalGame.time,
            opponent: externalGame.opponent,
            location: externalGame.location,
            isHome: externalGame.isHome,
            tvNetwork: externalGame.tvNetwork,
            status: 'unplanned'
          });
          newGames.push(createdGame);
        }
      }

      console.log(`Sync complete. Added ${newGames.length} new games.`);
      return newGames;
    } catch (error) {
      console.error('Error syncing schedule:', error);
      throw error;
    }
  }

  // Get games by status
  static async getGamesByStatus(status: string): Promise<Game[]> {
    try {
      const allGames = await this.getGames();
      return allGames.filter(game => game.status === status);
    } catch (error) {
      console.error('Error getting games by status:', error);
      throw error;
    }
  }

  // Get upcoming games
  static async getUpcomingGames(): Promise<Game[]> {
    try {
      const allGames = await this.getGames();
      const today = new Date().toISOString().split('T')[0];
      return allGames.filter(game => game.date >= today);
    } catch (error) {
      console.error('Error getting upcoming games:', error);
      throw error;
    }
  }

  // Clear all games (for testing)
  static async clearAll(): Promise<void> {
    try {
      await firebaseService.clearAll();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export default GameService;