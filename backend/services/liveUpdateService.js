const axios = require('axios');
const admin = require('../config/firebase');

class LiveUpdateService {
  constructor() {
    this.espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
    this.texasTeamId = '251';
    this.activeGames = new Map();
  }

  /**
   * Get currently active games (in progress or about to start)
   */
  async getActiveGames() {
    try {
      const now = new Date();
      const gamesRef = admin.database().ref('games');
      const snapshot = await gamesRef.once('value');
      const games = snapshot.val() || {};
      
      const activeGames = [];
      
      for (const [gameId, game] of Object.entries(games)) {
        if (!game.date || !game.time) continue;
        
        const gameDateTime = new Date(`${game.date} ${game.time}`);
        const timeDiff = gameDateTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Game is active if:
        // 1. Status is 'in-progress'
        // 2. Game starts within next 30 minutes
        // 3. Game started less than 4 hours ago (typical game length)
        if (game.status === 'in-progress' || 
            (hoursDiff > -4 && hoursDiff < 0.5)) {
          activeGames.push({
            id: gameId,
            ...game
          });
        }
      }
      
      return activeGames;
    } catch (error) {
      console.error('Error getting active games:', error);
      return [];
    }
  }

  /**
   * Fetch live updates for a specific game
   */
  async fetchLiveUpdates(espnGameId) {
    try {
      if (!espnGameId) return null;
      
      const response = await axios.get(
        `${this.espnBaseUrl}/summary?event=${espnGameId}`
      );
      
      const data = response.data;
      const competition = data.header?.competitions?.[0];
      
      if (!competition) return null;
      
      const texasCompetitor = competition.competitors.find(
        c => c.team.id === this.texasTeamId
      );
      const opponentCompetitor = competition.competitors.find(
        c => c.team.id !== this.texasTeamId
      );
      
      if (!texasCompetitor || !opponentCompetitor) return null;
      
      const isHome = texasCompetitor.homeAway === 'home';
      const texasScore = parseInt(texasCompetitor.score) || 0;
      const opponentScore = parseInt(opponentCompetitor.score) || 0;
      
      const updates = {
        homeScore: isHome ? texasScore : opponentScore,
        awayScore: isHome ? opponentScore : texasScore,
        status: competition.status.type.description,
        quarter: competition.status.period,
        timeRemaining: competition.status.displayClock,
        isCompleted: competition.status.type.completed,
        isHalftime: competition.status.type.description === 'Halftime',
        possession: this.getPossession(data),
        lastPlay: this.getLastPlay(data),
        drives: this.getCurrentDrive(data)
      };
      
      // Check for major events
      updates.majorEvent = this.checkForMajorEvent(espnGameId, updates);
      
      // Store current state for comparison
      this.activeGames.set(espnGameId, updates);
      
      return updates;
      
    } catch (error) {
      console.error(`Error fetching live updates for game ${espnGameId}:`, error);
      return null;
    }
  }

