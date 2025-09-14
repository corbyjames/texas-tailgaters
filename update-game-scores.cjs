const fetch = require('node-fetch');

async function getLatestScores() {
  console.log('Fetching latest Texas Longhorns scores from ESPN...\n');
  
  try {
    // ESPN API endpoint for Texas Longhorns 2025 season
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/251/schedule?season=2025');
    const data = await response.json();
    
    if (!data.events) {
      console.log('No games found');
      return;
    }
    
    console.log('2025 Texas Longhorns Games:\n');
    console.log('=' .repeat(80));
    
    data.events.forEach(event => {
      const competition = event.competitions[0];
      const date = new Date(competition.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const isHome = competition.competitors.find(c => c.homeAway === 'home').team.name === 'Texas';
      const texasTeam = competition.competitors.find(c => c.team.name === 'Texas' || c.team.name === 'Longhorns');
      const opponent = competition.competitors.find(c => c.team.name !== 'Texas' && c.team.name !== 'Longhorns');
      
      let status = competition.status.type.description;
      let scoreInfo = '';
      
      if (competition.status.type.completed) {
        const texasScore = parseInt(texasTeam.score) || 0;
        const opponentScore = parseInt(opponent.score) || 0;
        const result = texasScore > opponentScore ? 'W' : (texasScore < opponentScore ? 'L' : 'T');
        
        scoreInfo = `FINAL: Texas ${texasScore} - ${opponent.team.displayName} ${opponentScore} (${result})`;
        
        // Show if this needs updating in our database
        if (dateStr.includes('Aug 30') || dateStr.includes('Sep 6')) {
          console.log(`\n📊 ${dateStr} - ${opponent.team.displayName}`);
          console.log(`   ${scoreInfo}`);
          console.log(`   Status: COMPLETED`);
          console.log(`   ⚠️  This game needs score update in database!`);
        }
      } else if (competition.status.type.state === 'in') {
        const texasScore = parseInt(texasTeam.score) || 0;
        const opponentScore = parseInt(opponent.score) || 0;
        scoreInfo = `IN PROGRESS: Texas ${texasScore} - ${opponent.team.displayName} ${opponentScore}`;
        console.log(`\n🏈 ${dateStr} - ${opponent.team.displayName}`);
        console.log(`   ${scoreInfo}`);
        console.log(`   ${status}`);
      } else {
        console.log(`\n📅 ${dateStr} - ${opponent.team.displayName}`);
        console.log(`   Status: ${status}`);
        console.log(`   Time: ${competition.status.type.shortDetail || 'TBD'}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 To update production scores:');
    console.log('   1. Run sync from Admin Dashboard');
    console.log('   2. Or trigger manual deployment with updated scores');
    
  } catch (error) {
    console.error('Error fetching scores:', error.message);
  }
}

getLatestScores();