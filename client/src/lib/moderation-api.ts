import { api } from './api';

/**
 * Suspend a user (punitive action)
 */
export async function suspendUser(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/admin/users/${userId}/suspend`, { reason });
  return response.data;
}

/**
 * Deactivate a user (non-punitive action)
 */
export async function deactivateUser(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/admin/users/${userId}/deactivate`, { reason });
  return response.data;
}

/**
 * Activate/reactivate a user
 */
export async function activateUser(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/admin/users/${userId}/activate`);
  return response.data;
}

/**
 * Recall an event (pull down approved event)
 */
export async function recallEvent(eventId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/admin/events/${eventId}/recall`, { reason });
  return response.data;
}

/**
 * Get users with filters (for moderation)
 */
export async function getUsers(options?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; data: any[]; pagination: any }> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.search) params.append('search', options.search);

  const query = params.toString();
  const response = await api.get(`/admin/users${query ? `?${query}` : ''}`);
  return response.data;
}
