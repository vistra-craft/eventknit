/**
 * Workstation API Client
 * Handles all workstation-related API calls including ticket scanning,
 * manual operations, and event configuration.
 */

import { apiGet, apiPost, apiPut } from './api';

/**
 * Code Type Enum
 */
export enum CodeType {
  QR_CODE = 'QR_CODE',
  BACKUP_CODE = 'BACKUP_CODE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Scan Type Enum
 */
export enum ScanType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  MANUAL_CHECK_IN = 'MANUAL_CHECK_IN',
  MANUAL_CHECK_OUT = 'MANUAL_CHECK_OUT',
}

/**
 * Ticket Status Enum
 */
export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * Scan Request
 */
export interface ScanRequest {
  code: string; // QR code or backup code
  eventId: string;
  facility?: string | null;
  deviceId?: string | null;
  deviceType?: string | null;
}

/**
 * Scan Response
 */
export interface ScanResponse {
  scanId: string;
  registrationId: string;
  eventId: string;
  attendeeName: string;
  ticketType: string | null;
  scanType: ScanType;
  facility: string | null;
  scannedAt: string; // ISO date string
  isReEntry: boolean;
  signatureValid: boolean;
  codeType: CodeType;
}

/**
 * Manual Check-In/Out Request
 */
export interface ManualOperationRequest {
  searchTerm: string;
  eventId: string;
  facility?: string | null;
  code?: string | null; // Optional QR code for signature verification
}

/**
 * Manual Operation Response
 */
export interface ManualOperationResponse {
  scanId: string;
  registrationId: string;
  eventId: string;
  attendeeName: string;
  ticketType: string | null;
  scanType: ScanType;
  facility: string | null;
  scannedAt: string; // ISO date string
  isReEntry: boolean;
  signatureValid?: boolean;
  codeType?: CodeType;
}

/**
 * Search Attendees Request
 */
export interface SearchAttendeesRequest {
  searchTerm: string;
  eventId: string;
  code?: string | null; // Optional QR code for signature verification
  limit?: number;
}

/**
 * Attendee Search Result
 */
export interface AttendeeSearchResult {
  registrationId: string;
  eventId: string;
  attendeeName: string;
  email: string;
  phoneNumber: string | null;
  ticketType: string | null;
  ticketStatus: TicketStatus;
  checkedInAt: string | null; // ISO date string
  checkedOutAt: string | null; // ISO date string
  isCurrentlyInside: boolean;
  reEntryCount: number;
  signatureValid?: boolean;
  codeType?: CodeType;
}

/**
 * Search Attendees Response
 */
export interface SearchAttendeesResponse {
  success: boolean;
  data: {
    attendees: AttendeeSearchResult[];
    total: number;
  };
}

/**
 * Event Scan Configuration
 */
export interface EventScanConfig {
  allowReEntry: boolean;
  requireCheckOut: boolean;
  maxReEntries: number | null;
  scanSettings: {
    [key: string]: unknown;
  } | null;
}

/**
 * Event Statistics
 */
export interface EventStatistics {
  totalAttendees: number;
  checkedIn: number;
  currentlyInside: number;
  checkedOut: number;
  reEntries: number;
  scansToday: number;
  facilitiesData: Array<{
    facility: string | null;
    checkedIn: number;
    currentlyInside: number;
  }>;
}

/**
 * Event Response
 */
export interface EventResponse {
  success: boolean;
  data: {
    event: {
      id: string;
      title: string;
      description: string | null;
      startDate: string;
      endDate: string;
      scanConfig: EventScanConfig;
    };
    statistics: EventStatistics;
  };
}

/**
 * Event Attendee
 */
export interface EventAttendee {
  registrationId: string;
  attendeeId: string;
  attendeeName: string;
  email: string;
  phoneNumber: string | null;
  ticketType: string | null;
  ticketStatus: TicketStatus;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  isCurrentlyInside: boolean;
  reEntryCount: number;
  lastScanFacility: string | null;
}

/**
 * Get Event Attendees Response
 */
