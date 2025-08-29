import { supabase } from './supabase';
import { Game, Theme } from '../types/Game';
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
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*)
      `)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
      // Fall back to empty array on error
      return [];
    }

    // Map database fields to frontend format
    return (data || []).map(game => ({
      id: game.id,
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
      theme: game.theme
    }))
  }

  // Get a single game by ID
  static async getGame(id: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*),
        potluck_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching game:', error);
      return null;
    }

    if (!data) return null;

    // Map database fields to frontend format
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      opponent: data.opponent,
      location: data.location,
      isHome: data.is_home,
      themeId: data.theme_id,
      status: data.status as 'planned' | 'unplanned' | 'watch-party',
      setupTime: data.setup_time,
      expectedAttendance: data.expected_attendance,
      tvNetwork: data.tv_network,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      theme: data.theme,
      potluckItems: data.potluck_items
    }
  }

  // Create a new game
  static async createGame(gameData: CreateGameData): Promise<Game> {
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

    const { data, error } = await supabase
      .from('games')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      throw new Error(`Error creating game: ${error.message}`);
    }

    // Map database fields to frontend format
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      opponent: data.opponent,
      location: data.location,
      isHome: data.is_home,
      themeId: data.theme_id,
      status: data.status as 'planned' | 'unplanned' | 'watch-party',
      setupTime: data.setup_time,
      expectedAttendance: data.expected_attendance,
      tvNetwork: data.tv_network,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Update a game
  static async updateGame(gameData: UpdateGameData): Promise<Game> {
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
    
    dbUpdateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('games')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      throw new Error(`Error updating game: ${error.message}`);
    }

    // Map database fields to frontend format
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      opponent: data.opponent,
      location: data.location,
      isHome: data.is_home,
      themeId: data.theme_id,
      status: data.status as 'planned' | 'unplanned' | 'watch-party',
      setupTime: data.setup_time,
      expectedAttendance: data.expected_attendance,
      tvNetwork: data.tv_network,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Delete a game
  static async deleteGame(id: string): Promise<void> {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting game:', error);
      throw new Error(`Error deleting game: ${error.message}`);
    }
  }

  // Delete all games (Admin only)
  static async deleteAllGames(): Promise<{ error: any }> {
    const { error } = await supabase
      .from('games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible id)

    if (error) {
      console.error('Error deleting all games:', error);
    }
    
    return { error };
  }

  // Get games by status
  static async getGamesByStatus(status: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*)
      `)
      .eq('status', status)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching games by status:', error);
      return [];
    }

    // Map database fields to frontend format
    return (data || []).map(game => ({
      id: game.id,
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
      theme: game.theme
    }));
  }

  // Get upcoming games
  static async getUpcomingGames(limit: number = 5): Promise<Game[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*)
      `)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming games:', error);
      return [];
    }

    // Map database fields to frontend format
    return (data || []).map(game => ({
      id: game.id,
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
      theme: game.theme
    }));
  }

  // Sync from UT Athletics schedule
  static async syncFromUTAthletics(): Promise<{ success: boolean; message: string; added?: number; updated?: number }> {
    try {
      const result = await ScheduleSyncService.syncGames();
      return {
        success: true,
        message: result.message,
        added: result.added.length,
        updated: result.updated.length
      };
    } catch (error) {
      console.error('Error syncing from UT Athletics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync schedule'
      };
    }
  }

  // Get themes
  static async getThemes(): Promise<Theme[]> {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching themes:', error);
      return [];
    }

    // Map database fields to frontend format
    return (data || []).map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      opponent: theme.opponent,
      colors: theme.colors || [],
      foodSuggestions: theme.food_suggestions || [],
      isCustom: theme.is_custom,
      createdAt: theme.created_at
    }));
  }

  // Create a theme
  static async createTheme(themeData: Partial<Theme>): Promise<Theme> {
    const insertData = {
      name: themeData.name || 'New Theme',
      description: themeData.description,
      opponent: themeData.opponent || '',
      colors: themeData.colors || [],
      food_suggestions: themeData.foodSuggestions || [],
      is_custom: true
    };

    const { data, error } = await supabase
      .from('themes')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating theme:', error);
      throw new Error(`Error creating theme: ${error.message}`);
    }

    // Map database fields to frontend format
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      opponent: data.opponent,
      colors: data.colors || [],
      foodSuggestions: data.food_suggestions || [],
      isCustom: data.is_custom,
      createdAt: data.created_at
    };
  }
}

export default GameService;