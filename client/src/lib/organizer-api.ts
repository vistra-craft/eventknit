/**
 * Organizer API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { EventsListResponse, EventResponse, EventRegistrationsResponse, CreateEventData, UpdateEventData } from './event-api';
import { transformEventData } from './event-utils';

/**
 * Organizer Dashboard Stats Response
 */
export interface OrganizerDashboardStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalEvents: number;
      totalSpeakers: number;
      totalExhibitors: number;
      totalAttendees: number;
      totalRevenue: number;
      performanceInsights?: {
        bestPerformingEvent: {
          id: string;
          title: string;
          conversionRate: number;
        } | null;
        revenueGrowth: {
          percentage: number;
          period: '30d' | '90d' | '1y';
        };
        averageAttendance: {
          percentage: number;
          totalEvents: number;
        };
      };
      upcomingDeadlines?: Array<{
        type: string;
        eventId: string;
        eventTitle: string;
        deadlineDate: string;
        daysRemaining: number;
      }>;
      healthScore?: {
        overall: number;
        components: {
          registrationRate: number;
          speakerConfirmation: number;
          sponsorEngagement: number;
        };
      };
    };
  };
}

/**
 * Organizer Dashboard Event
 */
export interface OrganizerDashboardEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: string;
  attendees: number;
  capacity: number;
  revenue: number;
  views: number;
  conversion: string;
  speakers: number;
  exhibitors: number;
  sponsors: number;
  image: string;
  description: string;
  category: string;
  organizer: string;
  price: string;
  rating: number;
  fullDescription: string;
  duration: string;
  ageRestriction: string;
}

/**
 * Organizer Dashboard Events Response
 */
export interface OrganizerDashboardEventsResponse {
  success: boolean;
  data: {
    events: OrganizerDashboardEvent[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}

/**
 * Dashboard access tier levels:
 * 0 = No events - redirect to event creation
 * 1 = Has PENDING event only - read-only dashboard
 * 2 = Has APPROVED event - full dashboard access
 * 3 = Has APPROVED event + KYC verified - advanced features
 */
export type DashboardAccessTier = 0 | 1 | 2 | 3;

export interface PendingEvent {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface ApprovedEvent {
  id: string;
  title: string;
  status: string;
}

/**
 * Check organizer's dashboard access tier
 */
export interface DashboardAccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
    tier: DashboardAccessTier;
    hasApprovedEvent: boolean;
    hasPendingEvent: boolean;
    pendingEvents: PendingEvent[];
    approvedEvents: ApprovedEvent[];
    verificationLevel: number;
    message: string;
  };
}

export const getDashboardAccess = async (): Promise<DashboardAccessResponse> => {
  return apiGet<DashboardAccessResponse>('/organizer/dashboard-access');
};

/**
 * Complete onboarding response
 */
export interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      onboardingCompleted: boolean;
    };
  };
}

/**
 * Complete onboarding for organizer
 */
export const completeOnboarding = async (eventPreferences?: {
  eventTypes?: string[];
  organizationType?: string;
  eventsPerYear?: string;
  isRecurringSeries?: boolean;
}): Promise<CompleteOnboardingResponse> => {
  return apiPost<CompleteOnboardingResponse>('/organizer/onboarding/complete', {
    eventPreferences,
  });
};

/**
 * Get organizer dashboard stats
 */
export const getOrganizerDashboardStats = async (): Promise<OrganizerDashboardStatsResponse> => {
  return apiGet<OrganizerDashboardStatsResponse>('/organizer/dashboard/stats');
};

/**
 * Get organizer dashboard events
 */
export const getOrganizerDashboardEvents = async (filters?: {
  page?: number;
  limit?: number;
}): Promise<OrganizerDashboardEventsResponse> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer/dashboard/events?${queryString}` : '/organizer/dashboard/events';
  return apiGet<OrganizerDashboardEventsResponse>(endpoint);
};

/**
 * Get all organizer events (with filters)
 */
export const getOrganizerEvents = async (filters?: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number; // Deprecated: use page instead
  page?: number;
  upcoming?: boolean; // true for upcoming, false for past
  dateFrom?: string; // ISO date string - filter events starting from this date
  dateTo?: string; // ISO date string - filter events starting before this date
}): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();

  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  // Support both page and offset (page takes precedence)
  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  } else if (filters?.offset !== undefined) {
    queryParams.append('offset', filters.offset.toString());
  }
  if (filters?.upcoming !== undefined) queryParams.append('upcoming', filters.upcoming.toString());
  // Date range filtering
  if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer/events?${queryString}` : '/organizer/events';

  return apiGet<EventsListResponse>(endpoint);
};

