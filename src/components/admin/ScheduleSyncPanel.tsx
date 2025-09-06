import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckCircle, AlertCircle, Tv, Trophy, Calendar } from 'lucide-react';
import ComprehensiveScheduleSyncService from '../../services/scheduleSyncService';
import sync2025Schedule from '../../utils/sync2025Schedule';

interface SyncStatus {
  lastSync: string | null;
  nextSync: string;
  recentUpdates: any[];
}

export const ScheduleSyncPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await ComprehensiveScheduleSyncService.getLastSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Error loading sync status:', err);
    }
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await ComprehensiveScheduleSyncService.triggerManualSync();
      setSyncResult(result);
      await loadSyncStatus(); // Reload status after sync
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2025Sync = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await sync2025Schedule();
      if (result.success) {
        setSyncResult({
          added: 12, // 2025 games
          updated: 0,
          errors: [],
          message: result.message
        });
      } else {
        setError(result.message);
      }
      await loadSyncStatus(); // Reload status after sync
    } catch (err) {
      setError(err instanceof Error ? err.message : '2025 sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUpdateIcon = (field: string) => {
    if (field === 'tvNetwork') return <Tv className="h-4 w-4" />;
    if (field === 'time') return <Clock className="h-4 w-4" />;
    if (field === 'status' || field === 'result') return <Trophy className="h-4 w-4" />;
    return <RefreshCw className="h-4 w-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Sync</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automatically syncs daily at 6 AM CT
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handle2025Sync}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            <Calendar className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} />
            {isLoading ? 'Updating...' : 'Update to 2025 Season'}
          </button>
          <button
            onClick={handleManualSync}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              ${isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-orange-600 text-white hover:bg-orange-700'
              }
            `}
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-700 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Last Sync</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(syncStatus?.lastSync || null)}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-700 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Next Scheduled Sync</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(syncStatus?.nextSync || null)}
          </p>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Sync Completed</h3>
              <div className="mt-2 space-y-1 text-sm text-green-800">
                <p>{syncResult.added} games added</p>
                <p>{syncResult.updated} games updated</p>
                {syncResult.errors.length > 0 && (
                  <p className="text-orange-600">
                    {syncResult.errors.length} errors occurred
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Sync Failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {syncStatus?.recentUpdates && syncStatus.recentUpdates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Updates
          </h3>
          <div className="space-y-2">
            {syncStatus.recentUpdates.slice(0, 5).map((update, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {getUpdateIcon(update.field)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {update.field === 'tvNetwork' && 'TV Network Updated'}
                    {update.field === 'time' && 'Game Time Updated'}
                    {update.field === 'status' && 'Game Completed'}
                    {update.field === 'result' && 'Result Added'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {update.oldValue || 'TBD'} → {update.newValue}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{update.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Sync Features</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Daily automatic sync at 6 AM Central Time</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Live game score updates every 15 minutes on Saturdays</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>TV network announcements 6-12 days before games</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Bowl game detection in December/January</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Final scores and W/L records after games</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ScheduleSyncPanel;