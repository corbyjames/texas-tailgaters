const axios = require('axios');
const admin = require('../config/firebase');

class ScheduleService {
  constructor() {
    this.espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
    this.texasTeamId = '251';
  }

  /**
   * Perform full schedule sync from all sources
   */
  async performFullSync() {
    const result = {
      updated: 0,
      added: 0,
      errors: [],
      changes: [],
      lastSyncTime: new Date().toISOString()
    };

    try {
      console.log('Starting full schedule sync...');
      
      // Get existing games from Firebase
      const existingGames = await this.getExistingGames();
      const gamesMap = new Map(existingGames.map(g => [`${g.date}_${g.opponent}`, g]));
      
      // Fetch from all sources in parallel
      const [espnGames, utGames] = await Promise.all([
        this.fetchESPNSchedule(),
        this.fetchUTAthleticsSchedule()
      ]);
      
      // Check for bowl games in December/January
      const currentMonth = new Date().getMonth();
      if (currentMonth === 11 || currentMonth === 0) {
        const bowlGames = await this.checkForBowlGames();
        espnGames.push(...bowlGames);
      }
      
      // Process ESPN games
      for (const espnGame of espnGames) {
        if (!espnGame.opponent || !espnGame.date) continue;
        
        const gameKey = `${espnGame.date}_${espnGame.opponent}`;
        const existingGame = gamesMap.get(gameKey);
        
        if (existingGame) {
          const changes = this.compareGames(existingGame, espnGame, 'ESPN');
          if (changes.length > 0) {
            await this.updateGameData(existingGame.id, espnGame);
            result.updated++;
            result.changes.push(...changes);
          }
        } else {
          const newGameId = await this.addNewGame(espnGame);
          if (newGameId) {
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
          const changes = this.compareGames(existingGame, utGame, 'UTAthletics');
          if (changes.length > 0) {
            await this.updateGameData(existingGame.id, utGame);
            result.updated++;
            result.changes.push(...changes);
          }
        }
      }
      
      // Check for completed games
      await this.updateCompletedGames(existingGames, result);
      
      // Log sync result
      await this.logSyncResult(result);
      
      console.log(`Sync complete: ${result.added} added, ${result.updated} updated`);
      return result;
      
    } catch (error) {
      console.error('Error in full sync:', error);
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Fetch schedule from ESPN API
   */
  async fetchESPNSchedule() {
    try {
      const year = new Date().getFullYear();
      const response = await axios.get(
        `${this.espnBaseUrl}/teams/${this.texasTeamId}/schedule?season=${year}`
      );
      
      const events = response.data.events || [];
      return this.transformESPNGames(events);
      
    } catch (error) {
      console.error('Error fetching ESPN schedule:', error);
      return [];
    }
  }

  /**
   * Fetch schedule from UT Athletics (using scraping service)
   */
  async fetchUTAthleticsSchedule() {
    try {
      const scrapingService = require('./scrapingService');
      return await scrapingService.scrapeUTAthleticsSchedule();
    } catch (error) {
      console.error('Error fetching UT Athletics schedule:', error);
      return [];
    }
  }

  /**
   * Transform ESPN game data
   */
  transformESPNGames(espnGames) {
    return espnGames.map(espnGame => {
      const competition = espnGame.competitions[0];
      if (!competition) return null;
      
      const texasCompetitor = competition.competitors.find(
        c => c.team.id === this.texasTeamId
      );
      const opponentCompetitor = competition.competitors.find(
        c => c.team.id !== this.texasTeamId
      );
      
      if (!texasCompetitor || !opponentCompetitor) return null;
      
      const isHome = texasCompetitor.homeAway === 'home';
      const gameDate = new Date(competition.date);
      const tvNetwork = competition.broadcasts?.[0]?.names?.join(', ') || 'TBD';
      
      let result, homeScore, awayScore;
      
      if (competition.status.type.completed) {
        const texasScore = parseInt(texasCompetitor.score) || 0;
        const opponentScore = parseInt(opponentCompetitor.score) || 0;
        
        if (isHome) {
          homeScore = texasScore;
          awayScore = opponentScore;
        } else {
          homeScore = opponentScore;
          awayScore = texasScore;
        }
        
        if (texasCompetitor.winner === true) result = 'W';
        else if (texasCompetitor.winner === false) result = 'L';
        else if (texasScore === opponentScore) result = 'T';
      }
      
      const timeString = gameDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const venue = competition.venue;
      const location = venue ? 
        `${venue.fullName}${venue.address ? `, ${venue.address.city}, ${venue.address.state}` : ''}` :
        undefined;
      
      return {
        date: gameDate.toISOString().split('T')[0],
        time: timeString,
        opponent: opponentCompetitor.team.displayName,
        location,
        isHome,
        tvNetwork,
        status: competition.status.type.completed ? 'completed' : 'scheduled',
        homeScore,
        awayScore,
        result,
        espnGameId: espnGame.id,
        lastSyncedAt: new Date().toISOString()
      };
    }).filter(Boolean);
  }

  /**
   * Check for bowl games
   */
  async checkForBowlGames() {
    try {
      const year = new Date().getFullYear();
      const response = await axios.get(
        `${this.espnBaseUrl}/teams/${this.texasTeamId}/schedule?season=${year}`
      );
      
      const events = response.data.events || [];
      
      const bowlGames = events.filter(game => {
        const gameDate = new Date(game.date);
        const month = gameDate.getMonth();
        const name = game.name?.toLowerCase() || '';
        
        const isBowlPeriod = month === 11 || month === 0;
        const hasBowlName = name.includes('bowl') || 
                          name.includes('playoff') ||
                          name.includes('championship');
        
        return isBowlPeriod && hasBowlName;
      });
      
      return this.transformESPNGames(bowlGames).map(game => ({
        ...game,
        isBowlGame: true,
        bowlName: bowlGames.find(g => g.id === game.espnGameId)?.name
      }));
      
    } catch (error) {
      console.error('Error checking for bowl games:', error);
      return [];
    }
  }

  /**
   * Check for TV network updates
   */
  async checkNetworkUpdates() {
    try {
      const games = await this.fetchUTAthleticsSchedule();
      const updates = [];
      
      for (const game of games) {
        if (game.tvNetwork && game.tvNetwork !== 'TBD') {
          const existingGame = await this.findGameByOpponentAndDate(game.opponent, game.date);
          
          if (existingGame && existingGame.tvNetwork !== game.tvNetwork) {
            updates.push({
              gameId: existingGame.id,
              opponent: game.opponent,
              date: game.date,
              tvNetwork: game.tvNetwork,
              previousNetwork: existingGame.tvNetwork
            });
            
            await this.updateGameData(existingGame.id, { tvNetwork: game.tvNetwork });
          }
        }
      }
      
      return updates;
    } catch (error) {
      console.error('Error checking network updates:', error);
      return [];
    }
  }

  /**
   * Get existing games from Firebase
   */
  async getExistingGames() {
    try {
      const snapshot = await admin.database().ref('games').once('value');
      const gamesData = snapshot.val() || {};
      
      return Object.entries(gamesData).map(([id, data]) => ({
        id,
        ...data
      }));
    } catch (error) {
      console.error('Error fetching existing games:', error);
      return [];
    }
  }

  /**
   * Find game by opponent and date
   */
  async findGameByOpponentAndDate(opponent, date) {
    try {
      const games = await this.getExistingGames();
      return games.find(g => g.opponent === opponent && g.date === date);
    } catch (error) {
      console.error('Error finding game:', error);
      return null;
    }
  }

  /**
   * Compare games and return changes
   */
  compareGames(existing, updated, source) {
    const changes = [];
    
    if (updated.time && updated.time !== 'TBD' && existing.time !== updated.time) {
      changes.push({
        gameId: existing.id,
        field: 'time',
        oldValue: existing.time,
        newValue: updated.time,
        opponent: existing.opponent,
        source
      });
    }
    
    if (updated.tvNetwork && updated.tvNetwork !== 'TBD' && existing.tvNetwork !== updated.tvNetwork) {
      changes.push({
        gameId: existing.id,
        field: 'tvNetwork',
        oldValue: existing.tvNetwork,
        newValue: updated.tvNetwork,
        opponent: existing.opponent,
        source
      });
    }
    
    if (updated.status === 'completed' && existing.status !== 'completed') {
      changes.push({
        gameId: existing.id,
        field: 'status',
        oldValue: existing.status,
        newValue: 'completed',
        opponent: existing.opponent,
        source
      });
    }
    
    return changes;
  }

  /**
   * Update game data in Firebase
   */
  async updateGameData(gameId, updates) {
    try {
      const gameRef = admin.database().ref(`games/${gameId}`);
      await gameRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error(`Error updating game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Add new game to Firebase
   */
  async addNewGame(gameData) {
    try {
      const gamesRef = admin.database().ref('games');
      const newGameRef = gamesRef.push();
      
      await newGameRef.set({
        ...gameData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return newGameRef.key;
    } catch (error) {
      console.error('Error adding new game:', error);
      return null;
    }
  }

  /**
   * Update completed games with final scores
   */
  async updateCompletedGames(games, result) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const game of games) {
      if (game.status === 'completed') continue;
      
      const gameDate = new Date(game.date);
      gameDate.setHours(23, 59, 59, 999);
      
      if (gameDate < today && game.espnGameId) {
        try {
          const response = await axios.get(
            `${this.espnBaseUrl}/summary?event=${game.espnGameId}`
          );
          
          const competition = response.data.header?.competitions?.[0];
          if (competition?.status?.type?.completed) {
            const updates = this.transformESPNGames([{ competitions: [competition] }])[0];
            
            if (updates) {
              await this.updateGameData(game.id, {
                status: 'completed',
                homeScore: updates.homeScore,
                awayScore: updates.awayScore,
                result: updates.result
              });
              
              result.updated++;
              console.log(`Updated completed game: ${game.opponent}`);
            }
          }
        } catch (error) {
          console.error(`Error checking game completion for ${game.opponent}:`, error);
        }
      }
    }
  }

  /**
   * Log sync result
   */
  async logSyncResult(result) {
    try {
      const logsRef = admin.database().ref('syncLogs');
      await logsRef.push({
        timestamp: result.lastSyncTime,
        added: result.added,
        updated: result.updated,
        errors: result.errors,
        changes: result.changes
      });
    } catch (error) {
      console.error('Error logging sync result:', error);
    }
  }
}

module.exports = new ScheduleService();