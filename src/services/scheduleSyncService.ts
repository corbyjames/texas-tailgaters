import { Game } from '../types/Game';
import { database } from '../config/firebase';
import { ref, get, set, update, push } from 'firebase/database';
import ESPNApiService from './espnApi';
import UTAthleticsApiService from './utAthleticsApi';
import ScheduleSyncService from './scheduleSync';

interface SyncResult {
  updated: number;
  added: number;
  errors: string[];
  lastSyncTime: string;
}

interface GameUpdate {
  gameId: string;
  field: string;
  oldValue: any;
  newValue: any;
  source: 'ESPN' | 'UTAthletics';
}

export class ComprehensiveScheduleSyncService {
  private static readonly SYNC_LOG_KEY = 'syncLogs';
  private static readonly GAMES_KEY = 'games';
  
  /**
   * Main sync function that runs daily
   * Combines data from ESPN, UT Athletics, and checks for updates
   */
  static async performDailySync(): Promise<SyncResult> {
    const result: SyncResult = {
      updated: 0,
      added: 0,
      errors: [],
      lastSyncTime: new Date().toISOString()
    };
    
    try {
      console.log('Starting daily schedule sync...');
      
      // Step 1: Get existing games from Firebase
      const existingGames = await this.getExistingGames();
      const gamesMap = new Map(existingGames.map(g => [`${g.date}_${g.opponent}`, g]));
      
      // Step 2: Fetch from all sources in parallel
      const [espnGames, utGames, networkUpdates] = await Promise.all([
        this.fetchESPNData(),
        this.fetchUTAthleticsData(),
        UTAthleticsApiService.checkNetworkUpdates()
      ]);
      
      // Step 3: Check for bowl games (December/January)
      const currentMonth = new Date().getMonth();
      if (currentMonth === 11 || currentMonth === 0) { // December or January
        const bowlGames = await ESPNApiService.checkForBowlGames();
        espnGames.push(...bowlGames);
      }
      
      // Step 4: Merge and update games
      const updates: GameUpdate[] = [];
      
      // Process ESPN games
      for (const espnGame of espnGames) {
        if (!espnGame.opponent || !espnGame.date) continue;
        
        const gameKey = `${espnGame.date}_${espnGame.opponent}`;
        const existingGame = gamesMap.get(gameKey);
        
        if (existingGame) {
          // Update existing game
          const gameUpdates = this.compareAndUpdateGame(existingGame, espnGame, 'ESPN');
          if (gameUpdates.length > 0) {
            updates.push(...gameUpdates);
            await this.updateGame(existingGame.id, espnGame);
            result.updated++;
          }
        } else {
          // Add new game (likely a bowl game)
          const newGame = await this.addNewGame(espnGame);
          if (newGame) {
            result.added++;
            console.log(`Added new game: ${espnGame.opponent} on ${espnGame.date}`);
          }
        }
      }
      
      // Process UT Athletics games (priority for official info)
      for (const utGame of utGames) {
        if (!utGame.opponent || !utGame.date) continue;
        
        const gameKey = `${utGame.date}_${utGame.opponent}`;
        const existingGame = gamesMap.get(gameKey);
        
        if (existingGame) {
          const gameUpdates = this.compareAndUpdateGame(existingGame, utGame, 'UTAthletics');
          if (gameUpdates.length > 0) {
            updates.push(...gameUpdates);
            await this.updateGame(existingGame.id, utGame);
            result.updated++;
          }
        }
      }
      
      // Step 5: Apply network updates
      for (const [gameKey, network] of networkUpdates) {
        const [date, opponent] = gameKey.split('_');
        const existingGame = gamesMap.get(gameKey);
        
        if (existingGame && existingGame.tvNetwork !== network) {
          console.log(`TV Network update: ${opponent} now on ${network}`);
          await this.updateGame(existingGame.id, { tvNetwork: network });
          result.updated++;
        }
      }
      
      // Step 6: Check for completed games and update scores
      await this.updateCompletedGames(existingGames, result);
      
      // Step 7: Log sync results
      await this.logSyncResult(result, updates);
      
      console.log(`Sync complete: ${result.added} added, ${result.updated} updated`);
      
    } catch (error) {
      console.error('Error in daily sync:', error);
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    
    return result;
  }
  
  /**
   * Fetch games from ESPN API
   */
  private static async fetchESPNData(): Promise<Partial<Game>[]> {
    try {
      const games = await ESPNApiService.fetchSchedule();
      console.log(`Fetched ${games.length} games from ESPN`);
      return games;
    } catch (error) {
      console.error('ESPN fetch failed:', error);
      return [];
    }
  }
  
  /**
   * Fetch games from UT Athletics
   */
  private static async fetchUTAthleticsData(): Promise<Partial<Game>[]> {
    try {
      const games = await UTAthleticsApiService.fetchSchedule();
      console.log(`Fetched ${games.length} games from UT Athletics`);
      return games;
    } catch (error) {
      console.error('UT Athletics fetch failed:', error);
      return [];
    }
  }
  
  /**
   * Get existing games from Firebase
   */
  private static async getExistingGames(): Promise<Game[]> {
    try {
      const gamesRef = ref(database, this.GAMES_KEY);
      const snapshot = await get(gamesRef);
      
      if (snapshot.exists()) {
        const gamesData = snapshot.val();
        return Object.entries(gamesData).map(([id, data]) => ({
          id,
          ...(data as Omit<Game, 'id'>)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching existing games:', error);
      return [];
    }
  }
  
  /**
   * Compare game data and identify updates
   */
  private static compareAndUpdateGame(
    existing: Game,
    updated: Partial<Game>,
    source: 'ESPN' | 'UTAthletics'
  ): GameUpdate[] {
    const updates: GameUpdate[] = [];
    
    // Check time updates
    if (updated.time && updated.time !== 'TBD' && existing.time !== updated.time) {
      updates.push({
        gameId: existing.id,
        field: 'time',
        oldValue: existing.time,
        newValue: updated.time,
        source
      });
    }
    
    // Check TV network updates
    if (updated.tvNetwork && updated.tvNetwork !== 'TBD' && existing.tvNetwork !== updated.tvNetwork) {
      updates.push({
        gameId: existing.id,
        field: 'tvNetwork',
        oldValue: existing.tvNetwork,
        newValue: updated.tvNetwork,
        source
      });
    }
    
    // Check score updates (for completed games)
    if (updated.status === 'completed' && existing.status !== 'completed') {
      updates.push({
        gameId: existing.id,
        field: 'status',
        oldValue: existing.status,
        newValue: 'completed',
        source
      });
      
      if (updated.homeScore !== undefined) {
        updates.push({
          gameId: existing.id,
          field: 'homeScore',
          oldValue: existing.homeScore,
          newValue: updated.homeScore,
          source
        });
      }
      
      if (updated.awayScore !== undefined) {
        updates.push({
          gameId: existing.id,
          field: 'awayScore',
          oldValue: existing.awayScore,
          newValue: updated.awayScore,
          source
        });
      }
      
      if (updated.result) {
        updates.push({
          gameId: existing.id,
          field: 'result',
          oldValue: existing.result,
          newValue: updated.result,
          source
        });
      }
    }
    
    // Check for bowl game designation
    if (updated.isBowlGame && !existing.isBowlGame) {
      updates.push({
        gameId: existing.id,
        field: 'isBowlGame',
        oldValue: false,
        newValue: true,
        source
      });
      
      if (updated.bowlName) {
        updates.push({
          gameId: existing.id,
          field: 'bowlName',
          oldValue: existing.bowlName,
          newValue: updated.bowlName,
          source
        });
      }
    }
    
    return updates;
  }
  
  /**
   * Update a game in Firebase
   */
  private static async updateGame(gameId: string, updates: Partial<Game>): Promise<void> {
    try {
      const gameRef = ref(database, `${this.GAMES_KEY}/${gameId}`);
      await update(gameRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating game ${gameId}:`, error);
      throw error;
    }
  }
  
  /**
   * Add a new game to Firebase
   */
  private static async addNewGame(gameData: Partial<Game>): Promise<string | null> {
    try {
      const gamesRef = ref(database, this.GAMES_KEY);
      const newGameRef = push(gamesRef);
      
      const newGame: Omit<Game, 'id'> = {
        date: gameData.date || '',
        time: gameData.time || 'TBD',
        opponent: gameData.opponent || '',
        location: gameData.location || '',
        isHome: gameData.isHome || false,
        status: gameData.status || 'unplanned',
        tvNetwork: gameData.tvNetwork || 'TBD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expectedAttendance: 0,
        isBowlGame: gameData.isBowlGame,
        bowlName: gameData.bowlName,
        espnGameId: gameData.espnGameId,
        lastSyncedAt: new Date().toISOString()
      };
      
      await set(newGameRef, newGame);
      return newGameRef.key;
    } catch (error) {
      console.error('Error adding new game:', error);
      return null;
    }
  }
  
  /**
   * Check for games that have been completed and update scores
   */
  private static async updateCompletedGames(games: Game[], result: SyncResult): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const game of games) {
      if (game.status === 'completed') continue;
      
      const gameDate = new Date(game.date);
      gameDate.setHours(23, 59, 59, 999); // End of game day
      
      // If game date has passed, check for final score
      if (gameDate < today && game.espnGameId) {
        try {
          const gameDetails = await ESPNApiService.fetchGameDetails(game.espnGameId);
          
          if (gameDetails.status === 'completed') {
            await this.updateGame(game.id, {
              status: 'completed',
              homeScore: gameDetails.homeScore,
              awayScore: gameDetails.awayScore,
              result: gameDetails.result
            });
            
            result.updated++;
            console.log(`Updated completed game: ${game.opponent} - ${gameDetails.result}`);
          }
        } catch (error) {
          console.error(`Error checking game completion for ${game.opponent}:`, error);
        }
      }
    }
  }
  
  /**
   * Log sync results for monitoring
   */
  private static async logSyncResult(result: SyncResult, updates: GameUpdate[]): Promise<void> {
    try {
      const logsRef = ref(database, this.SYNC_LOG_KEY);
      const newLogRef = push(logsRef);
      
      await set(newLogRef, {
        timestamp: result.lastSyncTime,
        added: result.added,
        updated: result.updated,
        errors: result.errors,
        updates: updates.map(u => ({
          gameId: u.gameId,
          field: u.field,
          oldValue: u.oldValue,
          newValue: u.newValue,
          source: u.source
        }))
      });
    } catch (error) {
      console.error('Error logging sync result:', error);
    }
  }
  
  /**
   * Manual trigger for immediate sync
   */
  static async triggerManualSync(): Promise<SyncResult> {
    console.log('Manual sync triggered');
    return this.performDailySync();
  }
  
  /**
   * Get last sync status
   */
  static async getLastSyncStatus(): Promise<{
    lastSync: string | null;
    nextSync: string;
    recentUpdates: GameUpdate[];
  }> {
    try {
      const logsRef = ref(database, this.SYNC_LOG_KEY);
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const logs = Object.values(snapshot.val()) as any[];
        const sortedLogs = logs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const lastLog = sortedLogs[0];
        const lastSync = lastLog?.timestamp || null;
        
        // Calculate next sync time (daily at 6 AM)
        const nextSync = new Date();
        nextSync.setHours(6, 0, 0, 0);
        if (nextSync < new Date()) {
          nextSync.setDate(nextSync.getDate() + 1);
        }
        
        return {
          lastSync,
          nextSync: nextSync.toISOString(),
          recentUpdates: lastLog?.updates || []
        };
      }
      
      return {
        lastSync: null,
        nextSync: new Date().toISOString(),
        recentUpdates: []
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: null,
        nextSync: new Date().toISOString(),
        recentUpdates: []
      };
    }
  }
}

export default ComprehensiveScheduleSyncService;