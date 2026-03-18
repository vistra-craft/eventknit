/**
 * Survey API client
 *
 * Endpoints for post-event survey management and response submission.
 */

import api from './api-client';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CustomQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating';
  options?: string[];
}

export interface EventSurvey {
  id: string;
  eventId: string;
  createdById: string;
  title: string;
  description?: string | null;
  includeNps: boolean;
  includeVenueRating: boolean;
  includeSpeakerRating: boolean;
  includeContentRating: boolean;
  includeOrgRating: boolean;
  includeValueRating: boolean;
  customQuestions: CustomQuestion[];
  triggerAfterHours: number;
  isActive: boolean;
  _count?: { responses: number };
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  eventId: string;
  attendeeId: string;
  overallRating: number;
  npsScore?: number | null;
  venueRating?: number | null;
  speakerRating?: number | null;
  contentRating?: number | null;
  orgRating?: number | null;
  valueRating?: number | null;
  customAnswers?: Record<string, unknown>;
  comment?: string | null;
  submittedAt: string;
  attendee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
  };
}

export interface SurveyResults {
  survey: EventSurvey;
  totalResponses: number;
  averages: {
    overall?: number | null;
    nps?: number | null;
    venue?: number | null;
    speakers?: number | null;
    content?: number | null;
    organization?: number | null;
    value?: number | null;
  };
  npsBreakdown?: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
  } | null;
  responses: SurveyResponse[];
}

export interface CreateSurveyData {
  eventId: string;
  title?: string;
  description?: string;
  includeNps?: boolean;
  includeVenueRating?: boolean;
  includeSpeakerRating?: boolean;
  includeContentRating?: boolean;
  includeOrgRating?: boolean;
  includeValueRating?: boolean;
  customQuestions?: CustomQuestion[];
  triggerAfterHours?: number;
}

export interface SubmitResponseData {
  eventId: string;
  overallRating: number;
  npsScore?: number;
  venueRating?: number;
  speakerRating?: number;
  contentRating?: number;
  orgRating?: number;
  valueRating?: number;
  customAnswers?: Record<string, unknown>;
  comment?: string;
}

// ─── Response wrapper ───────────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── Organizer / Admin API ──────────────────────────────────────────────────────

export async function createSurvey(data: CreateSurveyData) {
  return api.post<ApiResponse<{ survey: EventSurvey }>>('/surveys', data);
}

export async function updateSurvey(surveyId: string, data: Partial<CreateSurveyData> & { isActive?: boolean }) {
  return api.put<ApiResponse<{ survey: EventSurvey }>>(`/surveys/${surveyId}`, data);
}

export async function deleteSurvey(surveyId: string) {
  return api.delete<ApiResponse>(`/surveys/${surveyId}`);
}

export async function getSurveyForOrganizer(eventId: string) {
  return api.get<ApiResponse<{ survey: EventSurvey }>>(`/surveys/event/${eventId}`);
}

export async function getSurveyResults(eventId: string) {
  return api.get<ApiResponse<SurveyResults>>(`/surveys/event/${eventId}/results`);
}

// ─── Attendee API ───────────────────────────────────────────────────────────────

export async function getSurveyForAttendee(eventId: string) {
  return api.get<ApiResponse<{ survey: EventSurvey; hasResponded: boolean }>>(`/surveys/event/${eventId}/public`);
}

export async function submitSurveyResponse(surveyId: string, data: SubmitResponseData) {
  return api.post<ApiResponse<{ response: SurveyResponse }>>(`/surveys/${surveyId}/respond`, data);
}

// ─── Admin API ──────────────────────────────────────────────────────────────────

export async function getAllSurveys(params?: { page?: number; limit?: number; eventId?: string }) {
  return api.get<ApiResponse<{ surveys: EventSurvey[]; total: number; page: number; limit: number }>>('/admin/surveys', { params });
}
