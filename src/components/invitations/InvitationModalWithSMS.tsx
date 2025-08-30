import React, { useState } from 'react';
import { X, Mail, MessageSquare, Phone, Calendar, AlertCircle } from 'lucide-react';
import { emailService } from '../../services/emailService';
import { smsService } from '../../services/smsService';
import { useAuth } from '../../hooks/useAuth';
import type { Game } from '../../types/Game';

interface InvitationModalWithSMSProps {
  game?: Game;  // Optional - if not provided, it's a season invite
  games?: Game[];  // For season invites
  isOpen: boolean;
  onClose: () => void;
  inviteType?: 'single' | 'season';
}

type InviteMethod = 'email' | 'sms' | 'both';

export function InvitationModalWithSMS({ 
  game, 
  games, 
  isOpen, 
  onClose, 
  inviteType = 'single' 
}: InvitationModalWithSMSProps) {
  const { user } = useAuth();
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('sms');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isSeasonInvite = inviteType === 'season' || (!game && games);
  const displayGames = games || (game ? [game] : []);

  // Check if user has permission to send invites (member or admin)
  const canSendInvites = user && (
    user.isAdmin || 
    user.role === 'admin' || 
    user.role === 'member' ||
    user.email === 'admin@texastailgaters.com' ||
    user.email === 'corbyjames@gmail.com' ||
    user.email === 'test@texastailgaters.com'
  );

  if (!isOpen) return null;

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handlePhoneInput = (value: string) => {
    // Only allow numbers, commas, and basic formatting characters
    const cleaned = value.replace(/[^\d,\s()-]/g, '');
    setPhoneNumbers(cleaned);
  };

  const parsePhoneNumbers = (input: string): Array<{ phone: string; name?: string }> => {
    return input
      .split(',')
      .map(phone => phone.trim())
      .filter(phone => phone.length >= 10) // Basic validation
      .map(phone => ({ phone }));
  };

  const parseEmails = (input: string): Array<{ email: string; name: string }> => {
    return input
      .split(',')
      .map(email => email.trim())
      .filter(email => email.includes('@'))
      .map(email => ({
        email,
        name: email.split('@')[0]
      }));
  };

  const createSeasonMessage = () => {
    let message = `🏈 Texas Tailgaters 2025 Season!\n\n`;
    message += `You're invited to join us for the entire season!\n\n`;
    message += `📅 Schedule:\n`;
    
    displayGames.slice(0, 5).forEach(g => {
      const date = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      message += `• ${date} - ${g.isHome ? 'vs' : '@'} ${g.opponent}\n`;
    });
    
    if (displayGames.length > 5) {
      message += `...and ${displayGames.length - 5} more games!\n`;
    }
    
    message += `\n${customMessage ? customMessage + '\n\n' : ''}`;
    message += `View full schedule: ${window.location.origin}/games`;
    
    return message;
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    let gameData: any;

    if (isSeasonInvite) {
      // Season invite
      gameData = {
        gameName: 'Texas Tailgaters 2025 Season',
        gameDate: 'Full Season',
        gameTime: 'Various',
        opponent: 'Multiple Games',
        location: 'Various Locations',
        theme: 'Season Pass',
        setupTime: '',
        specialNotes: createSeasonMessage(),
        rsvpLink: `${window.location.origin}/games`
      };
    } else if (game) {
      // Single game invite
      gameData = {
        gameName: `${game.opponent} Game`,
        gameDate: new Date(game.date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        gameTime: game.time || 'TBD',
        opponent: game.opponent,
        location: game.location || 'Memorial Stadium',
        theme: game.theme?.name,
        setupTime: game.setupTime,
        specialNotes: customMessage,
        rsvpLink: `${window.location.origin}/games/${game.id}`
      };
    } else {
      setResult({ success: false, message: 'No game data available' });
      setSending(false);
      return;
    }

    let totalSent = 0;
    let totalFailed = 0;
    let errors: string[] = [];

    // Send SMS invitations
    if ((inviteMethod === 'sms' || inviteMethod === 'both') && phoneNumbers.trim()) {
      const phones = parsePhoneNumbers(phoneNumbers);
      if (phones.length > 0) {
        const smsResults = await smsService.sendBulkSMS(phones, gameData);
        totalSent += smsResults.sent;
        totalFailed += smsResults.failed;
        errors = [...errors, ...smsResults.errors];
      }
    }

    // Send Email invitations
    if ((inviteMethod === 'email' || inviteMethod === 'both') && emailRecipients.trim()) {
      const emails = parseEmails(emailRecipients);
      if (emails.length > 0) {
        const emailResults = await emailService.sendBulkInvitations(emails, gameData);
        totalSent += emailResults.sent;
        totalFailed += emailResults.failed;
        errors = [...errors, ...emailResults.errors];
      }
    }

    if (totalSent === 0 && totalFailed === 0) {
      setResult({ 
        success: false, 
        message: 'Please enter at least one phone number or email address' 
      });
    } else {
      setResult({
        success: totalFailed === 0,
        message: totalFailed === 0
          ? `Successfully sent ${totalSent} invitation(s)!`
          : `Sent ${totalSent} invitation(s), ${totalFailed} failed.`
      });
    }
    
    setSending(false);
    
    if (totalFailed === 0 && totalSent > 0) {
      setTimeout(() => {
        onClose();
        setEmailRecipients('');
        setPhoneNumbers('');
        setCustomMessage('');
        setResult(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-orange-600">
            {isSeasonInvite 
              ? 'Send Season Invitations' 
              : `Send Invitations - ${game?.opponent || 'Game'}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {!canSendInvites && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Limited Access</p>
              <p>Only members and admins can send invitations. Contact an admin to upgrade your account.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send via:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setInviteMethod('sms')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  inviteMethod === 'sms' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <MessageSquare size={18} />
                SMS
              </button>
              <button
                onClick={() => setInviteMethod('email')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  inviteMethod === 'email' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Mail size={18} />
                Email
              </button>
              <button
                onClick={() => setInviteMethod('both')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  inviteMethod === 'both' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {/* Phone Numbers Input */}
          {(inviteMethod === 'sms' || inviteMethod === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                Phone Numbers (comma-separated)
              </label>
              <textarea
                value={phoneNumbers}
                onChange={(e) => handlePhoneInput(e.target.value)}
                placeholder="(512) 555-1234, (737) 555-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter US phone numbers. International numbers should include country code.
              </p>
            </div>
          )}

          {/* Email Input */}
          {(inviteMethod === 'email' || inviteMethod === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                Email Addresses (comma-separated)
              </label>
              <textarea
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="john@example.com, jane@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                rows={3}
              />
            </div>
          )}

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add any special notes about this game..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              maxLength={160} // SMS character limit consideration
            />
            <p className="text-xs text-gray-500 mt-1">
              {customMessage.length}/160 characters
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              {isSeasonInvite ? (
                <>
                  <p>🏈 Texas Tailgaters 2025 Season!</p>
                  <p>You're invited to join us for the entire season!</p>
                  <p className="font-semibold mt-2">📅 Upcoming Games:</p>
                  {displayGames.slice(0, 3).map((g, idx) => (
                    <p key={idx} className="ml-2">
                      • {new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {g.isHome ? 'vs' : '@'} {g.opponent}
                    </p>
                  ))}
                  {displayGames.length > 3 && <p className="ml-2">...and {displayGames.length - 3} more games!</p>}
                  {customMessage && <p className="mt-2">📝 {customMessage}</p>}
                </>
              ) : game ? (
                <>
                  <p>🏈 Texas Tailgaters Invite!</p>
                  <p>You're invited to the {game.opponent} game!</p>
                  <p>📅 {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p>⏰ {game.time || 'TBD'}</p>
                  <p>📍 {game.location || 'Memorial Stadium'}</p>
                  {game.theme?.name && <p>🎨 Theme: {game.theme.name}</p>}
                  {customMessage && <p>📝 {customMessage}</p>}
                </>
              ) : null}
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-3 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={sending || (!phoneNumbers.trim() && !emailRecipients.trim())}
              className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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