const cron = require('node-cron');
const enhancedSyncService = require('./enhancedSyncService');

/**
 * Job Scheduler
 * Manages all scheduled sync jobs with configurable frequencies
 */
class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.jobHistory = [];
    this.isRunning = false;
  }

  /**
   * Initialize all scheduled jobs
   */
  async initialize() {
    if (this.isRunning) {
      console.log('Job scheduler already running');
      return;
    }

    console.log('=== Initializing Job Scheduler ===');

    // Get configuration from environment or use defaults
    const config = {
      dailyScheduleSync: process.env.DAILY_SCHEDULE_SYNC || '0 6 * * *', // 6 AM daily
      gameDayScoreSync: process.env.GAMEDAY_SCORE_SYNC || '*/30 * * * *', // Every 30 min
      offSeasonSync: process.env.OFFSEASON_SYNC || '0 */4 * * *', // Every 4 hours
      weeklyDeepSync: process.env.WEEKLY_DEEP_SYNC || '0 23 * * 0', // Sundays at 11 PM
      enableScheduler: process.env.ENABLE_SCHEDULER !== 'false' // Default enabled
    };

    if (!config.enableScheduler) {
      console.log('Scheduler is disabled via environment variable');
      return;
    }

    // Job 1: Daily Schedule Sync (6 AM CT)
    // Updates game times, TV networks, adds new games (like bowl games)
    this.addJob('dailyScheduleSync', config.dailyScheduleSync, async () => {
      console.log('\n[DAILY SCHEDULE SYNC] Starting...');
      try {
        const result = await enhancedSyncService.performComprehensiveSync();
        this.recordJobRun('dailyScheduleSync', result);
        console.log(`[DAILY SCHEDULE SYNC] Complete: ${result.totalChanges} changes`);
      } catch (error) {
        console.error('[DAILY SCHEDULE SYNC] Error:', error);
        this.recordJobRun('dailyScheduleSync', { success: false, error: error.message });
      }
    });

    // Job 2: Game Day Score Sync (Every 30 minutes during game days)
    // Checks if today is a game day and syncs scores more frequently
    this.addJob('gameDayScoreSync', config.gameDayScoreSync, async () => {
      const isGameDay = await enhancedSyncService.isGameDay();

      if (isGameDay) {
        console.log('\n[GAME DAY SCORE SYNC] Starting...');
        try {
          const result = await enhancedSyncService.syncScores();
          this.recordJobRun('gameDayScoreSync', result);
          console.log(`[GAME DAY SCORE SYNC] Complete: ${result.updated} updates`);
        } catch (error) {
          console.error('[GAME DAY SCORE SYNC] Error:', error);
          this.recordJobRun('gameDayScoreSync', { success: false, error: error.message });
        }
      }
    });

    // Job 3: Off-Season Sync (Every 4 hours when not game day)
    // Less frequent sync for schedule changes during off-season
    this.addJob('offSeasonSync', config.offSeasonSync, async () => {
      const isGameDay = await enhancedSyncService.isGameDay();

      if (!isGameDay) {
        console.log('\n[OFF-SEASON SYNC] Starting...');
        try {
          const result = await enhancedSyncService.performComprehensiveSync();
          this.recordJobRun('offSeasonSync', result);
          console.log(`[OFF-SEASON SYNC] Complete: ${result.totalChanges} changes`);
        } catch (error) {
          console.error('[OFF-SEASON SYNC] Error:', error);
          this.recordJobRun('offSeasonSync', { success: false, error: error.message });
        }
      }
    });

    // Job 4: Weekly Deep Sync (Sundays at 11 PM)
    // Comprehensive validation after weekend games
    this.addJob('weeklyDeepSync', config.weeklyDeepSync, async () => {
      console.log('\n[WEEKLY DEEP SYNC] Starting...');
      try {
        const result = await enhancedSyncService.performComprehensiveSync();
        this.recordJobRun('weeklyDeepSync', result);
        console.log(`[WEEKLY DEEP SYNC] Complete: ${result.totalChanges} changes`);
      } catch (error) {
        console.error('[WEEKLY DEEP SYNC] Error:', error);
        this.recordJobRun('weeklyDeepSync', { success: false, error: error.message });
      }
    });

    this.isRunning = true;
    console.log('=== Job Scheduler Initialized ===');
    this.printSchedule();

    // Run initial sync on startup if configured
    if (process.env.SYNC_ON_STARTUP === 'true') {
      console.log('\n[STARTUP SYNC] Running initial sync...');
      try {
        const result = await enhancedSyncService.performComprehensiveSync();
        console.log(`[STARTUP SYNC] Complete: ${result.totalChanges} changes`);
      } catch (error) {
        console.error('[STARTUP SYNC] Error:', error);
      }
    }
  }

  /**
   * Add a scheduled job
   */
  addJob(name, cronExpression, task) {
    if (this.jobs.has(name)) {
      console.log(`Job ${name} already exists, skipping...`);
      return;
    }

    const job = cron.schedule(cronExpression, task, {
      scheduled: true,
      timezone: "America/Chicago" // Central Time
    });

    this.jobs.set(name, {
      job,
      cronExpression,
      name,
      createdAt: new Date().toISOString(),
      lastRun: null,
      runCount: 0
    });

    console.log(`✓ Scheduled job: ${name} (${cronExpression})`);
  }

  /**
   * Record job run in history
   */
  recordJobRun(jobName, result) {
    const jobInfo = this.jobs.get(jobName);

    if (jobInfo) {
      jobInfo.lastRun = new Date().toISOString();
      jobInfo.runCount++;
    }

    // Keep last 50 job runs in history
    this.jobHistory.unshift({
      jobName,
      timestamp: new Date().toISOString(),
      result
    });

    if (this.jobHistory.length > 50) {
      this.jobHistory.pop();
    }
  }

  /**
   * Manually trigger a sync job
   */
  async triggerManualSync(type = 'comprehensive') {
    console.log(`\n[MANUAL SYNC] Triggering ${type} sync...`);

    try {
      let result;

      switch (type) {
        case 'schedule':
          result = await enhancedSyncService.syncSchedule();
          break;
        case 'scores':
          result = await enhancedSyncService.syncScores();
          break;
        case 'comprehensive':
        default:
          result = await enhancedSyncService.performComprehensiveSync();
          break;
      }

      this.recordJobRun('manualSync', result);
      console.log(`[MANUAL SYNC] Complete`);
      return result;

    } catch (error) {
      console.error('[MANUAL SYNC] Error:', error);
      const errorResult = { success: false, error: error.message };
      this.recordJobRun('manualSync', errorResult);
      return errorResult;
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const jobs = [];

    for (const [name, info] of this.jobs.entries()) {
      jobs.push({
        name: info.name,
        cronExpression: info.cronExpression,
        createdAt: info.createdAt,
        lastRun: info.lastRun,
        runCount: info.runCount,
        isRunning: this.isRunning
      });
    }

    return {
      isRunning: this.isRunning,
      jobs,
      recentHistory: this.jobHistory.slice(0, 10),
      totalJobsRun: this.jobHistory.length
    };
  }

  /**
   * Get recent job history
   */
  getHistory(limit = 20) {
    return this.jobHistory.slice(0, limit);
  }

  /**
   * Print current schedule
   */
  printSchedule() {
    console.log('\n=== Scheduled Jobs ===');
    for (const [name, info] of this.jobs.entries()) {
      console.log(`  • ${name}: ${info.cronExpression}`);
    }
    console.log('======================\n');
  }

  /**
   * Stop a specific job
   */
  stopJob(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo) {
      jobInfo.job.stop();
      console.log(`Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific job
   */
  startJob(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo) {
      jobInfo.job.start();
      console.log(`Started job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    console.log('Stopping all scheduled jobs...');
    for (const [name, info] of this.jobs.entries()) {
      info.job.stop();
    }
    this.isRunning = false;
    console.log('All jobs stopped');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down job scheduler...');
    this.stopAll();
    this.jobs.clear();
    console.log('Job scheduler shutdown complete');
  }
}

// Export singleton instance
module.exports = new JobScheduler();
