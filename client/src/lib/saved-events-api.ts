import { api } from './api';

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

  const response = await api.get(url);
  return response.data;
}

/**
 * Save an event
 */
export async function saveEvent(eventId: string, notes?: string): Promise<{ success: boolean; data: SavedEventData; message: string }> {
  const response = await api.post(`/saved-events/${eventId}`, { notes });
  return response.data;
}

/**
 * Unsave an event
 */
export async function unsaveEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/saved-events/${eventId}`);
  return response.data;
}

/**
 * Check if an event is saved
 */
export async function isEventSaved(eventId: string): Promise<{ success: boolean; data: { isSaved: boolean } }> {
  const response = await api.get(`/saved-events/${eventId}/status`);
  return response.data;
}

/**
 * Check multiple events saved status
 */
export async function checkEventsSavedStatus(eventIds: string[]): Promise<{ success: boolean; data: Record<string, boolean> }> {
  const response = await api.post('/saved-events/check-status', { eventIds });
  return response.data;
}

/**
 * Update notes for a saved event
 */
export async function updateSavedEventNotes(eventId: string, notes: string): Promise<{ success: boolean; data: SavedEventData; message: string }> {
  const response = await api.patch(`/saved-events/${eventId}/notes`, { notes });
  return response.data;
}

/**
 * Get saved event count
 */
export async function getSavedEventCount(): Promise<{ success: boolean; data: { count: number } }> {
  const response = await api.get('/saved-events/count');
  return response.data;
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