/**
 * Get upcoming organizer events
 */
export const getOrganizerUpcomingEvents = async (filters?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number; // Deprecated: use page instead
  page?: number;
}): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();

  queryParams.append('upcoming', 'true');

  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  // Support both page and offset (page takes precedence)
  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  } else if (filters?.offset !== undefined) {
    queryParams.append('offset', filters.offset.toString());
  }

  return apiGet<EventsListResponse>(`/organizer/events?${queryParams.toString()}`);
};

/**
 * Get past organizer events
 */
export const getOrganizerPastEvents = async (filters?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number; // Deprecated: use page instead
  page?: number;
}): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();

  queryParams.append('upcoming', 'false');

  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  // Support both page and offset (page takes precedence)
  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  } else if (filters?.offset !== undefined) {
    queryParams.append('offset', filters.offset.toString());
  }

  return apiGet<EventsListResponse>(`/organizer/events?${queryParams.toString()}`);
};

/**
 * Get organizer event by ID
 */
export const getOrganizerEventById = async (eventId: string): Promise<EventResponse> => {
  const response = await apiGet<EventResponse>(`/organizer/events/${eventId}`);

  // Transform backend event to frontend format (same as getEventById)
  if (response.success && response.data) {
    const event = response.data.event;
    const normalizedEvent = {
      ...event,
      timezone: event.timezone || undefined,
      agenda: event.agenda
        ? (Array.isArray(event.agenda)
          ? event.agenda.map(item => ({
            title: item.title || "",
            description: item.description || "",
            date: item.date || undefined,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            speakers: item.speakers || [],
          }))
          : (typeof event.agenda === 'string'
            ? JSON.parse(event.agenda).map((item: { title?: string; description?: string; date?: string; startTime?: string; endTime?: string; speakers?: string[] }) => ({
              title: item.title || "",
              description: item.description || "",
              date: item.date || undefined,
              startTime: item.startTime || "",
              endTime: item.endTime || "",
              speakers: item.speakers || [],
            }))
            : event.agenda))
        : event.agenda,
      exhibitors: event.exhibitors
        ? (Array.isArray(event.exhibitors)
          ? event.exhibitors.map(exhibitor => ({
            ...exhibitor,
            description: exhibitor.description || "",
            logo: exhibitor.logo || "",
            contactEmail: exhibitor.contactEmail || "",
            booth: exhibitor.booth || "",
          }))
          : (typeof event.exhibitors === 'string'
            ? JSON.parse(event.exhibitors).map((exhibitor: { name?: string; description?: string; logo?: string; contactEmail?: string; booth?: string }) => ({
              name: exhibitor.name || "",
              description: exhibitor.description || "",
              logo: exhibitor.logo || "",
              contactEmail: exhibitor.contactEmail || "",
              booth: exhibitor.booth || "",
            }))
            : event.exhibitors))
        : event.exhibitors,
      tags: event.tags
        ? (Array.isArray(event.tags)
          ? event.tags
          : (typeof event.tags === 'string'
            ? JSON.parse(event.tags)
            : event.tags))
        : event.tags,
    };
    response.data.event = transformEventData(normalizedEvent);
  }

  return response;
};

/**
 * Get event registrations (attendees)
 */
export const getEventRegistrations = async (eventId: string): Promise<EventRegistrationsResponse> => {
  return apiGet<EventRegistrationsResponse>(`/events/${eventId}/registrations`);
};

/**
 * Create event (organizer)
 */
export const createOrganizerEvent = async (data: CreateEventData): Promise<EventResponse> => {
  return apiPost<EventResponse>('/events', data);
};

/**
 * Update event (organizer)
 */
export const updateOrganizerEvent = async (eventId: string, data: UpdateEventData): Promise<EventResponse> => {
  return apiPut<EventResponse>(`/events/${eventId}`, data);
};

/**
 * Delete event (organizer)
 */
export const deleteOrganizerEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  return apiDelete<{ success: boolean; message: string }>(`/events/${eventId}`);
};

