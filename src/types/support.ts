export interface SupportQuery {
  id: string;
  platform: SocialPlatform;
  senderName: string;
  senderHandle: string;
  senderId: string;
  message: string;
  attachments?: string[];
  status: QueryStatus;
  priority: QueryPriority;
  category: QueryCategory;
  assignedTo?: string;
  assignedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  responses: SupportResponse[];
  metadata: {
    originalMessageId?: string;
    threadId?: string;
    isReply?: boolean;
    parentQueryId?: string;
  };
}

export interface SupportResponse {
  id: string;
  queryId: string;
  responderId: string;
  responderName: string;
  message: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: string;
  platform: SocialPlatform;
}

export type SocialPlatform = 
  | 'whatsapp' 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'linkedin' 
  | 'email' 
  | 'website';

export type QueryStatus = 
  | 'new' 
  | 'in_progress' 
  | 'waiting_for_customer' 
  | 'resolved' 
  | 'closed';

export type QueryPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type QueryCategory = 
  | 'general_inquiry' 
  | 'technical_support' 
  | 'billing' 
  | 'event_management' 
  | 'account_issues' 
  | 'feature_request' 
  | 'complaint' 
  | 'partnership' 
  | 'other';

export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  assignedQueries: number;
  resolvedToday: number;
  averageResponseTime: number; // in minutes
  specialties: QueryCategory[];
}

export interface SupportMetrics {
  totalQueries: number;
  newQueries: number;
  inProgressQueries: number;
  resolvedToday: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  platformBreakdown: Record<SocialPlatform, number>;
  categoryBreakdown: Record<QueryCategory, number>;
  priorityBreakdown: Record<QueryPriority, number>;
}

export interface SupportSettings {
  autoAssignment: boolean;
  defaultPriority: QueryPriority;
  responseTimeTarget: number; // in minutes
  escalationRules: {
    highPriorityThreshold: number;
    urgentThreshold: number;
    autoEscalateAfter: number; // in hours
  };
  notificationSettings: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    browserNotifications: boolean;
  };
  workingHours: {
    timezone: string;
    startTime: string;
    endTime: string;
    workingDays: number[]; // 0-6, Sunday-Saturday
  };
}

