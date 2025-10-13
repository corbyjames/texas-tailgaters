#!/usr/bin/env node
/**
 * Standalone script for Render Cron Jobs
 * Syncs scores for completed games
 */

const enhancedSyncService = require('./services/enhancedSyncService');

console.log('=== Score Sync Cron Job ===');
console.log('Started:', new Date().toISOString());

enhancedSyncService.syncScores()
  .then(result => {
    console.log('\n=== Sync Complete ===');
    console.log('Updated:', result.updated);
    console.log('Errors:', result.errors.length);

    if (result.errors.length > 0) {
      console.error('Errors:', result.errors);
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