/**
 * Cancel event (organizer function)
 */
export interface CancelEventResponse {
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

export const cancelEvent = async (
  eventId: string,
  reason?: string
): Promise<CancelEventResponse> => {
  return apiPost<CancelEventResponse>(`/events/${eventId}/cancel`, { reason });
};

/**
 * Organizer Staff Types
 */
export interface OrganizerStaff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'ORGANIZER_STAFF' | 'ORGANIZER_TELLER';
  customRoleId?: string;
  customRole?: {
    id: string;
    name: string;
    description?: string;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrganizerStaffResponse {
  success: boolean;
  data: {
    staff: OrganizerStaff[];
  };
}

/**
 * Create staff member data
 */
export interface CreateOrganizerStaffData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'ORGANIZER_STAFF' | 'ORGANIZER_TELLER';
}

/**
 * Update staff member data
 */
export interface UpdateOrganizerStaffData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  customRoleId?: string | null; // Assign or remove custom role
}

/**
 * Get organizer staff
 */
export const getOrganizerStaff = async (): Promise<GetOrganizerStaffResponse> => {
  return apiGet<GetOrganizerStaffResponse>('/organizer/staff');
};

/**
 * Create organizer staff member
 */
export const createOrganizerStaff = async (
  data: CreateOrganizerStaffData
): Promise<{ success: boolean; message: string; data: { staff: OrganizerStaff } }> => {
  return apiPost('/organizer/staff', data);
};

/**
 * Update organizer staff member
 */
export const updateOrganizerStaff = async (
  staffId: string,
  data: UpdateOrganizerStaffData
): Promise<{ success: boolean; message: string; data: { staff: OrganizerStaff } }> => {
  return apiPut(`/organizer/staff/${staffId}`, data);
};

/**
 * Delete organizer staff member
 */
