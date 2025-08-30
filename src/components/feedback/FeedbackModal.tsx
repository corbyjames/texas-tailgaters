import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import feedbackService, { Feedback } from '../../services/feedbackService';
import { useAuth } from '../../hooks/useAuth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'improvement' as Feedback['type'],
    category: 'functionality' as Feedback['category'],
    priority: 'medium' as Feedback['priority'],
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setResult({ success: false, message: 'You must be logged in to submit feedback' });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      setResult({ success: false, message: 'Please fill in all required fields' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      await feedbackService.submitFeedback({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || user.email?.split('@')[0] || 'Anonymous',
        type: formData.type,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject,
        message: formData.message
      });

      setResult({ 
        success: true, 
        message: 'Thank you for your feedback! We\'ll review it soon.' 
      });

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          type: 'improvement',
          category: 'functionality',
          priority: 'medium',
          subject: '',
          message: ''
        });
        setResult(null);
        onClose();
      }, 2000);
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Failed to submit feedback. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: { value: Feedback['type']; label: string; icon: string }[] = [
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '✨' },
    { value: 'improvement', label: 'Improvement', icon: '💡' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const categoryOptions: { value: Feedback['category']; label: string }[] = [
    { value: 'ui', label: 'User Interface' },
    { value: 'functionality', label: 'Functionality' },
    { value: 'performance', label: 'Performance' },
    { value: 'content', label: 'Content' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions: { value: Feedback['priority']; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Send Feedback
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: option.value })}
                  className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                    formData.type === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Feedback['category'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {priorityOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: option.value })}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.priority === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={option.color}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your feedback"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please provide detailed feedback..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={5}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Be as specific as possible to help us understand and address your feedback.
            </p>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              result.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your feedback helps us improve Texas Tailgaters. We review all submissions.
          </p>
        </div>
      </div>
    </div>
  );
}