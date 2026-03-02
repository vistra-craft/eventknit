/**
 * Seating API Client
 *
 * Functions for managing event seating, seat reservations, and allocations
 */

import { apiClient } from './api-client';
import { ExtendedError } from './utils/error';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface SeatReservationRequest {
  eventId: string;
  seatIds: string[];
  registrationId?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  timeoutMinutes?: number;
}

export interface SeatReservationResponse {
  reservationId: string;
  eventId: string;
  registrationId?: string;
  seatIds: string[];
  status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
}

export interface SeatAssignmentRequest {
  eventId: string;
  seatId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  ticketLineItemId?: string;
}

export interface SeatAssignmentResponse {
  assignmentId: string;
  eventId: string;
  seatId: string;
  attendeeName: string;
  attendeeEmail: string;
  createdAt: string;
}

export interface SeatPreferencesRequest {
  registrationId: string;
  preferences: {
    preferredSections?: string[];
    preferredRows?: string[];
    accessibilityNeeds?: string;
    specialRequests?: string;
  };
}

export interface AvailableSeatsRequest {
  eventId: string;
  section?: string;
  priceRange?: { min: number; max: number };
  accessibilityOnly?: boolean;
}

export interface AvailableSeat {
  seatId: string;
  section: string;
  row: string;
  seatNumber: string;
  price: number;
  ticketTypeId?: string;
  isAccessible: boolean;
}

export interface SeatStatistics {
  totalSeats: number;
  availableSeats: number;
  reservedSeats: number;
  confirmedSeats: number;
  blockedSeats: number;
  utilization: number; // Percentage 0-100
}

export interface SeatingConfigRequest {
  eventId: string;
  seatingType: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID';
  seatMapRequired?: boolean;
  description?: string;
}

export interface SeatingValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ──────────────────────────────────────────────────────────────
// Seat Reservation APIs
// ──────────────────────────────────────────────────────────────

/**
 * Reserve seats for a customer during checkout
 * Supports multi-seat reservation with timeout
 */
export async function reserveSeats(data: SeatReservationRequest): Promise<SeatReservationResponse> {
  try {
    const response = await apiClient.post<SeatReservationResponse>(
      `/api/v1/events/${data.eventId}/seats/reserve`,
      {
        seatIds: data.seatIds,
        registrationId: data.registrationId,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        attendeePhone: data.attendeePhone,
        timeoutMinutes: data.timeoutMinutes || 15,
      },
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to reserve seats',
      'SEAT_RESERVATION_FAILED',
      error,
    );
  }
}

/**
 * Confirm seat reservations after payment
 * Moves reservations from RESERVED to CONFIRMED status
 */
export async function confirmSeatReservations(
  registrationId: string,
): Promise<SeatReservationResponse> {
  try {
    const response = await apiClient.post<SeatReservationResponse>(
      `/api/v1/registrations/${registrationId}/seats/confirm`,
      {},
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to confirm seat reservations',
      'SEAT_CONFIRMATION_FAILED',
      error,
    );
  }
}

/**
 * Request to change seat assignment (for CUSTOMER_SELECTS events)
 */
