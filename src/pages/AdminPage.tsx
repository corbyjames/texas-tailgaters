import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGames } from '../hooks/useGames';
import { Trash2, Users, Calendar, Shield, AlertTriangle, RefreshCw, Activity, MessageSquare, Mail, Send } from 'lucide-react';
import { FeedbackManager } from '../components/admin/FeedbackManager';
import { UserManager } from '../components/admin/UserManager';
import { InviteAllUsersModal } from '../components/admin/InviteAllUsersModal';

const AdminPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { games, clearMockData, refreshGames, syncFromUTAthletics } = useGames();
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');
  const [syncError, setSyncError] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'feedback'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Check if user is admin
  React.useEffect(() => {
    console.log('Admin page - Current user:', user, 'Loading:', loading);
    // Wait for auth to finish loading
    if (loading) {
      return;
    }
    
    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login');
      return;
    }
    // Check both role and isAdmin for compatibility
    const isUserAdmin = user.role === 'admin' || user.isAdmin || 
                        user.email === 'admin@texastailgaters.com' || 
                        user.email === 'corbyjames@gmail.com' ||
                        user.email === 'test@texastailgaters.com';
    console.log('Is user admin?', isUserAdmin);
    if (!isUserAdmin) {
      console.log('User is not admin, redirecting to home');
      navigate('/');
      return;
    }
  }, [user, navigate, loading]);

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleClearData = async () => {
    setClearing(true);
    setError('');
    setClearSuccess(false);

    try {
      // Clear all games and potluck items
      const result = await clearMockData();
      
      console.log('✅ Cleared mock data:', result);
      setClearSuccess(true);
      setShowConfirm(false);
      
      // Refresh the games list after clearing
      await refreshGames();
      
      // Show success message
      alert(`Successfully cleared ${result.gamesCleared} games and all potluck items`);
      
      // Reset success message after 3 seconds
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err) {
      console.error('Error clearing data:', err);
      setError('Failed to clear mock data. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleSyncSchedule = async () => {
    setSyncing(true);
    setSyncError('');
    setSyncSuccess('');

    try {
      const result = await syncFromUTAthletics();
      console.log('✅ Schedule sync result:', result);
      
      if (result.success) {
        setSyncSuccess(result.message);
      } else {
        setSyncError(result.message);
      }
      
      // Reset message after 5 seconds
      setTimeout(() => {
        setSyncSuccess('');
        setSyncError('');
      }, 5000);
    } catch (err) {
      console.error('Error syncing schedule:', err);
      setSyncError('Failed to sync schedule. Please try again.');
      
      // Reset error message after 5 seconds
      setTimeout(() => setSyncError(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const stats = {
    totalGames: games.length,
    plannedGames: games.filter(g => g.status === 'planned').length,
    unplannedGames: games.filter(g => g.status === 'unplanned').length,
    totalAttendance: games.reduce((sum, g) => sum + (g.expectedAttendance || 0), 0),
  };

  // Check admin status including email-based check
  const isUserAdmin = user && (user.role === 'admin' || user.isAdmin || user.email === 'admin@texastailgaters.com' || user.email === 'corbyjames@gmail.com' || user.email === 'test@texastailgaters.com');
  
  if (!user || !isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ut-text mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be an administrator to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-ut-orange" size={32} />
          <h1 className="text-3xl font-bold text-ut-text">Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">Manage system data and settings</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Overview</span>
                <span className="xs:hidden">View</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Users
              </div>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                Feedback
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-ut-orange" size={24} />
            <span className="text-2xl font-bold text-ut-text">{stats.totalGames}</span>
          </div>
          <p className="text-sm text-gray-600">Total Games</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-green-600" size={24} />
            <span className="text-2xl font-bold text-ut-text">{stats.plannedGames}</span>
          </div>
          <p className="text-sm text-gray-600">Planned Games</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-yellow-600" size={24} />
            <span className="text-2xl font-bold text-ut-text">{stats.unplannedGames}</span>
          </div>
          <p className="text-sm text-gray-600">Unplanned Games</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-ut-orange" size={24} />
            <span className="text-2xl font-bold text-ut-text">{stats.totalAttendance}</span>
          </div>
          <p className="text-sm text-gray-600">Expected Attendance</p>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-ut-text mb-4">Data Management</h2>
        
        {/* Sync Schedule */}
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <RefreshCw className="text-blue-600 mt-1" size={20} />
            <div className="flex-grow">
              <h3 className="font-semibold text-ut-text">Sync UT Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sync games from the official UT Athletics schedule. This will add any missing games and update game times.
              </p>
            </div>
          </div>

          {syncSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
              ✅ {syncSuccess}
            </div>
          )}

          {syncError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
              ❌ {syncError}
            </div>
          )}

          <button
            onClick={handleSyncSchedule}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Schedule'}
          </button>
        </div>
        
        {/* Clear Mock Data */}
        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="text-red-600 mt-1" size={20} />
            <div className="flex-grow">
              <h3 className="font-semibold text-ut-text">Clear Mock Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Remove all mock/demo data from the system including test potluck items and reset attendance numbers.
                This action cannot be undone.
              </p>
            </div>
          </div>

          {clearSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
              ✅ Mock data cleared successfully!
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
              ❌ {error}
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              disabled={clearing}
            >
              <Trash2 size={18} />
              Clear Mock Data
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-700">Are you sure? This will clear all mock data.</span>
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Yes, Clear Data'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={clearing}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Management Section */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-ut-text mb-4">User Management</h2>
        
        <div className="space-y-3">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-ut-text mb-2">Current User</h3>
            <p className="text-sm text-gray-600">
              Email: {user.email}<br />
              Role: <span className="px-2 py-1 bg-ut-orange text-white text-xs rounded-full uppercase">{user.role}</span>
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-ut-text mb-2">User Roles</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Admin:</strong> Full access to all features and data management</li>
              <li>• <strong>Member:</strong> Can view games, sign up for potluck, and RSVP</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-ut-text mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/games')}
            className="btn-secondary text-center"
          >
            View Games
          </button>
          <button
            onClick={() => navigate('/users')}
            className="btn-secondary text-center"
            disabled
          >
            Manage Users (Coming Soon)
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="btn-secondary text-center"
            disabled
          >
            System Settings (Coming Soon)
          </button>
        </div>
      </div>
      </>
      ) : activeTab === 'users' ? (
        /* Users Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Invite All Users
            </button>
          </div>
          <UserManager />
        </div>
      ) : (
        /* Feedback Tab */
        <FeedbackManager />
      )}
      
      {/* Invite All Users Modal */}
      <InviteAllUsersModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};

export default AdminPage;