export const deleteOrganizerStaff = async (
  staffId: string
): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/organizer/staff/${staffId}`);
};

/**
 * Deactivate organizer staff member
 */
export const deactivateOrganizerStaff = async (
  staffId: string
): Promise<{ success: boolean; message: string; data: { staff: OrganizerStaff } }> => {
  return apiPost(`/organizer/staff/${staffId}/deactivate`, {});
};

/**
 * Event Staff Assignment Types (for organizers)
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
    description?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    venue?: string;
    status?: string;
    image?: string;
  };
}

export interface AssignOrganizerStaffToEventData {
  staffId: string;
  role: EventStaffRole;
  notes?: string;
  shiftStart?: string;
  shiftEnd?: string;
  facility?: string;
}

export interface UpdateOrganizerStaffAssignmentData {
  role?: EventStaffRole;
  notes?: string;
  isActive?: boolean;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  facility?: string | null;
}

export interface GetOrganizerEventStaffResponse {
  success: boolean;
  data: {
    assignments: EventStaffAssignment[];
  };
}

export interface GetOrganizerStaffEventsResponse {
  success: boolean;
  data: {
    assignments: EventStaffAssignment[];
  };
}

export interface GetOrganizerStaffAssignmentsResponse {
  success: boolean;
  data: {
    assignments: EventStaffAssignment[];
  };
}

/**
 * Assign organizer staff to event
 */
export const assignOrganizerStaffToEvent = async (
  eventId: string,
  data: AssignOrganizerStaffToEventData
): Promise<{ success: boolean; message: string; data: { assignment: EventStaffAssignment } }> => {
  return apiPost(`/organizer/events/${eventId}/staff`, data);
};

/**
 * Get organizer staff assigned to event
 */
export const getOrganizerEventStaff = async (
  eventId: string,
  filters?: {
    role?: string;
    isActive?: boolean;
  }
): Promise<GetOrganizerEventStaffResponse> => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

  const queryString = params.toString();
  return apiGet<GetOrganizerEventStaffResponse>(`/organizer/events/${eventId}/staff${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get events where organizer staff is assigned
 */
export const getOrganizerStaffEvents = async (
  staffId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<GetOrganizerStaffEventsResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return apiGet<GetOrganizerStaffEventsResponse>(`/organizer/staff/${staffId}/events${queryString ? `?${queryString}` : ''}`);
};

/**
 * Update organizer staff assignment
 */
export const updateOrganizerStaffAssignment = async (
  eventId: string,
  staffId: string,
  updates: UpdateOrganizerStaffAssignmentData
): Promise<{ success: boolean; message: string; data: { assignment: EventStaffAssignment } }> => {
  return apiPut(`/organizer/events/${eventId}/staff/${staffId}`, updates);
};

/**
 * Remove organizer staff from event
 */
export const removeOrganizerStaffFromEvent = async (
  eventId: string,
  staffId: string
): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/organizer/events/${eventId}/staff/${staffId}`);
};

/**
 * Get all staff assignments for organizer's events
 */
export const getOrganizerStaffAssignments = async (
  filters?: {
    eventId?: string;
    staffId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<GetOrganizerStaffAssignmentsResponse> => {
  const params = new URLSearchParams();
  if (filters?.eventId) params.append('eventId', filters.eventId);
  if (filters?.staffId) params.append('staffId', filters.staffId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return apiGet<GetOrganizerStaffAssignmentsResponse>(`/organizer/staff/assignments${queryString ? `?${queryString}` : ''}`);
};

/**
 * Staff Performance Types (Organizer)
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

export interface StaffUtilization {
  totalStaff: number;
  activeStaff: number;
  utilizationRate: number;
  averageEventsPerStaff: number;
  averageHoursPerStaff: number;
  underutilizedStaff: StaffPerformanceMetrics[];
  overutilizedStaff: StaffPerformanceMetrics[];
}

export interface EventCoverage {
  totalEvents: number;
  eventsWithStaff: number;
  eventsWithoutStaff: number;
  averageStaffPerEvent: number;
  eventsByCoverage: {
    eventId: string;
    eventTitle: string;
    staffCount: number;
    totalScans: number;
    coverageStatus: 'adequate' | 'understaffed' | 'overstaffed';
  }[];
}

export interface StaffAvailability {
  staffAvailability: {
    staffId: string;
    staffName: string;
    totalShifts: number;
    completedShifts: number;
    availabilityRate: number;
    averageShiftDuration: number;
    preferredDays: string[];
    preferredTimes: string[];
  }[];
  overallAvailability: {
    totalShifts: number;
    completedShifts: number;
    averageAvailabilityRate: number;
    peakDays: string[];
  };
}

/**
 * Get staff performance metrics (organizer)
 */
export const getOrganizerStaffPerformance = async (
  staffId: string,
  period: PerformancePeriod = 'all',
): Promise<{ success: boolean; data: StaffPerformanceMetrics }> => {
  return apiGet(`/organizer/staff-performance/${staffId}?period=${period}`);
};

/**
 * Get team performance metrics (organizer)
 */
export const getOrganizerTeamPerformance = async (
  period: PerformancePeriod = 'all',
  limit?: number,
): Promise<{ success: boolean; data: { performances: StaffPerformanceMetrics[]; count: number } }> => {
  const params = new URLSearchParams();
  params.append('period', period);
  if (limit) params.append('limit', limit.toString());
  return apiGet(`/organizer/staff-performance/team?${params.toString()}`);
};

/**
 * Get team performance summary (organizer)
 */
export const getOrganizerTeamSummary = async (
  period: PerformancePeriod = 'all',
): Promise<{ success: boolean; data: TeamPerformanceSummary }> => {
  return apiGet(`/organizer/staff-performance/team/summary?period=${period}`);
};

/**
 * Get performance trends for a staff member (organizer)
 */
export const getOrganizerPerformanceTrends = async (
  staffId: string,
  period: PerformancePeriod = 'month',
): Promise<{ success: boolean; data: PerformanceTrend[] }> => {
  return apiGet(`/organizer/staff-performance/${staffId}/trends?period=${period}`);
};

/**
 * Get organizer staff utilization metrics
 */
export const getOrganizerStaffUtilization = async (
  period: PerformancePeriod = 'month',
): Promise<{ success: boolean; data: StaffUtilization }> => {
  return apiGet(`/organizer/staff-performance/utilization?period=${period}`);
};

/**
 * Get event coverage analysis
 */
export const getEventCoverageAnalysis = async (
  period: PerformancePeriod = 'month',
): Promise<{ success: boolean; data: EventCoverage }> => {
  return apiGet(`/organizer/staff-performance/coverage?period=${period}`);
};

/**
 * Get staff availability tracking
 */
export const getStaffAvailability = async (
  period: PerformancePeriod = 'month',
): Promise<{ success: boolean; data: StaffAvailability }> => {
  return apiGet(`/organizer/staff-performance/availability?period=${period}`);
};

/**
 * Role & Permission Management Types
 */
export interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: 'events' | 'attendees' | 'tickets' | 'analytics' | 'financial' | 'team' | 'communication' | 'settings';
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
  createdAt: string;
}

export interface TeamRoleTemplate {
  id: string;
  organizerId: string;
  name: string;
  description?: string;
  permissions?: RolePermission[];
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    staffWithCustomRole?: number;
  };
}

export interface CreateRoleTemplateData {
  name: string;
  description?: string;
  permissionKeys?: string[];
  // Legacy permissions (backward compatibility)
  canEdit?: boolean;
  canManageAttendees?: boolean;
  canManageTickets?: boolean;
  canViewAnalytics?: boolean;
  canManageStaff?: boolean;
  canPublish?: boolean;
  canManageCollaborators?: boolean;
}

export interface UpdateRoleTemplateData {
  name?: string;
  description?: string;
  permissionKeys?: string[];
  isActive?: boolean;
}

export interface DuplicateRoleTemplateData {
  name?: string;
}

/**
 * Get all permissions
 */
export const getPermissions = async (category?: string): Promise<{ success: boolean; data: { permissions: Permission[] } }> => {
  const queryParams = new URLSearchParams();
  if (category) queryParams.append('category', category);
  const endpoint = queryParams.toString() ? `/organizer-dashboard/team/permissions?${queryParams.toString()}` : '/organizer-dashboard/team/permissions';
  return apiGet(endpoint);
};

/**
 * Get permissions grouped by category
 */
export const getPermissionsByCategory = async (): Promise<{ success: boolean; data: { permissions: Record<string, Permission[]> } }> => {
  return apiGet('/organizer-dashboard/team/permissions/by-category');
};

/**
 * Get all role templates
 */
export const getRoleTemplates = async (isActive?: boolean): Promise<{ success: boolean; data: { templates: TeamRoleTemplate[] } }> => {
  const queryParams = new URLSearchParams();
  if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
  const endpoint = queryParams.toString() ? `/organizer-dashboard/team/role-templates?${queryParams.toString()}` : '/organizer-dashboard/team/role-templates';
  return apiGet(endpoint);
};

/**
 * Get role template by ID
 */
export const getRoleTemplateById = async (id: string): Promise<{ success: boolean; data: { template: TeamRoleTemplate } }> => {
  return apiGet(`/organizer-dashboard/team/role-templates/${id}`);
};

/**
 * Create role template
 */
export const createRoleTemplate = async (data: CreateRoleTemplateData): Promise<{ success: boolean; data: { template: TeamRoleTemplate } }> => {
  return apiPost('/organizer-dashboard/team/role-templates', data);
};

/**
 * Update role template
 */
export const updateRoleTemplate = async (id: string, data: UpdateRoleTemplateData): Promise<{ success: boolean; data: { template: TeamRoleTemplate } }> => {
  return apiPut(`/organizer-dashboard/team/role-templates/${id}`, data);
};

/**
 * Delete role template
 */
export const deleteRoleTemplate = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/organizer-dashboard/team/role-templates/${id}`);
};

