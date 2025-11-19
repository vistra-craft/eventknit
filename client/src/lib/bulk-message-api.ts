/**
 * Bulk Message API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from './api';

export type BulkMessageStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';

export type BulkMessageTargetAudience = 'ALL' | 'ORGANIZERS' | 'ATTENDEES' | 'STAFF' | 'SPECIFIC_EVENT';

export type BulkMessageType = 'announcement' | 'marketing' | 'system' | 'event_update';

export interface BulkMessageChannels {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
}

export interface BulkMessage {
  id: string;
  title: string;
  content: string;
  type: BulkMessageType;
  targetAudience: BulkMessageTargetAudience;
  eventId?: string | null;
  channels: BulkMessageChannels;
  status: BulkMessageStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBulkMessageData {
  title: string;
  content: string;
  type: BulkMessageType;
  targetAudience: BulkMessageTargetAudience;
  eventId?: string;
  channels?: BulkMessageChannels;
  scheduledAt?: string;
}

export interface UpdateBulkMessageData {
  title?: string;
  content?: string;
  type?: BulkMessageType;
  targetAudience?: BulkMessageTargetAudience;
  eventId?: string;
  channels?: BulkMessageChannels;
  scheduledAt?: string;
  status?: BulkMessageStatus;
}

export interface BulkMessageFilters {
  status?: BulkMessageStatus;
  type?: BulkMessageType;
  targetAudience?: BulkMessageTargetAudience;
  eventId?: string;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Create a new bulk message
 */
export const createBulkMessage = async (
  data: CreateBulkMessageData
): Promise<ApiResponse<{ message: BulkMessage }>> => {
  return apiPost<ApiResponse<{ message: BulkMessage }>>(
    '/admin/communications/bulk-messages',
    data
  );
};

/**
 * Get all bulk messages with filters
 */
export const getBulkMessages = async (
  filters?: BulkMessageFilters
): Promise<ApiResponse<{ messages: BulkMessage[] }>> => {
  const queryParams = new URLSearchParams();
  
  if (filters) {
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.targetAudience) queryParams.append('targetAudience', filters.targetAudience);
    if (filters.eventId) queryParams.append('eventId', filters.eventId);
    if (filters.createdBy) queryParams.append('createdBy', filters.createdBy);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/admin/communications/bulk-messages${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<ApiResponse<{ messages: BulkMessage[] }>>(endpoint);
};

/**
 * Get bulk message by ID
 */
export const getBulkMessageById = async (id: string): Promise<ApiResponse<{ message: BulkMessage }>> => {
  return apiGet<ApiResponse<{ message: BulkMessage }>>(`/admin/communications/bulk-messages/${id}`);
};

/**
 * Update bulk message
 */
export const updateBulkMessage = async (
  id: string,
  data: UpdateBulkMessageData
): Promise<ApiResponse<{ message: BulkMessage }>> => {
  return apiPut<ApiResponse<{ message: BulkMessage }>>(
    `/admin/communications/bulk-messages/${id}`,
    data
  );
};

/**
 * Delete bulk message
 */
export const deleteBulkMessage = async (id: string): Promise<ApiResponse<void>> => {
  return apiDelete<ApiResponse<void>>(`/admin/communications/bulk-messages/${id}`);
};

/**
 * Send bulk message immediately
 */
export const sendBulkMessage = async (id: string): Promise<ApiResponse<{ message: BulkMessage }>> => {
  return apiPost<ApiResponse<{ message: BulkMessage }>>(
    `/admin/communications/bulk-messages/${id}/send`
  );
};

/**
 * Cancel scheduled bulk message
 */
export const cancelBulkMessage = async (id: string): Promise<ApiResponse<{ message: BulkMessage }>> => {
  return apiPost<ApiResponse<{ message: BulkMessage }>>(
    `/admin/communications/bulk-messages/${id}/cancel`
  );
};

