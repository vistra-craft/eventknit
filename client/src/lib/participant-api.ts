import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticipantType =
  | 'SPEAKER'
  | 'EXHIBITOR'
  | 'SPONSOR'
  | 'VOLUNTEER'
  | 'PERFORMER'
  | 'VENDOR'
  | 'JUDGE'
  | 'STAFF'
  | 'VIP'
  | 'MEDIA'
  | 'CUSTOM';

export type ParticipantStatus =
  | 'INVITED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'CONFIRMED'
  | 'DECLINED';

export interface ParticipantUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar: string | null;
}

export interface Participant {
  id: string;
  eventId: string;
  userId: string | null;
  user: ParticipantUser | null;
  type: ParticipantType;
  status: ParticipantStatus;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  bio: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  avatarUrl: string | null;
  metadata: Record<string, unknown> | null;
  customType: string | null;
  formResponseId: string | null;
  addedBy: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  reviewedBy: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantListResponse {
  success: boolean;
  participants: Participant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateParticipantData {
  name: string;
  email: string;
  type: ParticipantType;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  customType?: string;
}

export interface UpdateParticipantData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  customType?: string;
  status?: ParticipantStatus;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function listParticipants(
  eventId: string,
  params: {
    page?: number;
    limit?: number;
    type?: ParticipantType;
    status?: ParticipantStatus;
    search?: string;
  } = {},
): Promise<ParticipantListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiGet(`/events/${eventId}/participants${qs ? `?${qs}` : ''}`);
}

export async function getParticipant(eventId: string, participantId: string): Promise<{ success: boolean; participant: Participant }> {
  return apiGet(`/events/${eventId}/participants/${participantId}`);
}

export async function createParticipant(
  eventId: string,
  data: CreateParticipantData,
): Promise<{ success: boolean; participant: Participant }> {
  return apiPost(`/events/${eventId}/participants`, data);
}

export async function updateParticipant(
  eventId: string,
  participantId: string,
  data: UpdateParticipantData,
): Promise<{ success: boolean; participant: Participant }> {
  return apiPatch(`/events/${eventId}/participants/${participantId}`, data);
}

export async function reviewParticipant(
  eventId: string,
  participantId: string,
  status: ParticipantStatus,
  reviewNotes?: string,
): Promise<{ success: boolean; participant: Participant }> {
  return apiPatch(`/events/${eventId}/participants/${participantId}/review`, { status, reviewNotes });
}

export async function deleteParticipant(eventId: string, participantId: string): Promise<{ success: boolean }> {
  return apiDelete(`/events/${eventId}/participants/${participantId}`);
}
