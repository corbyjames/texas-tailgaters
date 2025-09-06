import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, MapPin } from 'lucide-react';
import rsvpService, { RSVP } from '../../services/rsvpService';
import { useAuth } from '../../hooks/useAuth';
import { Game } from '../../types/Game';
import { createLocalDate } from '../../utils/dateUtils';

interface RSVPModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RSVPModal({ game, isOpen, onClose }: RSVPModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    status: 'yes' as RSVP['status'],
    attendeeCount: 1,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingRSVP, setExistingRSVP] = useState<RSVP | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (game && user && isOpen) {
      setSuccess(false); // Reset success state when opening
      loadExistingRSVP();
      loadStats();
    }
  }, [game, user, isOpen]);

  const loadExistingRSVP = async () => {
    if (!user || !game) return;
    
    try {
      const rsvp = await rsvpService.getUserRSVPForGame(user.id, game.id);
      if (rsvp) {
        setExistingRSVP(rsvp);
        setFormData({
          status: rsvp.status,
          attendeeCount: rsvp.attendeeCount,
          notes: rsvp.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading existing RSVP:', error);
    }
  };

  const loadStats = async () => {
    if (!game) return;
    
    try {
      const gameStats = await rsvpService.getGameRSVPStats(game.id);
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading RSVP stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !game) return;

    setSubmitting(true);

    try {
      await rsvpService.submitRSVP({
        gameId: game.id,
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || user.email?.split('@')[0] || 'Anonymous',
        status: formData.status,
        attendeeCount: formData.attendeeCount,
        notes: formData.notes
      });

      // Reload stats
      await loadStats();
      
      // Show success state
      setSuccess(true);
      
      // Close modal after brief delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!existingRSVP) return;
    
    setSubmitting(true);
    try {
      await rsvpService.cancelRSVP(existingRSVP.id!);
      setExistingRSVP(null);
      setFormData({
        status: 'yes',
        attendeeCount: 1,
        notes: ''
      });
      await loadStats();
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !game) return null;

  const statusOptions = [
    { value: 'yes', label: 'Yes, I\'ll be there!', color: 'text-green-600', bgColor: 'bg-green-50 border-green-500' },
    { value: 'maybe', label: 'Maybe', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-500' },
    { value: 'no', label: 'Can\'t make it', color: 'text-red-600', bgColor: 'bg-red-50 border-red-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {success ? (
          // Success Message
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">RSVP Submitted!</h3>
            <p className="text-gray-600">
              {formData.status === 'yes' ? 'See you at the game!' : 
               formData.status === 'maybe' ? 'Hope you can make it!' :
               'Maybe next time!'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  RSVP for Game
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {game.isHome ? 'vs' : '@'} {game.opponent}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

        {/* Game Details */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{createLocalDate(game.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            {game.time && <span>• {game.time}</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{game.location || 'TBD'}</span>
          </div>
          {stats && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{stats.totalAttendees} confirmed attendees</span>
            </div>
          )}
        </div>

        {/* RSVP Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Will you attend?
            </label>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: option.value as RSVP['status'] })}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                    formData.status === option.value
                      ? option.bgColor
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`font-medium ${
                    formData.status === option.value ? option.color : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Attendee Count (only for yes) */}
          {formData.status === 'yes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of attendees (including yourself)
              </label>
              <select
                value={formData.attendeeCount}
                onChange={(e) => setFormData({ ...formData, attendeeCount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requirements or comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
            />
          </div>

          {/* Current Stats */}
          {stats && stats.total > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Current RSVPs</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-green-600">{stats.yes}</div>
                  <div className="text-gray-600">Yes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-600">{stats.maybe}</div>
                  <div className="text-gray-600">Maybe</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">{stats.no}</div>
                  <div className="text-gray-600">No</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Saving...' : existingRSVP ? 'Update RSVP' : 'Submit RSVP'}
            </button>
            {existingRSVP && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel RSVP
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}