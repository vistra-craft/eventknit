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
 * Check if organizer has dashboard access (has created an event)
 */
export interface DashboardAccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
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
  const response = await apiGet<EventResponse>(`/events/${eventId}`);
  
  // Transform backend event to frontend format (same as getEventById)
  if (response.success && response.data) {
    const event = response.data.event;
    const normalizedEvent = {
      ...event,
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
                ? JSON.parse(event.agenda).map((item: any) => ({
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
                ? JSON.parse(event.exhibitors).map((exhibitor: any) => ({
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
 * Get organizer staff
 */
export const getOrganizerStaff = async (): Promise<GetOrganizerStaffResponse> => {
  return apiGet<GetOrganizerStaffResponse>('/organizer/staff');
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
    startDate?: string;
    endDate?: string;
    status?: string;
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

