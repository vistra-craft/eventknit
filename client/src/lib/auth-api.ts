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
  companyAffiliation?: string | null;
  organizerEntityType?: string | null;
  organizerIndustry?: string | null;
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
  avatar?: string | null;
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
 * Request email verification code (for existing unverified user)
 */
export const requestEmailVerification = async (email: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/verify-email/request', { email });
};

/**
 * Check-only: validate OTP without marking it used or requiring user to exist.
 * Use this during registration to give immediate feedback at the OTP step.
 */
export const checkEmailVerificationCode = async (email: string, code: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/verify-email/check', { email, code });
};

/**
 * Confirm email verification with OTP code (marks code as used, requires user to exist)
 */
export const confirmEmailVerification = async (email: string, code: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>('/auth/verify-email/confirm', { email, code });
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
 * Verify invitation token and get associated email (for pre-filling forms)
 */
export interface VerifyInvitationResponse {
  success: boolean;
  data: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const verifyInvitationToken = async (token: string): Promise<VerifyInvitationResponse> => {
  return apiGet<VerifyInvitationResponse>(`/auth/verify-invitation?token=${encodeURIComponent(token)}`);
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
  formData.append('image', file);
  return apiPut<ApiResponse<{ avatar: string }>>('/auth/profile', formData);
};

// ─── Staff Invitations ────────────────────────────────────────────────────────

export interface StaffInvitationInfo {
  email: string;
  role: string;
  scope: string;
  organizationName?: string;
  inviterName: string;
  message?: string;
  expiresAt: string;
}

export const validateStaffInvitation = async (
  token: string,
): Promise<ApiResponse<StaffInvitationInfo>> => {
  return apiPost<ApiResponse<StaffInvitationInfo>>('/auth/staff-invitation/validate', { token });
};

export interface AcceptStaffInvitationData {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AcceptStaffInvitationResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      status: UserStatus;
      isEmailVerified: boolean;
      organizationName?: string;
      createdAt: string;
      updatedAt: string;
    };
    accessToken: string;
    expiresIn: string;
  };
}

export const acceptStaffInvitation = async (
  data: AcceptStaffInvitationData,
): Promise<AcceptStaffInvitationResponse> => {
  return apiPost<AcceptStaffInvitationResponse>('/auth/staff-invitation/accept', data);
};




