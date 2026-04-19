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
  type?: EventType;
  dateFrom?: string; // ISO date string - filter events starting from this date
  dateTo?: string; // ISO date string - filter events starting before this date
  declinedOrRecalledCancelled?: boolean; // REJECTED or (CANCELLED + recalledAt)
  recalledCancelled?: boolean; // CANCELLED + recalledAt (recalled events only)
  recalledPending?: boolean; // PENDING + recalledAt
}

/**
 * Create Event data
 */
export interface CreateEventData {
  title: string;
  description: string;
  organizerDescription?: string;
  category?: string;
  tags?: string[];
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  startTime?: string;
  endTime?: string;
  registrationDeadline?: string; // ISO date string
  timezone?: string;
  venue?: string;
  location: string;
  address?: string;
  isOnline?: boolean;
  onlineLink?: string;
  coordinates?: { lat: number; lng: number };
  isFree: boolean;
  price?: number;
  currency?: string; // Currency code (e.g., 'KES', 'USD')
  ticketTypes?: Array<{
    name: string;
    description?: string;
    price: number;
    quantity?: number;
    maxPerPerson?: number;
    minPerOrder?: number;
    features?: string[];
    originalPrice?: number;
    discountLabel?: string;
    isComplementary?: boolean;
    requiresInvitation?: boolean;
    availableFrom?: string;
    availableUntil?: string;
    earlyBirdQuantity?: number;
    salesChannel?: 'online' | 'door' | 'both';
    isHidden?: boolean;
  }>;
  // Service fee configuration
  serviceFeeType?: 'percentage' | 'fixed' | 'none';
  serviceFeeValue?: number;
  serviceFeePassToAttendee?: boolean;
  // Refund policy
  refundPolicy?: 'no_refunds' | 'full_refund' | 'partial_refund' | 'custom';
  refundDeadlineDays?: number;
  refundPolicyText?: string;
  capacity?: number;
  image?: string;
  imageFocalX?: number;
  imageFocalY?: number;
  images?: string[];
  type?: EventType;
  requirements?: string[] | string;
  ageRestriction?: string;
  duration?: string;
  speakers?: Array<{
    id?: string;
    name: string;
    title?: string;
    bio?: string;
    image?: string;
    company?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
  }>;
  sponsors?: Array<{
    id?: string;
    name: string;
    level?: string;
    logo?: string;
    website?: string;
    description?: string;
  }>;
  faqs?: Array<{ question: string; answer: string }>;
  socialLinks?: Record<string, string>;
  exhibitors?: Array<{
    id?: string;
    name: string;
    description?: string;
    logo?: string;
    contactEmail?: string;
    booth?: string;
    website?: string;
    category?: string;
  }>;
  agenda?: Array<{
    id?: string;
    title: string;
    description?: string;
    date?: string; // Optional date for multi-day events (defaults to event start date)
    startTime?: string;
    endTime?: string;
    sessionType?: string; // keynote, workshop, panel, breakout, networking, break, lunch, registration, other
    room?: string; // Room or track name
    speakerIds?: string[]; // IDs of speakers assigned to this session
    speakers?: string[]; // Legacy: speaker names (for backwards compatibility)
  }>;
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
export interface TicketSelection {
  ticketType: string;
  quantity: number;
}

export interface RegisterForEventData {
  // New: Support multiple ticket types
  tickets?: TicketSelection[];
  // Deprecated: Use tickets array instead. Kept for backward compatibility
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
  invitationId?: string;
  promoCode?: string;
  // Seat selection
  seatIds?: string[];
  // Consent data
  consent?: {
    marketingConsent?: boolean;
  };
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
    resumedPendingPayment?: boolean;
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
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  // Support both page and offset (page takes precedence)
  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  } else if (filters?.offset !== undefined) {
    queryParams.append('offset', filters.offset.toString());
  }
  // Date range filtering
  if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
  // Special status filters
  if (filters?.declinedOrRecalledCancelled) queryParams.append('declinedOrRecalledCancelled', 'true');
  if (filters?.recalledCancelled) queryParams.append('recalledCancelled', 'true');
  if (filters?.recalledPending) queryParams.append('recalledPending', 'true');

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/events?${queryString}` : '/events';

  const response = await apiGet<EventsListResponse>(endpoint);

  // Transform backend events to frontend format
  if (response.success && response.data) {
    const normalizedEvents = (response.data.events || []).map(event => ({
      ...event,
      agenda: event.agenda
        ? event.agenda.map(item => ({
            title: item.title || "",
            description: item.description || "",
            date: item.date || undefined,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            speakers: item.speakers || [],
          }))
        : event.agenda,
      exhibitors: event.exhibitors
        ? event.exhibitors.map(exhibitor => ({
            ...exhibitor,
            description: exhibitor.description || "",
            logo: exhibitor.logo || "",
            contactEmail: exhibitor.contactEmail || "",
            booth: exhibitor.booth || "",
          }))
        : event.exhibitors,
    }));
    response.data.events = transformEventsData(normalizedEvents);
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
    const event = response.data.event;
    const normalizedEvent = {
      ...event,
      agenda: event.agenda
        ? event.agenda.map(item => ({
            title: item.title || "",
            description: item.description || "",
            date: item.date || undefined,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            speakers: item.speakers || [],
          }))
        : event.agenda,
      exhibitors: event.exhibitors
        ? event.exhibitors.map(exhibitor => ({
            ...exhibitor,
            description: exhibitor.description || "",
            logo: exhibitor.logo || "",
            contactEmail: exhibitor.contactEmail || "",
            booth: exhibitor.booth || "",
          }))
        : event.exhibitors,
    };
    response.data.event = transformEventData(normalizedEvent);
  }

  return response;
};

/**
 * Get related events for a given event (scored by relevance)
 */
export const getRelatedEvents = async (eventId: string, limit?: number): Promise<EventsListResponse> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/events/${eventId}/related?${queryString}`
    : `/events/${eventId}/related`;

