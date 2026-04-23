import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { ParticipantType } from './participant-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormPurpose =
  | 'SPEAKER_APPLICATION'
  | 'EXHIBITOR_APPLICATION'
  | 'SPONSOR_APPLICATION'
  | 'VOLUNTEER_APPLICATION'
  | 'PERFORMER_APPLICATION'
  | 'VENDOR_APPLICATION'
  | 'JUDGE_APPLICATION'
  | 'MEDIA_APPLICATION'
  | 'REGISTRATION'
  | 'FEEDBACK'
  | 'GENERAL_INQUIRY'
  | 'CUSTOM';

export type FormStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface FormTheme {
  accentColor?: string;
}

export type FormResponseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED';

export type FormQuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'url'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'rating'
  | 'scale'
  | 'file_upload'
  | 'section_break';

export interface FormQuestionOption {
  value: string;
  label: string;
}

export interface FormQuestion {
  id: string;
  type: FormQuestionType;
  label: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: FormQuestionOption[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  sectionTitle?: string;
  sectionDescription?: string;
}

export interface EventForm {
  id: string;
  eventId: string | null;
  event: { id: string; title: string; slug: string | null } | null;
  createdById: string;
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  title: string;
  description: string | null;
  purpose: FormPurpose;
  customPurpose: string | null;
  targetParticipantType: ParticipantType | null;
  status: FormStatus;
  questions: FormQuestion[];
  shareToken: string;
  isPublic: boolean;
  allowMultipleResponses: boolean;
  maxResponses: number | null;
  closesAt: string | null;
  notifyOnSubmission: boolean;
  notificationEmail: string | null;
  theme: FormTheme | null;
  _count: { responses: number };
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  form: { id: string; title: string; purpose: FormPurpose };
  respondentId: string | null;
  respondent: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  respondentEmail: string;
  respondentName: string | null;
  status: FormResponseStatus;
  answers: Record<string, string | string[] | number | null>;
  reviewedBy: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  participant: { id: string; type: ParticipantType; status: string } | null;
  submittedAt: string;
  updatedAt: string;
}

// ─── Form API ─────────────────────────────────────────────────────────────────

export async function listForms(params: {
  page?: number;
  limit?: number;
  status?: FormStatus;
  purpose?: FormPurpose;
  eventId?: string;
} = {}): Promise<{ success: boolean; forms: EventForm[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.purpose) query.set('purpose', params.purpose);
  if (params.eventId) query.set('eventId', params.eventId);
  const qs = query.toString();
  return apiGet(`/forms${qs ? `?${qs}` : ''}`);
}

export async function getForm(formId: string): Promise<{ success: boolean; form: EventForm }> {
  return apiGet(`/forms/${formId}`);
}

export async function createForm(data: {
  title: string;
  description?: string;
  eventId?: string;
  purpose?: FormPurpose;
  customPurpose?: string;
  targetParticipantType?: ParticipantType;
  questions?: FormQuestion[];
  isPublic?: boolean;
  allowMultipleResponses?: boolean;
  maxResponses?: number;
  closesAt?: string;
  notifyOnSubmission?: boolean;
  notificationEmail?: string;
  theme?: FormTheme;
}): Promise<{ success: boolean; form: EventForm }> {
  return apiPost('/forms', data);
}

export async function updateForm(
  formId: string,
  data: Partial<{
    title: string;
    description: string;
    purpose: FormPurpose;
    customPurpose: string;
    targetParticipantType: ParticipantType;
    questions: FormQuestion[];
    status: FormStatus;
    isPublic: boolean;
    allowMultipleResponses: boolean;
    maxResponses: number | null;
    closesAt: string | null;
    notifyOnSubmission: boolean;
    notificationEmail: string;
    theme: FormTheme | null;
  }>,
): Promise<{ success: boolean; form: EventForm }> {
  return apiPatch(`/forms/${formId}`, data);
}

export async function deleteForm(formId: string): Promise<{ success: boolean }> {
  return apiDelete(`/forms/${formId}`);
}

// ─── Responses API ────────────────────────────────────────────────────────────

export async function listResponses(
  formId: string,
  params: { page?: number; limit?: number; status?: FormResponseStatus } = {},
): Promise<{ success: boolean; responses: FormResponse[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  return apiGet(`/forms/${formId}/responses${qs ? `?${qs}` : ''}`);
}

export async function getResponse(formId: string, responseId: string): Promise<{ success: boolean; response: FormResponse }> {
  return apiGet(`/forms/${formId}/responses/${responseId}`);
}

export async function reviewResponse(
  formId: string,
  responseId: string,
  data: { status: FormResponseStatus; reviewNotes?: string; createParticipant?: boolean },
): Promise<{ success: boolean; response: FormResponse }> {
  return apiPatch(`/forms/${formId}/responses/${responseId}/review`, data);
}

// ─── Public Form API (no auth) ────────────────────────────────────────────────

export async function getPublicForm(shareToken: string): Promise<{ success: boolean; form: Omit<EventForm, 'createdById' | 'notificationEmail'> }> {
  return apiGet(`/forms/public/${shareToken}`);
}

export async function submitPublicForm(
  shareToken: string,
  data: {
    respondentEmail: string;
    respondentName?: string;
    answers: Record<string, string | string[] | number | null>;
  },
): Promise<{ success: boolean; response: { id: string; submittedAt: string } }> {
  return apiPost(`/forms/public/${shareToken}/submit`, data);
}
