export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'bug' | 'feature' | 'general' | 'complaint';
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'closed' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  
  // Admin response fields
  adminResponse?: string;
  adminRespondedAt?: string;
  adminRespondedBy?: string;
  adminRespondedByName?: string;
  
  // Resolution details
  resolution?: string;
  resolutionDetails?: string;
  
  // User satisfaction
  userSatisfied?: boolean;
  userSatisfactionComment?: string;
  
  // Tags for categorization
  tags?: string[];
  
  // Related to specific features
  relatedFeature?: string;
  relatedGameId?: string;
  
  // Attachments or screenshots
  attachments?: string[];
}

export interface FeedbackResponse {
  feedbackId: string;
  message: string;
  respondedBy: string;
  respondedByName: string;
  respondedAt: string;
  isAdminResponse: boolean;
}

export interface FeedbackStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  resolved: number;
  averageResolutionTime?: number;
  satisfactionRate?: number;
}