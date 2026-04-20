/**
 * Service Point Registration API Client
 * Handles walk-in / on-site attendee registration via OTP verification.
 * Backend: POST /api/v1/events/:eventId/service-point/*
 */

import { apiGet, apiPost, apiDelete } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegistrationSession {
  sessionId: string;
  status: 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  phoneNumber: string;
  expiresAt: string;
}

export interface InitiateRegistrationResponse {
  success: boolean;
  data: {
    sessionId: string;
    message: string;
    expiresAt: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  data: {
    sessionId: string;
    verified: boolean;
    message: string;
    // Populated if phone matches an existing user
    existingUser?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface CompleteRegistrationRequest {
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  industry?: string;
  jobTitle?: string;
  ticketTypeId?: string;
  registrationData?: Record<string, unknown>;
}

export interface CompleteRegistrationResponse {
  success: boolean;
  data: {
    registrationId: string;
    attendeeName: string;
    email: string;
    ticketType: string | null;
    qrCode: string;
    backupCode: string;
    message: string;
  };
}

export interface SessionStatusResponse {
  success: boolean;
  data: {
    session: RegistrationSession;
  };
}

export interface ServicePointStats {
  totalRegistrations: number;
  completedToday: number;
  pendingSessions: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Step 1: Send OTP to the attendee's phone number
 */
export const initiateWalkInRegistration = async (
  eventId: string,
  phoneNumber: string,
  facilityId?: string,
): Promise<InitiateRegistrationResponse> => {
  return apiPost<InitiateRegistrationResponse>(
    `/events/${eventId}/service-point/initiate`,
    { phoneNumber, facilityId },
  );
};

/**
 * Step 2: Verify the OTP entered by the attendee
 */
export const verifyWalkInOTP = async (
  eventId: string,
  sessionId: string,
  otp: string,
): Promise<VerifyOTPResponse> => {
  return apiPost<VerifyOTPResponse>(
    `/events/${eventId}/service-point/verify`,
    { sessionId, otp },
  );
};

/**
 * Step 3: Complete registration with attendee details
 */
export const completeWalkInRegistration = async (
  eventId: string,
  data: CompleteRegistrationRequest,
): Promise<CompleteRegistrationResponse> => {
  return apiPost<CompleteRegistrationResponse>(
    `/events/${eventId}/service-point/complete`,
    data,
  );
};

/**
 * Get the status of a registration session
 */
export const getRegistrationSessionStatus = async (
  eventId: string,
  sessionId: string,
): Promise<SessionStatusResponse> => {
  return apiGet<SessionStatusResponse>(
    `/events/${eventId}/service-point/session/${sessionId}`,
  );
};

/**
 * Cancel an incomplete registration session
 */
export const cancelRegistrationSession = async (
  eventId: string,
  sessionId: string,
): Promise<{ success: boolean; data: { message: string } }> => {
  return apiDelete<{ success: boolean; data: { message: string } }>(
    `/events/${eventId}/service-point/session/${sessionId}`,
  );
};

/**
 * Check if there is already an active session for a phone number
 */
export const checkActiveSessionByPhone = async (
  eventId: string,
  phoneNumber: string,
): Promise<{ success: boolean; data: { session: RegistrationSession | null } }> => {
  return apiGet<{ success: boolean; data: { session: RegistrationSession | null } }>(
    `/events/${eventId}/service-point/check-phone/${encodeURIComponent(phoneNumber)}`,
  );
};