/**
 * Duplicate role template
 */
export const duplicateRoleTemplate = async (id: string, data?: DuplicateRoleTemplateData): Promise<{ success: boolean; data: { template: TeamRoleTemplate } }> => {
  return apiPost(`/organizer-dashboard/team/role-templates/${id}/duplicate`, data || {});
};

// ========== KYC / Entity Type Verification ==========

/**
 * Organizer Entity Types
 */
export enum OrganizerEntityType {
  INDIVIDUAL = 'INDIVIDUAL',
  SOLE_PROPRIETOR = 'SOLE_PROPRIETOR',
  PARTNERSHIP = 'PARTNERSHIP',
  LIMITED_LIABILITY_COMPANY = 'LIMITED_LIABILITY_COMPANY',
  LIMITED_LIABILITY_PARTNERSHIP = 'LIMITED_LIABILITY_PARTNERSHIP',
  EMPLOYMENT_AGENCY_LLC = 'EMPLOYMENT_AGENCY_LLC',
  FOREIGN_COMPANY_COMPLIANCE = 'FOREIGN_COMPANY_COMPLIANCE',
  PRIVATE_HOSPITAL_SOLE_PROPRIETOR = 'PRIVATE_HOSPITAL_SOLE_PROPRIETOR',
  PRIVATE_HOSPITAL_LLC = 'PRIVATE_HOSPITAL_LLC',
  PUBLIC_HOSPITAL = 'PUBLIC_HOSPITAL',
  PRIVATE_EDUCATION_SOLE_PROPRIETOR = 'PRIVATE_EDUCATION_SOLE_PROPRIETOR',
  PRIVATE_EDUCATION_LLC = 'PRIVATE_EDUCATION_LLC',
  INTERNATIONAL_EDUCATION_LLC = 'INTERNATIONAL_EDUCATION_LLC',
  PUBLIC_EDUCATION = 'PUBLIC_EDUCATION',
  COOPERATIVE_SOCIETY = 'COOPERATIVE_SOCIETY',
  INSURANCE_REINSURANCE = 'INSURANCE_REINSURANCE',
  NGO = 'NGO',
  EMBASSY_UN_WORLD_BANK = 'EMBASSY_UN_WORLD_BANK',
  DENOMINATIONAL_CHURCH = 'DENOMINATIONAL_CHURCH',
  PARTNERSHIP_PROFESSIONAL = 'PARTNERSHIP_PROFESSIONAL',
  TRUST = 'TRUST',
}

