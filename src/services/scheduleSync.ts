import { Game } from '../types/Game';
import { teamLogos } from './teamLogos';

interface UTGame {
  date: string;
  opponent: string;
  location: string;
  time?: string;
  tvNetwork?: string;
  isHome: boolean;
  result?: 'W' | 'L' | 'T';
  homeScore?: number;
  awayScore?: number;
  status?: 'scheduled' | 'completed' | 'in-progress';
}

// Schedule data should come from the database, not be hardcoded
// This service should only handle syncing from external APIs to the database

export class ScheduleSyncService {
  /**
   * Sync games from external API
   * This method should fetch from an external API, not use hardcoded data
   * All schedule data should be stored in and retrieved from the database
   */
  static async syncSchedule(): Promise<Game[]> {
    try {
      // This should be implemented to fetch from an external API
      // For now, return empty array since schedules should be in the database
      console.warn('syncSchedule: This method should fetch from an external API.');
      console.warn('All schedule data should be stored in the database.');
      return [];
    } catch (error) {
      console.error('Error syncing schedule:', error);
      throw error;
    }
  }

  /**
   * Alias for syncSchedule to maintain backward compatibility
   */
  static async syncGames(): Promise<{ 
    added: Game[], 
    updated: Game[], 
    total: number,
    message: string 
  }> {
    try {
      const games = await this.syncSchedule();
      return {
        added: games,
        updated: [],
        total: games.length,
        message: `Found ${games.length} games in schedule`
      };
    } catch (error) {
      console.error('Error syncing games:', error);
      return {
        added: [],
        updated: [],
        total: 0,
        message: `Error syncing games: ${error}`
      };
    }
  }

  /**
   * Get team-specific theme suggestions
   */
  static getThemeSuggestions(opponent: string): {
    colors?: string[];
    foodSuggestions?: string[];
    decorations?: string[];
  } {
    // Basic theme suggestions based on opponent
    const themes: Record<string, any> = {
      'Oklahoma': {
        colors: ['#841617', '#FFC72C'],
        foodSuggestions: ['Sooner Schooner Sliders', 'Red River Ribs', 'Crimson Corn'],
        decorations: ['Red & White balloons', 'Rivalry banners']
      },
      'Texas A&M': {
        colors: ['#500000', '#FFFFFF'],
        foodSuggestions: ['Aggie BBQ', 'Maroon Margaritas', 'Rivalry Ribs'],
        decorations: ['Lone Star decorations', 'Rivalry flags']
      },
      'Georgia': {
        colors: ['#BA0C2F', '#000000'],
        foodSuggestions: ['Bulldog Burgers', 'Georgia Peach Cobbler', 'SEC Championship Chili'],
        decorations: ['Red & Black streamers', 'SEC banners']
      },
      'Michigan': {
        colors: ['#00274C', '#FFCB05'],
        foodSuggestions: ['Wolverine Wings', 'Big House Burgers', 'Maize & Blue Munchies'],
        decorations: ['Blue & Yellow decorations', 'Big Ten banners']
      },
      'default': {
        colors: ['#BF5700', '#FFFFFF'],
        foodSuggestions: ['Texas BBQ', 'Longhorn Burgers', 'Bevo Bites'],
        decorations: ['Burnt Orange & White', 'Hook \'em Horns signs']
      }
    };

    return themes[opponent] || themes['default'];
  }
}

export default ScheduleSyncService;