/**
 * Notification API Functions
 */

import { apiGet, apiPut, apiDelete, apiPatch, type ApiResponse } from './api';

export type NotificationType =
  | 'EVENT_REMINDER_24H'
  | 'EVENT_REMINDER_1H'
  | 'EVENT_UPDATE'
  | 'EVENT_CANCELLED'
  | 'EVENT_POSTPONED'
  | 'EVENT_VENUE_CHANGED'
  | 'EVENT_TIME_CHANGED'
  | 'REGISTRATION_DEADLINE_REMINDER'
  | 'REGISTRATION_DEADLINE_24H'
  | 'REGISTRATION_DEADLINE_1H'
  | 'WAITLIST_AVAILABLE'
  | 'CAPACITY_FULL'
  | 'EVENT_COMPLETED'
  | 'EVENT_APPROVED'
  | 'EVENT_REJECTED'
  | 'EVENT_CANCELLED_BY_ADMIN'
  | 'REGISTRATION_MILESTONE_50'
  | 'REGISTRATION_MILESTONE_75'
  | 'REGISTRATION_MILESTONE_100'
  | 'CAPACITY_REACHED'
  | 'PAYMENT_RECEIVED'
  | 'REFUND_PROCESSED'
  | 'EVENT_PERFORMANCE_SUMMARY'
  | 'REGISTRATION_CONFIRMED'
  | 'REGISTRATION_CANCELLED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_SUCCESS'
  | 'REFUND_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'PLATFORM_UPDATE'
  | 'MAINTENANCE_SCHEDULED'
  | 'SECURITY_ALERT'
  | 'NEW_EVENT_AVAILABLE'
  | 'PROMOTION_OFFER'
  | 'EARLY_BIRD_REMINDER'
  | 'ACCOUNT_VERIFIED'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_ATTEMPT'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_ACTIVATED'
  | 'STAFF_ASSIGNED_TO_EVENT'
  | 'STAFF_REMOVED_FROM_EVENT'
  | 'STAFF_ASSIGNMENT_UPDATED'
  | 'EVENT_UPDATE_FOR_STAFF'
  | 'EVENT_CANCELLED_FOR_STAFF'
  | 'EVENT_REMINDER_FOR_STAFF';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type DeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  emailStatus?: DeliveryStatus | null;
  smsStatus?: DeliveryStatus | null;
  pushStatus?: DeliveryStatus | null;
  inAppStatus?: DeliveryStatus | null;
  isRead: boolean;
  readAt?: string | null;
  priority: NotificationPriority;
  expiresAt?: string | null;
  eventId?: string | null;
  registrationId?: string | null;
  relatedUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
  eventId?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  eventReminders: boolean;
  eventUpdates: boolean;
  eventCancellations: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  systemAnnouncements: boolean;
  registrationUpdates: boolean;
  staffNotifications?: boolean;
  reminderFrequency: 'all' | 'daily_digest' | 'weekly_digest' | 'none';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesData {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  eventReminders?: boolean;
  eventUpdates?: boolean;
  eventCancellations?: boolean;
  paymentNotifications?: boolean;
  marketingEmails?: boolean;
  systemAnnouncements?: boolean;
  registrationUpdates?: boolean;
  staffNotifications?: boolean;
  reminderFrequency?: 'all' | 'daily_digest' | 'weekly_digest' | 'none';
}

/**
 * Get user notifications
 */
export const getNotifications = async (
  filters?: NotificationFilters
): Promise<ApiResponse<{ notifications: Notification[] }>> => {
  const queryParams = new URLSearchParams();
  
  if (filters) {
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.isRead !== undefined) queryParams.append('isRead', String(filters.isRead));
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.eventId) queryParams.append('eventId', filters.eventId);
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    if (filters.offset) queryParams.append('offset', String(filters.offset));
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<ApiResponse<{ notifications: Notification[] }>>(endpoint);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  return apiGet<ApiResponse<{ count: number }>>('/notifications/unread-count');
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string): Promise<ApiResponse<{ notification: Notification }>> => {
  return apiPatch<ApiResponse<{ notification: Notification }>>(`/notifications/${id}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<ApiResponse<{ count: number }>> => {
  return apiPatch<ApiResponse<{ count: number }>>('/notifications/read-all');
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: string): Promise<ApiResponse<void>> => {
  return apiDelete<ApiResponse<void>>(`/notifications/${id}`);
};

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = async (): Promise<ApiResponse<{ preferences: NotificationPreferences }>> => {
  return apiGet<ApiResponse<{ preferences: NotificationPreferences }>>('/users/me/notification-preferences');
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: UpdateNotificationPreferencesData
): Promise<ApiResponse<{ preferences: NotificationPreferences }>> => {
  return apiPut<ApiResponse<{ preferences: NotificationPreferences }>>(
    '/users/me/notification-preferences',
    preferences
  );
};

