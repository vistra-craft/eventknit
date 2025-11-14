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

/**
 * User Status Management Types
 */
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type UserRole = 'SUPERADMIN' | 'ADMIN_STAFF' | 'ORGANIZER' | 'ATTENDEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  organizationName?: string | null;
  businessEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface Attendee extends User {
  registrations: EventRegistration[];
}

/**
 * Suspend User Response
 */
export interface SuspendUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Deactivate User Response
 */
export interface DeactivateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Activate User Response
 */
export interface ActivateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Get Attendees Response
 */
export interface GetAttendeesResponse {
  success: boolean;
  data: {
    attendees: Attendee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Get Users Response
 */
export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Create User Response
 */
export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Create User Data
 */
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  organizationName?: string;
  businessEmail?: string;
  status?: UserStatus;
}

/**
 * Suspend a user (punitive action - user cannot login)
 */
export const suspendUser = async (
  userId: string,
  reason?: string
): Promise<SuspendUserResponse> => {
  return apiPost<SuspendUserResponse>(`/admin/users/${userId}/suspend`, { reason });
};

/**
 * Deactivate a user (non-punitive action - user can login but cannot perform actions)
 */
export const deactivateUser = async (
  userId: string,
  reason?: string
): Promise<DeactivateUserResponse> => {
  return apiPost<DeactivateUserResponse>(`/admin/users/${userId}/deactivate`, { reason });
};

/**
 * Activate a user (reactivate suspended or deactivated user)
 */
export const activateUser = async (
  userId: string
): Promise<ActivateUserResponse> => {
  return apiPost<ActivateUserResponse>(`/admin/users/${userId}/activate`, {});
};

/**
 * Get attendees with event filtering and registration history
 */
export const getAttendees = async (filters?: {
  eventId?: string;
  search?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}): Promise<GetAttendeesResponse> => {
  const params = new URLSearchParams();
  if (filters?.eventId) params.append('eventId', filters.eventId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  return apiGet<GetAttendeesResponse>(`/admin/users/attendees${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get all users with filters
 */
export const getUsers = async (filters?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<GetUsersResponse> => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  return apiGet<GetUsersResponse>(`/admin/users${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<{ success: boolean; data: { user: User } }> => {
  return apiGet<{ success: boolean; data: { user: User } }>(`/admin/users/${userId}`);
};

/**
 * Create a new user (admin function)
 */
export const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
  return apiPost<CreateUserResponse>('/admin/users', userData);
};

/**
 * Update user
 */
export const updateUser = async (
  userId: string,
  userData: Partial<CreateUserData>
): Promise<{ success: boolean; message: string; data: { user: User } }> => {
  return apiPut<{ success: boolean; message: string; data: { user: User } }>(`/admin/users/${userId}`, userData);
};

