/**
 * Admin API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

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
    };
    meta: {
      timeRange: string;
      periodStart: string;
      periodEnd: string;
    };
  };
}

export type AdminDashboardGrowthPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

export interface AdminDashboardGrowthPoint {
  label: string;
  value: number;
}

export interface AdminDashboardGrowthResponse {
  success: boolean;
  data: {
    period: AdminDashboardGrowthPeriod;
    organizers: AdminDashboardGrowthPoint[];
    events: AdminDashboardGrowthPoint[];
    revenue: AdminDashboardGrowthPoint[];
    attendees: AdminDashboardGrowthPoint[];
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
 * Get admin dashboard growth series (for charts)
 */
export const getAdminDashboardGrowth = async (
  period: AdminDashboardGrowthPeriod = 'monthly'
): Promise<AdminDashboardGrowthResponse> => {
  return apiGet<AdminDashboardGrowthResponse>(`/admin/dashboard/growth?period=${period}`);
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
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'PENDING_APPROVAL';
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
 * Approve a pending organizer (PENDING_APPROVAL → ACTIVE)
 */
export const approveOrganizer = async (
  userId: string
): Promise<ActivateUserResponse> => {
  return apiPost<ActivateUserResponse>(`/admin/users/${userId}/approve`, {});
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
 * User Stats Response
 */
export interface UserStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalStaff: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      totalOrganizers: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      totalAttendees: {
        value: string;
        change: string;
        changeType: 'positive' | 'negative';
      };
      activeUsers: {
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
 * Get user statistics
 */
export const getUsersStats = async (
  timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
): Promise<UserStatsResponse> => {
  return apiGet<UserStatsResponse>(`/admin/users/stats?timeRange=${timeRange}`);
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

/**
 * Recall Event Response
 */
export interface RecallEventResponse {
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
 * Recall event (admin function - pull down approved event)
 */
export const recallEvent = async (
  eventId: string,
  action: 'PENDING' | 'CANCELLED',
  reason?: string
): Promise<RecallEventResponse> => {
  return apiPost<RecallEventResponse>(`/admin/events/${eventId}/recall`, { action, reason });
};

/**
 * Role information from backend
 */
export interface RoleInfo {
  role: UserRole;
  hierarchy: number;
  displayName: string;
  description: string;
  canCreate: boolean;
  canModify: boolean;
  canDelete: boolean;
  creatableRoles: UserRole[];
  modifiableRoles: UserRole[];
}

/**
 * Get Roles Response
 */
export interface GetRolesResponse {
  success: boolean;
  data: {
    roles: RoleInfo[];
    currentUserRole: UserRole;
  };
}

/**
 * Get all roles with permissions information
 */
export const getRoles = async (): Promise<GetRolesResponse> => {
  return apiGet<GetRolesResponse>('/admin/roles');
};

/**
 * Event Staff Assignment Types
 */
export type EventStaffRole = 'SCANNER' | 'SUPPORT' | 'MANAGER' | 'COORDINATOR' | 'SUPERVISOR' | 'TICKET_SELLER';

export interface EventStaffAssignment {
  id: string;
  eventId: string;
  staffId: string;
  role: EventStaffRole;
  staffType: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
  assignedAt: string;
  assignedBy: string;
  notes?: string;
  isActive: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  facility?: string;
  staff: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber?: string;
  };
  event?: {
    id: string;
    title: string;
    startDate?: string;
  };
}

export interface AssignStaffToEventData {
  staffId: string;
  role: EventStaffRole;
  notes?: string;
  shiftStart?: string;
  shiftEnd?: string;
  facility?: string;
}

export interface UpdateStaffAssignmentData {
  role?: EventStaffRole;
  notes?: string;
  isActive?: boolean;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  facility?: string | null;
}

export interface GetEventStaffResponse {
  success: boolean;
  data: {
    assignments: EventStaffAssignment[];
  };
}

export interface GetStaffEventsResponse {
  success: boolean;
  data: {
    assignments: EventStaffAssignment[];
  };
}

/**
 * Assign admin staff to event
 */
export const assignAdminStaffToEvent = async (
  eventId: string,
  data: AssignStaffToEventData
): Promise<{ success: boolean; message: string; data: { assignment: EventStaffAssignment } }> => {
  return apiPost(`/admin/events/${eventId}/staff`, data);
};

/**
 * Get staff assigned to event
 */
export const getEventStaff = async (
  eventId: string,
  filters?: {
    role?: string;
    staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
    isActive?: boolean;
  }
): Promise<GetEventStaffResponse> => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.staffType) params.append('staffType', filters.staffType);
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  
  const queryString = params.toString();
  return apiGet<GetEventStaffResponse>(`/admin/events/${eventId}/staff${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get events assigned to staff member
 */
export const getAdminStaffEvents = async (
  staffId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<GetStaffEventsResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const queryString = params.toString();
  return apiGet<GetStaffEventsResponse>(`/admin/staff/${staffId}/events${queryString ? `?${queryString}` : ''}`);
};

/**
 * Update staff assignment
 */
export const updateStaffAssignment = async (
  eventId: string,
  staffId: string,
  updates: UpdateStaffAssignmentData
): Promise<{ success: boolean; message: string; data: { assignment: EventStaffAssignment } }> => {
  return apiPut(`/admin/events/${eventId}/staff/${staffId}`, updates);
};

/**
 * Remove staff from event
 */
export const removeStaffFromEvent = async (
  eventId: string,
  staffId: string
): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/admin/events/${eventId}/staff/${staffId}`);
};

/**
 * Bulk assign staff to event
 */
export const bulkAssignStaff = async (
  eventId: string,
  staffIds: string[],
  role: EventStaffRole,
  notes?: string
): Promise<{ success: boolean; message: string; data: { assignments: EventStaffAssignment[] } }> => {
  return apiPost(`/admin/events/${eventId}/staff/bulk`, { staffIds, role, notes });
};

/**
 * Staff Performance Types
 */
export type PerformancePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface StaffPerformanceMetrics {
  staffId: string;
  staffName: string;
  staffEmail: string;
  role: string;
  eventsAssigned: number;
  eventsCompleted: number;
  eventsActive: number;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageScansPerEvent: number;
  reEntryScans: number;
  totalShifts: number;
  completedShifts: number;
  attendanceRate: number;
  totalHoursWorked: number;
  averageHoursPerEvent: number;
  responseTime?: number;
  campaignEngagement?: number;
  lastScanAt?: string;
  lastEventAt?: string;
}

export interface TeamPerformanceSummary {
  totalStaff: number;
  activeStaff: number;
  totalEvents: number;
  totalScans: number;
  averageScansPerStaff: number;
  averageAttendanceRate: number;
  topPerformers: StaffPerformanceMetrics[];
}

export interface PerformanceTrend {
  date: string;
  scans: number;
  events: number;
}

/**
 * Get staff performance metrics
 */
export const getStaffPerformance = async (
  staffId: string,
  period: PerformancePeriod = 'all'
): Promise<{ success: boolean; data: StaffPerformanceMetrics }> => {
  return apiGet(`/admin/staff-performance/${staffId}?period=${period}`);
};

/**
 * Get team performance metrics
 */
export const getTeamPerformance = async (
  period: PerformancePeriod = 'all',
  limit?: number
): Promise<{ success: boolean; data: { performances: StaffPerformanceMetrics[]; count: number } }> => {
  const params = new URLSearchParams();
  params.append('period', period);
  if (limit) params.append('limit', limit.toString());
  return apiGet(`/admin/staff-performance/team?${params.toString()}`);
};

/**
 * Get team performance summary
 */
export const getTeamSummary = async (
  period: PerformancePeriod = 'all'
): Promise<{ success: boolean; data: TeamPerformanceSummary }> => {
  return apiGet(`/admin/staff-performance/team/summary?period=${period}`);
};

/**
 * Get performance trends for a staff member
 */
export const getPerformanceTrends = async (
  staffId: string,
  period: PerformancePeriod = 'month'
): Promise<{ success: boolean; data: PerformanceTrend[] }> => {
  return apiGet(`/admin/staff-performance/${staffId}/trends?period=${period}`);
};

// ========== Extended Profile Types ==========

export type StaffDepartment = 'OPERATIONS' | 'CUSTOMER_SERVICE' | 'TECHNICAL' | 'MANAGEMENT' | 'FINANCE' | 'MARKETING';

export interface StaffProfile {
  id: string;
  userId: string;
  employeeId?: string;
  department: StaffDepartment;
  location?: string;
  hireDate: string;
  salary?: number;
  hourlyRate?: number;
  permissions?: Record<string, boolean>;
  totalHours?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  website?: string;
  description?: string;
  businessLicense?: string;
  taxId?: string;
  bankAccountLast4?: string;
  location?: string;
  totalEvents: number;
  totalRevenue?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FullUserProfile extends User {
  staffProfile?: StaffProfile | null;
  organizerProfile?: OrganizerProfile | null;
  emergencyContact?: EmergencyContact | null;
}

// ========== Extended Profile API Functions ==========

/**
 * Get full user profile with all extended data
 */
export const getFullUserProfile = async (
  userId: string
): Promise<{ success: boolean; data: { profile: FullUserProfile } }> => {
  return apiGet(`/admin/users/${userId}/profile/full`);
};

/**
 * Get staff profile for a user
 */
export const getStaffProfile = async (
  userId: string
): Promise<{ success: boolean; data: { user: User; staffProfile: StaffProfile | null } }> => {
  return apiGet(`/admin/users/${userId}/staff-profile`);
};

/**
 * Update staff profile for a user
 */
export const updateStaffProfile = async (
  userId: string,
  data: Partial<Omit<StaffProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'user'>>
): Promise<{ success: boolean; message: string; data: { staffProfile: StaffProfile } }> => {
  return apiPut(`/admin/users/${userId}/staff-profile`, data);
};

/**
 * Get organizer profile for a user
 */
export const getOrganizerProfile = async (
  userId: string
): Promise<{ success: boolean; data: { user: User; organizerProfile: OrganizerProfile | null } }> => {
  return apiGet(`/admin/users/${userId}/organizer-profile`);
};

/**
 * Update organizer profile for a user
 */
export const updateOrganizerProfile = async (
  userId: string,
  data: Partial<Omit<OrganizerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'user'>>
): Promise<{ success: boolean; message: string; data: { organizerProfile: OrganizerProfile } }> => {
  return apiPut(`/admin/users/${userId}/organizer-profile`, data);
};

/**
 * Get emergency contact for a user
 */
export const getEmergencyContact = async (
  userId: string
): Promise<{ success: boolean; data: { emergencyContact: EmergencyContact | null } }> => {
  return apiGet(`/admin/users/${userId}/emergency-contact`);
};

/**
 * Update emergency contact for a user
 */
export const updateEmergencyContact = async (
  userId: string,
  data: Omit<EmergencyContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; message: string; data: { emergencyContact: EmergencyContact } }> => {
  return apiPut(`/admin/users/${userId}/emergency-contact`, data);
};

/**
 * Delete emergency contact for a user
 */
export const deleteEmergencyContact = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/admin/users/${userId}/emergency-contact`);
};

// ─── KYC Review & Approval ────────────────────────────────────────────

export interface KYCSubmissionSummary {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string | null;
  entityType: string | null;
  businessName: string | null;
  industry: string | null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string | null;
  approvedAt: string | null;
  verificationLevel: number;
  avatar: string | null;
  documentCount: number;
}

export interface KYCDocument {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string | null;
  documentUrl: string | null;
  documentCategory: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  isRequired: boolean;
  isConditional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KYCDirector {
  id: string;
  userId: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  documentType: string;
  documentNumber: string;
  kraPin: string | null;
  sharePercentage: number | null;
  isTopFive: boolean;
  position: string | null;
}

export interface KYCRequirementStatus {
  documentType: string;
  description: string;
  category: string;
  isRequired: boolean;
  minQuantity: number;
  uploadedCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  isComplete: boolean;
}

export interface KYCOrganizerDetails {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    organizationName: string | null;
    entityType: string | null;
    businessName: string | null;
    industry: string | null;
    country: string;
    registrationNumber: string | null;
    kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    submittedAt: string | null;
    approvedAt: string | null;
    verificationLevel: number;
    isIdentityVerified: boolean;
    avatar: string | null;
    createdAt: string;
  };
  documents: KYCDocument[];
  directors: KYCDirector[];
  requirementsStatus: KYCRequirementStatus[];
}

export interface KYCStats {
  totalPending: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalSubmissions: number;
}

export const getKYCStats = async (): Promise<{
  success: boolean;
  data: { stats: KYCStats };
}> => {
  return apiGet('/admin/kyc/stats');
};

export const getKYCSubmissions = async (filters?: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  entityType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  success: boolean;
  data: {
    submissions: KYCSubmissionSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  const qs = params.toString();
  return apiGet(`/admin/kyc/submissions${qs ? `?${qs}` : ''}`);
};

export const getOrganizerKYCDetails = async (userId: string): Promise<{
  success: boolean;
  data: KYCOrganizerDetails;
}> => {
  return apiGet(`/admin/kyc/users/${userId}`);
};

export const approveKYCDocument = async (documentId: string): Promise<{
  success: boolean;
  data: { document: KYCDocument };
}> => {
  return apiPost(`/admin/kyc/documents/${documentId}/approve`, {});
};

export const rejectKYCDocument = async (documentId: string, rejectionReason: string): Promise<{
  success: boolean;
  data: { document: KYCDocument };
}> => {
  return apiPost(`/admin/kyc/documents/${documentId}/reject`, { rejectionReason });
};

export const approveOrganizerKYC = async (userId: string): Promise<{
  success: boolean;
  data: { message: string };
}> => {
  return apiPost(`/admin/kyc/users/${userId}/approve`, {});
};

export const rejectOrganizerKYC = async (userId: string, reason: string): Promise<{
  success: boolean;
  data: { message: string };
}> => {
  return apiPost(`/admin/kyc/users/${userId}/reject`, { reason });
};

