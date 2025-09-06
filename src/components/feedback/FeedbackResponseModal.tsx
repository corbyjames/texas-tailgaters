import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import feedbackService, { Feedback, FeedbackResponse } from '../../services/feedbackService';
import { useAuth } from '../../hooks/useAuth';

interface FeedbackResponseModalProps {
  feedback: Feedback | null;
  isOpen: boolean;
  onClose: () => void;
  onResponseSent?: () => void;
}

export function FeedbackResponseModal({ 
  feedback, 
  isOpen, 
  onClose,
  onResponseSent 
}: FeedbackResponseModalProps) {
  const { user } = useAuth();
  const [response, setResponse] = useState('');
  const [resolution, setResolution] = useState('');
  const [markAsResolved, setMarkAsResolved] = useState(false);
  const [sending, setSending] = useState(false);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    if (feedback && isOpen) {
      loadResponses();
    }
  }, [feedback, isOpen]);

  const loadResponses = async () => {
    if (!feedback?.id) return;
    
    setLoadingResponses(true);
    try {
      const feedbackResponses = await feedbackService.getFeedbackResponses(feedback.id);
      setResponses(feedbackResponses);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback?.id || !response.trim()) return;

    setSending(true);
    try {
      if (user?.role === 'admin' || user?.isAdmin) {
        // Admin response
        await feedbackService.addAdminResponse(
          feedback.id,
          response,
          user.id,
          user.name || user.email || 'Admin',
          markAsResolved ? resolution : undefined
        );
      } else {
        // User follow-up response
        await feedbackService.addUserResponse(
          feedback.id,
          response,
          user?.id || '',
          user?.name || user?.email || 'User'
        );
      }

      setResponse('');
      setResolution('');
      setMarkAsResolved(false);
      
      // Reload responses
      await loadResponses();
      
      if (onResponseSent) {
        onResponseSent();
      }

      // Close if resolved
      if (markAsResolved) {
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !feedback) return null;

  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  const isOwner = user?.id === feedback.userId;
  const canRespond = isAdmin || isOwner;

  const getStatusIcon = () => {
    switch (feedback.status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = () => {
    switch (feedback.status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
              <p className="text-sm text-gray-600 mt-1">{feedback.subject}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Original Feedback */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                  {feedback.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {getStatusIcon()}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 mb-2">{feedback.message}</p>
              <p className="text-sm text-gray-600">
                — {feedback.userName || 'Anonymous'}
              </p>
            </div>

            {/* Admin Response if exists */}
            {feedback.adminResponse && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-900">Admin Response</span>
                  <span className="text-xs text-blue-700">
                    {feedback.adminRespondedAt && new Date(feedback.adminRespondedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-blue-900">{feedback.adminResponse}</p>
                {feedback.resolution && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <span className="text-sm font-medium text-blue-900">Resolution: </span>
                    <span className="text-sm text-blue-800">{feedback.resolution}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Response Thread */}
          {responses.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversation Thread
              </h3>
              <div className="space-y-3">
                {responses.map((resp) => (
                  <div
                    key={resp.id}
                    className={`rounded-lg p-3 ${
                      resp.isAdminResponse 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {resp.respondedByName}
                        {resp.isAdminResponse && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(resp.respondedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800">{resp.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Form */}
          {canRespond && feedback.status !== 'closed' && (
            <form onSubmit={handleSubmit} className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {isAdmin ? 'Admin Response' : 'Your Response'}
              </h3>
              
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={isAdmin ? "Enter your response to the user..." : "Add a follow-up message..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={4}
                required
              />

              {isAdmin && (
                <>
                  <div className="mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={markAsResolved}
                        onChange={(e) => setMarkAsResolved(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Mark as resolved</span>
                    </label>
                  </div>

                  {markAsResolved && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Brief resolution summary (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={sending || !response.trim()}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Response'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </form>
          )}

          {/* Closed/Resolved Notice */}
          {(feedback.status === 'closed' || feedback.status === 'resolved') && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                This feedback has been {feedback.status}. No further responses are allowed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}