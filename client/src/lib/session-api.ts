/**
 * Session API Client
 * Handles all session-related API calls for event service points
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

/**
 * Session Stats
 */
export interface SessionStats {
  totalScans: number;
  checkIns: number;
  checkOuts: number;
  uniqueAttendees: number;
  lastScanAt: string | null;
}

/**
 * Session Data
 */
export interface EventSession {
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
  stats?: SessionStats;
}

/**
 * Create Session Request
 */
export interface CreateSessionRequest {
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
 * Update Session Request
 */
export interface UpdateSessionRequest {
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
 * Get all sessions for an event
 */
export async function getSessions(
  eventId: string,
  options?: {
    includeStats?: boolean;
    activeOnly?: boolean;
  }
): Promise<{ success: boolean; data: EventSession[] }> {
  const params = new URLSearchParams();
  if (options?.includeStats) params.append('includeStats', 'true');
  if (options?.activeOnly) params.append('activeOnly', 'true');

  const queryString = params.toString();
  const url = `/facilities/events/${eventId}${queryString ? `?${queryString}` : ''}`;

  return apiGet<{ success: boolean; data: EventSession[] }>(url);
}

/**
 * Get a single session
 */
export async function getSessionById(
  eventId: string,
  sessionId: string
): Promise<{ success: boolean; data: EventSession }> {
  return apiGet<{ success: boolean; data: EventSession }>(
    `/facilities/events/${eventId}/${sessionId}`
  );
}

/**
 * Create a new session
 */
export async function createSession(
  eventId: string,
  data: CreateSessionRequest
): Promise<{ success: boolean; data: EventSession; message: string }> {
  return apiPost<{ success: boolean; data: EventSession; message: string }>(
    `/facilities/events/${eventId}`,
    data
  );
}

/**
 * Update a session
 */
export async function updateSession(
  eventId: string,
  sessionId: string,
  data: UpdateSessionRequest
): Promise<{ success: boolean; data: EventSession; message: string }> {
  return apiPut<{ success: boolean; data: EventSession; message: string }>(
    `/facilities/events/${eventId}/${sessionId}`,
    data
  );
}

/**
 * Delete a session
 */
export async function deleteSession(
  eventId: string,
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(
    `/facilities/events/${eventId}/${sessionId}`
  );
}

/**
 * Get session statistics
 */
export async function getSessionStats(
  eventId: string,
  sessionId: string
): Promise<{ success: boolean; data: SessionStats }> {
  return apiGet<{ success: boolean; data: SessionStats }>(
    `/facilities/events/${eventId}/${sessionId}/stats`
  );
}

/**
 * Reorder sessions
 */
export async function reorderSessions(
  eventId: string,
  orderedIds: string[]
): Promise<{ success: boolean; data: EventSession[]; message: string }> {
  return apiPost<{ success: boolean; data: EventSession[]; message: string }>(
    `/facilities/events/${eventId}/reorder`,
    { orderedIds }
  );
}

/**
 * Create default session ("Main Entrance")
 */
export async function createDefaultSession(
  eventId: string
): Promise<{ success: boolean; data: EventSession; message: string }> {
  return apiPost<{ success: boolean; data: EventSession; message: string }>(
    `/facilities/events/${eventId}/create-default`,
    {}
  );
}

/**
 * Ensure at least one session exists for an event
 * Creates default "Main Entrance" if none exist
 */
export async function ensureDefaultSession(
  eventId: string
): Promise<{ success: boolean; data: EventSession[] }> {
  return apiPost<{ success: boolean; data: EventSession[] }>(
    `/facilities/events/${eventId}/ensure-default`,
    {}
  );
}

/**
 * Session icon options for UI
 */
export const SESSION_ICONS = [
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
 * Session color options for UI
 */
export const SESSION_COLORS = [
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

// Re-export with old names for backward compatibility during migration
export {
  EventSession as EventFacility,
  SessionStats as FacilityStats,
  CreateSessionRequest as CreateFacilityRequest,
  UpdateSessionRequest as UpdateFacilityRequest,
  getSessions as getFacilities,
  getSessionById as getFacilityById,
  createSession as createFacility,
  updateSession as updateFacility,
  deleteSession as deleteFacility,
  getSessionStats as getFacilityStats,
  reorderSessions as reorderFacilities,
  createDefaultSession as createDefaultFacility,
  ensureDefaultSession as ensureDefaultFacility,
  SESSION_ICONS as FACILITY_ICONS,
  SESSION_COLORS as FACILITY_COLORS,
};