  /**
   * Get possession information
   */
  getPossession(data) {
    try {
      const situation = data.situation;
      if (!situation) return null;
      
      return {
        team: situation.possession?.displayName,
        yardLine: situation.shortDownDistanceText,
        down: situation.down,
        distance: situation.distance
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get last play information
   */
  getLastPlay(data) {
    try {
      const plays = data.plays;
      if (!plays || plays.length === 0) return null;
      
      const lastPlay = plays[0];
      return {
        text: lastPlay.text,
        type: lastPlay.type?.text,
        scoreValue: lastPlay.scoreValue,
        clock: lastPlay.clock?.displayValue
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current drive information
   */
  getCurrentDrive(data) {
    try {
      const drives = data.drives?.current;
      if (!drives) return null;
      
      return {
        team: drives.team?.displayName,
        startTime: drives.timeElapsed?.displayValue,
        plays: drives.plays?.length || 0,
        yards: drives.yards || 0,
        description: drives.description
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check for major events (scoring, game end, etc.)
   */
  checkForMajorEvent(gameId, currentUpdate) {
    const previousUpdate = this.activeGames.get(gameId);
    
    if (!previousUpdate) return null;
    
    // Game just ended
    if (!previousUpdate.isCompleted && currentUpdate.isCompleted) {
      const texasWon = currentUpdate.homeScore > currentUpdate.awayScore;
      return {
        type: 'game-end',
        result: texasWon ? 'W' : 'L',
        homeScore: currentUpdate.homeScore,
        awayScore: currentUpdate.awayScore
      };
    }
    
    // Halftime
    if (!previousUpdate.isHalftime && currentUpdate.isHalftime) {
      return {
        type: 'halftime',
        homeScore: currentUpdate.homeScore,
        awayScore: currentUpdate.awayScore
      };
    }
    
    // Scoring play detected
    const prevTotal = (previousUpdate.homeScore || 0) + (previousUpdate.awayScore || 0);
    const currTotal = currentUpdate.homeScore + currentUpdate.awayScore;
    
    if (currTotal > prevTotal) {
      const scoreDiff = currTotal - prevTotal;
      let type = 'score';
      
      if (scoreDiff === 6 || scoreDiff === 7 || scoreDiff === 8) {
        type = 'touchdown';
      } else if (scoreDiff === 3) {
        type = 'field-goal';
      } else if (scoreDiff === 2) {
        type = 'safety';
      }
      
      return {
        type,
        homeScore: currentUpdate.homeScore,
        awayScore: currentUpdate.awayScore,
        scoringTeam: this.determineScoringTeam(previousUpdate, currentUpdate)
      };
    }
    
    return null;
  }

  /**
   * Determine which team scored
   */
  determineScoringTeam(previous, current) {
    const homeScoreDiff = current.homeScore - (previous.homeScore || 0);
    const awayScoreDiff = current.awayScore - (previous.awayScore || 0);
    
    if (homeScoreDiff > 0) return 'home';
    if (awayScoreDiff > 0) return 'away';
    return null;
  }

  /**
   * Start monitoring a specific game
   */
  startGameMonitoring(gameId, espnGameId) {
    console.log(`Starting live monitoring for game ${gameId}`);
    this.activeGames.set(espnGameId, { monitoring: true });
  }

  /**
   * Stop monitoring a specific game
   */
  stopGameMonitoring(gameId, espnGameId) {
    console.log(`Stopping live monitoring for game ${gameId}`);
    this.activeGames.delete(espnGameId);
  }

  /**
   * Get game preview data
   */
  async getGamePreview(espnGameId) {
    try {
      const response = await axios.get(
        `${this.espnBaseUrl}/summary?event=${espnGameId}`
      );
      
      const data = response.data;
      
      return {
        storylines: data.article?.storyline,
        lastMeeting: data.lastMeeting,
        odds: data.odds,
        weather: data.weather,
        attendance: data.attendance
      };
      
    } catch (error) {
      console.error('Error fetching game preview:', error);
      return null;
    }
  }

  /**
   * Get team statistics for the game
   */
  async getGameStats(espnGameId) {
    try {
      const response = await axios.get(
        `${this.espnBaseUrl}/summary?event=${espnGameId}`
      );
      
      const data = response.data;
      const stats = data.boxscore?.teams;
      
      if (!stats) return null;
      
      return {
        home: {
          totalYards: stats[0].statistics?.find(s => s.name === 'totalYards')?.displayValue,
          passingYards: stats[0].statistics?.find(s => s.name === 'passingYards')?.displayValue,
          rushingYards: stats[0].statistics?.find(s => s.name === 'rushingYards')?.displayValue,
          turnovers: stats[0].statistics?.find(s => s.name === 'turnovers')?.displayValue
        },
        away: {
          totalYards: stats[1].statistics?.find(s => s.name === 'totalYards')?.displayValue,
          passingYards: stats[1].statistics?.find(s => s.name === 'passingYards')?.displayValue,
          rushingYards: stats[1].statistics?.find(s => s.name === 'rushingYards')?.displayValue,
          turnovers: stats[1].statistics?.find(s => s.name === 'turnovers')?.displayValue
        }
      };
      
    } catch (error) {
      console.error('Error fetching game stats:', error);
      return null;
    }
  }
}

module.exports = new LiveUpdateService();