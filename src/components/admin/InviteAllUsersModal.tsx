import React, { useState, useEffect } from 'react';
import { X, Mail, Users, Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { emailService } from '../../services/emailService';
import { Game } from '../../types/Game';
import { useGames } from '../../hooks/useGames';
import { createLocalDate } from '../../utils/dateUtils';
import { getDatabase, ref, get } from 'firebase/database';

interface InviteAllUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export function InviteAllUsersModal({ isOpen, onClose }: InviteAllUsersModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [emailSubject, setEmailSubject] = useState('Texas Tailgaters - Season Invitation');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sendResults, setSendResults] = useState<{ success: string[]; failed: string[] }>({ success: [], failed: [] });
  const [showResults, setShowResults] = useState(false);
  
  const { games } = useGames();
  const upcomingGames = games.filter(g => {
    const gameDate = createLocalDate(g.date);
    return gameDate >= new Date();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fetch all users from Firebase
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const db = getDatabase();
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.entries(usersData).map(([id, data]: [string, any]) => ({
          id,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          role: data.role || 'member'
        }));
        
        setUsers(usersList);
        // Select all users by default
        setSelectedUsers(new Set(usersList.map(u => u.id)));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  const handleSendInvites = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user to invite');
      return;
    }

    setLoading(true);
    setSendProgress({ current: 0, total: selectedUsers.size });
    setSendResults({ success: [], failed: [] });
    setShowResults(false);

    const selectedUsersList = users.filter(u => selectedUsers.has(u.id));
    const results = { success: [] as string[], failed: [] as string[] };

    // Prepare email content based on selection
    let emailContent = '';
    let gameInfo = null;

    if (selectedGame === 'all') {
      // Season invitation
      emailContent = `
        <h2>You're Invited to Texas Tailgaters ${new Date().getFullYear()} Season!</h2>
        <p>Join us for an amazing season of Texas Longhorns football and tailgating!</p>
        
        <h3>Upcoming Games:</h3>
        <ul>
          ${upcomingGames.slice(0, 5).map(game => `
            <li>
              <strong>${createLocalDate(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> - 
              ${game.isHome ? 'vs' : '@'} ${game.opponent}
              ${game.time ? ` at ${game.time}` : ''}
            </li>
          `).join('')}
        </ul>
        ${upcomingGames.length > 5 ? `<p>...and ${upcomingGames.length - 5} more games!</p>` : ''}
      `;
    } else {
      // Specific game invitation
      const game = games.find(g => g.id === selectedGame);
      if (game) {
        gameInfo = game;
        emailContent = `
          <h2>You're Invited: ${game.opponent} Game!</h2>
          <p>Join us for the tailgate!</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${game.isHome ? 'vs' : '@'} ${game.opponent}</h3>
            <p><strong>Date:</strong> ${createLocalDate(game.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${game.time || 'TBD'}</p>
            <p><strong>Location:</strong> ${game.location || (game.isHome ? 'Memorial Stadium' : 'Away')}</p>
            ${game.tvNetwork ? `<p><strong>TV:</strong> ${game.tvNetwork}</p>` : ''}
          </div>
        `;
      }
    }

    // Add custom message if provided
    if (customMessage) {
      emailContent += `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Message from the organizer:</strong></p>
          <p style="margin: 10px 0 0 0;">${customMessage}</p>
        </div>
      `;
    }

    // Add action button
    emailContent += `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://texastailgaters.com/games" 
           style="background: #bf5700; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Games & RSVP
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Visit <a href="https://texastailgaters.com">texastailgaters.com</a> to manage your potluck items and RSVP for games.
      </p>
    `;

    // Send emails to each selected user
    for (let i = 0; i < selectedUsersList.length; i++) {
      const user = selectedUsersList[i];
      setSendProgress({ current: i + 1, total: selectedUsersList.length });

      try {
        const result = await emailService.sendCustomEmail({
          to_email: user.email,
          to_name: user.name || user.email.split('@')[0],
          subject: emailSubject,
          html_content: emailContent,
          reply_to: 'texastailgaters@gmail.com'
        });
        
        if (result.success) {
          results.success.push(user.email);
          console.log(`✅ Successfully sent to ${user.email}`);
        } else {
          results.failed.push(user.email);
          console.error(`❌ Failed to send to ${user.email}:`, result.message);
        }
      } catch (error) {
        console.error(`❌ Exception sending to ${user.email}:`, error);
        results.failed.push(user.email);
      }

      // Add a small delay between emails to avoid rate limiting
      if (i < selectedUsersList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setSendResults(results);
    setShowResults(true);
    setLoading(false);
  };

  const handleClose = () => {
    setShowResults(false);
    setSendResults({ success: [], failed: [] });
    setSendProgress({ current: 0, total: 0 });
    setCustomMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col sm:m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2 sm:gap-3">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            <h2 className="text-lg sm:text-xl font-bold">Invite All Users</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!showResults ? (
            <>
              {/* Game Selection */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Invitation Type
                </label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading}
                >
                  <option value="all">Full Season Invitation</option>
                  {upcomingGames.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.opponent} - {createLocalDate(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Subject */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter email subject..."
                  disabled={loading}
                />
              </div>

              {/* Custom Message */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add a personal message to the invitation..."
                  disabled={loading}
                />
              </div>

              {/* User Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Recipients ({selectedUsers.size})
                  </label>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs sm:text-sm text-orange-600 hover:text-orange-700"
                    disabled={loading || loadingUsers}
                  >
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg max-h-36 sm:max-h-48 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading users...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {users.map(user => (
                        <label
                          key={user.id}
                          className="flex items-center p-2 sm:p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="mr-2 sm:mr-3 text-orange-600 focus:ring-orange-500"
                            disabled={loading}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{user.name}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                          {user.role === 'admin' && (
                            <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs rounded flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Send Progress */}
              {loading && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Loader className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Sending invitations... ({sendProgress.current}/{sendProgress.total})
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results View */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Invitations Sent!</h3>
                <p className="text-gray-600 mt-1">
                  Successfully sent {sendResults.success.length} invitation{sendResults.success.length !== 1 ? 's' : ''}
                </p>
              </div>

              {sendResults.success.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">
                    Successfully Sent ({sendResults.success.length})
                  </h4>
                  <div className="bg-green-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="text-sm text-green-600 space-y-1">
                      {sendResults.success.map((email, idx) => (
                        <div key={idx}>✓ {email}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sendResults.failed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">
                    Failed to Send ({sendResults.failed.length})
                  </h4>
                  <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="text-sm text-red-600 space-y-1">
                      {sendResults.failed.map((email, idx) => (
                        <div key={idx}>✗ {email}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 sm:p-6">
          {!showResults ? (
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvites}
                disabled={loading || selectedUsers.size === 0}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Sending...</span>
                    <span className="sm:hidden">Send</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Send Invitations</span>
                    <span className="sm:hidden">Send</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}