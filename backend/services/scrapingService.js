const axios = require('axios');
const cheerio = require('cheerio');

class ScrapingService {
  constructor() {
    this.utAthleticsUrl = 'https://texassports.com/sports/football/schedule';
  }

  /**
   * Scrape UT Athletics website server-side (no CORS issues)
   */
  async scrapeUTAthleticsSchedule() {
    try {
      const response = await axios.get(this.utAthleticsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const games = [];
      
      // Parse schedule table
      $('.sidearm-schedule-game').each((index, element) => {
        const $game = $(element);
        
        // Extract date
        const dateText = $game.find('.sidearm-schedule-game-opponent-date').text().trim();
        const date = this.parseDate(dateText);
        
        // Extract opponent
        const opponent = $game.find('.sidearm-schedule-game-opponent-name').text().trim()
          .replace(/^\d+\s*/, '') // Remove ranking numbers
          .replace(/\s*\*+$/, ''); // Remove asterisks
        
        // Extract location and determine home/away
        const locationText = $game.find('.sidearm-schedule-game-location').text().trim();
        const isHome = locationText.toLowerCase().includes('austin') || 
                      locationText.toLowerCase().includes('home') ||
                      locationText === '';
        
        // Extract time
        let time = $game.find('.sidearm-schedule-game-time').text().trim();
        if (!time || time === 'TBA') {
          time = 'TBD';
        } else {
          time = this.formatTime(time);
        }
        
        // Extract TV network
        let tvNetwork = $game.find('.sidearm-schedule-game-tv').text().trim();
        if (!tvNetwork || tvNetwork === 'TBA') {
          tvNetwork = 'TBD';
        }
        
        // Extract venue
        const venue = $game.find('.sidearm-schedule-game-venue').text().trim();
        const location = venue || (isHome ? 'DKR-Texas Memorial Stadium, Austin, TX' : locationText);
        
        // Check if game is completed and get result
        const resultText = $game.find('.sidearm-schedule-game-result').text().trim();
        let status = 'scheduled';
        let result = undefined;
        let homeScore = undefined;
        let awayScore = undefined;
        
        if (resultText) {
          status = 'completed';
          const isWin = resultText.includes('W');
          const isLoss = resultText.includes('L');
          result = isWin ? 'W' : isLoss ? 'L' : 'T';
          
          // Extract scores
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
        
        // Check for special game notes (bowl games, playoffs)
        const gameNotes = $game.find('.sidearm-schedule-game-name').text().trim();
        const isBowlGame = gameNotes.toLowerCase().includes('bowl') || 
                          gameNotes.toLowerCase().includes('playoff') ||
                          gameNotes.toLowerCase().includes('championship');
        
        if (opponent && date) {
          games.push({
            date,
            opponent,
            location,
            isHome,
            time,
            tvNetwork,
            status,
            result,
            homeScore,
            awayScore,
            isBowlGame,
            bowlName: isBowlGame ? gameNotes : undefined,
            lastSyncedAt: new Date().toISOString()
          });
        }
      });
      
      console.log(`Scraped ${games.length} games from UT Athletics`);
      return games;
      
    } catch (error) {
      console.error('Error scraping UT Athletics:', error);
      throw error;
    }
  }

  /**
   * Parse date string to ISO format
   */
  parseDate(dateStr) {
    try {
      const currentYear = new Date().getFullYear();
      
      // Handle MM/DD format
      if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
        const [month, day] = dateStr.split('/');
        return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle full date format (e.g., "Saturday, Aug 31")
      const months = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'september': '09', 'sept': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
      };
      
      const dateParts = dateStr.toLowerCase().replace(/[,\s]+/g, ' ').split(' ');
      
      for (const part of dateParts) {
        if (months[part]) {
          const monthNum = months[part];
          const dayMatch = dateStr.match(/\d{1,2}/);
          if (dayMatch) {
            const day = dayMatch[0].padStart(2, '0');
            
            // Determine year (handle games in next calendar year)
            let year = currentYear;
            const currentMonth = new Date().getMonth() + 1;
            const gameMonth = parseInt(monthNum);
            
            // If game is in January but we're in fall, it's next year
            if (gameMonth < 3 && currentMonth > 8) {
              year = currentYear + 1;
            }
            
            return `${year}-${monthNum}-${day}`;
          }
        }
      }
      
      // Try native date parsing as fallback
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
   * Format time string consistently
   */
  formatTime(timeStr) {
    try {
      timeStr = timeStr.trim().toUpperCase();
      
      // Remove timezone indicators
      timeStr = timeStr.replace(/\s*(CT|CST|CDT|ET|EST|EDT|PT|PST|PDT|MT|MST|MDT)\s*/, '');
      
      // Already in correct format?
      if (timeStr.match(/^\d{1,2}:\d{2}\s*(AM|PM)$/)) {
        return timeStr;
      }
      
      // Just hour with AM/PM?
      if (timeStr.match(/^\d{1,2}\s*(AM|PM)$/)) {
        const [hour, period] = timeStr.split(/\s+/);
        return `${hour}:00 ${period}`;
      }
      
      // Extract time with AM/PM
      const timeMatch = timeStr.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM|A\.M\.|P\.M\.)/i);
      if (timeMatch) {
        let [, hour, minutes, period] = timeMatch;
        period = period.replace(/\./g, '').toUpperCase();
        minutes = minutes || '00';
        return `${hour}:${minutes.padStart(2, '0')} ${period}`;
      }
      
      return timeStr || 'TBD';
    } catch (error) {
      console.error('Error formatting time:', timeStr, error);
      return timeStr || 'TBD';
    }
  }

  /**
   * Scrape live game data
   */
  async scrapeLiveGameData(gameUrl) {
    try {
      const response = await axios.get(gameUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract live score and game status
      const homeScore = $('.home-score').text().trim();
      const awayScore = $('.away-score').text().trim();
      const gameStatus = $('.game-status').text().trim();
      const quarter = $('.game-quarter').text().trim();
      const timeRemaining = $('.game-clock').text().trim();
      
      return {
        homeScore: parseInt(homeScore) || 0,
        awayScore: parseInt(awayScore) || 0,
        status: gameStatus,
        quarter,
        timeRemaining,
        isLive: gameStatus.toLowerCase().includes('in progress'),
        isCompleted: gameStatus.toLowerCase().includes('final')
      };
      
    } catch (error) {
      console.error('Error scraping live game data:', error);
      return null;
    }
  }
}

module.exports = new ScrapingService();