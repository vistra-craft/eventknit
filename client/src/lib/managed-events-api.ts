import { apiGet, apiPost, apiPut } from './api';

export type ManagedClientType = 'CORPORATE' | 'NGO' | 'GOVERNMENT' | 'PLATFORM' | 'OTHER';

export interface ManagedEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  venue?: string;
  isFree: boolean;
  price?: number;
  capacity?: number;
  availableSlots?: number;
  image?: string;
  clientName?: string;
  clientType?: ManagedClientType;
  clientContactEmail?: string;
  clientContactPhone?: string;
  clientContractRef?: string;
  managedByAdminId?: string;
  managedByAdmin?: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
  _count?: { registrations: number };
}

export interface ManagedEventStats {
  total: number;
  active: number;
  upcoming: number;
  byClientType: Array<{ clientType: ManagedClientType | null; _count: number }>;
}

export interface CreateManagedEventPayload {
  clientName: string;
  clientType: ManagedClientType;
  clientContactEmail?: string;
  clientContactPhone?: string;
  clientContractRef?: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isFree: boolean;
  price?: number;
  capacity?: number;
  category?: string;
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
  timezone?: string;
}

interface ManagedEventsListResponse {
  success: boolean;
  data: {
    events: ManagedEvent[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
}

interface ManagedEventResponse {
  success: boolean;
  message?: string;
  data: { event: ManagedEvent };
}

interface ManagedEventStatsResponse {
  success: boolean;
  data: { stats: ManagedEventStats };
}

export async function getManagedEvents(params?: {
  status?: string;
  clientType?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ManagedEventsListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.clientType) query.set('clientType', params.clientType);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return apiGet<ManagedEventsListResponse>(`/admin/managed-events?${query.toString()}`);
}

export async function getManagedEventStats(): Promise<ManagedEventStatsResponse> {
  return apiGet<ManagedEventStatsResponse>('/admin/managed-events/stats');
}

export async function getManagedEventById(eventId: string): Promise<ManagedEventResponse> {
  return apiGet<ManagedEventResponse>(`/admin/managed-events/${eventId}`);
}

export async function createManagedEvent(payload: CreateManagedEventPayload): Promise<ManagedEventResponse> {
  return apiPost<ManagedEventResponse>('/admin/managed-events', payload);
}

export async function updateManagedEvent(eventId: string, payload: Partial<CreateManagedEventPayload>): Promise<ManagedEventResponse> {
  return apiPut<ManagedEventResponse>(`/admin/managed-events/${eventId}`, payload);
}

export async function cancelManagedEvent(eventId: string, reason?: string): Promise<ManagedEventResponse> {
  return apiPost<ManagedEventResponse>(`/admin/managed-events/${eventId}/cancel`, { reason });
}