/**
 * KYC Document Types
 */
export enum KYCDocumentType {
  PP_NEW_CONTRACT = 'PP_NEW_CONTRACT',
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  ALIEN_ID = 'ALIEN_ID',
  MILITARY_ID = 'MILITARY_ID',
  KRA_PIN = 'KRA_PIN',
  CERTIFICATE_OF_REGISTRATION = 'CERTIFICATE_OF_REGISTRATION',
  CERTIFICATE_OF_INCORPORATION = 'CERTIFICATE_OF_INCORPORATION',
  COMPANY_KRA_PIN = 'COMPANY_KRA_PIN',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CANCELLED_CHEQUE = 'CANCELLED_CHEQUE',
  BANK_LETTER = 'BANK_LETTER',
  LETTER_AUTHORIZING_ENTRY = 'LETTER_AUTHORIZING_ENTRY',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  TAX_ID = 'TAX_ID',
  CR12 = 'CR12',
  CR13 = 'CR13',
  PARTNERSHIP_DEED = 'PARTNERSHIP_DEED',
  AFFIDAVIT = 'AFFIDAVIT',
  MINISTRY_OF_HEALTH_LICENSE = 'MINISTRY_OF_HEALTH_LICENSE',
  KMPDB_LICENSE = 'KMPDB_LICENSE',
  MINISTRY_OF_EDUCATION_LICENSE = 'MINISTRY_OF_EDUCATION_LICENSE',
  EPRA_LICENSE = 'EPRA_LICENSE',
  IRA_LICENSE = 'IRA_LICENSE',
  TRA_MEMBERSHIP = 'TRA_MEMBERSHIP',
  KATO_MEMBERSHIP = 'KATO_MEMBERSHIP',
  KATA_MEMBERSHIP = 'KATA_MEMBERSHIP',
  KCAA_REGISTRATION = 'KCAA_REGISTRATION',
  TOUR_OPERATOR_LICENSE = 'TOUR_OPERATOR_LICENSE',
  ORGANIZATION_CONSTITUTION = 'ORGANIZATION_CONSTITUTION',
  BOARD_ELECTION_MINUTES = 'BOARD_ELECTION_MINUTES',
  TRUST_DEED = 'TRUST_DEED',
  ACCREDITATION_LETTER = 'ACCREDITATION_LETTER',
  AGREEMENT_LETTER = 'AGREEMENT_LETTER',
  LETTER_OF_INTRODUCTION = 'LETTER_OF_INTRODUCTION',
  COUNTY_CONTRACT_FORM = 'COUNTY_CONTRACT_FORM',
  COMPANY_PROFILE = 'COMPANY_PROFILE',
  ONLINE_LINK = 'ONLINE_LINK',
  TRADE_NAME_CERTIFICATE = 'TRADE_NAME_CERTIFICATE',
  GRANT_PROBATE = 'GRANT_PROBATE',
  AUTHORIZED_SIGNATORY_LETTER = 'AUTHORIZED_SIGNATORY_LETTER',
  TILL_APPLICATION_FORM = 'TILL_APPLICATION_FORM',
  MPESA_AUTHORIZATION_FORM = 'MPESA_AUTHORIZATION_FORM',
  ANNUAL_RETURNS = 'ANNUAL_RETURNS',
  DIRECTORS_LIST_LETTERHEAD = 'DIRECTORS_LIST_LETTERHEAD',
}

