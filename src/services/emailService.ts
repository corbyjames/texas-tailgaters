import emailjs from '@emailjs/browser';

interface GameInvitationData {
  recipientName: string;
  recipientEmail: string;
  gameName: string;
  gameDate: string;
  gameTime: string;
  opponent: string;
  location: string;
  theme?: string;
  setupTime?: string;
  specialNotes?: string;
  rsvpLink: string;
  senderName?: string;
}

interface PotluckReminderData {
  recipientName: string;
  recipientEmail: string;
  gameName: string;
  gameDate: string;
  assignedItem: string;
  category: string;
  quantity?: string;
  servingSize?: string;
  dietaryNotes?: string;
}

class EmailService {
  private serviceId: string;
  private invitationTemplateId: string;
  private reminderTemplateId: string;
  private publicKey: string;
  private initialized: boolean = false;

  constructor() {
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
    this.invitationTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
    this.reminderTemplateId = import.meta.env.VITE_EMAILJS_REMINDER_TEMPLATE_ID || '';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
    
    if (this.serviceId && this.publicKey) {
      emailjs.init(this.publicKey);
      this.initialized = true;
    }
  }

  async sendGameInvitation(data: GameInvitationData): Promise<{ success: boolean; message: string }> {
    if (!this.initialized) {
      return { success: false, message: 'Email service not configured' };
    }

    const templateParams = {
      to_email: data.recipientEmail,
      to_name: data.recipientName,
      from_name: data.senderName || 'Texas Tailgaters',
      game_name: data.gameName,
      game_date: data.gameDate,
      game_time: data.gameTime,
      opponent: data.opponent,
      location: data.location,
      theme: data.theme || 'No specific theme',
      setup_time: data.setupTime || 'TBD',
      special_notes: data.specialNotes || 'None',
      rsvp_link: data.rsvpLink,
      reply_to: 'texastailgaters@gmail.com'
    };

    try {
      const response = await emailjs.send(
        this.serviceId,
        this.invitationTemplateId,
        templateParams
      );
      
      if (response.status === 200) {
        return { success: true, message: 'Invitation sent successfully!' };
      } else {
        return { success: false, message: 'Failed to send invitation' };
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send invitation' 
      };
    }
  }

  async sendPotluckReminder(data: PotluckReminderData): Promise<{ success: boolean; message: string }> {
    if (!this.initialized) {
      return { success: false, message: 'Email service not configured' };
    }

    const templateParams = {
      to_email: data.recipientEmail,
      to_name: data.recipientName,
      game_name: data.gameName,
      game_date: data.gameDate,
      assigned_item: data.assignedItem,
      category: data.category,
      quantity: data.quantity || 'Not specified',
      serving_size: data.servingSize || 'Standard',
      dietary_notes: data.dietaryNotes || 'None',
      reply_to: 'texastailgaters@gmail.com'
    };

    try {
      const response = await emailjs.send(
        this.serviceId,
        this.reminderTemplateId,
        templateParams
      );
      
      if (response.status === 200) {
        return { success: true, message: 'Reminder sent successfully!' };
      } else {
        return { success: false, message: 'Failed to send reminder' };
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send reminder' 
      };
    }
  }

  async sendBulkInvitations(
    recipients: Array<{ name: string; email: string }>,
    gameData: Omit<GameInvitationData, 'recipientName' | 'recipientEmail'>
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const recipient of recipients) {
      const invitationData: GameInvitationData = {
        ...gameData,
        recipientName: recipient.name,
        recipientEmail: recipient.email
      };

      const result = await this.sendGameInvitation(invitationData);
      
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${recipient.email}: ${result.message}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}

export const emailService = new EmailService();
export type { GameInvitationData, PotluckReminderData };