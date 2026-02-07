import { apiGet, apiPut, apiPatch, apiPost, type ApiResponse } from './api';

export interface UserPreferences {
  id: string;
  userId: string;
  // Appearance
  theme?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  dashboardLayout?: 'compact' | 'spacious';
  showMetrics?: boolean;
  showCharts?: boolean;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  // Privacy
  profileVisibility?: 'public' | 'private' | 'friends';
  showEmail?: boolean;
  showPhone?: boolean;
  allowMessages?: boolean;
  // Account
  sessionTimeout?: number; // minutes
  loginAlerts?: boolean;
  twoFactorAuth?: boolean;
  // Organizer-specific
  eventNotifications?: boolean;
  registrationNotifications?: boolean;
  paymentNotifications?: boolean;
  marketingEmails?: boolean;
  weeklyDigest?: boolean;
  // Attendee-specific
  eventReminders?: boolean;
  eventUpdates?: boolean;
  promotionalOffers?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesResponse {
  preferences: UserPreferences;
}

/**
 * Get current user's preferences
 */
export const getUserPreferences = async (): Promise<ApiResponse<UserPreferencesResponse>> => {
  return apiGet<ApiResponse<UserPreferencesResponse>>('/user/me/preferences');
};

/**
 * Update current user's preferences
 */
export const updateUserPreferences = async (
  preferences: Partial<UserPreferences>
): Promise<ApiResponse<UserPreferencesResponse>> => {
  return apiPut<ApiResponse<UserPreferencesResponse>>('/user/me/preferences', {
    preferences,
  });
};

/**
 * Update a single preference
 */
export const updatePreference = async (
  key: keyof UserPreferences,
  value: unknown
): Promise<ApiResponse<UserPreferencesResponse>> => {
  return apiPatch<ApiResponse<UserPreferencesResponse>>(`/user/me/preferences/${key}`, {
    value,
  });
};

/**
 * Reset preferences to defaults
 */
export const resetPreferences = async (): Promise<ApiResponse<UserPreferencesResponse>> => {
  return apiPost<ApiResponse<UserPreferencesResponse>>('/user/me/preferences/reset', {});
};

/**
 * Get default preferences for current user's role
 */
export const getDefaultPreferences = async (): Promise<ApiResponse<UserPreferencesResponse>> => {
  return apiGet<ApiResponse<UserPreferencesResponse>>('/user/me/preferences/defaults');
};


