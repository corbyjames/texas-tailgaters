// SMS Service using Twilio (requires backend API endpoint)
// For security, Twilio credentials should never be exposed in frontend code

interface SMSInvitationData {
  recipientPhone: string;
  recipientName?: string;
  gameName: string;
  gameDate: string;
  gameTime: string;
  opponent: string;
  location: string;
  theme?: string;
  rsvpLink?: string;
}

interface SMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

class SMSService {
  private apiEndpoint: string;

  constructor() {
    // This should point to your backend API that handles Twilio
    this.apiEndpoint = import.meta.env.VITE_SMS_API_ENDPOINT || '/api/sms';
  }

  /**
   * Format phone number to E.164 format
   * Assumes US numbers if no country code provided
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's 10 digits, assume US number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it's 11 digits starting with 1, it's already a US number with country code
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it already has a country code (starts with +), return as is
    if (phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    // Default to adding US country code
    return `+1${cleaned}`;
  }

  /**
   * Create SMS message content
   */
  private createMessage(data: SMSInvitationData): string {
    let message = `🏈 Texas Tailgaters Invite!\n\n`;
    message += `You're invited to the ${data.opponent} game!\n`;
    message += `📅 ${data.gameDate}\n`;
    message += `⏰ ${data.gameTime}\n`;
    message += `📍 ${data.location}\n`;
    
    if (data.theme) {
      message += `🎨 Theme: ${data.theme}\n`;
    }
    
    if (data.rsvpLink) {
      message += `\nRSVP: ${data.rsvpLink}`;
    } else {
      message += `\nReply YES to confirm attendance`;
    }
    
    return message;
  }

  /**
   * Send a single SMS invitation
   */
  async sendSMSInvitation(data: SMSInvitationData): Promise<SMSResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(data.recipientPhone);
      const message = this.createMessage(data);

      // For now, we'll simulate the SMS sending
      // In production, this would call your backend API
      console.log('Sending SMS to:', formattedPhone);
      console.log('Message:', message);

      // Simulate API call
      const response = await this.mockSendSMS(formattedPhone, message);
      
      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  /**
   * Send bulk SMS invitations
   */
  async sendBulkSMS(
    recipients: Array<{ phone: string; name?: string }>,
    gameData: Omit<SMSInvitationData, 'recipientPhone' | 'recipientName'>
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const recipient of recipients) {
      const invitationData: SMSInvitationData = {
        ...gameData,
        recipientPhone: recipient.phone,
        recipientName: recipient.name
      };

      const result = await this.sendSMSInvitation(invitationData);
      
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${recipient.phone}: ${result.message}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Mock SMS sending for development
   * Replace this with actual API call to your backend
   */
  private async mockSendSMS(phone: string, message: string): Promise<SMSResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success for valid phone numbers
    if (phone.match(/^\+1\d{10}$/)) {
      return {
        success: true,
        message: 'SMS sent successfully (simulated)',
        messageId: `mock_${Date.now()}`
      };
    }

    return {
      success: false,
      message: 'Invalid phone number format'
    };
  }

  /**
   * Production implementation would call your backend
   * Example:
   */
  private async sendViaBackend(phone: string, message: string): Promise<SMSResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: message
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'SMS sent successfully',
          messageId: data.messageId
        };
      } else {
        return {
          success: false,
          message: data.error || 'Failed to send SMS'
        };
      }
    } catch (error) {
      throw error;
    }
  }
}

export const smsService = new SMSService();
export type { SMSInvitationData, SMSResponse };