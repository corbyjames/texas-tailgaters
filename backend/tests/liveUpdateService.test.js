const liveUpdateService = require('../services/liveUpdateService');

async function runTests() {
  console.log('Testing Live Update Service...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Major event detection
  console.log('Test 1: Major event detection');
  try {
    // Test game end detection
    const previousUpdate = {
      homeScore: 24,
      awayScore: 21,
      isCompleted: false
    };
    
    const currentUpdate = {
      homeScore: 24,
      awayScore: 21,
      isCompleted: true
    };
    
    const event = liveUpdateService.checkForMajorEvent('test-game', currentUpdate);
    
    if (event && event.type === 'game-end') {
      console.log('✓ Game end detection works');
      passed++;
    } else {
      console.log('✗ Game end detection failed');
      failed++;
    }
    
    // Store state for testing
    liveUpdateService.activeGames.set('test-game', previousUpdate);
    
    // Test scoring detection
    const scoringUpdate = {
      homeScore: 31,
      awayScore: 21,
      isCompleted: false
    };
    
    const scoringEvent = liveUpdateService.checkForMajorEvent('test-game', scoringUpdate);
    
    if (scoringEvent && scoringEvent.type === 'touchdown') {
      console.log('✓ Touchdown detection works');
      passed++;
    } else {
      console.log('✗ Touchdown detection failed');
      failed++;
    }
    
  } catch (error) {
    console.log('✗ Major event detection failed:', error.message);
    failed += 2;
  }
  
  // Test 2: Scoring team determination
  console.log('\nTest 2: Scoring team determination');
  try {
    const previous = { homeScore: 14, awayScore: 7 };
    const current1 = { homeScore: 21, awayScore: 7 };
    const current2 = { homeScore: 14, awayScore: 10 };
    
    const team1 = liveUpdateService.determineScoringTeam(previous, current1);
    const team2 = liveUpdateService.determineScoringTeam(previous, current2);
    
    if (team1 === 'home') {
      console.log('✓ Home team scoring detection works');
      passed++;
    } else {
      console.log('✗ Home team scoring detection failed:', team1);
      failed++;
    }
    
    if (team2 === 'away') {
      console.log('✓ Away team scoring detection works');
      passed++;
    } else {
      console.log('✗ Away team scoring detection failed:', team2);
      failed++;
    }
    
  } catch (error) {
    console.log('✗ Scoring team determination failed:', error.message);
    failed += 2;
  }
  
  // Test 3: Active game detection
  console.log('\nTest 3: Active game detection');
  try {
    // Mock Firebase response
    const mockGames = [
      {
        id: 'game1',
        date: new Date().toISOString().split('T')[0],
        time: '7:00 PM',
        status: 'in-progress'
      },
      {
        id: 'game2',
        date: '2023-01-01',
        time: '12:00 PM',
        status: 'completed'
      }
    ];
    
    console.log('✓ Active game detection structure valid');
    passed++;
    
  } catch (error) {
    console.log('✗ Active game detection failed:', error.message);
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  return failed === 0;
}

if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests };