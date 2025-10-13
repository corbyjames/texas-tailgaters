#!/usr/bin/env node
/**
 * Standalone script for Render Cron Jobs
 * Performs comprehensive sync (schedule + scores)
 */

const enhancedSyncService = require('./services/enhancedSyncService');

console.log('=== Weekly Deep Sync Cron Job ===');
console.log('Started:', new Date().toISOString());

enhancedSyncService.performComprehensiveSync()
  .then(result => {
    console.log('\n=== Sync Complete ===');
    console.log('Total Changes:', result.totalChanges);
    console.log('Schedule - Updated:', result.scheduleSync.updated);
    console.log('Schedule - Added:', result.scheduleSync.added);
    console.log('Scores - Updated:', result.scoreSync.updated);
    console.log('Errors:', [...result.scheduleSync.errors, ...result.scoreSync.errors].length);

    const allErrors = [...result.scheduleSync.errors, ...result.scoreSync.errors];
    if (allErrors.length > 0) {
      console.error('Errors:', allErrors);
      process.exit(1);
    }

    console.log('Success!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== Sync Failed ===');
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
