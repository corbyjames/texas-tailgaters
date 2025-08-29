import { test, expect } from '@playwright/test';

test('Direct Firebase data validation', async ({ page }) => {
  console.log('='.repeat(60));
  console.log('DIRECT FIREBASE DATA TEST');
  console.log('='.repeat(60));
  
  // First, let's check if we have any data in Firebase by going to a test page
  console.log('\n📋 Step 1: Creating a direct Firebase test page...');
  
  // Create a test HTML page that directly accesses Firebase
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Direct Firebase Test</title>
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getDatabase, ref, get, push, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
        
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
        
        window.testFirebase = async () => {
          const results = document.getElementById('results');
          results.innerHTML = '<h2>Testing Firebase...</h2>';
          
          try {
            // Get games
            const gamesRef = ref(database, 'games');
            const snapshot = await get(gamesRef);
            
            if (snapshot.exists()) {
              const games = snapshot.val();
              const gameCount = Object.keys(games).length;
              results.innerHTML += '<p>✅ Found ' + gameCount + ' games in Firebase</p>';
              
              // Display games with TV info
              let gamesWithTv = 0;
              Object.entries(games).forEach(([id, game]) => {
                const div = document.createElement('div');
                div.className = 'game-card';
                
                let tvInfo = 'No TV info';
                if (game.tv_network) {
                  tvInfo = '📺 ' + game.tv_network;
                  gamesWithTv++;
                } else if (game.tvNetwork) {
                  tvInfo = '📺 ' + game.tvNetwork;
                  gamesWithTv++;
                }
                
                div.innerHTML = '<h3>' + game.opponent + '</h3>' +
                               '<p>Date: ' + game.date + '</p>' +
                               '<p>TV: ' + tvInfo + '</p>' +
                               '<p>Location: ' + (game.is_home ? 'Home' : 'Away') + '</p>';
                results.appendChild(div);
              });
              
              results.innerHTML += '<h3>Summary: ' + gamesWithTv + ' games have TV network info</h3>';
            } else {
              results.innerHTML += '<p>❌ No games found in Firebase</p>';
              results.innerHTML += '<button onclick="addTestGames()">Add Test Games</button>';
            }
          } catch (error) {
            results.innerHTML += '<p>❌ Error: ' + error.message + '</p>';
          }
        };
        
        window.addTestGames = async () => {
          const results = document.getElementById('results');
          results.innerHTML += '<p>Adding test games...</p>';
          
          const testGames = [
            {
              date: '2025-10-11',
              opponent: 'Oklahoma',
              location: 'Dallas, TX',
              is_home: false,
              tv_network: 'ABC/ESPN',
              time: 'TBD',
              status: 'unplanned',
              expected_attendance: 0
            },
            {
              date: '2025-08-30',
              opponent: 'Ohio State',
              location: 'Columbus, OH',
              is_home: false,
              tv_network: 'FOX',
              time: 'TBD',
              status: 'unplanned',
              expected_attendance: 0
            }
          ];
          
          try {
            const gamesRef = ref(database, 'games');
            
            for (const game of testGames) {
              const newGameRef = push(gamesRef);
              await set(newGameRef, {
                ...game,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
            
            results.innerHTML += '<p>✅ Added ' + testGames.length + ' test games</p>';
            window.testFirebase(); // Refresh the display
          } catch (error) {
            results.innerHTML += '<p>❌ Error adding games: ' + error.message + '</p>';
          }
        };
        
        // Auto-run on load
        window.addEventListener('load', () => {
          window.testFirebase();
        });
    </script>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
        }
        .game-card {
            border: 1px solid #ddd;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            background: #f9f9f9;
        }
        .game-card h3 {
            color: #BF5700;
            margin-top: 0;
        }
        button {
            background: #BF5700;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Direct Firebase Data Test</h1>
    <div id="results">Loading...</div>
    <button onclick="testFirebase()">Refresh Data</button>
</body>
</html>
  `;
  
  // Navigate to a data URL with our test page
  await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`);
  await page.waitForTimeout(3000);
  
  // Check results
  console.log('\n📋 Step 2: Checking Firebase data...');
  
  const results = await page.locator('#results').textContent();
  console.log('Results from Firebase:');
  console.log(results);
  
  // Check if we need to add test games
  if (results?.includes('No games found')) {
    console.log('\n📋 Step 3: Adding test games...');
    await page.click('button:has-text("Add Test Games")');
    await page.waitForTimeout(3000);
    
    const updatedResults = await page.locator('#results').textContent();
    console.log('Updated results:');
    console.log(updatedResults);
  }
  
  // Count games with TV info
  const gameCards = await page.locator('.game-card').count();
  console.log(`\n📊 Found ${gameCards} game cards`);
  
  // Check each game for TV info
  const gamesWithTv = await page.locator('.game-card:has-text("📺")').count();
  console.log(`📺 Games with TV network: ${gamesWithTv}`);
  
  // Get specific game info
  const games = await page.locator('.game-card').all();
  console.log('\n📋 Game Details:');
  
  for (let i = 0; i < Math.min(games.length, 5); i++) {
    const game = games[i];
    const opponent = await game.locator('h3').textContent();
    const tvInfo = await game.locator('p:has-text("TV:")').textContent();
    console.log(`  ${opponent}: ${tvInfo}`);
  }
  
  // Now test the actual app with the data we know exists
  console.log('\n📋 Step 4: Testing actual app...');
  
  // Open app in new tab
  const context = page.context();
  const appPage = await context.newPage();
  
  // Try to navigate directly to games (might redirect to login)
  await appPage.goto('http://localhost:5173/games');
  await appPage.waitForTimeout(2000);
  
  // Check where we ended up
  const currentUrl = appPage.url();
  console.log(`Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('/login')) {
    console.log('Redirected to login - trying to authenticate...');
    
    // Try login
    await appPage.fill('input[type="email"]', 'test@texastailgaters.com');
    await appPage.fill('input[type="password"]', 'TestPassword123!');
    await appPage.click('button:has-text("Sign In")');
    await appPage.waitForTimeout(3000);
    
    // Check if login worked
    const afterLoginUrl = appPage.url();
    if (!afterLoginUrl.includes('/login')) {
      console.log('✅ Login successful');
      
      // Navigate to games
      await appPage.goto('http://localhost:5173/games');
      await appPage.waitForTimeout(2000);
    } else {
      console.log('❌ Login failed - checking for errors');
      const errors = await appPage.locator('.text-red-500, [role="alert"]').allTextContents();
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
    }
  }
  
  // Take screenshot of final state
  await appPage.screenshot({ path: 'direct-test-app.png', fullPage: true });
  console.log('\nScreenshot saved: direct-test-app.png');
  
  // Check for TV network display in app
  const appTvIcons = await appPage.locator('text=📺').count();
  const appGameCards = await appPage.locator('.card, .bg-white').count();
  
  console.log('\n📊 App Results:');
  console.log(`  Game cards in app: ${appGameCards}`);
  console.log(`  TV icons in app: ${appTvIcons}`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Firebase has ${gameCards} games`);
  console.log(`Firebase games with TV: ${gamesWithTv}`);
  console.log(`App shows ${appGameCards} game cards`);
  console.log(`App shows ${appTvIcons} TV icons`);
  
  if (gamesWithTv > 0 && appTvIcons === 0 && appGameCards > 0) {
    console.log('\n❌ ISSUE FOUND: Firebase has TV data but app is not displaying it');
  } else if (gamesWithTv > 0 && appTvIcons > 0) {
    console.log('\n✅ SUCCESS: TV network data is properly displayed');
  } else if (gameCards === 0) {
    console.log('\n⚠️ No data in Firebase to test');
  }
  
  await appPage.close();
});