/**
 * KYC Status
 */
export enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Document Requirement
 */
export interface DocumentRequirement {
  documentType: KYCDocumentType;
  category: string;
  minQuantity: number;
  maxQuantity?: number;
  validityPeriodDays?: number;
  isRequired: boolean;
  isConditional: boolean;
  description: string;
  helpText?: string;
  uploadedCount?: number;
  approvedCount?: number;
  pendingCount?: number;
  isComplete?: boolean;
  hasMinimum?: boolean;
}

/**
 * Entity Type Requirements
 */
export interface EntityTypeRequirements {
  entityType: OrganizerEntityType;
  displayName: string;
  category: string;
  requiresDirectors: boolean;
  requiresShareholders: boolean;
  minDirectors?: number;
  maxDirectorsToCollect?: number;
  documents: DocumentRequirement[];
}

/**
 * KYC Requirements Response
 */
export interface KYCRequirementsResponse {
  entityType: OrganizerEntityType | null;
  requirements: EntityTypeRequirements | null;
  documents: DocumentRequirement[];
  requiresDirectors: boolean;
  requiresShareholders: boolean;
  minDirectors?: number;
  maxDirectorsToCollect?: number;
}

/**
 * KYC Document
 */
export interface KYCDocument {
  id: string;
  userId: string;
  documentType: KYCDocumentType;
  documentNumber?: string | null;
  documentUrl?: string | null;
  documentCategory?: string | null;
  status: KYCStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  isRequired: boolean;
  isConditional: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * KYC Documents Response
 */
export interface KYCDocumentsResponse {
  documents: KYCDocument[];
  requirementsStatus: DocumentRequirement[];
  isComplete: boolean;
}

/**
 * Director/Shareholder
 */
export interface OrganizerDirector {
  id: string;
  userId: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  documentType: string;
  documentNumber: string;
  kraPin?: string | null;
  sharePercentage?: number | null;
  isTopFive: boolean;
  position?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Set Entity Type Data
 */
export interface SetEntityTypeData {
  entityType: OrganizerEntityType;
  industry?: string;
  businessName?: string;
  registrationNumber?: string;
}

/**
 * Create Document Data
 */
export interface CreateKYCDocumentData {
  documentType: KYCDocumentType;
  documentNumber?: string;
  documentUrl?: string;
  issueDate?: string;
  expiryDate?: string;
}

/**
 * Create Director Data
 */
export interface CreateDirectorData {
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  documentType: string;
  documentNumber: string;
  kraPin?: string;
  sharePercentage?: number;
  position?: string;
}

/**
 * Set organizer entity type
 */
export const setEntityType = async (data: SetEntityTypeData): Promise<{ success: boolean; data: { entityType: OrganizerEntityType; requiresReVerification: boolean } }> => {
  return apiPost('/organizer-dashboard/kyc/entity-type', data);
};

/**
 * Get KYC requirements for current user
 */
export const getKYCRequirements = async (): Promise<{ success: boolean; data: KYCRequirementsResponse }> => {
  return apiGet('/organizer-dashboard/kyc/requirements');
};

/**
 * Get all KYC documents with requirements status
 */
export const getKYCDocuments = async (): Promise<{ success: boolean; data: KYCDocumentsResponse }> => {
  return apiGet('/organizer-dashboard/kyc/documents');
};

/**
 * Create/upload a KYC document
 */
export const createKYCDocument = async (data: CreateKYCDocumentData): Promise<{ success: boolean; data: { document: KYCDocument } }> => {
  return apiPost('/organizer-dashboard/kyc/documents', data);
};

/**
 * Update a KYC document
 */
export const updateKYCDocument = async (documentId: string, data: Partial<CreateKYCDocumentData>): Promise<{ success: boolean; data: { document: KYCDocument } }> => {
  return apiPut(`/organizer-dashboard/kyc/documents/${documentId}`, data);
};

/**
 * Delete a KYC document
 */
export const deleteKYCDocument = async (documentId: string): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/organizer-dashboard/kyc/documents/${documentId}`);
};

/**
 * Submit KYC for review
 */
export const submitKYCForReview = async (): Promise<{ success: boolean; message: string; data: { message: string; documentsCount: number } }> => {
  return apiPost('/organizer-dashboard/kyc/submit', {});
};

/**
 * Get directors/shareholders
 */
export const getDirectors = async (): Promise<{ success: boolean; data: { directors: OrganizerDirector[] } }> => {
  return apiGet('/organizer-dashboard/kyc/directors');
};

/**
 * Create/add a director/shareholder
 */
export const createDirector = async (data: CreateDirectorData): Promise<{ success: boolean; data: { director: OrganizerDirector } }> => {
  return apiPost('/organizer-dashboard/kyc/directors', data);
};

/**
 * Delete a director/shareholder
 */
export const deleteDirector = async (directorId: string): Promise<{ success: boolean; message: string }> => {
  return apiDelete(`/organizer-dashboard/kyc/directors/${directorId}`);
};



// ========== Subscription Management ==========

/**
 * Subscription Tier
 */
export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

/**
 * Organizer Subscription
 */
export interface OrganizerSubscription {
  id: string;
  organizerId: string;
  tier: SubscriptionTier;
  startedAt: string;
  expiresAt?: string | null;
  isActive: boolean;
  canceledAt?: string | null;
  billingEmail?: string | null;
  nextBillingDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get organizer subscription
 */
export const getSubscription = async (): Promise<{ success: boolean; data: { subscription: OrganizerSubscription } }> => {
  return apiGet('/organizer-dashboard/subscription');
};

/**
 * Upgrade subscription tier data
 */
export interface UpgradeSubscriptionData {
  tier: SubscriptionTier;
  billingEmail?: string; // Required for PREMIUM tier
}

/**
 * Upgrade subscription tier
 */
export const upgradeSubscription = async (data: UpgradeSubscriptionData): Promise<{ success: boolean; data: { subscription: OrganizerSubscription } }> => {
  return apiPost('/organizer-dashboard/subscription/upgrade', data);
};

/**
 * Cancel Premium subscription
 */
export const cancelSubscription = async (): Promise<{ success: boolean; message: string; data: { subscription: OrganizerSubscription } }> => {
  return apiPost('/organizer-dashboard/subscription/cancel', {});
};

// ========== Consent Management ==========

/**
 * Consent Statistics
 */
export interface ConsentStatistics {
  totalRegistrations: number;
  totalConsents: number;
  operational: {
    count: number;
    percentage: number;
  };
  marketing: {
    count: number;
    percentage: number;
  };
  demographics: {
    count: number;
    percentage: number;
  };
  analytics: {
    count: number;
    percentage: number;
  };
}

/**
 * Get consent statistics for an event
 */
export const getEventConsentStats = async (eventId: string): Promise<{ success: boolean; data: ConsentStatistics }> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/consent-stats`);
};

// ========== Event Refunds ==========

export interface OrganizerRefund {
  id: string;
  refundNumber: string;
  refundAmount: number;
  currency: string;
  refundReason: string;
  refundType: 'full' | 'partial';
  status: string;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  transaction?: {
    id: string;
    transactionNumber: string;
    amount: number;
    paymentDate: string | null;
    attendeeName: string | null;
  };
  requester?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface OrganizerRefundSummary {
  totalRefunded: number;
  totalPlatformFeeRefunded: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  processingCount: number;
  fullRefunds: number;
  partialRefunds: number;
}

/**
 * Get refunds for an organizer's event
 */
export const getEventRefunds = async (
  eventId: string,
  filters?: { status?: string },
): Promise<{ success: boolean; data: OrganizerRefund[] }> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return apiGet(`/organizer/events/${eventId}/refunds${qs ? `?${qs}` : ''}`);
};

/**
 * Get refund summary for an organizer's event
 */
export const getEventRefundSummary = async (
  eventId: string,
): Promise<{ success: boolean; data: OrganizerRefundSummary }> => {
  return apiGet(`/organizer/events/${eventId}/refunds/summary`);
};