export interface GetEventAttendeesResponse {
  success: boolean;
  data: {
    attendees: EventAttendee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Scan History Filters
 */
export interface ScanHistoryFilters {
  facility?: string | null;
  status?: TicketStatus | null;
  scanType?: ScanType | null;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  limit?: number;
}

/**
 * Ticket Scan Record
 */
export interface TicketScanRecord {
  id: string;
  registrationId: string;
  eventId: string;
  scanType: ScanType;
  scannedBy: string;
  scannedAt: string; // ISO date string
  facility: string | null;
  deviceId: string | null;
  deviceType: string | null;
  isValid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  isReEntry: boolean;
  previousScanId: string | null;
  attendeeName: string;
  ticketType: string | null;
}

/**
 * Get Event Scans Response
 */
export interface GetEventScansResponse {
  success: boolean;
  data: {
    scans: TicketScanRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Update Event Config Request
 */
export interface UpdateEventConfigRequest {
  allowReEntry?: boolean;
  requireCheckOut?: boolean;
  maxReEntries?: number | null;
  scanSettings?: {
    [key: string]: unknown;
  } | null;
}

/**
 * API Error Response
 */
export interface WorkstationApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      registrationId?: string;
      eventId?: string;
    };
  };
}

/**
 * API Success Response
 */
export interface WorkstationApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Scan ticket (check-in)
 * POST /api/v1/workstation/scan
 */
export const scanTicket = async (
  request: ScanRequest,
): Promise<WorkstationApiSuccess<ScanResponse> | WorkstationApiError> => {
  try {
    const response = await apiPost<WorkstationApiSuccess<ScanResponse>>('/workstation/scan', request);
    return response;
  } catch (error: unknown) {
    // Handle signature verification failures
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as WorkstationApiError;
      if (apiError.error?.code === 'INVALID_SIGNATURE') {
        console.warn('Signature verification failed:', apiError.error.message);
      }
      return apiError;
    }
    throw error;
  }
};

/**
 * Scan out (check-out)
 * POST /api/v1/workstation/scan-out
 */
export const scanOut = async (
  request: ScanRequest,
): Promise<WorkstationApiSuccess<ScanResponse> | WorkstationApiError> => {
  try {
    const response = await apiPost<WorkstationApiSuccess<ScanResponse>>('/workstation/scan-out', request);
    return response;
  } catch (error: unknown) {
    // Handle signature verification failures
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as WorkstationApiError;
      if (apiError.error?.code === 'INVALID_SIGNATURE') {
        console.warn('Signature verification failed:', apiError.error.message);
      }
      return apiError;
    }
    throw error;
  }
};

/**
 * Manual check-in
 * POST /api/v1/workstation/manual-check-in
 */
export const manualCheckIn = async (
  request: ManualOperationRequest,
): Promise<WorkstationApiSuccess<ManualOperationResponse> | WorkstationApiError> => {
  try {
    const response = await apiPost<WorkstationApiSuccess<ManualOperationResponse>>(
      '/workstation/manual-check-in',
      request,
    );
    return response;
  } catch (error: unknown) {
    // Handle signature verification failures
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as WorkstationApiError;
      if (apiError.error?.code === 'INVALID_SIGNATURE') {
        console.warn('Signature verification failed:', apiError.error.message);
      }
      return apiError;
    }
    throw error;
  }
};

/**
 * Manual check-out
 * POST /api/v1/workstation/manual-check-out
 */
export const manualCheckOut = async (
  request: ManualOperationRequest,
): Promise<WorkstationApiSuccess<ManualOperationResponse> | WorkstationApiError> => {
  try {
    const response = await apiPost<WorkstationApiSuccess<ManualOperationResponse>>(
      '/workstation/manual-check-out',
      request,
    );
    return response;
  } catch (error: unknown) {
    // Handle signature verification failures
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as WorkstationApiError;
      if (apiError.error?.code === 'INVALID_SIGNATURE') {
        console.warn('Signature verification failed:', apiError.error.message);
      }
      return apiError;
    }
    throw error;
  }
};

/**
 * Search attendees
 * GET /api/v1/workstation/search
 */
export const searchAttendees = async (
  request: SearchAttendeesRequest,
): Promise<SearchAttendeesResponse> => {
  const params = new URLSearchParams({
    searchTerm: request.searchTerm,
    eventId: request.eventId,
    ...(request.limit && { limit: request.limit.toString() }),
    ...(request.code && { code: request.code }),
  });

  return apiGet<SearchAttendeesResponse>(`/workstation/search?${params.toString()}`);
};

