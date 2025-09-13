import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Shield, 
  UserCheck, 
  UserX, 
  Clock,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Key
} from 'lucide-react';
import userManagementService, { User } from '../../services/userManagementService';
import { useAuth } from '../../hooks/useAuth';

export const UserManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUsers();
    
    // Set up real-time listener
    const unsubscribe = userManagementService.onUsersChange((updatedUsers) => {
      setUsers(updatedUsers);
    });
    
    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setErrorMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const success = await userManagementService.approveUser(userId, currentUser?.email || '');
      if (success) {
        setSuccessMessage('User approved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to approve user');
      }
    } catch (error) {
      setErrorMessage('Error approving user');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    setActionLoading(userId);
    try {
      const success = await userManagementService.deactivateUser(userId, currentUser?.email || '');
      if (success) {
        setSuccessMessage('User deactivated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to deactivate user');
      }
    } catch (error) {
      setErrorMessage('Error deactivating user');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const success = await userManagementService.reactivateUser(userId);
      if (success) {
        setSuccessMessage('User reactivated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to reactivate user');
      }
    } catch (error) {
      setErrorMessage('Error reactivating user');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setActionLoading(email);
    try {
      const success = await userManagementService.sendPasswordReset(email);
      if (success) {
        setSuccessMessage(`Password reset email sent to ${email}`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage('Failed to send password reset email');
      }
    } catch (error) {
      setErrorMessage('Error sending password reset');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    if (!confirm(`Change user role to ${newRole}?`)) return;
    
    setActionLoading(userId);
    try {
      const success = await userManagementService.updateUserRole(userId, newRole);
      if (success) {
        setSuccessMessage(`User role updated to ${newRole}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to update user role');
      }
    } catch (error) {
      setErrorMessage('Error updating user role');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>;
      case 'pending_approval':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1">
          <Shield className="w-3 h-3" /> Admin
        </span>;
      case 'member':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Member</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{role}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <Users className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-lg sm:text-2xl font-bold">{users.length}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Users</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <UserCheck className="text-green-500 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-lg sm:text-2xl font-bold">
              {users.filter(u => u.status === 'active').length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Active</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <UserX className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-lg sm:text-2xl font-bold">
              {users.filter(u => u.status === 'inactive').length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Inactive</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <Clock className="text-yellow-500 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-lg sm:text-2xl font-bold">
              {users.filter(u => u.status === 'pending_approval').length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Pending</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <Shield className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-lg sm:text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Admins</p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
          ✅ {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
          ❌ {errorMessage}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending_approval">Pending</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            
            <button
              onClick={loadUsers}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
              <button
                onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                disabled={actionLoading === user.id}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                {actionLoading === user.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {getStatusBadge(user.status)}
              {getRoleBadge(user.role)}
            </div>
            
            <div className="text-xs text-gray-500">
              <div>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>
              <div>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</div>
            </div>
            
            {showActionMenu === user.id && (
              <div className="mt-3 border-t pt-3 space-y-2">
                {user.status === 'pending_approval' && (
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Approve Registration
                  </button>
                )}
                
                {user.status === 'active' && user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeactivateUser(user.id)}
                    className="w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4 text-red-600" />
                    Deactivate User
                  </button>
                )}
                
                {user.status === 'inactive' && (
                  <button
                    onClick={() => handleReactivateUser(user.id)}
                    className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-green-600" />
                    Reactivate User
                  </button>
                )}
                
                <button
                  onClick={() => handleSendPasswordReset(user.email)}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2"
                >
                  <Key className="w-4 h-4 text-blue-600" />
                  Send Password Reset
                </button>
                
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    className="w-full text-left px-3 py-2 text-sm bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-orange-600" />
                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Users Table - Desktop View */}
      <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        disabled={actionLoading === user.id}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        {actionLoading === user.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </button>
                      
                      {showActionMenu === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          {user.status === 'pending_approval' && (
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Approve Registration
                            </button>
                          )}
                          
                          {user.status === 'active' && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <UserX className="w-4 h-4 text-red-600" />
                              Deactivate User
                            </button>
                          )}
                          
                          {user.status === 'inactive' && (
                            <button
                              onClick={() => handleReactivateUser(user.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <UserCheck className="w-4 h-4 text-green-600" />
                              Reactivate User
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleSendPasswordReset(user.email)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Key className="w-4 h-4 text-blue-600" />
                            Send Password Reset
                          </button>
                          
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleToggleRole(user.id, user.role)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4 text-orange-600" />
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};