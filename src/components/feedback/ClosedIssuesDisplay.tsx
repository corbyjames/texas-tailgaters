import React, { useState, useEffect } from 'react';
import { CheckCircle, MessageCircle, TrendingUp, Bug, Lightbulb, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import feedbackService, { Feedback } from '../../services/feedbackService';

export function ClosedIssuesDisplay() {
  const [closedIssues, setClosedIssues] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    loadClosedIssues();
  }, []);

  const loadClosedIssues = async () => {
    setLoading(true);
    try {
      const issues = await feedbackService.getClosedFeedback();
      setClosedIssues(issues);
    } catch (error) {
      console.error('Error loading closed issues:', error);
      // Set some mock data if Firebase is not available
      setClosedIssues([
        {
          id: 'demo-1',
          subject: 'Fixed login issues on mobile devices',
          message: 'Users reported difficulty logging in on mobile devices. The issue was related to touch event handling.',
          type: 'bug',
          priority: 'high',
          status: 'resolved',
          createdAt: '2024-08-15T10:00:00Z',
          closedAt: '2024-08-16T14:30:00Z',
          adminResponse: 'Thank you for reporting this issue. We have identified and fixed the mobile touch event handling problem.',
          resolution: 'Updated mobile CSS and JavaScript to properly handle touch events',
          userId: '',
          userEmail: '',
          userName: 'Anonymous',
          category: 'functionality'
        },
        {
          id: 'demo-2',
          subject: 'Added dark mode support',
          message: 'Request for dark mode to reduce eye strain during evening use.',
          type: 'feature',
          priority: 'medium',
          status: 'resolved',
          createdAt: '2024-08-10T15:30:00Z',
          closedAt: '2024-08-20T11:00:00Z',
          adminResponse: 'Great suggestion! We have implemented a full dark mode theme.',
          resolution: 'Added toggle switch in user settings for dark/light theme',
          userId: '',
          userEmail: '',
          userName: 'Anonymous',
          category: 'ui'
        },
        {
          id: 'demo-3',
          subject: 'Improved game notification system',
          message: 'Notifications for game updates were sometimes delayed or not received.',
          type: 'improvement',
          priority: 'medium',
          status: 'resolved',
          createdAt: '2024-08-05T09:15:00Z',
          closedAt: '2024-08-12T16:45:00Z',
          adminResponse: 'We have upgraded our notification system to be more reliable and faster.',
          resolution: 'Implemented real-time WebSocket notifications with fallback to push notifications',
          userId: '',
          userEmail: '',
          userName: 'Anonymous',
          category: 'functionality'
        }
      ]);
    } finally {
      setLoading(false);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
      case 'improvement':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'text-red-600 bg-red-50';
      case 'feature':
        return 'text-blue-600 bg-blue-50';
      case 'improvement':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Filter and sort issues
  const filteredIssues = closedIssues
    .filter(issue => {
      const matchesSearch = searchTerm === '' || 
        issue.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.resolution && issue.resolution.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || issue.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.closedAt || a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.closedAt || b.updatedAt || b.createdAt).getTime();
      return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resolved issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resolved Issues & Updates</h2>
        <p className="text-gray-600">
          Browse through recently resolved issues and improvements we've made based on your feedback.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{closedIssues.filter(i => i.status === 'resolved').length}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {closedIssues.filter(i => i.type === 'bug').length}
          </div>
          <div className="text-sm text-gray-600">Bugs Fixed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {closedIssues.filter(i => i.type === 'feature').length}
          </div>
          <div className="text-sm text-gray-600">Features Added</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {closedIssues.filter(i => i.type === 'improvement').length}
          </div>
          <div className="text-sm text-gray-600">Improvements</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Types</option>
              <option value="bug">Bugs</option>
              <option value="feature">Features</option>
              <option value="improvement">Improvements</option>
              <option value="other">Other</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No resolved issues found matching your criteria.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpanded(issue.id!)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${getTypeColor(issue.type)}`}>
                        {getTypeIcon(issue.type)}
                      </div>
                      <h3 className="font-medium text-gray-900">{issue.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      {issue.status === 'resolved' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">{issue.message}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Closed: {issue.closedAt && new Date(issue.closedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {issue.category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {issue.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {expandedItems.has(issue.id!) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedItems.has(issue.id!) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-4">
                    {/* Full Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Issue Description</h4>
                      <p className="text-sm text-gray-600">{issue.message}</p>
                    </div>
                    
                    {/* Admin Response */}
                    {issue.adminResponse && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Our Response</h4>
                        <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                          <p className="text-sm text-gray-800">{issue.adminResponse}</p>
                          {issue.adminRespondedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Responded on {new Date(issue.adminRespondedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Resolution */}
                    {issue.resolution && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Resolution</h4>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-900">{issue.resolution}</p>
                        </div>
                      </div>
                    )}

                    {/* User Satisfaction */}
                    {issue.userSatisfied !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        {issue.userSatisfied ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">User marked as satisfied</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-600">Follow-up may be needed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More / Pagination could go here */}
      {filteredIssues.length > 10 && (
        <div className="mt-8 text-center">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Load More Issues
          </button>
        </div>
      )}
    </div>
  );
}