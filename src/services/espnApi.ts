import { Game } from '../types/Game';

interface ESPNGame {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    date: string;
    status: {
      type: {
        completed: boolean;
        description: string;
      };
      displayClock: string;
      period: number;
    };
    competitors: Array<{
      id: string;
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
      };
      homeAway: 'home' | 'away';
      score: string;
      winner?: boolean;
    }>;
    broadcasts?: Array<{
      market: string;
      names: string[];
    }>;
    venue?: {
      fullName: string;
      address?: {
        city: string;
        state: string;
      };
    };
    notes?: Array<{
      headline: string;
    }>;
  }>;
  season: {
    type: number;
    year: number;
  };
}

interface ESPNScheduleResponse {
  events: ESPNGame[];
}

export class ESPNApiService {
  private static readonly BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
  private static readonly TEXAS_TEAM_ID = '251'; // Texas Longhorns team ID
  
  /**
   * Fetch Texas schedule from ESPN API
   */
  static async fetchSchedule(year: number = new Date().getFullYear()): Promise<Partial<Game>[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/teams/${this.TEXAS_TEAM_ID}/schedule?season=${year}`
      );
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }
      
      const data: ESPNScheduleResponse = await response.json();
      return this.transformESPNGames(data.events);
    } catch (error) {
      console.error('Error fetching ESPN schedule:', error);
      throw error;
    }
  }
  
  /**
   * Fetch specific game details including live scores
   */
  static async fetchGameDetails(espnGameId: string): Promise<Partial<Game>> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/summary?event=${espnGameId}`
      );
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformGameDetails(data);
    } catch (error) {
      console.error('Error fetching game details:', error);
      throw error;
    }
  }
  
  /**
   * Fetch live scores for today's games
   */
  static async fetchLiveScores(): Promise<Partial<Game>[]> {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const response = await fetch(
        `${this.BASE_URL}/teams/${this.TEXAS_TEAM_ID}/schedule`
      );
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }
      
      const data: ESPNScheduleResponse = await response.json();
      
      // Filter for today's games or games in progress
      const liveGames = data.events.filter(game => {
        const gameDate = new Date(game.date);
        const today = new Date();
        return gameDate.toDateString() === today.toDateString() ||
               !game.competitions[0]?.status?.type?.completed;
      });
      
      return this.transformESPNGames(liveGames);
    } catch (error) {
      console.error('Error fetching live scores:', error);
      throw error;
    }
  }
  
  /**
   * Check for bowl game invitations
   */
  static async checkForBowlGames(): Promise<Partial<Game>[]> {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `${this.BASE_URL}/teams/${this.TEXAS_TEAM_ID}/schedule?season=${currentYear}`
      );
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }
      
      const data: ESPNScheduleResponse = await response.json();
      
      // Filter for postseason games (bowl games and playoffs)
      const bowlGames = data.events.filter(game => {
        const gameDate = new Date(game.date);
        const december = 11; // December
        const january = 0; // January
        const gameMonth = gameDate.getMonth();
        
        // Bowl games typically happen in December and January
        // Also check if game name contains bowl-related keywords
        const isBowlPeriod = gameMonth === december || gameMonth === january;
        const hasBowlName = game.name?.toLowerCase().includes('bowl') ||
                           game.name?.toLowerCase().includes('playoff') ||
                           game.name?.toLowerCase().includes('championship');
        
        return isBowlPeriod && hasBowlName;
      });
      
      return this.transformESPNGames(bowlGames, true);
    } catch (error) {
      console.error('Error checking for bowl games:', error);
      throw error;
    }
  }
  
  /**
   * Transform ESPN game data to our Game format
   */
  private static transformESPNGames(espnGames: ESPNGame[], isBowl = false): Partial<Game>[] {
    return espnGames.map(espnGame => {
      const competition = espnGame.competitions[0];
      if (!competition) return {} as Partial<Game>;
      
      const texasCompetitor = competition.competitors.find(
        c => c.team.id === this.TEXAS_TEAM_ID
      );
      const opponentCompetitor = competition.competitors.find(
        c => c.team.id !== this.TEXAS_TEAM_ID
      );
      
      if (!texasCompetitor || !opponentCompetitor) return {} as Partial<Game>;
      
      const isHome = texasCompetitor.homeAway === 'home';
      const gameDate = new Date(competition.date);
      // Fix: ESPN uses media.shortName, not names array
      const tvNetwork = competition.broadcasts?.[0]?.media?.shortName || 'TBD';
      
      // Determine game result if completed
      let result: 'W' | 'L' | 'T' | undefined;
      let homeScore: number | undefined;
      let awayScore: number | undefined;
      
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
      
      // Extract bowl name if it's a bowl game
      let bowlName: string | undefined;
      if (isBowl || espnGame.name?.toLowerCase().includes('bowl')) {
        bowlName = espnGame.name;
      }
      
      // Format time
      const timeString = gameDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      // Format location
      const venue = competition.venue;
      const location = venue ? 
        `${venue.fullName}${venue.address ? `, ${venue.address.city}, ${venue.address.state}` : ''}` :
        undefined;
      
      return {
        date: gameDate.toISOString().split('T')[0],
        time: competition.status.type.completed ? timeString : timeString,
        opponent: opponentCompetitor.team.displayName,
        location,
        isHome,
        tvNetwork,
        status: competition.status.type.completed ? 'completed' : 'unplanned',
        homeScore,
        awayScore,
        result,
        isBowlGame: isBowl || bowlName !== undefined,
        bowlName,
        espnGameId: espnGame.id,
        gameNotes: competition.notes?.[0]?.headline,
        lastSyncedAt: new Date().toISOString()
      } as Partial<Game>;
    }).filter(game => game.opponent); // Filter out any empty games
  }
  
  /**
   * Transform detailed game data
   */
  private static transformGameDetails(data: any): Partial<Game> {
    const header = data.header;
    const competition = header?.competitions?.[0];
    
    if (!competition) return {};
    
    const texasCompetitor = competition.competitors.find(
      (c: any) => c.team.id === this.TEXAS_TEAM_ID
    );
    const opponentCompetitor = competition.competitors.find(
      (c: any) => c.team.id !== this.TEXAS_TEAM_ID
    );
    
    if (!texasCompetitor || !opponentCompetitor) return {};
    
    const isHome = texasCompetitor.homeAway === 'home';
    const gameDate = new Date(competition.date);
    
    // Get scores
    const texasScore = parseInt(texasCompetitor.score) || 0;
    const opponentScore = parseInt(opponentCompetitor.score) || 0;
    
    let homeScore: number;
    let awayScore: number;
    
    if (isHome) {
      homeScore = texasScore;
      awayScore = opponentScore;
    } else {
      homeScore = opponentScore;
      awayScore = texasScore;
    }
    
    // Determine result
    let result: 'W' | 'L' | 'T' | undefined;
    if (competition.status.type.completed) {
      if (texasScore > opponentScore) result = 'W';
      else if (texasScore < opponentScore) result = 'L';
      else result = 'T';
    }
    
    return {
      date: gameDate.toISOString().split('T')[0],
      time: gameDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      opponent: opponentCompetitor.team.displayName,
      isHome,
      status: competition.status.type.completed ? 'completed' : 'unplanned',
      homeScore,
      awayScore,
      result,
      tvNetwork: competition.broadcast || 'TBD',
      lastSyncedAt: new Date().toISOString()
    };
  }
}

export default ESPNApiService;