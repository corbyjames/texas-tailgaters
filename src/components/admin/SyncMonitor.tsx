import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';

interface JobInfo {
  name: string;
  cronExpression: string;
  createdAt: string;
  lastRun: string | null;
  runCount: number;
  isRunning: boolean;
}

interface JobHistoryItem {
  jobName: string;
  timestamp: string;
  result: {
    success?: boolean;
    totalChanges?: number;
    updated?: number;
    added?: number;
    errors?: string[];
  };
}

interface SchedulerStatus {
  isRunning: boolean;
  jobs: JobInfo[];
  recentHistory: JobHistoryItem[];
  totalJobsRun: number;
}

const SyncMonitor: React.FC = () => {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  // Fetch scheduler status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/scheduler/status`);
      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
        setError(null);
      } else {
        setError('Failed to fetch scheduler status');
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError('Backend service unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Fetch job history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/scheduler/history?limit=20`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Trigger manual sync
  const triggerSync = async (type: 'comprehensive' | 'schedule' | 'scores') => {
    setSyncing(true);
    setError(null);

    try {
      const endpoint = type === 'comprehensive' ? '/api/sync' : `/api/sync/${type}`;
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh status and history after sync
        await fetchStatus();
        await fetchHistory();
        setLastUpdate(new Date());
      } else {
        setError(data.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Error triggering sync:', err);
      setError('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStatus();
    fetchHistory();

    const interval = setInterval(() => {
      fetchStatus();
      fetchHistory();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJobDisplayName = (jobName: string) => {
    const names: Record<string, string> = {
      dailyScheduleSync: 'Daily Schedule Sync',
      gameDayScoreSync: 'Game Day Score Sync',
      offSeasonSync: 'Off-Season Sync',
      weeklyDeepSync: 'Weekly Deep Sync',
      manualSync: 'Manual Sync'
    };
    return names[jobName] || jobName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading scheduler status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sync Monitor</h2>
            <p className="text-sm text-gray-600 mt-1">
              Automated schedule and score synchronization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                status?.isRunning
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {status?.isRunning ? '● Active' : '● Stopped'}
            </div>
            <button
              onClick={() => {
                fetchStatus();
                fetchHistory();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Manual Sync Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Sync</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => triggerSync('comprehensive')}
            disabled={syncing}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              syncing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {syncing ? 'Syncing...' : 'Full Sync'}
          </button>
          <button
            onClick={() => triggerSync('schedule')}
            disabled={syncing}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              syncing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Schedule Only
          </button>
          <button
            onClick={() => triggerSync('scores')}
            disabled={syncing}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              syncing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Scores Only
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Manually trigger a sync operation. The scheduler will continue running on its schedule.
        </p>
      </div>

      {/* Scheduled Jobs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-orange-500" />
          Scheduled Jobs
        </h3>
        <div className="space-y-3">
          {status?.jobs.map((job) => (
            <div
              key={job.name}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getJobDisplayName(job.name)}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Schedule: <code className="bg-gray-100 px-2 py-0.5 rounded">{job.cronExpression}</code>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Last run: {formatDate(job.lastRun)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total runs: {job.runCount}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!status?.jobs || status.jobs.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No scheduled jobs configured
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={index}
              className="border-l-4 border-gray-200 pl-4 py-2 hover:bg-gray-50 transition-colors"
              style={{
                borderLeftColor: item.result.success !== false ? '#10b981' : '#ef4444'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.result.success !== false ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium text-gray-900">
                    {getJobDisplayName(item.jobName)}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatDate(item.timestamp)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600 ml-6">
                {item.result.totalChanges !== undefined && (
                  <span>
                    {item.result.totalChanges} total changes
                    {item.result.updated !== undefined && ` (${item.result.updated} updated`}
                    {item.result.added !== undefined && `, ${item.result.added} added)`}
                  </span>
                )}
                {item.result.errors && item.result.errors.length > 0 && (
                  <span className="text-red-600">
                    Errors: {item.result.errors.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncMonitor;
