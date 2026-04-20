import { apiGet, apiPost, apiRequest, type ApiResponse } from './api';

export interface ExportedUserData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    createdAt: string;
  };
  registrations: unknown[];
  payments: unknown[];
  notifications: unknown[];
  ticketTransfers: unknown[];
  preferences: unknown;
}

/**
 * Request a data export via email (generates a download link sent to user's email)
 */
export const requestDataExport = async (): Promise<ApiResponse<{ message: string }>> => {
  return apiPost<ApiResponse<{ message: string }>>('/gdpr/export');
};

/**
 * Get user's data directly as JSON
 */
export const getDataExport = async (): Promise<ApiResponse<ExportedUserData>> => {
  return apiGet<ApiResponse<ExportedUserData>>('/gdpr/export');
};

/**
 * Delete (anonymize) user account — requires email confirmation
 */
export const deleteAccount = async (
  confirmEmail: string,
  reason?: string
): Promise<ApiResponse<{ message: string }>> => {
  return apiRequest<ApiResponse<{ message: string }>>('/gdpr/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmEmail, reason }),
  });
};
