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
 * Request registration verification code (email-only registration)
 */
export const requestRegistrationCode = async (
  email: string,
  role?: 'ATTENDEE' | 'ORGANIZER'
): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/register-code/request', { email, role });
};

/**
 * Verify registration code and create account
 */
export const verifyRegistrationCode = async (
  email: string,
  code: string,
  password: string
): Promise<RegisterResponse> => {
  return apiPost<RegisterResponse>('/auth/register-code/verify', { email, code, password });
};

/**
 * Request Email OAuth code (code-based passwordless login/registration)
 */
export const requestEmailOAuthCode = async (
  email: string,
  role?: 'ATTENDEE' | 'ORGANIZER'
): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/email-oauth/request', { email, role });
};

/**
 * Verify Email OAuth code and authenticate user (creates account if new, logs in if existing)
 */
export const verifyEmailOAuthCode = async (
  email: string,
  code: string
): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/email-oauth/verify', { email, code });
};

/**
 * Facebook OAuth login/registration
 */
export const facebookAuth = async (
  accessToken: string,
  role?: 'ATTENDEE' | 'ORGANIZER'
): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/facebook', { accessToken, role });
};

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

/**
 * Request magic link login (send email with login link)
 */
export const requestMagicLink = async (email: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/magic-link/request', { email });
};

/**
 * Verify magic link token and auto-login user
 */
export const verifyMagicLink = async (token: string): Promise<LoginResponse> => {
  return apiGet<LoginResponse>(`/auth/magic-link/verify?token=${token}`);
};

/**
 * Create account from invitation token (for guest users)
 */
export const createAccountFromInvitation = async (token: string, password: string): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/create-account', { token, password });
};




