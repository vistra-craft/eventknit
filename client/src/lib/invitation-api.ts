/**
 * Invitation API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse, API_BASE_URL } from './api';

/**
 * Invite Type enum (matches backend)
 */
export enum InviteType {
  ATTENDEE = 'ATTENDEE',
  SPEAKER = 'SPEAKER',
  EXHIBITOR = 'EXHIBITOR',
  GUEST = 'GUEST',
}

/**
 * Create Invitation data
 */
export interface CreateInvitationData {
  inviteType: InviteType;
  title?: string;
  description?: string;
  expiresAt?: string; // ISO date string
  maxUses?: number;
}

/**
 * Update Invitation data
 */
export interface UpdateInvitationData {
  title?: string;
  description?: string;
  expiresAt?: string | null; // ISO date string or null
  maxUses?: number | null;
  isActive?: boolean;
}

/**
 * Invitation Response
 */
export interface InvitationResponse {
  success: boolean;
  message?: string;
  data: {
    invitation: {
      id: string;
      eventId: string;
      inviteType: InviteType;
      token: string;
      title: string | null;
      description: string | null;
      expiresAt: string | null;
      maxUses: number | null;
      usedCount: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      event?: {
        id: string;
        title: string;
        description: string;
        registrationFields?: Array<{
          id: string;
          name: string;
          label: string;
          type: string;
          required: boolean;
          placeholder?: string;
          options?: string[];
        }>;
        [key: string]: unknown;
      };
    };
  };
}

/**
 * Invitations List Response
 */
export interface InvitationsListResponse {
  success: boolean;
  data: {
    invitations: Array<{
      id: string;
      eventId: string;
      inviteType: InviteType;
      token: string;
      title: string | null;
      description: string | null;
      expiresAt: string | null;
      maxUses: number | null;
      usedCount: number;
      usageCount: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      creator: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
  };
}

/**
 * Register via Invitation Response
 */
export interface RegisterViaInvitationResponse {
  success: boolean;
  message: string;
  data: {
    registration: {
      id: string;
      eventId: string;
      userId: string;
      status: string;
      ticketType?: string;
      quantity?: number;
      createdAt: string;
    };
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isNewUser: boolean;
    };
  };
}

/**
 * Create a new invitation link for an event
 */
export const createInvitation = async (
  eventId: string,
  data: CreateInvitationData
): Promise<InvitationResponse> => {
  return apiPost<InvitationResponse>(`/invitations/events/${eventId}`, data);
};

/**
 * Get all invitations for an event
 */
export const getEventInvitations = async (
  eventId: string
): Promise<InvitationsListResponse> => {
  return apiGet<InvitationsListResponse>(`/invitations/events/${eventId}`);
};

/**
 * Get invitation by token (public - for registration form)
 */
export const getInvitationByToken = async (
  token: string
): Promise<InvitationResponse> => {
  // Public endpoint - no auth required
  // API Base URL - uses VITE_API_BASE_URL environment variable if set
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '/api/v1' : 'https://eventknit.onrender.com/api/v1');
  const response = await fetch(`${API_BASE_URL}/invitations/${token}`);
  const data = await response.json();

  if (!response.ok) {
    throw {
      success: false,
      message: data.message || 'Failed to fetch invitation',
    };
  }

  return data;
};

/**
 * Update an invitation
 */
export const updateInvitation = async (
  invitationId: string,
  data: UpdateInvitationData
): Promise<InvitationResponse> => {
  return apiPut<InvitationResponse>(`/invitations/${invitationId}`, data);
};

/**
 * Revoke an invitation
 */
export const revokeInvitation = async (
  invitationId: string
): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>(`/invitations/${invitationId}/revoke`);
};

/**
 * Delete an invitation
 */
export const deleteInvitation = async (
  invitationId: string
): Promise<ApiResponse<void>> => {
  return apiDelete<ApiResponse<void>>(`/invitations/${invitationId}`);
};

/**
 * Register for event via invitation link (public - no auth required)
 */
export const registerViaInvitation = async (
  token: string,
  registrationData: Record<string, unknown>
): Promise<RegisterViaInvitationResponse> => {
  // Public endpoint - no auth required
  // API Base URL - imported from ./api
  const response = await fetch(`${API_BASE_URL}/invitations/${token}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registrationData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      success: false,
      message: data.message || 'Failed to register via invitation',
      errors: data.errors,
    };
  }

  return data;
};

/**
 * Generate registration link URL
 */
export const getRegistrationLinkUrl = (token: string): string => {
  // Use environment variable if set, otherwise use current origin (works for both localhost and production)
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  return `${frontendUrl}/register/${token}`;
};



