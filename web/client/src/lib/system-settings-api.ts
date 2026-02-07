import { apiGet, apiPut, type ApiResponse } from './api';

export interface SystemSetting {
  id: string;
  key: string;
  value: string | number | boolean | Record<string, unknown> | unknown[];
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'users' | 'notifications' | 'security' | 'appearance' | 'email' | 'api' | 'maintenance';
  description?: string;
  isPublic: boolean;
  isEncrypted: boolean;
  environment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  settings: SystemSetting[];
}

export interface SettingResponse {
  setting: SystemSetting;
}

/**
 * Get all system settings (optionally filtered by category)
 */
export const getSettings = async (
  category?: string,
  environment?: string
): Promise<ApiResponse<SettingsResponse>> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (environment) params.append('environment', environment);
  
  const query = params.toString();
  const endpoint = `/admin/settings${query ? `?${query}` : ''}`;
  
  return apiGet<ApiResponse<SettingsResponse>>(endpoint);
};

/**
 * Get a single setting by key
 */
export const getSetting = async (
  key: string,
  environment?: string
): Promise<ApiResponse<SettingResponse>> => {
  const params = new URLSearchParams();
  if (environment) params.append('environment', environment);
  
  const query = params.toString();
  const endpoint = `/admin/settings/${key}${query ? `?${query}` : ''}`;
  
  return apiGet<ApiResponse<SettingResponse>>(endpoint);
};

/**
 * Set a single setting
 */
export const setSetting = async (
  key: string,
  value: string | number | boolean | Record<string, unknown> | unknown[],
  type: 'string' | 'number' | 'boolean' | 'json',
  category: 'general' | 'users' | 'notifications' | 'security' | 'appearance' | 'email' | 'api' | 'maintenance',
  options?: {
    description?: string;
    isPublic?: boolean;
    isEncrypted?: boolean;
    environment?: string;
    changeReason?: string;
  }
): Promise<ApiResponse<SettingResponse>> => {
  return apiPut<ApiResponse<SettingResponse>>(`/admin/settings/${key}`, {
    value,
    type,
    category,
    ...options,
  });
};

/**
 * Set multiple settings at once (bulk update)
 */
export const setSettings = async (
  settings: Array<{
    key: string;
    value: string | number | boolean | Record<string, unknown> | unknown[];
    type: 'string' | 'number' | 'boolean' | 'json';
    category: 'general' | 'users' | 'notifications' | 'security' | 'appearance' | 'email' | 'api' | 'maintenance';
    description?: string;
    isPublic?: boolean;
    isEncrypted?: boolean;
    environment?: string;
  }>,
  changeReason?: string
): Promise<ApiResponse<SettingsResponse>> => {
  return apiPut<ApiResponse<SettingsResponse>>('/admin/settings', {
    settings,
    changeReason,
  });
};

/**
 * Get public settings (for non-admin users)
 */
export const getPublicSettings = async (): Promise<ApiResponse<SettingsResponse>> => {
  return apiGet<ApiResponse<SettingsResponse>>('/admin/settings/public');
};


