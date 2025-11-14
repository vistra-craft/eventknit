/**
 * Event API Functions
 */

import { apiPost, apiGet, apiPut, apiDelete, type ApiResponse } from './api';
import type { EventData } from '../types/event';
import { transformEventData, transformEventsData } from './event-utils';

// Re-export EventData for use in other modules
export type { EventData } from '../types/event';

/**
 * Event Status enum (matches backend)
 */
export enum EventStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Event Type enum (matches backend)
 */
export enum EventType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

/**
 * Event filters for querying events
 */
export interface EventFilters {
  status?: EventStatus;
  category?: string;
  isFree?: boolean;
  organizerId?: string;
  search?: string;
  limit?: number;
  offset?: number; // Deprecated: use page instead
  page?: number;
}

/**
 * Create Event data
 */
export interface CreateEventData {
  title: string;
  description: string;
  fullDescription?: string;
  category?: string;
  tags?: string[];
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  startTime?: string;
  endTime?: string;
  registrationDeadline?: string; // ISO date string
  venue?: string;
  location: string;
  address?: string;
  isOnline?: boolean;
  onlineLink?: string;
  coordinates?: { lat: number; lng: number };
  isFree: boolean;
  price?: number;
  ticketTypes?: Array<{
    name: string;
    price: number;
    quantity?: number;
    features?: string[];
  }>;
  capacity?: number;
  image?: string;
  images?: string[];
  type?: EventType;
  requirements?: string[];
  ageRestriction?: string;
  duration?: string;
  speakers?: Array<{ name: string; title: string; bio: string; image?: string }>;
  sponsors?: Array<{ name: string; level: string; logo: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  registrationFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
}

/**
 * Update Event data (partial)
 */
export type UpdateEventData = Partial<CreateEventData>;

/**
 * Register for Event data
 */
export interface RegisterForEventData {
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
}

/**
 * Event Response from API
 */
export interface EventResponse {
  success: boolean;
  message?: string;
  data: {
    event: EventData;
  };
}

/**
 * Events List Response from API
 */
export interface EventsListResponse {
  success: boolean;
  message?: string;
  data: {
    events: EventData[];
    total: number;
    limit?: number;
    page?: number;
    totalPages?: number;
    offset?: number; // Deprecated: use page instead
  };
}

/**
 * Register for Event Response
 */
export interface RegisterEventResponse {
  success: boolean;
  message: string;
  data: {
    registration: {
      id: string;
      eventId: string;
      userId: string;
      status: string;
      ticketType?: string;
      quantity?: number;
      createdAt: string;
    };
  };
}

/**
 * Event Registrations Response
 */
export interface EventRegistrationsResponse {
  success: boolean;
  data: {
    registrations: Array<{
      id: string;
      eventId: string;
      userId?: string;
      attendeeId?: string;
      status: string;
      ticketType?: string | null;
      quantity?: number;
      totalAmount?: number | string;
      paymentStatus?: string | null;
      paymentMethod?: string | null;
      paymentTransactionId?: string | null;
      createdAt: string;
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string | null;
      };
      attendee?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string | null;
      };
    }>;
  };
}

/**
 * Get all events with optional filters
 */
export const getEvents = async (filters?: EventFilters): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.isFree !== undefined) queryParams.append('isFree', filters.isFree.toString());
  if (filters?.organizerId) queryParams.append('organizerId', filters.organizerId);
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  // Support both page and offset (page takes precedence)
  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  } else if (filters?.offset !== undefined) {
    queryParams.append('offset', filters.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/events?${queryString}` : '/events';
  
  const response = await apiGet<EventsListResponse>(endpoint);
  
  // Transform backend events to frontend format
  if (response.success && response.data) {
    response.data.events = transformEventsData(response.data.events);
  }
  
  return response;
};

/**
 * Get event by ID
 */
export const getEventById = async (id: string): Promise<EventResponse> => {
  const response = await apiGet<EventResponse>(`/events/${id}`);
  
  // Transform backend event to frontend format
  if (response.success && response.data) {
    response.data.event = transformEventData(response.data.event);
  }
  
  return response;
};

/**
 * Create a new event
 */
export const createEvent = async (data: CreateEventData): Promise<EventResponse> => {
  const response = await apiPost<EventResponse>('/events', data);
  
  // Transform backend event to frontend format
  if (response.success && response.data) {
    response.data.event = transformEventData(response.data.event);
  }
  
  return response;
};

/**
 * Update an event
 */
export const updateEvent = async (id: string, data: UpdateEventData): Promise<EventResponse> => {
  const response = await apiPut<EventResponse>(`/events/${id}`, data);
  
  // Transform backend event to frontend format
  if (response.success && response.data) {
    response.data.event = transformEventData(response.data.event);
  }
  
  return response;
};

/**
 * Delete an event
 */
export const deleteEvent = async (id: string): Promise<ApiResponse<void>> => {
  return apiDelete<ApiResponse<void>>(`/events/${id}`);
};

/**
 * Register for an event
 */
export const registerForEvent = async (
  eventId: string,
  data: RegisterForEventData
): Promise<RegisterEventResponse> => {
  return apiPost<RegisterEventResponse>(`/events/${eventId}/register`, data);
};

/**
 * Register for an event as guest (no authentication required)
 */
export interface RegisterAsGuestData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
}

export interface RegisterAsGuestResponse {
  success: boolean;
  message: string;
  data: {
    registration: {
      id: string;
      eventId: string;
      attendeeId: string;
      status: string;
      ticketType?: string | null;
      quantity?: number;
      totalAmount?: number | string;
      paymentStatus?: string | null;
      createdAt: string;
    };
    user: {
      id: string;
      email: string;
      isNewUser: boolean;
      requiresPasswordSetup: boolean;
    };
    // No magic link token - user receives ticket email and account invitation email separately
  };
}

export const registerAsGuest = async (
  eventId: string,
  data: RegisterAsGuestData
): Promise<RegisterAsGuestResponse> => {
  return apiPost<RegisterAsGuestResponse>(`/events/${eventId}/register-guest`, data);
};

/**
 * Get event registrations (organizer function)
 */
export const getEventRegistrations = async (
  eventId: string
): Promise<EventRegistrationsResponse> => {
  return apiGet<EventRegistrationsResponse>(`/events/${eventId}/registrations`);
};

/**
 * Cancel registration
 */
export const cancelRegistration = async (registrationId: string): Promise<ApiResponse<void>> => {
  return apiDelete<ApiResponse<void>>(`/events/registrations/${registrationId}`);
};

/**
 * Approve event (admin function)
 */
export const approveEvent = async (eventId: string): Promise<EventResponse> => {
  return apiPost<EventResponse>(`/events/${eventId}/approve`);
};

/**
 * Reject event (admin function)
 */
export const rejectEvent = async (
  eventId: string,
  rejectionReason: string
): Promise<EventResponse> => {
  return apiPost<EventResponse>(`/events/${eventId}/reject`, { rejectionReason });
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
 * Get user's registered events (for user dashboard)
 */
export interface UserRegisteredEventsResponse {
  success: boolean;
  data: {
    events: Array<{
      id: string;
      title: string;
      date: string;
      location: string;
      type: string;
      image: string;
      registrationDate: string;
      venue?: string;
      description?: string;
      status?: 'upcoming' | 'ongoing' | 'completed';
      category?: string;
    }>;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}

export const getUserRegisteredEvents = async (filters?: {
  page?: number;
  limit?: number;
}): Promise<UserRegisteredEventsResponse> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/events/user/registered?${queryString}` : '/events/user/registered';
  return apiGet<UserRegisteredEventsResponse>(endpoint);
};

