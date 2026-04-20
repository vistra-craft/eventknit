/**
 * Seating API Client
 *
 * Functions for managing event seating, seat reservations, and allocations
 */

import { apiGet, apiPost } from './api';

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
  utilization: number;
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

export interface SeatAllocationSummary {
  totalSeats: number;
  allocatedSeats: number;
  availableSeats: number;
  pendingSeats: number;
  byStatus: Record<string, number>;
  lastUpdated: string;
}

export interface SeatAllocation {
  id: string;
  registrationId: string;
  attendeeName: string;
  attendeeEmail: string;
  seatId: string;
  seatLocation: string;
  status: 'CONFIRMED' | 'PENDING' | 'RELEASED';
  allocatedAt: string;
}

export interface SeatAllocationByType {
  byType: Record<string, {
    allocated: number;
    available: number;
    pending: number;
    total: number;
  }>;
}

export interface SeatOperation {
  id: string;
  type: 'RELEASED' | 'ALLOCATION';
  seatId: string;
  seatLocation: string;
  attendeeName: string;
  attendeeEmail: string;
  status: string;
  operationDate: string;
  registrationId: string;
}

export interface RegistrationSeat {
  seatId: string;
  location: string;
  section: string;
  row: string;
  number: string;
  type: string;
  price: number;
  status: 'CONFIRMED' | 'PENDING' | 'RELEASED';
  allocatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Seat Reservation APIs
// ──────────────────────────────────────────────────────────────

export async function reserveSeats(data: SeatReservationRequest): Promise<SeatReservationResponse> {
  const response = await apiPost<{ data: SeatReservationResponse }>(
    `/events/${data.eventId}/seats/reserve`,
    {
      seatIds: data.seatIds,
      registrationId: data.registrationId,
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      attendeePhone: data.attendeePhone,
      timeoutMinutes: data.timeoutMinutes ?? 15,
    },
  );
  return response.data;
}

export async function confirmSeatReservations(registrationId: string): Promise<SeatReservationResponse> {
  const response = await apiPost<{ data: SeatReservationResponse }>(
    `/registrations/${registrationId}/seats/confirm`,
    {},
  );
  return response.data;
}

export async function requestSeatChange(
  registrationId: string,
  newSeatIds: string[],
  reason?: string,
): Promise<SeatReservationResponse> {
  const response = await apiPost<{ data: SeatReservationResponse }>(
    `/registrations/${registrationId}/seats/change-request`,
    { newSeatIds, reason },
  );
  return response.data;
}

// ──────────────────────────────────────────────────────────────
// Organizer Seat Assignment APIs
// ──────────────────────────────────────────────────────────────

export async function assignSeat(
  eventId: string,
  data: Omit<SeatAssignmentRequest, 'eventId'>,
): Promise<SeatAssignmentResponse> {
  const response = await apiPost<{ data: SeatAssignmentResponse }>(
    `/organizer-dashboard/events/${eventId}/seats/assign`,
    data,
  );
  return response.data;
}

// ──────────────────────────────────────────────────────────────
// Attendee Preferences APIs
// ──────────────────────────────────────────────────────────────

export async function saveSeatPreferences(
  data: SeatPreferencesRequest,
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    `/registrations/${data.registrationId}/seats/preferences`,
    data.preferences,
  );
}

// ──────────────────────────────────────────────────────────────
// Seat Query APIs
// ──────────────────────────────────────────────────────────────

export async function getAvailableSeats(data: AvailableSeatsRequest): Promise<AvailableSeat[]> {
  const params = new URLSearchParams();
  if (data.section) params.append('section', data.section);
  if (data.priceRange) {
    params.append('minPrice', data.priceRange.min.toString());
    params.append('maxPrice', data.priceRange.max.toString());
  }
  if (data.accessibilityOnly) params.append('accessibility', 'true');

  const response = await apiGet<{ data: AvailableSeat[] }>(
    `/events/${data.eventId}/seats/available?${params.toString()}`,
  );
  return response.data;
}

export async function getSeatStatistics(eventId: string): Promise<SeatStatistics> {
  const response = await apiGet<{ data: SeatStatistics }>(
    `/events/${eventId}/seats/statistics`,
  );
  return response.data;
}

// ──────────────────────────────────────────────────────────────
// Dashboard APIs
// ──────────────────────────────────────────────────────────────

export async function getSeatAllocationSummary(eventId: string): Promise<SeatAllocationSummary> {
  const response = await apiGet<{ data: SeatAllocationSummary }>(
    `/organizer-dashboard/events/${eventId}/seats/summary`,
  );
  return response.data;
}

export async function getSeatAllocations(
  eventId: string,
  page: number,
  limit: number,
  status: string,
): Promise<{ allocations: SeatAllocation[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const response = await apiGet<{
    data: {
      allocations: SeatAllocation[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>(`/organizer-dashboard/events/${eventId}/seats/allocations?page=${page}&limit=${limit}&status=${status}`);
  return response.data;
}

export async function getSeatAllocationByType(eventId: string): Promise<SeatAllocationByType> {
  const response = await apiGet<{ data: SeatAllocationByType }>(
    `/organizer-dashboard/events/${eventId}/seats/by-type`,
  );
  return response.data;
}

export async function getSeatOperations(
  eventId: string,
  limit: number,
): Promise<{ operations: SeatOperation[] }> {
  const response = await apiGet<{ data: { operations: SeatOperation[] } }>(
    `/organizer-dashboard/events/${eventId}/seats/operations?limit=${limit}`,
  );
  return response.data;
}

export async function getRegistrationSeats(
  registrationId: string,
): Promise<{ registrationId: string; seats: RegistrationSeat[]; seatCount: number }> {
  const response = await apiGet<{
    data: { registrationId: string; seats: RegistrationSeat[]; seatCount: number };
  }>(`/registrations/${registrationId}/seats`);
  return response.data;
}

// ──────────────────────────────────────────────────────────────
// Seating Configuration APIs
// ──────────────────────────────────────────────────────────────

export async function configureSeating(data: SeatingConfigRequest): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    `/organizer-dashboard/events/${data.eventId}/seating/configure`,
    {
      seatingType: data.seatingType,
      seatMapRequired: data.seatMapRequired,
      description: data.description,
    },
  );
}

export async function validateSeatingConfiguration(eventId: string): Promise<SeatingValidationResponse> {
  const response = await apiGet<{ data: SeatingValidationResponse }>(
    `/organizer-dashboard/events/${eventId}/seating/validate`,
    {},
  );
  return response.data;
}

export async function getSeatingConfiguration(eventId: string): Promise<{
  seatingType: string;
  hasSeatingMap: boolean;
  seatMapRequired: boolean;
  description?: string;
}> {
  const response = await apiGet<{
    data: {
      seatingType: string;
      hasSeatingMap: boolean;
      seatMapRequired: boolean;
      description?: string;
    };
  }>(`/events/${eventId}/seating/configuration`);
  return response.data;
}