/**
 * Get event with scan configuration and statistics
 * GET /api/v1/workstation/events/:eventId
 */
export const getEvent = async (eventId: string): Promise<EventResponse> => {
  return apiGet<EventResponse>(`/workstation/events/${eventId}`);
};

/**
 * Get event attendees with scan status
 * GET /api/v1/workstation/events/:eventId/attendees
 */
export const getEventAttendees = async (
  eventId: string,
  page: number = 1,
  limit: number = 25,
  status?: TicketStatus | null,
): Promise<GetEventAttendeesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });

  return apiGet<GetEventAttendeesResponse>(`/workstation/events/${eventId}/attendees?${params.toString()}`);
};

/**
 * Get scan history for event
 * GET /api/v1/workstation/events/:eventId/scans
 */
export const getEventScans = async (
  eventId: string,
  filters: ScanHistoryFilters = {},
): Promise<GetEventScansResponse> => {
  const params = new URLSearchParams({
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 25).toString(),
    ...(filters.facility && { facility: filters.facility }),
    ...(filters.status && { status: filters.status }),
    ...(filters.scanType && { scanType: filters.scanType }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
  });

  return apiGet<GetEventScansResponse>(`/workstation/events/${eventId}/scans?${params.toString()}`);
};

/**
 * Get event scan configuration
 * GET /api/v1/workstation/events/:eventId/config
 */
export const getEventConfig = async (eventId: string): Promise<{
  success: boolean;
  data: {
    config: EventScanConfig;
  };
}> => {
  return apiGet<{
    success: boolean;
    data: {
      config: EventScanConfig;
    };
  }>(`/workstation/events/${eventId}/config`);
};

/**
 * Update event scan configuration
 * PUT /api/v1/workstation/events/:eventId/config
 */
export const updateEventConfig = async (
  eventId: string,
  config: UpdateEventConfigRequest,
): Promise<{
  success: boolean;
  data: {
    config: EventScanConfig;
  };
}> => {
  return apiPut<{
    success: boolean;
    data: {
      config: EventScanConfig;
    };
  }>(`/workstation/events/${eventId}/config`, config);
};

/**
 * Get ticket details with scan history
 * GET /api/v1/workstation/tickets/:ticketId
 */
export const getTicketDetails = async (ticketId: string): Promise<{
  success: boolean;
  data: {
    registration: {
      id: string;
      eventId: string;
      attendeeName: string;
      email: string;
      ticketType: string | null;
      ticketStatus: TicketStatus;
      checkedInAt: string | null;
      checkedOutAt: string | null;
      isCurrentlyInside: boolean;
      reEntryCount: number;
    };
    scans: TicketScanRecord[];
  };
}> => {
  return apiGet<{
    success: boolean;
    data: {
      registration: {
        id: string;
        eventId: string;
        attendeeName: string;
        email: string;
        ticketType: string | null;
        ticketStatus: TicketStatus;
        checkedInAt: string | null;
        checkedOutAt: string | null;
        isCurrentlyInside: boolean;
        reEntryCount: number;
      };
      scans: TicketScanRecord[];
    };
  }>(`/workstation/tickets/${ticketId}`);
};

/**
 * Utility function to detect if a code is a QR code or backup code
 */
export const detectCodeType = (code: string): CodeType => {
  // QR Code Detection: Contains pipe separator and has at least 5 parts
  if (code.includes('|') && code.split('|').length >= 5) {
    return CodeType.QR_CODE;
  }

  // Backup Code Validation: 10 characters, alphanumeric (Option A)
  if (/^[A-Z0-9]{10}$/.test(code.toUpperCase())) {
    return CodeType.BACKUP_CODE;
  }

  return CodeType.UNKNOWN;
};

/**
 * Utility function to validate backup code format
 */
export const isValidBackupCode = (code: string): boolean => {
  // Option A: 10 characters, alphanumeric
  return /^[A-Z0-9]{10}$/.test(code.toUpperCase());
};

/**
 * Utility function to format backup code (uppercase, remove spaces)
 */
export const formatBackupCode = (code: string): string => {
  return code.toUpperCase().replace(/\s+/g, '');
};