  const response = await apiGet<EventsListResponse>(endpoint);

  // Transform backend events to frontend format (same pattern as getEvents)
  if (response.success && response.data) {
    const normalizedEvents = (response.data.events || []).map(event => ({
      ...event,
      agenda: event.agenda
        ? event.agenda.map(item => ({
            title: item.title || "",
            description: item.description || "",
            date: item.date || undefined,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            speakers: item.speakers || [],
          }))
        : event.agenda,
      exhibitors: event.exhibitors
        ? event.exhibitors.map(exhibitor => ({
            ...exhibitor,
            description: exhibitor.description || "",
            logo: exhibitor.logo || "",
            contactEmail: exhibitor.contactEmail || "",
            booth: exhibitor.booth || "",
          }))
        : event.exhibitors,
    }));
    response.data.events = transformEventsData(normalizedEvents);
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
    const event = response.data.event;
    const normalizedEvent = {
      ...event,
      agenda: event.agenda
        ? event.agenda.map(item => ({
            title: item.title || "",
            description: item.description || "",
            date: item.date || undefined,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            speakers: item.speakers || [],
          }))
        : event.agenda,
      exhibitors: event.exhibitors
        ? event.exhibitors.map(exhibitor => ({
            ...exhibitor,
            description: exhibitor.description || "",
            logo: exhibitor.logo || "",
            contactEmail: exhibitor.contactEmail || "",
            booth: exhibitor.booth || "",
          }))
        : event.exhibitors,
    };
    response.data.event = transformEventData(normalizedEvent);
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
    const event = response.data.event;
    const normalizedEvent = {
      ...event,
      agenda: event.agenda
        ? event.agenda.map(item => ({
            title: item.title || "",
            description: item.description || "",
            date: item.date || undefined,
            startTime: item.startTime || "",
            endTime: item.endTime || "",
            speakers: item.speakers || [],
          }))
        : event.agenda,
      exhibitors: event.exhibitors
        ? event.exhibitors.map(exhibitor => ({
            ...exhibitor,
            description: exhibitor.description || "",
            logo: exhibitor.logo || "",
            contactEmail: exhibitor.contactEmail || "",
            booth: exhibitor.booth || "",
          }))
        : event.exhibitors,
    };
    response.data.event = transformEventData(normalizedEvent);
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
  // New: Support multiple ticket types
  tickets?: TicketSelection[];
  // Deprecated: Use tickets array instead. Kept for backward compatibility
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
  // Consent data
  consent?: {
    marketingConsent?: boolean;
  };
}

export interface RegisterAsGuestResponse {
  success: boolean;
  message: string;
  data: {
    resumedPendingPayment?: boolean;
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
      firstName: string;
      lastName: string;
      isNewUser: boolean;
      requiresPasswordSetup?: boolean;
    };
    accessToken?: string;
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
      slug?: string | null;
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
      // Registration data for badge/ticket features
      registrationId?: string;
      ticketType?: string;
      backupCode?: string;
      ticketEmailStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | null;
      ticketEmailSentAt?: string | null;
      ticketEmailError?: string | null;
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

