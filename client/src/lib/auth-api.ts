/**
 * Authentication API Functions
 */

import { apiPost, apiGet, apiPut, API_BASE_URL, type ApiResponse } from './api';
import { UserRole, UserStatus } from '../types/auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  otherName?: string | null;
  phoneNumber?: string | null;
  companyAffiliation?: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  organizationName?: string | null;
  businessEmail?: string | null;
  avatar?: string | null;
  kycStatus?: string | null;
  lastLoginAt?: string | null;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
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
  password: string,
  firstName: string,
  lastName: string
): Promise<RegisterResponse> => {
  return apiPost<RegisterResponse>('/auth/register-code/verify', { email, code, password, firstName, lastName });
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
 * Apple OAuth login/registration
 */
export const appleAuth = async (
  authorizationCode: string,
  idToken: string,
  role?: 'ATTENDEE' | 'ORGANIZER',
  user?: { name?: { firstName?: string; lastName?: string } }
): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/apple', {
    authorizationCode,
    idToken,
    role,
    user,
  });
};

/**
 * Google OAuth login/registration
 */
export const googleAuth = async (
  token: string,
  tokenType: 'id_token' | 'access_token' = 'id_token',
  role?: 'ATTENDEE' | 'ORGANIZER'
): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/google', { token, tokenType, role });
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
 * Supports both JSON data and FormData (for avatar uploads)
 */
export const updateProfile = async (data: Partial<RegisterData> | FormData): Promise<ProfileResponse> => {
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
 * Setup password for guest users (users without password)
 */
export const setupPassword = async (password: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/password/setup', { password });
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

export interface ResendInvitationResponse {
  success: boolean;
  message: string;
}

export const resendAccountInvitation = async (email: string): Promise<ResendInvitationResponse> => {
  return apiPost<ResendInvitationResponse>('/auth/resend-invitation', { email });
};

/**
 * Upload user avatar/profile photo
 * Uploads to Cloudinary via backend
 */
export const uploadAvatar = async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: formData,
  })
    .then(res => res.json())
    .catch(error => ({
      success: false,
      message: 'Failed to upload avatar',
      error,
    }));
};




