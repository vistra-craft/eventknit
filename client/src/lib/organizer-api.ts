/**
 * Organizer API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { EventsListResponse, EventResponse, EventRegistrationsResponse, CreateEventData, UpdateEventData } from './event-api';

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
  };
}

/**
 * Get organizer dashboard stats
 */
export const getOrganizerDashboardStats = async (): Promise<OrganizerDashboardStatsResponse> => {
  return apiGet<OrganizerDashboardStatsResponse>('/organizer/dashboard/stats');
};

/**
 * Get organizer dashboard events
 */
export const getOrganizerDashboardEvents = async (limit?: number): Promise<OrganizerDashboardEventsResponse> => {
  const queryParams = limit ? `?limit=${limit}` : '';
  return apiGet<OrganizerDashboardEventsResponse>(`/organizer/dashboard/events${queryParams}`);
};

/**
 * Get all organizer events (with filters)
 */
export const getOrganizerEvents = async (filters?: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  upcoming?: boolean; // true for upcoming, false for past
}): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.offset) queryParams.append('offset', filters.offset.toString());
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
  offset?: number;
}): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('upcoming', 'true');
  
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.offset) queryParams.append('offset', filters.offset.toString());
  
  return apiGet<EventsListResponse>(`/organizer/events?${queryParams.toString()}`);
};

/**
 * Get past organizer events
 */
export const getOrganizerPastEvents = async (filters?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('upcoming', 'false');
  
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.offset) queryParams.append('offset', filters.offset.toString());
  
  return apiGet<EventsListResponse>(`/organizer/events?${queryParams.toString()}`);
};

/**
 * Get organizer event by ID
 */
export const getOrganizerEventById = async (eventId: string): Promise<EventResponse> => {
  return apiGet<EventResponse>(`/events/${eventId}`);
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

