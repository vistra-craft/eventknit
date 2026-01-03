import { api } from './api';

export interface FeedbackData {
  eventId: string;
  userType: 'ATTENDEE' | 'ORGANIZER';
  npsScore: number;
  comment?: string;
  eventQuality?: number;
  platformUsability?: number;
  registrationProcess?: number;
  communicationQuality?: number;
  improvementAreas?: string[];
  wouldUseAgain?: boolean;
  wouldRecommend?: boolean;
}

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  userType: 'ATTENDEE' | 'ORGANIZER';
  npsScore: number;
  comment?: string;
  eventQuality?: number;
  platformUsability?: number;
  registrationProcess?: number;
  communicationQuality?: number;
  improvementAreas: string[];
  wouldUseAgain?: boolean;
  wouldRecommend?: boolean;
  emailSentAt?: string;
  submittedVia: 'EMAIL' | 'PLATFORM';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
    startDate?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface FeedbackAnalytics {
  totalResponses: number;
  npsScore: number;
  averageNps: number;
  distribution: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  categoryAverages: {
    eventQuality: number;
    platformUsability: number;
    registrationProcess: number;
    communicationQuality: number;
  };
  byUserType: Array<{
    userType: string;
    count: number;
    averageNps: number;
  }>;
  improvementAreas: Array<{
    area: string;
    count: number;
  }>;
  retention: {
    wouldUseAgain: number;
    wouldRecommend: number;
  };
}

export interface FeedbackFilters {
  page?: number;
  limit?: number;
  userType?: 'ATTENDEE' | 'ORGANIZER';
  eventId?: string;
  minNps?: number;
  maxNps?: number;
  startDate?: string;
  endDate?: string;
}

// User endpoints (authenticated)
export const submitFeedback = async (data: FeedbackData) => {
  return api.post('/feedback', data);
};

// Token-based endpoints (no auth required)
export const validateFeedbackToken = async (token: string) => {
  return api.get(`/feedback/token/${token}`);
};

export const submitFeedbackViaToken = async (token: string, data: Omit<FeedbackData, 'eventId' | 'userType'>) => {
  return api.post(`/feedback/token/${token}`, data);
};

// Admin endpoints
export const getAllFeedback = async (filters?: FeedbackFilters) => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.userType) params.append('userType', filters.userType);
  if (filters?.eventId) params.append('eventId', filters.eventId);
  if (filters?.minNps !== undefined) params.append('minNps', filters.minNps.toString());
  if (filters?.maxNps !== undefined) params.append('maxNps', filters.maxNps.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return api.get(`/admin/feedback${queryString ? `?${queryString}` : ''}`);
};

export const getFeedbackAnalytics = async (filters?: { startDate?: string; endDate?: string; eventId?: string }) => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.eventId) params.append('eventId', filters.eventId);

  const queryString = params.toString();
  return api.get(`/admin/feedback/analytics${queryString ? `?${queryString}` : ''}`);
};

export const getFeedbackById = async (id: string) => {
  return api.get(`/admin/feedback/${id}`);
};

export const getEventFeedback = async (eventId: string, filters?: { page?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  return api.get(`/admin/feedback/event/${eventId}${queryString ? `?${queryString}` : ''}`);
};

export const addAdminNotes = async (id: string, notes: string) => {
  return api.patch(`/admin/feedback/${id}/notes`, { notes });
};

export const triggerFeedbackEmails = async (eventId: string, options?: { includeOrganizer?: boolean; includeAttendees?: boolean }) => {
  return api.post(`/admin/feedback/trigger/${eventId}`, options || {});
};
