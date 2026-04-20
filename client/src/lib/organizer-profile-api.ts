/**
 * Organizer Profile API Client
 * Handles organizer extended profile operations (bio, website, social links)
 */

import { apiGet, apiPut, type ApiResponse } from './api';

export interface OrganizerProfileData {
  id?: string;
  userId?: string;
  website?: string | null;
  description?: string | null;
  socialLinks?: Record<string, string> | null;
  businessLicense?: string | null;
  taxId?: string | null;
  bankAccountLast4?: string | null;
  location?: string | null;
  totalEvents?: number;
  totalRevenue?: number;
  rating?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizerProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  organizationName?: string | null;
  businessEmail?: string | null;
  status: string;
  role: string;
  avatar?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrganizerProfileResponse {
  user: OrganizerProfileUser | null;
  organizerProfile: OrganizerProfileData | null;
}

export interface UpdateOrganizerProfileRequest {
  website?: string;
  description?: string;
  socialLinks?: Record<string, string>;
  businessLicense?: string;
  taxId?: string;
  bankAccountLast4?: string;
  location?: string;
  markComplete?: boolean;
}

/**
 * Get the current authenticated organizer's profile
 */
export const getMyOrganizerProfile = (): Promise<ApiResponse<GetOrganizerProfileResponse>> => {
  return apiGet<ApiResponse<GetOrganizerProfileResponse>>('/profile/organizer');
};

/**
 * Update the current authenticated organizer's profile
 */
export const updateMyOrganizerProfile = (
  data: UpdateOrganizerProfileRequest,
): Promise<ApiResponse<{ organizerProfile: OrganizerProfileData }>> => {
  return apiPut<ApiResponse<{ organizerProfile: OrganizerProfileData }>>('/profile/organizer', data);
};
