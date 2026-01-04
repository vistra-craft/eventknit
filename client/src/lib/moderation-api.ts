import { apiGet, apiPost } from './api';

/**
 * Suspend a user (punitive action)
 */
export async function suspendUser(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/admin/users/${userId}/suspend`, { reason });
}

/**
 * Deactivate a user (non-punitive action)
 */
export async function deactivateUser(userId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/admin/users/${userId}/deactivate`, { reason });
}

/**
 * Activate/reactivate a user
 */
export async function activateUser(userId: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/admin/users/${userId}/activate`);
}

/**
 * Recall an event (pull down approved event)
 */
export async function recallEvent(eventId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/admin/events/${eventId}/recall`, { reason });
}

/**
 * Get users with filters (for moderation)
 */
export async function getUsers(options?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; data: unknown[]; pagination: unknown }> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.search) params.append('search', options.search);

  const query = params.toString();
  return apiGet<{ success: boolean; data: unknown[]; pagination: unknown }>(`/admin/users${query ? `?${query}` : ''}`);
}
