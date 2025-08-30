import { Game } from '../types/Game';
import { teamLogos } from './teamLogos';

interface UTGame {
  date: string;
  opponent: string;
  location: string;
  time?: string;
  tvNetwork?: string;
  isHome: boolean;
  result?: string;
}

// UT 2024 Football Schedule
const UT_2024_SCHEDULE: UTGame[] = [
  { date: '2024-08-31', opponent: 'Colorado State', location: 'Austin, TX', time: '2:30 PM', tvNetwork: 'ESPN', isHome: true },
  { date: '2024-09-07', opponent: 'Michigan', location: 'Ann Arbor, MI', time: '11:00 AM', tvNetwork: 'FOX', isHome: false },
  { date: '2024-09-14', opponent: 'UTSA', location: 'Austin, TX', time: '6:00 PM', tvNetwork: 'ESPN', isHome: true },
  { date: '2024-09-21', opponent: 'ULM', location: 'Austin, TX', time: '7:00 PM', tvNetwork: 'SEC Network', isHome: true },
  { date: '2024-09-28', opponent: 'Mississippi State', location: 'Austin, TX', time: '3:00 PM', tvNetwork: 'SEC Network', isHome: true },
  { date: '2024-10-12', opponent: 'Oklahoma', location: 'Dallas, TX', time: '2:30 PM', tvNetwork: 'ABC', isHome: false }, // Red River Rivalry
  { date: '2024-10-19', opponent: 'Georgia', location: 'Austin, TX', time: '6:30 PM', tvNetwork: 'ABC', isHome: true },
  { date: '2024-10-26', opponent: 'Vanderbilt', location: 'Nashville, TN', time: '3:15 PM', tvNetwork: 'SEC Network', isHome: false },
  { date: '2024-11-09', opponent: 'Florida', location: 'Austin, TX', time: '11:00 AM', tvNetwork: 'ABC', isHome: true },
  { date: '2024-11-16', opponent: 'Arkansas', location: 'Fayetteville, AR', time: '11:00 AM', tvNetwork: 'ABC', isHome: false },
  { date: '2024-11-23', opponent: 'Kentucky', location: 'Austin, TX', time: '2:30 PM', tvNetwork: 'SEC Network', isHome: true },
  { date: '2024-11-30', opponent: 'Texas A&M', location: 'College Station, TX', time: '6:30 PM', tvNetwork: 'ABC', isHome: false },
];

// UT 2025 Football Schedule (with likely TV networks based on matchup importance)
const UT_2025_SCHEDULE: UTGame[] = [
  { date: '2025-08-30', opponent: 'Ohio State', location: 'Columbus, OH', time: '11:00 AM', tvNetwork: 'FOX', isHome: false }, // Big Noon Kickoff marquee matchup
  { date: '2025-09-06', opponent: 'San Jose State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'Longhorn Network', isHome: true },
  { date: '2025-09-13', opponent: 'UTSA', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN+', isHome: true },
  { date: '2025-09-20', opponent: 'Colorado State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'SEC Network', isHome: true },
  { date: '2025-10-04', opponent: 'Mississippi State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN', isHome: true },
  { date: '2025-10-11', opponent: 'Oklahoma', location: 'Dallas, TX', time: '2:30 PM', tvNetwork: 'ABC', isHome: false }, // Red River Rivalry - always ABC at 2:30
  { date: '2025-10-18', opponent: 'Georgia', location: 'Austin, TX', time: 'TBD', tvNetwork: 'CBS', isHome: true }, // SEC Game of the Week candidate
  { date: '2025-10-25', opponent: 'Vanderbilt', location: 'Nashville, TN', time: 'TBD', tvNetwork: 'SEC Network', isHome: false },
  { date: '2025-11-01', opponent: 'Florida', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN', isHome: true },
  { date: '2025-11-15', opponent: 'Arkansas', location: 'Fayetteville, AR', time: 'TBD', tvNetwork: 'ABC/ESPN', isHome: false },
  { date: '2025-11-22', opponent: 'Kentucky', location: 'Austin, TX', time: 'TBD', tvNetwork: 'SEC Network', isHome: true },
  { date: '2025-11-29', opponent: 'Texas A&M', location: 'College Station, TX', time: 'TBD', tvNetwork: 'ABC', isHome: false }, // Rivalry game - primetime
];

export class ScheduleSyncService {
  /**
   * Sync games from UT Athletics schedule
   * Returns array of games to be added
   */
  static async syncSchedule(): Promise<Game[]> {
    try {
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Select appropriate schedule based on year
      const schedule = currentYear === 2024 ? UT_2024_SCHEDULE : UT_2025_SCHEDULE;
      
      // Convert schedule to Game format
      const games: Game[] = schedule.map((utGame, index) => {
        // Find team logo if available
        const teamLogo = teamLogos[utGame.opponent] || null;
        
        return {
          id: `temp-${Date.now()}-${index}`, // Temporary ID, will be replaced when saved
          date: utGame.date,
          time: utGame.time || 'TBD',
          opponent: utGame.opponent,
          location: utGame.location,
          isHome: utGame.isHome,
          tvNetwork: utGame.tvNetwork || 'TBD',
          status: 'unplanned' as const,
          expectedAttendance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      
      return games;
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