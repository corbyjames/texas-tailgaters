import { Game } from '../types/Game';

interface UTAthleticsGame {
  date: string;
  opponent: string;
  location: string;
  time?: string;
  tvNetwork?: string;
  isHome: boolean;
  result?: string;
  score?: string;
}

export class UTAthleticsApiService {
  private static readonly BASE_URL = 'https://texassports.com';
  private static readonly SCHEDULE_URL = `${UTAthleticsApiService.BASE_URL}/sports/football/schedule`;
  
  /**
   * Fetch schedule from UT Athletics website
   * This uses a proxy service to avoid CORS issues
   */
  static async fetchSchedule(): Promise<Partial<Game>[]> {
    try {
      // Using a CORS proxy for client-side fetching
      // In production, this should be done server-side
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const response = await fetch(
        `${proxyUrl}${encodeURIComponent(this.SCHEDULE_URL)}`
      );
      
      if (!response.ok) {
        throw new Error(`UT Athletics fetch error: ${response.status}`);
      }
      
      const data = await response.json();
      const html = data.contents;
      
      return this.parseScheduleHTML(html);
    } catch (error) {
      console.error('Error fetching UT Athletics schedule:', error);
      // Fall back to manual schedule data
      return this.getManualSchedule();
    }
  }
  
  /**
   * Parse HTML from UT Athletics website
   */
  private static parseScheduleHTML(html: string): Partial<Game>[] {
    const games: Partial<Game>[] = [];
    
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for schedule table or list items
    // UT Athletics typically uses specific class names
    const gameElements = doc.querySelectorAll('.sidearm-schedule-game');
    
    gameElements.forEach(element => {
      try {
        // Extract game date
        const dateElement = element.querySelector('.sidearm-schedule-game-opponent-date');
        const dateText = dateElement?.textContent?.trim() || '';
        
        // Extract opponent
        const opponentElement = element.querySelector('.sidearm-schedule-game-opponent-name');
        const opponent = opponentElement?.textContent?.trim() || '';
        
        // Extract location (home/away/neutral)
        const locationElement = element.querySelector('.sidearm-schedule-game-location');
        const locationText = locationElement?.textContent?.trim() || '';
        const isHome = locationText.toLowerCase().includes('austin') || 
                      locationText.toLowerCase().includes('home');
        
        // Extract time
        const timeElement = element.querySelector('.sidearm-schedule-game-time');
        const time = timeElement?.textContent?.trim() || 'TBD';
        
        // Extract TV network
        const tvElement = element.querySelector('.sidearm-schedule-game-tv');
        const tvNetwork = tvElement?.textContent?.trim() || 'TBD';
        
        // Extract result if game is completed
        const resultElement = element.querySelector('.sidearm-schedule-game-result');
        const resultText = resultElement?.textContent?.trim() || '';
        
        let result: 'W' | 'L' | 'T' | undefined;
        let homeScore: number | undefined;
        let awayScore: number | undefined;
        
        if (resultText) {
          const isWin = resultText.includes('W');
          const isLoss = resultText.includes('L');
          result = isWin ? 'W' : isLoss ? 'L' : undefined;
          
          // Try to extract scores from result text (e.g., "W 31-24")
          const scoreMatch = resultText.match(/(\d+)-(\d+)/);
          if (scoreMatch) {
            const score1 = parseInt(scoreMatch[1]);
            const score2 = parseInt(scoreMatch[2]);
            
            if (isHome) {
              homeScore = isWin ? Math.max(score1, score2) : Math.min(score1, score2);
              awayScore = isWin ? Math.min(score1, score2) : Math.max(score1, score2);
            } else {
              awayScore = isWin ? Math.max(score1, score2) : Math.min(score1, score2);
              homeScore = isWin ? Math.min(score1, score2) : Math.max(score1, score2);
            }
          }
        }
        
        if (opponent && dateText) {
          games.push({
            date: this.parseDate(dateText),
            opponent,
            location: locationText,
            isHome,
            time: time !== 'TBD' ? this.formatTime(time) : 'TBD',
            tvNetwork,
            status: result ? 'completed' : 'unplanned',
            result,
            homeScore,
            awayScore,
            lastSyncedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error parsing game element:', err);
      }
    });
    
    return games;
  }
  
  /**
   * Parse date string from various formats
   */
  private static parseDate(dateStr: string): string {
    try {
      // Try to parse various date formats
      // "Saturday, Aug 31" -> "2024-08-31"
      // "9/7" -> "2024-09-07"
      
      const currentYear = new Date().getFullYear();
      
      // Check for month/day format
      if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
        const [month, day] = dateStr.split('/');
        return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Check for full date format
      const months: Record<string, string> = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'september': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
      };
      
      const dateParts = dateStr.toLowerCase().split(/[\s,]+/);
      for (const part of dateParts) {
        if (months[part]) {
          const monthNum = months[part];
          const dayMatch = dateStr.match(/\d{1,2}/);
          if (dayMatch) {
            const day = dayMatch[0].padStart(2, '0');
            return `${currentYear}-${monthNum}-${day}`;
          }
        }
      }
      
      // Fallback: try to parse as-is
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      return dateStr;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return dateStr;
    }
  }
  
  /**
   * Format time string to consistent format
   */
  private static formatTime(timeStr: string): string {
    try {
      // Remove extra whitespace and standardize
      timeStr = timeStr.trim().toUpperCase();
      
      // Already in correct format?
      if (timeStr.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/)) {
        return timeStr;
      }
      
      // Just hour with AM/PM?
      if (timeStr.match(/^\d{1,2}\s*(AM|PM)$/)) {
        const [hour, period] = timeStr.split(/\s+/);
        return `${hour}:00 ${period}`;
      }
      
      // Time with 'CT' or other timezone?
      const timeMatch = timeStr.match(/(\d{1,2}:?\d{0,2})\s*(AM|PM|A\.M\.|P\.M\.)/i);
      if (timeMatch) {
        let [, time, period] = timeMatch;
        period = period.replace(/\./g, '').toUpperCase();
        if (!time.includes(':')) {
          time = `${time}:00`;
        }
        return `${time} ${period}`;
      }
      
      return timeStr;
    } catch (error) {
      console.error('Error formatting time:', timeStr, error);
      return timeStr;
    }
  }
  
  /**
   * Get manual schedule as fallback
   * This returns the static schedule we maintain
   */
  private static getManualSchedule(): Partial<Game>[] {
    const currentYear = new Date().getFullYear();
    
    if (currentYear === 2025) {
      return [
        { date: '2025-08-30', opponent: 'Ohio State', location: 'Columbus, OH', time: '11:00 AM', tvNetwork: 'FOX', isHome: false },
        { date: '2025-09-06', opponent: 'San Jose State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'Longhorn Network', isHome: true },
        { date: '2025-09-13', opponent: 'UTSA', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN+', isHome: true },
        { date: '2025-09-20', opponent: 'Colorado State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'SEC Network', isHome: true },
        { date: '2025-10-04', opponent: 'Mississippi State', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN', isHome: true },
        { date: '2025-10-11', opponent: 'Oklahoma', location: 'Dallas, TX', time: '2:30 PM', tvNetwork: 'ABC', isHome: false },
        { date: '2025-10-18', opponent: 'Georgia', location: 'Austin, TX', time: 'TBD', tvNetwork: 'CBS', isHome: true },
        { date: '2025-10-25', opponent: 'Vanderbilt', location: 'Nashville, TN', time: 'TBD', tvNetwork: 'SEC Network', isHome: false },
        { date: '2025-11-01', opponent: 'Florida', location: 'Austin, TX', time: 'TBD', tvNetwork: 'ESPN', isHome: true },
        { date: '2025-11-15', opponent: 'Arkansas', location: 'Fayetteville, AR', time: 'TBD', tvNetwork: 'ABC/ESPN', isHome: false },
        { date: '2025-11-22', opponent: 'Kentucky', location: 'Austin, TX', time: 'TBD', tvNetwork: 'SEC Network', isHome: true },
        { date: '2025-11-29', opponent: 'Texas A&M', location: 'College Station, TX', time: 'TBD', tvNetwork: 'ABC', isHome: false },
      ];
    }
    
    return [];
  }
  
  /**
   * Check for TV network updates
   * Networks are usually announced 6-12 days before games
   */
  static async checkNetworkUpdates(): Promise<Map<string, string>> {
    const networkUpdates = new Map<string, string>();
    
    try {
      // Fetch latest schedule
      const games = await this.fetchSchedule();
      
      // Check each game for network updates
      games.forEach(game => {
        if (game.opponent && game.tvNetwork && game.tvNetwork !== 'TBD') {
          // Create a key for the game (date + opponent)
          const gameKey = `${game.date}_${game.opponent}`;
          networkUpdates.set(gameKey, game.tvNetwork);
        }
      });
      
      return networkUpdates;
    } catch (error) {
      console.error('Error checking network updates:', error);
      return networkUpdates;
    }
  }
}

export default UTAthleticsApiService;