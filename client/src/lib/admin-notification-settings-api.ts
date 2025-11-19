import { apiGet, apiPut, apiDelete, type ApiResponse } from './api';

export interface DefaultNotificationPreferences {
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
  staffNotifications: boolean;
  reminderFrequency: 'all' | 'daily_digest' | 'weekly_digest' | 'none';
}

export interface SystemNotificationConfig {
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  defaultReminderTime: number;
  defaultDeadlineReminderTime: number;
  maxNotificationsPerUser: number;
  notificationRetentionDays: number;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byChannel: {
    email: { sent: number; delivered: number; failed: number };
    sms: { sent: number; delivered: number; failed: number };
    push: { sent: number; delivered: number; failed: number };
    inApp: { sent: number; delivered: number; failed: number };
  };
  byType: Record<string, { sent: number; delivered: number; failed: number }>;
  deliveryRate: number;
  failureRate: number;
}

/**
 * Get default notification preferences
 */
export const getDefaultPreferences = async (): Promise<ApiResponse<{ preferences: DefaultNotificationPreferences }>> => {
  return apiGet<ApiResponse<{ preferences: DefaultNotificationPreferences }>>('/admin/notification-settings/defaults');
};

/**
 * Update default notification preferences
 */
export const updateDefaultPreferences = async (
  preferences: Partial<DefaultNotificationPreferences>
): Promise<ApiResponse<{ preferences: DefaultNotificationPreferences }>> => {
  return apiPut<ApiResponse<{ preferences: DefaultNotificationPreferences }>>('/admin/notification-settings/defaults', preferences);
};

/**
 * Get system-wide notification configuration
 */
export const getSystemConfig = async (): Promise<ApiResponse<{ config: SystemNotificationConfig }>> => {
  return apiGet<ApiResponse<{ config: SystemNotificationConfig }>>('/admin/notification-settings/system');
};

/**
 * Update system-wide notification configuration
 */
export const updateSystemConfig = async (
  config: Partial<SystemNotificationConfig>
): Promise<ApiResponse<{ config: SystemNotificationConfig }>> => {
  return apiPut<ApiResponse<{ config: SystemNotificationConfig }>>('/admin/notification-settings/system', config);
};

/**
 * Get all notification templates
 */
export const getTemplates = async (): Promise<ApiResponse<{ templates: NotificationTemplate[] }>> => {
  return apiGet<ApiResponse<{ templates: NotificationTemplate[] }>>('/admin/notification-settings/templates');
};

/**
 * Get a specific notification template
 */
export const getTemplate = async (type: string): Promise<ApiResponse<{ template: NotificationTemplate }>> => {
  return apiGet<ApiResponse<{ template: NotificationTemplate }>>(`/admin/notification-settings/templates/${type}`);
};

/**
 * Create or update a notification template
 */
export const saveTemplate = async (
  type: string,
  template: Omit<NotificationTemplate, 'id' | 'type'>
): Promise<ApiResponse<{ template: NotificationTemplate }>> => {
  return apiPut<ApiResponse<{ template: NotificationTemplate }>>(`/admin/notification-settings/templates/${type}`, template);
};

/**
 * Delete a notification template
 */
export const deleteTemplate = async (type: string): Promise<ApiResponse<null>> => {
  return apiDelete<ApiResponse<null>>(`/admin/notification-settings/templates/${type}`);
};

/**
 * Get notification analytics summary
 */
export const getAnalytics = async (period?: 'day' | 'week' | 'month'): Promise<ApiResponse<{ analytics: NotificationAnalytics }>> => {
  const params = period ? `?period=${period}` : '';
  return apiGet<ApiResponse<{ analytics: NotificationAnalytics }>>(`/admin/notification-settings/analytics${params}`);
};

