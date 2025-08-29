import { test, expect } from '@playwright/test';

test('Verify updated TV networks in Firebase', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('📺 VERIFYING UPDATED TV NETWORKS');
  console.log('='.repeat(70));
  
  // Create a test page to check Firebase directly
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
        
        const firebaseConfig = {
          apiKey: "AIzaSyBJascYs4rXD4uL5Z8F7RDkMOBhQtjehic",
          authDomain: "texas-tailgaters.firebaseapp.com",
          databaseURL: "https://texas-tailgaters-default-rtdb.firebaseio.com",
          projectId: "texas-tailgaters",
          storageBucket: "texas-tailgaters.appspot.com",
          messagingSenderId: "517392756353",
          appId: "1:517392756353:web:texas-tailgaters-web"
        };
        
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        
        window.checkTvNetworks = async () => {
          const results = document.getElementById('results');
          const gamesRef = ref(database, 'games');
          const snapshot = await get(gamesRef);
          
          if (snapshot.exists()) {
            const games = snapshot.val();
            const gameArray = Object.entries(games)
              .map(([id, game]) => ({
                ...game,
                id
              }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            window.gamesData = gameArray;
            
            // Check specific games
            const keyGames = {
              'Ohio State': 'FOX',
              'Oklahoma': 'ABC',
              'Georgia': 'CBS',
              'Texas A&M': 'ABC',
              'Mississippi State': 'ESPN',
              'San Jose State': 'Longhorn Network'
            };
            
            let validationResults = [];
            
            Object.entries(keyGames).forEach(([opponent, expectedNetwork]) => {
              const game = gameArray.find(g => g.opponent === opponent);
              if (game) {
                const actualNetwork = game.tv_network || game.tvNetwork || 'Not set';
                const isCorrect = actualNetwork === expectedNetwork;
                validationResults.push({
                  opponent,
                  expected: expectedNetwork,
                  actual: actualNetwork,
                  correct: isCorrect
                });
              }
            });
            
            window.validationResults = validationResults;
            
            // Display results
            results.innerHTML = '<h3>TV Network Validation Results:</h3>';
            validationResults.forEach(result => {
              const icon = result.correct ? '✅' : '❌';
              results.innerHTML += '<div class="' + (result.correct ? 'correct' : 'incorrect') + '">' +
                icon + ' ' + result.opponent + ': Expected ' + result.expected + 
                ', Got ' + result.actual + '</div>';
            });
            
            // Count networks
            const networkCounts = {};
            gameArray.forEach(game => {
              const network = game.tv_network || game.tvNetwork || 'Not set';
              networkCounts[network] = (networkCounts[network] || 0) + 1;
            });
            
            window.networkCounts = networkCounts;
            results.innerHTML += '<h4>Network Distribution:</h4>';
            Object.entries(networkCounts).forEach(([network, count]) => {
              results.innerHTML += '<div>' + network + ': ' + count + ' games</div>';
            });
          }
        };
        
        window.addEventListener('load', () => window.checkTvNetworks());
    </script>
    <style>
        .correct { color: green; margin: 5px 0; }
        .incorrect { color: red; margin: 5px 0; }
    </style>
</head>
<body>
    <div id="results">Loading...</div>
</body>
</html>
  `;
  
  await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`);
  await page.waitForTimeout(3000);
  
  // Get validation results
  const validationResults = await page.evaluate(() => (window as any).validationResults);
  const networkCounts = await page.evaluate(() => (window as any).networkCounts);
  const gamesData = await page.evaluate(() => (window as any).gamesData);
  
  console.log('\n📋 KEY GAMES TV NETWORK VALIDATION:');
  console.log('-'.repeat(40));
  
  if (validationResults && validationResults.length > 0) {
    validationResults.forEach((result: any) => {
      const icon = result.correct ? '✅' : '❌';
      console.log(`${icon} ${result.opponent}:`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual}`);
      if (!result.correct) {
        console.log(`   ⚠️ MISMATCH - Network needs update`);
      }
    });
    
    const correctCount = validationResults.filter((r: any) => r.correct).length;
    const totalCount = validationResults.length;
    console.log(`\n📊 Validation Score: ${correctCount}/${totalCount} correct`);
  } else {
    console.log('❌ No validation results available');
  }
  
  console.log('\n📺 TV NETWORK DISTRIBUTION:');
  console.log('-'.repeat(40));
  
  if (networkCounts) {
    // Sort by count
    const sorted = Object.entries(networkCounts)
      .sort(([,a]: any, [,b]: any) => b - a);
    
    sorted.forEach(([network, count]) => {
      console.log(`   ${network}: ${count} game${count === 1 ? '' : 's'}`);
    });
    
    // Check if we have variety
    const uniqueNetworks = Object.keys(networkCounts).filter(n => n !== 'TBD' && n !== 'Not set');
    console.log(`\n   Total unique networks: ${uniqueNetworks.length}`);
    console.log(`   Networks: ${uniqueNetworks.join(', ')}`);
  }
  
  console.log('\n📅 COMPLETE SCHEDULE WITH TV NETWORKS:');
  console.log('-'.repeat(40));
  
  if (gamesData && gamesData.length > 0) {
    gamesData.forEach((game: any) => {
      const network = game.tv_network || game.tvNetwork || 'Not set';
      const date = new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const home = game.is_home ? '🏠' : '✈️';
      console.log(`   ${date} ${home} vs ${game.opponent}: 📺 ${network}`);
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 SUMMARY');
  console.log('='.repeat(70));
  
  const hasOhioStateFox = validationResults?.find((r: any) => r.opponent === 'Ohio State' && r.actual === 'FOX');
  const hasOklahomaAbc = validationResults?.find((r: any) => r.opponent === 'Oklahoma' && r.actual === 'ABC');
  const hasGeorgiaCbs = validationResults?.find((r: any) => r.opponent === 'Georgia' && r.actual === 'CBS');
  
  if (hasOhioStateFox) {
    console.log('✅ Ohio State game correctly shows FOX');
  } else {
    console.log('❌ Ohio State game NOT on FOX (needs update)');
  }
  
  if (hasOklahomaAbc) {
    console.log('✅ Oklahoma game correctly shows ABC');
  } else {
    console.log('❌ Oklahoma game NOT on ABC (needs update)');
  }
  
  if (hasGeorgiaCbs) {
    console.log('✅ Georgia game correctly shows CBS');
  } else {
    console.log('❌ Georgia game NOT on CBS (needs update)');
  }
  
  console.log('\n📝 NEXT STEPS:');
  console.log('1. If games show incorrect networks, click "Clear and Resync" in update-tv-networks.html');
  console.log('2. Once updated, TV networks will display in the app with 📺 icon');
  console.log('3. Major games (Ohio State, Oklahoma, Georgia, Texas A&M) should have specific networks');
  
  // Assertions
  expect(gamesData).toBeDefined();
  expect(gamesData.length).toBeGreaterThan(0);
});