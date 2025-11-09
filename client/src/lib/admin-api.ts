/**
 * Admin API Functions
 */

import { apiGet, apiPost, apiPut } from './api';

/**
 * Admin Dashboard Stats Response
 */
export interface AdminDashboardStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalEvents: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      activeStaff: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      organizers: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      platformRevenue: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      systemHealth: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
    };
    meta: {
      timeRange: string;
      periodStart: string;
      periodEnd: string;
    };
  };
}

/**
 * Admin Recent Events Response
 */
export interface AdminRecentEventsResponse {
  success: boolean;
  data: {
    events: Array<{
      id: string;
      title: string;
      organizer: string;
      date: string;
      attendees: number;
      status: string;
      revenue: string;
      category: string;
    }>;
  };
}

/**
 * Admin Recent Activity Response
 */
export interface AdminRecentActivityResponse {
  success: boolean;
  data: {
    activities: Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      icon: string;
      user: string;
      createdAt: string;
    }>;
  };
}

/**
 * Admin System Alerts Response
 */
export interface AdminSystemAlertsResponse {
  success: boolean;
  data: {
    alerts: Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      severity: string;
    }>;
  };
}

/**
 * Get admin dashboard stats
 */
export const getAdminDashboardStats = async (
  timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
): Promise<AdminDashboardStatsResponse> => {
  return apiGet<AdminDashboardStatsResponse>(`/admin/dashboard/stats?timeRange=${timeRange}`);
};

/**
 * Get recent events for admin dashboard
 */
export const getAdminRecentEvents = async (
  limit: number = 10
): Promise<AdminRecentEventsResponse> => {
  return apiGet<AdminRecentEventsResponse>(`/admin/dashboard/events?limit=${limit}`);
};

/**
 * Get recent activity for admin dashboard
 */
export const getAdminRecentActivity = async (
  limit: number = 10
): Promise<AdminRecentActivityResponse> => {
  return apiGet<AdminRecentActivityResponse>(`/admin/dashboard/activity?limit=${limit}`);
};

/**
 * Get system alerts for admin dashboard
 */
export const getAdminSystemAlerts = async (): Promise<AdminSystemAlertsResponse> => {
  return apiGet<AdminSystemAlertsResponse>('/admin/dashboard/alerts');
};

/**
 * Approve Event Response
 */
export interface ApproveEventResponse {
  success: boolean;
  message: string;
  data: {
    event: {
      id: string;
      title: string;
      status: string;
    };
  };
}

/**
 * Reject Event Response
 */
export interface RejectEventResponse {
  success: boolean;
  message: string;
  data: {
    event: {
      id: string;
      title: string;
      status: string;
    };
  };
}

/**
 * Approve an event
 */
export const approveEvent = async (eventId: string): Promise<ApproveEventResponse> => {
  return apiPost<ApproveEventResponse>(`/events/${eventId}/approve`, {});
};

/**
 * Reject an event
 */
export const rejectEvent = async (eventId: string, rejectionReason: string): Promise<RejectEventResponse> => {
  return apiPost<RejectEventResponse>(`/events/${eventId}/reject`, { rejectionReason });
};

/**
 * Update Organizer Data Access Response
 */
export interface UpdateOrganizerDataAccessResponse {
  success: boolean;
  message: string;
  data: {
    event: {
      id: string;
      organizerDataAccess: 'RESTRICTED' | 'STANDARD' | 'FULL';
    };
  };
}

/**
 * Update organizer data access level for an event
 */
export const updateOrganizerDataAccess = async (
  eventId: string,
  dataAccessLevel: 'RESTRICTED' | 'STANDARD' | 'FULL'
): Promise<UpdateOrganizerDataAccessResponse> => {
  return apiPut<UpdateOrganizerDataAccessResponse>(`/events/${eventId}/organizer-data-access`, { dataAccessLevel });
};

/**
 * Bulk Update Organizer Data Access Response
 */
export interface BulkUpdateOrganizerDataAccessResponse {
  success: boolean;
  message: string;
  data: {
    updatedCount: number;
    eventIds: string[];
  };
}

/**
 * Bulk update organizer data access level for multiple events
 */
export const bulkUpdateOrganizerDataAccess = async (
  eventIds: string[],
  dataAccessLevel: 'RESTRICTED' | 'STANDARD' | 'FULL'
): Promise<BulkUpdateOrganizerDataAccessResponse> => {
  return apiPut<BulkUpdateOrganizerDataAccessResponse>(`/events/bulk/organizer-data-access`, { 
    eventIds, 
    dataAccessLevel 
  });
};

