/**
 * Attendee Import API Functions
 */

import { apiGet, apiPost, apiFetch } from './api';

// Import row structure
export interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  ticketType?: string;
  checkpoints?: string;
}

// Validation error structure
export interface ImportRowError {
  row: number;
  field: string;
  value?: string;
  message: string;
}

// Validation result from server
export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ImportRowError[];
  preview: ImportRow[];
}

// Import result from server
export interface ImportResult {
  importId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportRowError[];
}

// Import history record
export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  sendWelcomeEmails: boolean;
  createdAt: string;
  completedAt: string | null;
}

// Import options
export interface ImportOptions {
  sendWelcomeEmails?: boolean;
  skipDuplicates?: boolean;
  defaultTicketType?: string;
}

/**
 * Download CSV template for import
 */
export const downloadImportTemplate = async (eventId: string): Promise<void> => {
  const response = await apiFetch(`/events/${eventId}/import/template`);

  if (!response.ok) {
    throw new Error('Failed to download template');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendee-import-template.csv';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Validate import file (dry run)
 */
export const validateImportFile = async (
  eventId: string,
  file: File,
): Promise<ValidationResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const result = await apiPost<{ success: boolean; data: ValidationResult }>(
    `/events/${eventId}/import/validate`,
    formData,
  );
  return result.data;
};

/**
 * Execute import
 */
export const executeImport = async (
  eventId: string,
  file: File,
  options: ImportOptions = {},
): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  if (options.sendWelcomeEmails !== undefined) {
    formData.append('sendWelcomeEmails', String(options.sendWelcomeEmails));
  }
  if (options.skipDuplicates !== undefined) {
    formData.append('skipDuplicates', String(options.skipDuplicates));
  }
  if (options.defaultTicketType) {
    formData.append('defaultTicketType', options.defaultTicketType);
  }

  const result = await apiPost<{ success: boolean; data: ImportResult }>(
    `/events/${eventId}/import`,
    formData,
  );
  return result.data;
};

/**
 * Get import history for event
 */
export const getImportHistory = async (
  eventId: string,
  limit = 20,
  offset = 0,
): Promise<{ imports: ImportHistoryRecord[]; total: number }> => {
  const response = await apiGet<{
    success: boolean;
    data: { imports: ImportHistoryRecord[]; total: number };
  }>(`/events/${eventId}/imports?limit=${limit}&offset=${offset}`);

  if (!response.success) {
    throw new Error('Failed to fetch import history');
  }

  return response.data;
};

/**
 * Get import details
 */
export const getImportDetails = async (
  eventId: string,
  importId: string,
): Promise<ImportHistoryRecord & { errors: ImportRowError[] }> => {
  const response = await apiGet<{
    success: boolean;
    data: ImportHistoryRecord & { errors: ImportRowError[] };
  }>(`/events/${eventId}/imports/${importId}`);

  if (!response.success) {
    throw new Error('Failed to fetch import details');
  }

  return response.data;
};

// Quick register request
export interface QuickRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  ticketType?: string;
  registrationData?: Record<string, unknown>;
}

// Quick register response
export interface QuickRegisterResult {
  registrationId: string;
  attendeeName: string;
  email: string;
  ticketType: string | null;
  backupCode: string;
  qrCodeDataUrl: string | null;
}

/**
 * Quick register a single attendee (walk-in registration)
 */
export const quickRegisterAttendee = async (
  eventId: string,
  data: QuickRegisterRequest,
): Promise<QuickRegisterResult> => {
  const response = await apiPost<{
    success: boolean;
    message: string;
    data: QuickRegisterResult;
  }>(`/events/${eventId}/attendees/register`, data);

  if (!response.success) {
    throw new Error('Failed to register attendee');
  }

  return response.data;
};

/**
 * Export attendees to CSV
 */
export const exportAttendees = async (eventId: string): Promise<void> => {
  const response = await apiFetch(`/events/${eventId}/attendees/export`);

  if (!response.ok) {
    throw new Error('Failed to export attendees');
  }

  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'attendees.csv';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
