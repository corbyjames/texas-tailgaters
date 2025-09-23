import firebaseService from './firebaseService';
import { parseGameDate } from '../utils/dateUtils';
import { Game } from '../types/Game';

interface UpdateLog {
  timestamp: string;
  gamesChecked: number;
  gamesUpdated: number;
  updates: Array<{
    gameId: string;
    opponent: string;
    date: string;
    previousStatus: string;
    newStatus: string;
  }>;
  errors: string[];
}

class DailyUpdateService {
  private static UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
  private static LAST_UPDATE_KEY = 'lastGameStatusUpdate';
  private static UPDATE_LOG_KEY = 'gameStatusUpdateLog';
  private static intervalId: ReturnType<typeof setInterval> | null = null;
  private static isRunning = false;

  /**
   * Initialize the daily update service
   * This will start checking for games that need status updates
   */
  static initialize(): void {
    if (this.isRunning) {
      console.log('Daily update service already running');
      return;
    }

    console.log('Initializing daily game status update service...');
    this.isRunning = true;

    // Run initial check
    this.checkAndUpdateGameStatuses();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkAndUpdateGameStatuses();
    }, this.UPDATE_CHECK_INTERVAL);

    // Also check when the page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAndUpdateGameStatuses();
      }
    });

    console.log('Daily update service initialized - checking every hour');
  }

  /**
   * Stop the daily update service
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Daily update service stopped');
  }

  /**
   * Check if we should run the update based on last run time
   */
  private static shouldRunUpdate(): boolean {
    const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Run if never run before or if it's a new day
    if (!lastUpdate) return true;

    const lastUpdateDate = lastUpdate.split('T')[0];
    return lastUpdateDate !== today;
  }

  /**
   * Main function to check and update game statuses
   */
  static async checkAndUpdateGameStatuses(): Promise<UpdateLog> {
    const log: UpdateLog = {
      timestamp: new Date().toISOString(),
      gamesChecked: 0,
      gamesUpdated: 0,
      updates: [],
      errors: []
    };

    try {
      // Check if we should run (once per day unless forced)
      if (!this.shouldRunUpdate() && !this.isForceUpdate) {
        console.log('Daily update already ran today, skipping...');
        return log;
      }

      console.log('Starting daily game status update check...');

      // Get all games from Firebase
      const games = await firebaseService.getGames() as any[];
      log.gamesChecked = games.length;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const updates: { [key: string]: any } = {};

      for (const game of games) {
        try {
          // Skip if already completed or in-progress
          if (game.status === 'completed' || game.status === 'in-progress') {
            continue;
          }

          const gameDate = parseGameDate(game.date);

          // Check if game date has passed
          if (gameDate < now) {
            let shouldUpdate = false;
            let reason = '';

            // Check if we have scores
            if ((game.homeScore !== undefined && game.awayScore !== undefined) ||
                (game.home_score !== undefined && game.away_score !== undefined)) {
              shouldUpdate = true;
              reason = 'Has scores';
            } else if (game.time) {
              // Check if enough time has passed after kickoff
              const [hours, minutes] = (game.time || '00:00').split(':').map(Number);
              const gameDateTime = new Date(gameDate);
              gameDateTime.setHours(hours || 12, minutes || 0, 0, 0);
              // Add 4 hours for typical game duration
              gameDateTime.setHours(gameDateTime.getHours() + 4);

              if (new Date() > gameDateTime) {
                shouldUpdate = true;
                reason = 'Past kickoff + 4 hours';
              }
            } else {
              // No time specified, if date has passed, mark as completed
              shouldUpdate = true;
              reason = 'Past game date';
            }

            if (shouldUpdate) {
              updates[`games/${game.id}/status`] = 'completed';

              log.updates.push({
                gameId: game.id!,
                opponent: game.opponent,
                date: game.date,
                previousStatus: game.status || 'scheduled',
                newStatus: 'completed'
              });

              console.log(`Marking game as completed: ${game.opponent} (${game.date}) - Reason: ${reason}`);
            }
          }
        } catch (error) {
          const errorMsg = `Error processing game ${game.opponent}: ${error}`;
          console.error(errorMsg);
          log.errors.push(errorMsg);
        }
      }

      // Apply all updates at once
      if (Object.keys(updates).length > 0) {
        await firebaseService.batchUpdate(updates);
        log.gamesUpdated = Object.keys(updates).length;
        console.log(`Updated ${log.gamesUpdated} game(s) to completed status`);

        // Trigger a refresh event
        window.dispatchEvent(new Event('gamesUpdated'));
      } else {
        console.log('No games needed status updates');
      }

      // Update last run timestamp
      localStorage.setItem(this.LAST_UPDATE_KEY, new Date().toISOString());

      // Save log
      this.saveUpdateLog(log);

    } catch (error) {
      const errorMsg = `Daily update service error: ${error}`;
      console.error(errorMsg);
      log.errors.push(errorMsg);
    }

    return log;
  }

  /**
   * Force an immediate update regardless of last run time
   */
  private static isForceUpdate = false;

  static async forceUpdate(): Promise<UpdateLog> {
    console.log('Forcing game status update...');
    this.isForceUpdate = true;
    const result = await this.checkAndUpdateGameStatuses();
    this.isForceUpdate = false;
    return result;
  }

  /**
   * Save update log for debugging and monitoring
   */
  private static saveUpdateLog(log: UpdateLog): void {
    try {
      // Get existing logs
      const existingLogsStr = localStorage.getItem(this.UPDATE_LOG_KEY);
      const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];

      // Add new log
      existingLogs.unshift(log);

      // Keep only last 7 days of logs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const filteredLogs = existingLogs.filter((l: UpdateLog) =>
        new Date(l.timestamp) > sevenDaysAgo
      );

      // Save back to localStorage
      localStorage.setItem(this.UPDATE_LOG_KEY, JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('Error saving update log:', error);
    }
  }

  /**
   * Get recent update logs for debugging
   */
  static getRecentLogs(): UpdateLog[] {
    try {
      const logsStr = localStorage.getItem(this.UPDATE_LOG_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get status of the service
   */
  static getStatus(): {
    isRunning: boolean;
    lastUpdate: string | null;
    nextCheck: string;
  } {
    const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY);
    const nextCheck = new Date(Date.now() + this.UPDATE_CHECK_INTERVAL).toISOString();

    return {
      isRunning: this.isRunning,
      lastUpdate,
      nextCheck
    };
  }

  /**
   * Clear all stored data and reset service
   */
  static reset(): void {
    localStorage.removeItem(this.LAST_UPDATE_KEY);
    localStorage.removeItem(this.UPDATE_LOG_KEY);
    console.log('Daily update service data cleared');
  }
}

export default DailyUpdateService;