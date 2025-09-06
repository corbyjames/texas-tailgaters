import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, X, Filter, ChevronDown, ChevronUp, MessageCircle, Send } from 'lucide-react';
import feedbackService, { Feedback } from '../../services/feedbackService';
import { useAuth } from '../../hooks/useAuth';
import { FeedbackResponseModal } from '../feedback/FeedbackResponseModal';

export function FeedbackManager() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<Feedback['status'] | 'all'>('all');
  const [filterType, setFilterType] = useState<Feedback['type'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Feedback['priority'] | 'all'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    loadFeedback();
    loadStats();

    // Listen for real-time updates
    const handleFeedbackUpdate = () => {
      loadFeedback();
      loadStats();
    };

    window.addEventListener('feedbackSubmitted', handleFeedbackUpdate);
    window.addEventListener('feedbackUpdated', handleFeedbackUpdate);
    window.addEventListener('feedbackResponseAdded', handleFeedbackUpdate);

    return () => {
      window.removeEventListener('feedbackSubmitted', handleFeedbackUpdate);
      window.removeEventListener('feedbackUpdated', handleFeedbackUpdate);
      window.removeEventListener('feedbackResponseAdded', handleFeedbackUpdate);
    };
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...feedbackList];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(f => f.type === filterType);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(f => f.priority === filterPriority);
    }

    setFilteredFeedback(filtered);
  }, [feedbackList, filterStatus, filterType, filterPriority]);

  const loadFeedback = async () => {
    try {
      const data = await feedbackService.getAllFeedback();
      setFeedbackList(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await feedbackService.getFeedbackStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const updateStatus = async (feedbackId: string, newStatus: Feedback['status']) => {
    try {
      await feedbackService.updateFeedbackStatus(feedbackId, newStatus);
      loadFeedback();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: Feedback['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Feedback['type']) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'improvement': return '💡';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: Feedback['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-orange-600" />
          Feedback Manager
        </h2>
        <div className="text-sm text-gray-600">
          {filteredFeedback.length} of {feedbackList.length} items
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.byStatus.new}</div>
            <div className="text-sm text-gray-600">New Items</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{stats.byStatus['in-progress']}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="improvement">Improvement</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No feedback items match your filters.</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpanded(item.id!)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <h3 className="font-semibold text-gray-900">{item.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{item.userEmail}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    {expandedItems.has(item.id!) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedItems.has(item.id!) && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{item.message}</p>
                  </div>

                  {item.deviceInfo && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Device Info</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Platform: {item.deviceInfo.platform}</p>
                        <p>Screen: {item.deviceInfo.screenSize}</p>
                        <p className="text-xs truncate">User Agent: {item.deviceInfo.userAgent}</p>
                      </div>
                    </div>
                  )}

                  {item.adminNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h4>
                      <p className="text-gray-600">{item.adminNotes}</p>
                    </div>
                  )}

                  {/* Admin Response if exists */}
                  {item.adminResponse && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Response</h4>
                      <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                        <p className="text-blue-900">{item.adminResponse}</p>
                        {item.adminRespondedAt && (
                          <p className="text-xs text-blue-700 mt-2">
                            Responded on {new Date(item.adminRespondedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resolution if exists */}
                  {item.resolution && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Resolution</h4>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-green-900">{item.resolution}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Status Update</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['new', 'reviewed', 'in-progress', 'resolved', 'closed'] as Feedback['status'][]).map(status => (
                          <button
                            key={status}
                            onClick={() => updateStatus(item.id!, status)}
                            disabled={item.status === status}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              item.status === status
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {status.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Respond Button */}
                    <button
                      onClick={() => {
                        setSelectedFeedback(item);
                        setShowResponseModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Respond
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      <FeedbackResponseModal
        feedback={selectedFeedback}
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedFeedback(null);
        }}
        onResponseSent={() => {
          loadFeedback();
          loadStats();
        }}
      />
    </div>
  );
}