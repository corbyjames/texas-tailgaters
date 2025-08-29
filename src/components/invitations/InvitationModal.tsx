import React, { useState } from 'react';
import { X } from 'lucide-react';
import { emailService } from '../../services/emailService';
import type { Game } from '../../types/Game';

interface InvitationModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
}

export function InvitationModal({ game, isOpen, onClose }: InvitationModalProps) {
  const [recipients, setRecipients] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    // Parse recipients (comma-separated email addresses)
    const recipientList = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .map(email => ({
        name: email.split('@')[0], // Use email prefix as name if not provided
        email: email
      }));

    if (recipientList.length === 0) {
      setResult({ success: false, message: 'Please enter at least one email address' });
      setSending(false);
      return;
    }

    const gameData = {
      gameName: `${game.opponent} Game`,
      gameDate: new Date(game.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      gameTime: game.time || 'TBD',
      opponent: game.opponent,
      location: game.location || 'Memorial Stadium',
      theme: game.theme?.name,
      setupTime: game.setupTime,
      specialNotes: customMessage,
      rsvpLink: `${window.location.origin}/games/${game.id}/rsvp`
    };

    const results = await emailService.sendBulkInvitations(recipientList, gameData);
    
    setResult({
      success: results.failed === 0,
      message: results.failed === 0
        ? `Successfully sent ${results.sent} invitation(s)!`
        : `Sent ${results.sent} invitation(s), ${results.failed} failed. ${results.errors.join(', ')}`
    });
    
    setSending(false);
    
    if (results.failed === 0) {
      setTimeout(() => {
        onClose();
        setRecipients('');
        setCustomMessage('');
        setResult(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-ut-burntorange">
            Send Invitations - {game.opponent}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients (comma-separated emails)
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="john@example.com, jane@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ut-burntorange focus:border-ut-burntorange"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any special notes about this game..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ut-burntorange focus:border-ut-burntorange"
              rows={3}
            />
          </div>

          {result && (
            <div className={`p-3 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending || recipients.trim().length === 0}
              className="flex-1 bg-ut-burntorange text-white py-2 px-4 rounded-md hover:bg-ut-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Invitations'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}