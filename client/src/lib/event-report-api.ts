import { apiGet, apiPost, apiPatch } from './api';

// Types
export type ReportCategory = 'FRAUD_SCAM' | 'INAPPROPRIATE' | 'SPAM' | 'SAFETY' | 'WRONG_DETAILS' | 'DUPLICATE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface EventReport {
  id: string;
  eventId: string;
  reportedBy: string;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  event: { id: string; slug?: string | null; title: string; organizerId: string };
  reporter: { id: string; firstName: string | null; lastName: string | null; email: string };
}

export interface ReportStats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  dismissed: number;
  byCategory: Record<string, number>;
}

export interface GetEventReportsResponse {
  success: boolean;
  data: {
    reports: EventReport[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export interface GetReportStatsResponse {
  success: boolean;
  data: ReportStats;
}

// User-facing
export const submitEventReport = async (
  eventId: string,
  data: { category: ReportCategory; description?: string },
): Promise<{ success: boolean; message: string; data: EventReport }> => {
  return apiPost(`/user-dashboard/events/${eventId}/reports`, data);
};

export const getEventReportStatus = async (
  eventId: string,
): Promise<{ success: boolean; data: { hasReported: boolean } }> => {
  return apiGet(`/user-dashboard/events/${eventId}/report-status`);
};

// Admin-facing
export const getEventReports = async (filters?: {
  status?: ReportStatus;
  category?: ReportCategory;
  page?: number;
  limit?: number;
}): Promise<GetEventReportsResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  const qs = params.toString();
  return apiGet<GetEventReportsResponse>(`/admin/event-reports${qs ? `?${qs}` : ''}`);
};

export const updateEventReport = async (
  id: string,
  data: { status: ReportStatus; reviewNotes?: string },
): Promise<{ success: boolean; message: string; data: EventReport }> => {
  return apiPatch(`/admin/event-reports/${id}`, data);
};

export const getEventReportStats = async (): Promise<GetReportStatsResponse> => {
  return apiGet<GetReportStatsResponse>('/admin/event-reports/stats');
};
