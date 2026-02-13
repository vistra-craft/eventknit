/**
 * Role Management API
 * Handles role upgrades and transitions
 */

import { apiPost } from './api';
import type { User } from '../types/auth';

/**
 * API Response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Become Organizer Response
 */
export interface BecomeOrganizerResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Upgrade user from ATTENDEE to ORGANIZER
 * Allows users to start creating and managing events
 */
export const becomeOrganizer = async (): Promise<BecomeOrganizerResponse> => {
  try {
    const response = await apiPost<BecomeOrganizerResponse>(
      '/user/role-switch/become-organizer',
      {}
    );
    return response;
  } catch (error) {
    console.error('Error upgrading to organizer:', error);
    throw error;
  }
};

/**
 * Request organizer verification/KYC
 * Required for certain features like payouts
 */
export const requestOrganizerVerification = async (data: {
  businessName?: string;
  businessType?: string;
  taxId?: string;
}): Promise<ApiResponse> => {
  try {
    const response = await apiPost<ApiResponse>(
      '/organizer/verification/request',
      data
    );
    return response;
  } catch (error) {
    console.error('Error requesting verification:', error);
    throw error;
  }
};