export async function requestSeatChange(
  registrationId: string,
  newSeatIds: string[],
  reason?: string,
): Promise<SeatReservationResponse> {
  try {
    const response = await apiClient.post<SeatReservationResponse>(
      `/api/v1/registrations/${registrationId}/seats/change-request`,
      {
        newSeatIds,
        reason,
      },
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to request seat change',
      'SEAT_CHANGE_REQUEST_FAILED',
      error,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Organizer Seat Assignment APIs
// ──────────────────────────────────────────────────────────────

/**
 * Assign a specific seat to an attendee (organizer action)
 * Used in ORGANIZER_ASSIGNS seating model
 */
export async function assignSeat(
  eventId: string,
  data: Omit<SeatAssignmentRequest, 'eventId'>,
): Promise<SeatAssignmentResponse> {
  try {
    const response = await apiClient.post<SeatAssignmentResponse>(
      `/api/v1/organizer-dashboard/events/${eventId}/seats/assign`,
      data,
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to assign seat',
      'SEAT_ASSIGNMENT_FAILED',
      error,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Attendee Preferences APIs
// ──────────────────────────────────────────────────────────────

/**
 * Save seating preferences for an attendee
 * Used in ORGANIZER_ASSIGNS model for preference collection
 */
export async function saveSeatPreferences(
  data: SeatPreferencesRequest,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/api/v1/registrations/${data.registrationId}/seats/preferences`,
      data.preferences,
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to save seat preferences',
      'SAVE_PREFERENCES_FAILED',
      error,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Seat Query APIs
// ──────────────────────────────────────────────────────────────

/**
 * Get available seats for an event
 * Supports filtering by section, price range, accessibility
 */
export async function getAvailableSeats(data: AvailableSeatsRequest): Promise<AvailableSeat[]> {
  try {
    const params = new URLSearchParams();
    if (data.section) params.append('section', data.section);
    if (data.priceRange) {
      params.append('minPrice', data.priceRange.min.toString());
      params.append('maxPrice', data.priceRange.max.toString());
    }
    if (data.accessibilityOnly) params.append('accessibility', 'true');

    const response = await apiClient.get<AvailableSeat[]>(
      `/api/v1/events/${data.eventId}/seats/available?${params.toString()}`,
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to fetch available seats',
      'FETCH_SEATS_FAILED',
      error,
    );
  }
}

/**
 * Get seat allocation statistics for an event
 * Shows total, available, reserved, confirmed, and blocked seats
 */
export async function getSeatStatistics(eventId: string): Promise<SeatStatistics> {
  try {
    const response = await apiClient.get<SeatStatistics>(
      `/api/v1/events/${eventId}/seats/statistics`,
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to fetch seat statistics',
      'FETCH_STATISTICS_FAILED',
      error,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Seating Configuration APIs
// ──────────────────────────────────────────────────────────────

/**
 * Configure seating model for an event
 * Sets CUSTOMER_SELECTS, ORGANIZER_ASSIGNS, or HYBRID
 */
export async function configureSeating(data: SeatingConfigRequest): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/api/v1/organizer-dashboard/events/${data.eventId}/seating/configure`,
      {
        seatingType: data.seatingType,
        seatMapRequired: data.seatMapRequired,
        description: data.description,
      },
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to configure seating',
      'SEATING_CONFIG_FAILED',
      error,
    );
  }
}

/**
 * Validate seating configuration before event publication
 */
export async function validateSeatingConfiguration(
  eventId: string,
): Promise<SeatingValidationResponse> {
  try {
    const response = await apiClient.post<SeatingValidationResponse>(
      `/api/v1/organizer-dashboard/events/${eventId}/seating/validate`,
      {},
    );
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to validate seating configuration',
      'SEATING_VALIDATION_FAILED',
      error,
    );
  }
}

/**
 * Retrieve current seating configuration for an event
 */
export async function getSeatingConfiguration(eventId: string): Promise<{
  seatingType: string;
  hasSeatingMap: boolean;
  seatMapRequired: boolean;
  description?: string;
}> {
  try {
    const response = await apiClient.get<{
      seatingType: string;
      hasSeatingMap: boolean;
      seatMapRequired: boolean;
      description?: string;
    }>(`/api/v1/events/${eventId}/seating/configuration`);
    return response.data;
  } catch (error) {
    throw new ExtendedError(
      error instanceof Error ? error.message : 'Failed to fetch seating configuration',
      'FETCH_CONFIG_FAILED',
      error,
    );
  }
}

export default {
  reserveSeats,
  confirmSeatReservations,
  requestSeatChange,
  assignSeat,
  saveSeatPreferences,
  getAvailableSeats,
  getSeatStatistics,
  configureSeating,
  validateSeatingConfiguration,
  getSeatingConfiguration,
};
