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

    // Include multiple field name variations to support different template configurations
    const templateParams = {
      // Primary email field - template uses {{email}}
      email: data.recipientEmail,
      // Fallback variations for compatibility
      to_email: data.recipientEmail,
      user_email: data.recipientEmail,
      
      // Name fields
      to_name: data.recipientName,
      user_name: data.recipientName,
      name: data.recipientName,
      recipient_name: data.recipientName,
      
      // Sender fields
      from_name: data.senderName || 'Texas Tailgaters',
      
      // Game details - include variations for template compatibility
      game_name: data.gameName,
      game_date: data.gameDate,
      date: data.gameDate,  // Alternative field name
      'Game Date': data.gameDate,  // Exact template field name with space
      game_time: data.gameTime,
      time: data.gameTime,  // Alternative field name
      'Time': data.gameTime,  // Exact template field name with capital T
      opponent: data.opponent,
      opposing_team: data.opponent,  // Alternative field name
      'Opposing Team': data.opponent,  // Exact template field name with space and capitals
      team: data.opponent,  // Alternative field name
      location: data.location,
      venue: data.location,  // Alternative field name
      'Location': data.location,  // Capital L version
      theme: data.theme || 'No specific theme',
      setup_time: data.setupTime || 'TBD',
      special_notes: data.specialNotes || 'None',
      notes: data.specialNotes || 'None',  // Alternative field name
      rsvp_link: data.rsvpLink,
      link: data.rsvpLink,  // Alternative field name
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
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to send invitation';
      
      if (error.status === 422) {
        errorMessage = 'Email template configuration error. The template expects different field names. Check EmailJS dashboard.';
        console.error('Template parameter issue. Sent params:', templateParams);
      } else if (error.status === 401) {
        errorMessage = 'EmailJS authentication failed. Check your public key.';
      } else if (error.status === 404) {
        errorMessage = 'EmailJS service or template not found. Check service ID and template ID.';
      } else if (error.text) {
        errorMessage = error.text;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }

  async sendPotluckReminder(data: PotluckReminderData): Promise<{ success: boolean; message: string }> {
    if (!this.initialized) {
      return { success: false, message: 'Email service not configured' };
    }

    // Include multiple field name variations to support different template configurations
    const templateParams = {
      // Primary email field - template uses {{email}}
      email: data.recipientEmail,
      // Fallback variations for compatibility
      to_email: data.recipientEmail,
      user_email: data.recipientEmail,
      
      // Name fields
      to_name: data.recipientName,
      user_name: data.recipientName,
      name: data.recipientName,
      recipient_name: data.recipientName,
      
      // Potluck details
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
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to send reminder';
      
      if (error.status === 422) {
        errorMessage = 'Email template configuration error. The template expects different field names. Check EmailJS dashboard.';
        console.error('Template parameter issue. Sent params:', templateParams);
      } else if (error.status === 401) {
        errorMessage = 'EmailJS authentication failed. Check your public key.';
      } else if (error.status === 404) {
        errorMessage = 'EmailJS service or template not found. Check service ID and template ID.';
      } else if (error.text) {
        errorMessage = error.text;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage
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

  async sendCustomEmail(data: {
    to_email: string;
    to_name: string;
    subject: string;
    html_content: string;
    reply_to?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.initialized) {
      return { success: false, message: 'Email service not configured' };
    }

    // Convert HTML content to work with the invitation template
    // The template expects game-related fields, so we'll adapt our content
    const templateParams = {
      // Email recipient fields - multiple variations for compatibility
      email: data.to_email,
      to_email: data.to_email,
      user_email: data.to_email,
      
      // Name fields
      to_name: data.to_name,
      user_name: data.to_name,
      name: data.to_name,
      recipient_name: data.to_name,
      
      // Sender fields
      from_name: 'Texas Tailgaters',
      
      // Adapt content to game invitation fields
      game_name: data.subject || 'Texas Tailgaters Update',
      game_date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      date: 'See details below',
      game_time: '',
      time: '',
      opponent: 'Season Games',
      team: 'Texas Longhorns',
      location: 'Various Locations',
      venue: 'See game details',
      theme: '',
      setup_time: '',
      
      // Use special_notes for our custom content
      special_notes: data.html_content.replace(/<[^>]*>/g, ' ').substring(0, 500), // Strip HTML and limit length
      notes: data.html_content.replace(/<[^>]*>/g, ' ').substring(0, 500),
      
      // Link to games page
      rsvp_link: 'https://texastailgaters.com/games',
      link: 'https://texastailgaters.com/games',
      
      reply_to: data.reply_to || 'texastailgaters@gmail.com'
    };

    console.log('Sending email to:', data.to_email);
    console.log('Template params:', templateParams);

    try {
      const response = await emailjs.send(
        this.serviceId,
        this.invitationTemplateId,
        templateParams
      );
      
      console.log('EmailJS response:', response);

      if (response.status === 200) {
        return { 
          success: true, 
          message: 'Email sent successfully' 
        };
      } else {
        return {
          success: false,
          message: `Email service returned status ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('Error sending custom email:', error);
      
      // Provide detailed error information
      let errorMessage = 'Failed to send email';
      
      if (error.status === 422) {
        errorMessage = 'Template configuration error. Check EmailJS template fields.';
        console.error('Template expects different fields. Error:', error.text);
      } else if (error.status === 401) {
        errorMessage = 'EmailJS authentication failed. Check API keys.';
      } else if (error.status === 404) {
        errorMessage = 'EmailJS template not found.';
      } else if (error.text) {
        errorMessage = error.text;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }
}

export const emailService = new EmailService();
export type { GameInvitationData, PotluckReminderData };