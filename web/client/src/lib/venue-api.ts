/**
 * Venue & Seating API Client
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import api from "./api";
import type { ApiResponse } from "./api";

export interface Venue {
  id: string;
  organizerId: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: { lat: number; lng: number };
  capacity?: number;
  venueType?: string;
  amenities?: string[];
  defaultSeatMap?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeatMap {
  id: string;
  eventId: string;
  venueId?: string;
  name?: string;
  layout: any;
  pricing?: any;
  imageUrl?: string;
  width?: number;
  height?: number;
  isActive: boolean;
  seats?: Seat[];
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  seatIdentifier: string;
  sectionId?: string;
  rowId?: string;
  rowLabel?: string;
  seatLabel?: string;
  seatType: 'STANDARD' | 'VIP' | 'PREMIUM' | 'WHEELCHAIR' | 'COMPANION' | 'STANDING';
  status: 'available' | 'reserved' | 'booked' | 'blocked' | 'maintenance';
  price?: number;
  x?: number;
  y?: number;
  angle?: number;
  metadata?: Record<string, unknown>;
}

export interface SeatReservation {
  id: string;
  seatId: string;
  registrationId: string;
  reservedAt: string;
  reservedUntil?: string;
  confirmedAt?: string;
  priceAtReservation: number;
  status: 'reserved' | 'confirmed' | 'cancelled';
  seat?: Seat;
}

// Venue APIs
export const createVenue = async (data: Partial<Venue>): Promise<Venue> => {
  const response = await api.post<ApiResponse<{ venue: Venue }>>('/organizer-dashboard/venues', data);
  return response.data?.venue as Venue;
};

export const getVenues = async (filters?: {
  isActive?: boolean;
  venueType?: string;
  search?: string;
}): Promise<Venue[]> => {
  const params = new URLSearchParams();
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.venueType) params.append('venueType', filters.venueType);
  if (filters?.search) params.append('search', filters.search);
  const qs = params.toString();
  const response = await api.get<ApiResponse<{ venues: Venue[] }>>(
    `/organizer-dashboard/venues${qs ? `?${qs}` : ''}`,
  );
  return response.data?.venues || [];
};

export const getVenueById = async (venueId: string): Promise<Venue> => {
  const response = await api.get<ApiResponse<{ venue: Venue }>>(`/organizer-dashboard/venues/${venueId}`);
  return response.data?.venue as Venue;
};

export const updateVenue = async (venueId: string, data: Partial<Venue>): Promise<Venue> => {
  const response = await api.put<ApiResponse<{ venue: Venue }>>(`/organizer-dashboard/venues/${venueId}`, data);
  return response.data?.venue as Venue;
};

export const deleteVenue = async (venueId: string): Promise<void> => {
  await api.delete(`/organizer-dashboard/venues/${venueId}`);
};

// Seat Map APIs (Organizer)
export const upsertSeatMap = async (eventId: string, data: {
  venueId?: string;
  name?: string;
  layout: any;
  pricing?: any;
  imageUrl?: string;
  width?: number;
  height?: number;
}): Promise<SeatMap> => {
  const response = await api.post<ApiResponse<{ seatMap: SeatMap }>>(`/organizer-dashboard/events/${eventId}/seat-map`, data);
  return response.data?.seatMap as SeatMap;
};

export const getSeatMap = async (eventId: string): Promise<SeatMap> => {
  const response = await api.get<ApiResponse<{ seatMap: SeatMap }>>(`/organizer-dashboard/events/${eventId}/seat-map`);
  return response.data?.seatMap as SeatMap;
};

export const getAvailableSeats = async (eventId: string, filters?: {
  sectionId?: string;
  seatType?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Seat[]> => {
  const params = new URLSearchParams();
  if (filters?.sectionId) params.append('sectionId', filters.sectionId);
  if (filters?.seatType) params.append('seatType', filters.seatType);
  if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
  const qs = params.toString();
  const response = await api.get<ApiResponse<{ seats: Seat[] }>>(
    `/organizer-dashboard/events/${eventId}/seats/available${qs ? `?${qs}` : ''}`,
  );
  return response.data?.seats || [];
};

export const deleteSeatMap = async (eventId: string): Promise<void> => {
  await api.delete(`/organizer-dashboard/events/${eventId}/seat-map`);
};

// Seat Selection APIs (Public/Attendee)
export const getSeatMapAvailability = async (eventId: string): Promise<SeatMap> => {
  const response = await api.get<ApiResponse<{ seatMap: SeatMap }>>(`/events/${eventId}/seat-map`);
  return response.data?.seatMap as SeatMap;
};

export const reserveSeats = async (eventId: string, data: {
  seatIds: string[];
  registrationId: string;
  reservationTimeoutMinutes?: number;
}): Promise<SeatReservation[]> => {
  const response = await api.post<ApiResponse<{ reservations: SeatReservation[] }>>(`/events/${eventId}/seats/reserve`, data);
  return response.data?.reservations || [];
};

export const confirmSeatReservation = async (registrationId: string): Promise<SeatReservation> => {
  const response = await api.post<ApiResponse<{ reservation: SeatReservation }>>(`/events/registrations/${registrationId}/seats/confirm`);
  return response.data?.reservation as SeatReservation;
};

export const cancelSeatReservation = async (registrationId: string): Promise<void> => {
  await api.delete(`/events/registrations/${registrationId}/seats`);
};

export const getSeatSelection = async (registrationId: string): Promise<SeatReservation> => {
  const response = await api.get<ApiResponse<{ selection: SeatReservation }>>(`/events/registrations/${registrationId}/seats`);
  return response.data?.selection as SeatReservation;
};

