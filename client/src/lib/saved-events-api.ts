import { apiGet, apiPost, apiPatch, apiDelete } from './api';

export interface SavedEventData {
  id: string;
  eventId: string;
  savedAt: string;
  notes: string | null;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    venueName: string | null;
    coverImage: string | null;
    category: string | null;
    eventType: string;
    status: string;
    basePrice: number | null;
    currency: string;
  };
}

export interface GetSavedEventsResponse {
  success: boolean;
  data: SavedEventData[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export interface SavedEventsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

/**
 * Get all saved events for the current user
 */
export async function getSavedEvents(options?: SavedEventsOptions): Promise<GetSavedEventsResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.search) params.append('search', options.search);
  if (options?.category) params.append('category', options.category);

  const queryString = params.toString();
  const url = `/saved-events${queryString ? `?${queryString}` : ''}`;

  return apiGet<GetSavedEventsResponse>(url);
}

/**
 * Save an event
 */
export async function saveEvent(eventId: string, notes?: string): Promise<{ success: boolean; data: SavedEventData; message: string }> {
  return apiPost<{ success: boolean; data: SavedEventData; message: string }>(`/saved-events/${eventId}`, { notes });
}

/**
 * Unsave an event
 */
export async function unsaveEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/saved-events/${eventId}`);
}

/**
 * Check if an event is saved
 */
export async function isEventSaved(eventId: string): Promise<{ success: boolean; data: { isSaved: boolean } }> {
  return apiGet<{ success: boolean; data: { isSaved: boolean } }>(`/saved-events/${eventId}/status`);
}

/**
 * Check multiple events saved status
 */
export async function checkEventsSavedStatus(eventIds: string[]): Promise<{ success: boolean; data: Record<string, boolean> }> {
  return apiPost<{ success: boolean; data: Record<string, boolean> }>('/saved-events/check-status', { eventIds });
}

/**
 * Update notes for a saved event
 */
export async function updateSavedEventNotes(eventId: string, notes: string): Promise<{ success: boolean; data: SavedEventData; message: string }> {
  return apiPatch<{ success: boolean; data: SavedEventData; message: string }>(`/saved-events/${eventId}/notes`, { notes });
}

/**
 * Get saved event count
 */
export async function getSavedEventCount(): Promise<{ success: boolean; data: { count: number } }> {
  return apiGet<{ success: boolean; data: { count: number } }>('/saved-events/count');
}

/**
 * Toggle saved status for an event
 */
export async function toggleSaveEvent(eventId: string, currentlySaved: boolean): Promise<boolean> {
  if (currentlySaved) {
    await unsaveEvent(eventId);
    return false;
  } else {
    await saveEvent(eventId);
    return true;
  }
}
