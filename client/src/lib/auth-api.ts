/**
 * Authentication API Functions
 */

import { apiPost, apiGet, apiPut, type ApiResponse } from './api';
import { UserRole, UserStatus } from '../types/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  otherName?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  organizationName?: string | null;
  businessEmail?: string | null;
  kycStatus?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  phoneNumber?: string;
  companyAffiliation?: string;
  role?: UserRole;
  organizationName?: string;
  businessEmail?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    expiresIn: number;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/login', credentials);
};

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  return apiPost<RegisterResponse>('/auth/register', data);
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  return apiGet<ProfileResponse>('/auth/me');
};

/**
 * Logout user
 */
export const logout = async (): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/logout');
};

/**
 * Update user profile
 */
export const updateProfile = async (data: Partial<RegisterData>): Promise<ProfileResponse> => {
  return apiPut<ProfileResponse>('/auth/profile', data);
};

/**
 * Request password reset
 */
export const forgotPassword = async (email: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/password/reset-request', { email });
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, password: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/password/reset-confirm', { token, password });
};

/**
 * Change password (authenticated users)
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/password/change', {
    currentPassword,
    newPassword,
  });
};

