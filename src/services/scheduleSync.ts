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

// UT 2025 Football Schedule
const UT_2025_SCHEDULE: UTGame[] = [
  { date: '2025-08-30', opponent: 'Ohio State', location: 'Columbus, OH', time: 'TBD', tvNetwork: 'TBD', isHome: false },
  { date: '2025-09-06', opponent: 'San Jose State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-09-13', opponent: 'UTSA', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-09-20', opponent: 'Colorado State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-10-04', opponent: 'Mississippi State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-10-11', opponent: 'Oklahoma', location: 'Dallas, TX', time: 'TBD', tvNetwork: 'ABC/ESPN', isHome: false }, // Red River Rivalry - always on major network
  { date: '2025-10-18', opponent: 'Georgia', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-10-25', opponent: 'Vanderbilt', location: 'Nashville, TN', time: 'TBD', tvNetwork: 'TBD', isHome: false },
  { date: '2025-11-01', opponent: 'Florida', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-11-15', opponent: 'Arkansas', location: 'Fayetteville, AR', time: 'TBD', tvNetwork: 'TBD', isHome: false },
  { date: '2025-11-22', opponent: 'Kentucky', location: 'Austin, TX', time: 'TBD', tvNetwork: 'TBD', isHome: true },
  { date: '2025-11-29', opponent: 'Texas A&M', location: 'College Station, TX', time: 'TBD', tvNetwork: 'TBD', isHome: false },
];

export class ScheduleSyncService {
  /**
   * Sync games from UT Athletics schedule
   * Returns the games that were added/updated
   */
  static async syncGames(): Promise<{ 
    added: Game[], 
    updated: Game[], 
    total: number,
    message: string 
  }> {
    try {
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Select appropriate schedule based on year
      const schedule = currentYear === 2024 ? UT_2024_SCHEDULE : UT_2025_SCHEDULE;
      
      // Get existing games from Supabase
      const { data: existingGamesData, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .order('date', { ascending: true });
      
      if (fetchError) {
        console.error('Error fetching existing games:', fetchError);
        throw new Error('Failed to fetch existing games from database');
      }
      
      const existingGames = existingGamesData || [];
      const added: Game[] = [];
      const updated: Game[] = [];
      
      // Process each game from the schedule
      for (const utGame of schedule) {
        // Check if game already exists (by date and opponent)
        const existingGame = existingGames.find(
          g => g.date === utGame.date && g.opponent === utGame.opponent
        );
        
        if (!existingGame) {
          // Create new game in Supabase
          const { data: newGameData, error: insertError } = await supabase
            .from('games')
            .insert({
              date: utGame.date,
              time: utGame.time || 'TBD',
              opponent: utGame.opponent,
              location: utGame.location,
              is_home: utGame.isHome,
              tv_network: utGame.tvNetwork || 'TBD',
              status: 'unplanned',
              expected_attendance: 0
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error inserting game:', insertError);
            continue;
          }
          
          if (newGameData) {
            // Map to frontend format
            const newGame: Game = {
              id: newGameData.id,
              date: newGameData.date,
              time: newGameData.time,
              opponent: newGameData.opponent,
              location: newGameData.location,
              isHome: newGameData.is_home,
              tvNetwork: newGameData.tv_network,
              status: newGameData.status as 'planned' | 'unplanned' | 'watch-party',
              createdAt: newGameData.created_at,
              updatedAt: newGameData.updated_at,
            };
            added.push(newGame);
          }
        } else {
          // Check if we need to update existing game
          let hasChanges = false;
          const updateData: any = {};
          
          if (utGame.time && utGame.time !== 'TBD' && existingGame.time === 'TBD') {
            updateData.time = utGame.time;
            hasChanges = true;
          }
          
          if (utGame.tvNetwork && utGame.tvNetwork !== 'TBD' && (!existingGame.tv_network || existingGame.tv_network === 'TBD')) {
            updateData.tv_network = utGame.tvNetwork;
            hasChanges = true;
          }
          
          if (utGame.location && existingGame.location !== utGame.location) {
            updateData.location = utGame.location;
            hasChanges = true;
          }
          
          if (hasChanges) {
            updateData.updated_at = new Date().toISOString();
            
            const { data: updatedGameData, error: updateError } = await supabase
              .from('games')
              .update(updateData)
              .eq('id', existingGame.id)
              .select()
              .single();
            
            if (updateError) {
              console.error('Error updating game:', updateError);
              continue;
            }
            
            if (updatedGameData) {
              // Map to frontend format
              const updatedGame: Game = {
                id: updatedGameData.id,
                date: updatedGameData.date,
                time: updatedGameData.time,
                opponent: updatedGameData.opponent,
                location: updatedGameData.location,
                isHome: updatedGameData.is_home,
                tvNetwork: updatedGameData.tv_network,
                status: updatedGameData.status as 'planned' | 'unplanned' | 'watch-party',
                createdAt: updatedGameData.created_at,
                updatedAt: updatedGameData.updated_at,
              };
              updated.push(updatedGame);
            }
          }
        }
      }
      
      const message = added.length > 0 
        ? `Successfully synced ${added.length} new games and updated ${updated.length} games from UT schedule`
        : updated.length > 0 
          ? `Updated ${updated.length} games with new information`
          : 'Schedule is already up to date';
      
      return {
        added,
        updated,
        total: existingGames.length + added.length,
        message
      };
    } catch (error) {
      console.error('Error syncing games:', error);
      throw new Error('Failed to sync games from UT schedule');
    }
  }
  
  /**
   * Get upcoming games from the schedule
   */
  static getUpcomingGames(limit: number = 5): UTGame[] {
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const schedule = currentYear === 2024 ? UT_2024_SCHEDULE : UT_2025_SCHEDULE;
    
    return schedule
      .filter(game => game.date >= today)
      .slice(0, limit);
  }
  
  /**
   * Check if sync is needed (e.g., if we're missing games)
   */
  static async checkSyncNeeded(): Promise<boolean> {
    const { data: existingGames, error } = await supabase
      .from('games')
      .select('date, opponent');
    
    if (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const schedule = currentYear === 2024 ? UT_2024_SCHEDULE : UT_2025_SCHEDULE;
    
    // Get future games from schedule
    const futureScheduleGames = schedule.filter(game => game.date >= today);
    
    // Check if we have all future games
    for (const scheduleGame of futureScheduleGames) {
      const exists = existingGames?.some(
        g => g.date === scheduleGame.date && g.opponent === scheduleGame.opponent
      );
      if (!exists) {
        return true; // Sync needed
      }
    }
    
    return false;
  }
  
  /**
   * Get team logo URL for an opponent
   */
  static getTeamLogo(opponent: string): string | null {
    const teamInfo = teamLogos[opponent];
    return teamInfo?.logoUrl || null;
  }
}

export default ScheduleSyncService;