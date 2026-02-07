/**
 * Facility API Client
 * Handles all facility-related API calls for event service points
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

/**
 * Facility Stats
 */
export interface FacilityStats {
  totalScans: number;
  checkIns: number;
  checkOuts: number;
  uniqueAttendees: number;
  lastScanAt: string | null;
}

/**
 * Facility Data
 */
export interface EventFacility {
  id: string;
  eventId: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  location: string | null;
  isActive: boolean;
  allowCheckIn: boolean;
  allowCheckOut: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  stats?: FacilityStats;
}

/**
 * Create Facility Request
 */
export interface CreateFacilityRequest {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  location?: string;
  isActive?: boolean;
  allowCheckIn?: boolean;
  allowCheckOut?: boolean;
  sortOrder?: number;
}

/**
 * Update Facility Request
 */
export interface UpdateFacilityRequest {
  name?: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  location?: string;
  isActive?: boolean;
  allowCheckIn?: boolean;
  allowCheckOut?: boolean;
  sortOrder?: number;
}

/**
 * Get all facilities for an event
 */
export async function getFacilities(
  eventId: string,
  options?: {
    includeStats?: boolean;
    activeOnly?: boolean;
  }
): Promise<{ success: boolean; data: EventFacility[] }> {
  const params = new URLSearchParams();
  if (options?.includeStats) params.append('includeStats', 'true');
  if (options?.activeOnly) params.append('activeOnly', 'true');

  const queryString = params.toString();
  const url = `/facilities/events/${eventId}${queryString ? `?${queryString}` : ''}`;

  return apiGet<{ success: boolean; data: EventFacility[] }>(url);
}

/**
 * Get a single facility
 */
export async function getFacilityById(
  eventId: string,
  facilityId: string
): Promise<{ success: boolean; data: EventFacility }> {
  return apiGet<{ success: boolean; data: EventFacility }>(
    `/facilities/events/${eventId}/${facilityId}`
  );
}

/**
 * Create a new facility
 */
export async function createFacility(
  eventId: string,
  data: CreateFacilityRequest
): Promise<{ success: boolean; data: EventFacility; message: string }> {
  return apiPost<{ success: boolean; data: EventFacility; message: string }>(
    `/facilities/events/${eventId}`,
    data
  );
}

/**
 * Update a facility
 */
export async function updateFacility(
  eventId: string,
  facilityId: string,
  data: UpdateFacilityRequest
): Promise<{ success: boolean; data: EventFacility; message: string }> {
  return apiPut<{ success: boolean; data: EventFacility; message: string }>(
    `/facilities/events/${eventId}/${facilityId}`,
    data
  );
}

/**
 * Delete a facility
 */
export async function deleteFacility(
  eventId: string,
  facilityId: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(
    `/facilities/events/${eventId}/${facilityId}`
  );
}

/**
 * Get facility statistics
 */
export async function getFacilityStats(
  eventId: string,
  facilityId: string
): Promise<{ success: boolean; data: FacilityStats }> {
  return apiGet<{ success: boolean; data: FacilityStats }>(
    `/facilities/events/${eventId}/${facilityId}/stats`
  );
}

/**
 * Reorder facilities
 */
export async function reorderFacilities(
  eventId: string,
  orderedIds: string[]
): Promise<{ success: boolean; data: EventFacility[]; message: string }> {
  return apiPost<{ success: boolean; data: EventFacility[]; message: string }>(
    `/facilities/events/${eventId}/reorder`,
    { orderedIds }
  );
}

/**
 * Create default facility ("Main Entrance")
 */
export async function createDefaultFacility(
  eventId: string
): Promise<{ success: boolean; data: EventFacility; message: string }> {
  return apiPost<{ success: boolean; data: EventFacility; message: string }>(
    `/facilities/events/${eventId}/create-default`,
    {}
  );
}

/**
 * Ensure at least one facility exists for an event
 * Creates default "Main Entrance" if none exist
 */
export async function ensureDefaultFacility(
  eventId: string
): Promise<{ success: boolean; data: EventFacility[] }> {
  return apiPost<{ success: boolean; data: EventFacility[] }>(
    `/facilities/events/${eventId}/ensure-default`,
    {}
  );
}

/**
 * Facility icon options for UI
 */
export const FACILITY_ICONS = [
  { id: 'shield', label: 'Entrance', icon: 'Shield' },
  { id: 'door-open', label: 'Door', icon: 'DoorOpen' },
  { id: 'utensils', label: 'Food', icon: 'Utensils' },
  { id: 'coffee', label: 'Beverages', icon: 'Coffee' },
  { id: 'gift', label: 'Gift', icon: 'Gift' },
  { id: 'star', label: 'VIP', icon: 'Star' },
  { id: 'car', label: 'Parking', icon: 'Car' },
  { id: 'clipboard', label: 'Registration', icon: 'ClipboardList' },
  { id: 'award', label: 'Award', icon: 'Award' },
  { id: 'users', label: 'Networking', icon: 'Users' },
  { id: 'presentation', label: 'Session', icon: 'Presentation' },
  { id: 'camera', label: 'Photo', icon: 'Camera' },
] as const;

/**
 * Facility color options for UI
 */
export const FACILITY_COLORS = [
  { id: '#3b82f6', label: 'Blue' },
  { id: '#22c55e', label: 'Green' },
  { id: '#eab308', label: 'Yellow' },
  { id: '#f97316', label: 'Orange' },
  { id: '#ef4444', label: 'Red' },
  { id: '#8b5cf6', label: 'Purple' },
  { id: '#ec4899', label: 'Pink' },
  { id: '#06b6d4', label: 'Cyan' },
  { id: '#64748b', label: 'Gray' },
] as const;
