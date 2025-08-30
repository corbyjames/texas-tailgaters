import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Calendar, UserCheck, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import rsvpService, { RSVP } from '../services/rsvpService';
import { useGames } from '../hooks/useGames';
import { isGameUpcoming } from '../utils/dateUtils';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { games } = useGames();
  const [userRSVPs, setUserRSVPs] = useState<RSVP[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    dietaryRestrictions: '',
    emergencyContact: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.name || user.email?.split('@')[0] || '',
        phone: '',
        dietaryRestrictions: '',
        emergencyContact: '',
        notes: ''
      });
      loadUserRSVPs();
    }
  }, [user]);

  const loadUserRSVPs = async () => {
    if (!user) return;
    try {
      const rsvps = await rsvpService.getUserRSVPs(user.id);
      setUserRSVPs(rsvps);
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user profile
      // TODO: Implement profile update functionality when backend is ready
      console.log('Profile update:', {
        displayName: formData.displayName,
        phoneNumber: formData.phone
      });
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const upcomingRSVPs = userRSVPs.filter(rsvp => {
    const game = games.find(g => g.id === rsvp.gameId);
    return game && isGameUpcoming(game.date) && rsvp.status === 'yes';
  });

  const getUserBadge = () => {
    if (user.isAdmin || user.role === 'admin') {
      return { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: Shield };
    }
    if (user.role === 'member') {
      return { label: 'Member', color: 'bg-green-100 text-green-800', icon: UserCheck };
    }
    return { label: 'Guest', color: 'bg-gray-100 text-gray-800', icon: User };
  };

  const badge = getUserBadge();

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || user.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                    <badge.icon className="w-4 h-4" />
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
            {!isMobile && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{upcomingRSVPs.length}</div>
              <div className="text-xs text-gray-600">Upcoming Games</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{userRSVPs.length}</div>
              <div className="text-xs text-gray-600">Total RSVPs</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Date().getFullYear()}
              </div>
              <div className="text-xs text-gray-600">Member Since</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {user.role === 'admin' || user.role === 'member' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-600">Verified</div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              Profile Information
            </h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              ) : (
                <p className="text-gray-900">{formData.displayName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                {user.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              ) : (
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {formData.phone || 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
              {editMode ? (
                <textarea
                  value={formData.dietaryRestrictions}
                  onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                  placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={2}
                />
              ) : (
                <p className="text-gray-900">{formData.dietaryRestrictions || 'None specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Name and phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              ) : (
                <p className="text-gray-900">{formData.emergencyContact || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming RSVPs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Your Upcoming Games
          </h2>
          
          {upcomingRSVPs.length > 0 ? (
            <div className="space-y-3">
              {upcomingRSVPs.map(rsvp => {
                const game = games.find(g => g.id === rsvp.gameId);
                if (!game) return null;
                
                return (
                  <div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {game.isHome ? 'vs' : '@'} {game.opponent}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(game.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {game.time && ` • ${game.time}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        Going
                      </span>
                      {rsvp.attendeeCount > 1 && (
                        <p className="text-xs text-gray-600 mt-1">
                          {rsvp.attendeeCount} attendees
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No upcoming games. RSVP to games to see them here!
            </p>
          )}
        </div>

        {/* Mobile Sign Out Button */}
        {isMobile && (
          <div className="mt-6 px-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}