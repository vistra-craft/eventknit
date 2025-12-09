/**
 * Venue & Seating API Client
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import api from "./api";

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
  const response = await api.post('/organizer-dashboard/venues', data);
  return response.data.data.venue;
};

export const getVenues = async (filters?: {
  isActive?: boolean;
  venueType?: string;
  search?: string;
}): Promise<Venue[]> => {
  const response = await api.get('/organizer-dashboard/venues', { params: filters });
  return response.data.data.venues;
};

export const getVenueById = async (venueId: string): Promise<Venue> => {
  const response = await api.get(`/organizer-dashboard/venues/${venueId}`);
  return response.data.data.venue;
};

export const updateVenue = async (venueId: string, data: Partial<Venue>): Promise<Venue> => {
  const response = await api.put(`/organizer-dashboard/venues/${venueId}`, data);
  return response.data.data.venue;
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
  const response = await api.post(`/organizer-dashboard/events/${eventId}/seat-map`, data);
  return response.data.data.seatMap;
};

export const getSeatMap = async (eventId: string): Promise<SeatMap> => {
  const response = await api.get(`/organizer-dashboard/events/${eventId}/seat-map`);
  return response.data.data.seatMap;
};

export const getAvailableSeats = async (eventId: string, filters?: {
  sectionId?: string;
  seatType?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Seat[]> => {
  const response = await api.get(`/organizer-dashboard/events/${eventId}/seats/available`, {
    params: filters,
  });
  return response.data.data.seats;
};

export const deleteSeatMap = async (eventId: string): Promise<void> => {
  await api.delete(`/organizer-dashboard/events/${eventId}/seat-map`);
};

// Seat Selection APIs (Public/Attendee)
export const getSeatMapAvailability = async (eventId: string): Promise<SeatMap> => {
  const response = await api.get(`/events/${eventId}/seat-map`);
  return response.data.data.seatMap;
};

export const reserveSeats = async (eventId: string, data: {
  seatIds: string[];
  registrationId: string;
  reservationTimeoutMinutes?: number;
}): Promise<SeatReservation[]> => {
  const response = await api.post(`/events/${eventId}/seats/reserve`, data);
  return response.data.data.reservations;
};

export const confirmSeatReservation = async (registrationId: string): Promise<SeatReservation> => {
  const response = await api.post(`/events/registrations/${registrationId}/seats/confirm`);
  return response.data.data.reservation;
};

export const cancelSeatReservation = async (registrationId: string): Promise<void> => {
  await api.delete(`/events/registrations/${registrationId}/seats`);
};

export const getSeatSelection = async (registrationId: string): Promise<SeatReservation> => {
  const response = await api.get(`/events/registrations/${registrationId}/seats`);
  return response.data.data.selection;
};

