import { supabase } from './supabase';
import { Game, Theme } from '../types/Game';
import { mockGames, mockThemes } from '../utils/mockData';

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
}

export interface UpdateGameData extends Partial<CreateGameData> {
  id: string;
}

export class GameService {
  // Get all games with themes
  static async getGames(): Promise<Game[]> {
    // For now, return mock data until Supabase is set up
    return mockGames;
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*)
      `)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching games: ${error.message}`);
    }

    return data || [];
    */
  }

  // Get a single game by ID
  static async getGame(id: string): Promise<Game | null> {
    // For now, return mock data
    const game = mockGames.find(g => g.id === id);
    return game || null;
    
    // TODO: Uncomment when Supabase is configured
    /*
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
      throw new Error(`Error fetching game: ${error.message}`);
    }

    return data;
    */
  }

  // Create a new game
  static async createGame(gameData: CreateGameData): Promise<Game> {
    // For now, simulate creating a game
    const newGame: Game = {
      id: Date.now().toString(),
      ...gameData,
      status: (gameData.status as 'planned' | 'unplanned' | 'watch-party') || 'unplanned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to mock data
    mockGames.push(newGame);
    return newGame;
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('games')
      .insert([gameData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating game: ${error.message}`);
    }

    return data;
    */
  }

  // Update a game
  static async updateGame(gameData: UpdateGameData): Promise<Game> {
    const { id, ...updateData } = gameData;
    
    // For now, simulate updating a game
    const gameIndex = mockGames.findIndex(g => g.id === id);
    if (gameIndex === -1) {
      throw new Error('Game not found');
    }
    
    mockGames[gameIndex] = {
      ...mockGames[gameIndex],
      ...updateData,
      status: updateData.status as 'planned' | 'unplanned' | 'watch-party' || mockGames[gameIndex].status,
      updatedAt: new Date().toISOString(),
    };
    
    return mockGames[gameIndex];
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating game: ${error.message}`);
    }

    return data;
    */
  }

  // Delete a game
  static async deleteGame(id: string): Promise<void> {
    // For now, simulate deleting a game
    const gameIndex = mockGames.findIndex(g => g.id === id);
    if (gameIndex === -1) {
      throw new Error('Game not found');
    }
    
    mockGames.splice(gameIndex, 1);
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting game: ${error.message}`);
    }
    */
  }

  // Get games by status
  static async getGamesByStatus(status: string): Promise<Game[]> {
    // For now, filter mock data
    return mockGames.filter(game => game.status === status);
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*)
      `)
      .eq('status', status)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching games by status: ${error.message}`);
    }

    return data || [];
    */
  }

  // Get upcoming games
  static async getUpcomingGames(): Promise<Game[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // For now, filter mock data
    return mockGames
      .filter(game => game.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        theme:themes(*)
      `)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(5);

    if (error) {
      throw new Error(`Error fetching upcoming games: ${error.message}`);
    }

    return data || [];
    */
  }

  // Sync games from UT Athletics (placeholder for now)
  static async syncFromUTAthletics(): Promise<{ success: boolean; message: string }> {
    // This will be implemented in Phase 2
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Schedule sync feature coming soon! Mock data is currently being used.'
    };
  }

  // Get themes
  static async getThemes(): Promise<Theme[]> {
    // For now, return mock themes
    return mockThemes;
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching themes: ${error.message}`);
    }

    return data || [];
    */
  }

  // Create a theme
  static async createTheme(themeData: Partial<Theme>): Promise<Theme> {
    // For now, simulate creating a theme
    const newTheme: Theme = {
      id: Date.now().toString(),
      name: themeData.name || 'New Theme',
      description: themeData.description,
      opponent: themeData.opponent,
      colors: themeData.colors || [],
      foodSuggestions: themeData.foodSuggestions || [],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    
    // Add to mock data
    mockThemes.push(newTheme);
    return newTheme;
    
    // TODO: Uncomment when Supabase is configured
    /*
    const { data, error } = await supabase
      .from('themes')
      .insert([themeData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating theme: ${error.message}`);
    }

    return data;
    */
  }
}
