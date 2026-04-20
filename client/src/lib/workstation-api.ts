/**
 * Workstation API Client
 * Handles all workstation-related API calls including ticket scanning, manual operations, and event management
 */

import { apiGet, apiPost, apiPut } from './api';

/**
 * Code Type Enum
 */
export type CodeType = 'QR_CODE' | 'BACKUP_CODE' | 'UNKNOWN';

/**
 * Scan Type Enum
 */
export const ScanType = {
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  MANUAL_CHECK_IN: 'MANUAL_CHECK_IN',
  MANUAL_CHECK_OUT: 'MANUAL_CHECK_OUT',
} as const;

export type ScanType = typeof ScanType[keyof typeof ScanType];

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
 * Workstation API Error
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
 * Scan Request
 */
export interface ScanRequest {
  code: string; // QR code or backup code
  eventId: string;
  facility?: string | null;
  session?: string | null;
  deviceId?: string | null;
  deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'KIOSK' | null;
}

/**
 * Scan Response
 */
export interface ScanResponse {
  success: boolean;
  data: {
    scanId: string;
    registrationId: string;
    eventId: string;
    attendeeName: string;
    ticketType: string | null;
    scanType: 'CHECK_IN' | 'CHECK_OUT' | 'MANUAL_CHECK_IN' | 'MANUAL_CHECK_OUT';
    facility: string | null;
    session: string | null;
    scannedAt: Date;
    isReEntry: boolean;
    signatureValid: boolean;
    codeType: CodeType;
  };
  error?: {
    code: string;
    message: string;
    details?: {
      registrationId?: string;
      eventId?: string;
    };
  };
}

/**
 * Manual Operation Request
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
  success: boolean;
  data: {
    scanId: string;
    registrationId: string;
    eventId: string;
    attendeeName: string;
    ticketType: string | null;
    scanType: 'MANUAL_CHECK_IN' | 'MANUAL_CHECK_OUT';
    facility: string | null;
    scannedAt: Date;
    isReEntry: boolean;
    signatureValid?: boolean;
    codeType?: CodeType;
  };
  error?: {
    code: string;
    message: string;
    details?: {
      registrationId?: string;
      eventId?: string;
    };
  };
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
  ticketStatus: 'ACTIVE' | 'DEACTIVATED' | 'EXPIRED' | 'CANCELLED';
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  isCurrentlyInside: boolean;
  reEntryCount: number;
  lastScanFacility: string | null;
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
 * Ticket Details Response
 */
export interface TicketDetailsResponse {
  success: boolean;
  data: {
    registrationId: string;
    eventId: string;
    attendeeName: string;
    email: string;
    phoneNumber: string | null;
    ticketType: string | null;
    ticketStatus: 'ACTIVE' | 'DEACTIVATED' | 'EXPIRED' | 'CANCELLED';
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
    isCurrentlyInside: boolean;
    reEntryCount: number;
    lastScanFacility: string | null;
    scans: Array<{
      id: string;
      scanType: 'CHECK_IN' | 'CHECK_OUT' | 'MANUAL_CHECK_IN' | 'MANUAL_CHECK_OUT';
      scannedAt: Date;
      facility: string | null;
      isReEntry: boolean;
      isValid: boolean;
    }>;
  };
}

/**
 * Event Scan Configuration
 */
export interface EventScanConfig {
  allowReEntry: boolean;
  requireCheckOut: boolean;
  maxReEntries: number | null;
  scanSettings: Record<string, unknown> | null;
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
}

/**
 * Event Response
 */
export interface EventResponse {
  success: boolean;
  data: {
    eventId: string;
    eventTitle: string;
    config: EventScanConfig;
    statistics: EventStatistics;
  };
}

/**
 * Event Attendee
 */
export interface EventAttendee {
  registrationId: string;
  visitorId: string;
  attendeeName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  ticketType: string | null;
  ticketStatus: TicketStatus;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  isCurrentlyInside: boolean;
  reEntryCount: number;
  lastScanFacility: string | null;
  registeredAt: Date;
  backupCode: string | null;
  qrCodeDataUrl: string | null;
  registrationData: Record<string, unknown> | null;
}

/**
 * Event Attendees Response
 */
export interface EventAttendeesResponse {
  success: boolean;
  data: {
    attendees: EventAttendee[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * Ticket Scan Record
 */
export interface TicketScanRecord {
  id: string;
  registrationId: string;
  eventId: string;
  scanType: ScanType;
  scannedAt: Date | string;
  facility: string | null;
  session: string | null;
  attendeeName: string;
  ticketType: string | null;
  isReEntry: boolean;
  isValid: boolean;
  scannedBy: string;
  scanLocation: string | null; // New property added
}

/**
 * Scan History Filters
 */
export interface ScanHistoryFilters {
  facility?: string | null;
  session?: string | null;
  scanType?: ScanType | null;
  status?: ScanType | null; // Alias for scanType (backward compatibility)
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  startDate?: Date | string | null; // Alias for dateFrom (component compatibility)
  endDate?: Date | string | null; // Alias for dateTo (component compatibility)
  page?: number;
  limit?: number;
}

/**
 * Event Scans Response
 */
export interface EventScansResponse {
  success: boolean;
  data: {
    scans: TicketScanRecord[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
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
  scanSettings?: Record<string, unknown> | null;
}

/**
 * Update Event Config Response
 */
export interface UpdateEventConfigResponse {
  success: boolean;
  data: {
    eventId: string;
    config: EventScanConfig;
  };
}

/**
 * QR Code Detection
 * Checks if a code string is a QR code format
 */
export const isQRCode = (code: string): boolean => {
  return code.includes('|') && code.split('|').length >= 5;
};

/**
 * Backup Code Validation
 * Validates if a code string is a valid backup code format (Option A: 10 characters, alphanumeric)
 */
export const isValidBackupCode = (code: string): boolean => {
  // Option A: 10 characters, alphanumeric
  return /^[A-Z0-9]{10}$/.test(code.toUpperCase());
  // Option B: 8-char code + 6-char signature (not implemented)
  // return /^[A-Z0-9]{8}-[A-Z0-9]{6}$/.test(code.toUpperCase());
};

/**
 * Detect Code Type
 * Determines if a code is a QR code or backup code
 */
export const detectCodeType = (code: string): CodeType => {
  if (isQRCode(code)) {
    return 'QR_CODE';
  }
  if (isValidBackupCode(code)) {
    return 'BACKUP_CODE';
  }
  return 'UNKNOWN';
};

/**
 * Format Backup Code
 * Formats a backup code to uppercase and removes spaces
 */
export const formatBackupCode = (code: string): string => {
  return code.toUpperCase().replace(/\s+/g, '');
};

/**
 * Scan Ticket (Check-in)
 * POST /api/v1/workstation/scan
 * Accepts QR code or backup code
 */
export const scanTicket = async (request: ScanRequest): Promise<ScanResponse> => {
  try {
    const response = await apiPost<ScanResponse>('/workstation/scan', {
      code: request.code,
      eventId: request.eventId,
      facility: request.facility || null,
      deviceId: request.deviceId || null,
      deviceType: request.deviceType || null,
    });

    // Log signature verification failures
    if (response.data && !response.data.signatureValid) {
      console.warn('Signature verification failed for scan:', {
        codeType: response.data.codeType,
        registrationId: response.data.registrationId,
      });
    }

    return response;
  } catch (error) {
    // Handle INVALID_SIGNATURE errors specifically
    const apiError = error as { error?: { code?: string; message?: string } };
    if (apiError.error?.code === 'INVALID_SIGNATURE') {
      console.error('Security warning: Invalid signature detected', apiError);
    }
    throw error;
  }
};

/**
 * Scan Out (Check-out)
 * POST /api/v1/workstation/scan-out
 * Accepts QR code or backup code
 */
export const scanOut = async (request: ScanRequest): Promise<ScanResponse> => {
  try {
    const response = await apiPost<ScanResponse>('/workstation/scan-out', {
      code: request.code,
      eventId: request.eventId,
      facility: request.facility || null,
      deviceId: request.deviceId || null,
      deviceType: request.deviceType || null,
    });

    // Log signature verification failures
    if (response.data && !response.data.signatureValid) {
      console.warn('Signature verification failed for scan-out:', {
        codeType: response.data.codeType,
        registrationId: response.data.registrationId,
      });
    }

    return response;
  } catch (error) {
    // Handle INVALID_SIGNATURE errors specifically
    const apiError = error as { error?: { code?: string; message?: string } };
    if (apiError.error?.code === 'INVALID_SIGNATURE') {
      console.error('Security warning: Invalid signature detected', apiError);
    }
    throw error;
  }
};

/**
 * Get Ticket Details
 * GET /api/v1/workstation/tickets/:ticketId
 */
export const getTicketDetails = async (ticketId: string): Promise<TicketDetailsResponse> => {
  return apiGet<TicketDetailsResponse>(`/workstation/tickets/${ticketId}`);
};

/**
 * Manual Check-in
 * POST /api/v1/workstation/manual-check-in
 * Requires: ADMIN or higher
 * Optional code parameter for signature verification
 */
export const manualCheckIn = async (
  request: ManualOperationRequest,
): Promise<ManualOperationResponse> => {
  try {
    const response = await apiPost<ManualOperationResponse>('/workstation/manual-check-in', {
      searchTerm: request.searchTerm,
      eventId: request.eventId,
      facility: request.facility || null,
      code: request.code || null,
    });

    // Log signature verification failures if code was provided
    if (request.code && response.data && !response.data.signatureValid) {
      console.warn('Signature verification failed for manual check-in:', {
        codeType: response.data.codeType,
        registrationId: response.data.registrationId,
      });
    }

    return response;
  } catch (error) {
    // Handle INVALID_SIGNATURE errors specifically
    const apiError = error as { error?: { code?: string; message?: string } };
    if (apiError.error?.code === 'INVALID_SIGNATURE') {
      console.error('Security warning: Invalid signature detected', apiError);
    }
    throw error;
  }
};

/**
 * Manual Check-out
 * POST /api/v1/workstation/manual-check-out
 * Requires: ADMIN or higher
 * Optional code parameter for signature verification
 */
export const manualCheckOut = async (
  request: ManualOperationRequest,
): Promise<ManualOperationResponse> => {
  try {
    const response = await apiPost<ManualOperationResponse>('/workstation/manual-check-out', {
      searchTerm: request.searchTerm,
      eventId: request.eventId,
      facility: request.facility || null,
      code: request.code || null,
    });

    // Log signature verification failures if code was provided
    if (request.code && response.data && !response.data.signatureValid) {
      console.warn('Signature verification failed for manual check-out:', {
        codeType: response.data.codeType,
        registrationId: response.data.registrationId,
      });
    }

    return response;
  } catch (error) {
    // Handle INVALID_SIGNATURE errors specifically
    const apiError = error as { error?: { code?: string; message?: string } };
    if (apiError.error?.code === 'INVALID_SIGNATURE') {
      console.error('Security warning: Invalid signature detected', apiError);
    }
    throw error;
  }
};

/**
 * Search Attendees
 * GET /api/v1/workstation/search
 * Optional code parameter for signature verification
 */
export const searchAttendees = async (
  request: SearchAttendeesRequest,
): Promise<SearchAttendeesResponse> => {
  const params = new URLSearchParams({
    searchTerm: request.searchTerm,
    eventId: request.eventId,
  });

  if (request.code) {
    params.append('code', request.code);
  }

  if (request.limit) {
    params.append('limit', request.limit.toString());
  }

  return apiGet<SearchAttendeesResponse>(`/workstation/search?${params.toString()}`);
};

/**
 * Get Event with Configuration and Statistics
 * GET /api/v1/workstation/events/:eventId
 */
export const getEventConfig = async (eventId: string): Promise<EventResponse> => {
  return apiGet<EventResponse>(`/workstation/events/${eventId}`);
};

/**
 * Alias for getEventConfig (for backward compatibility)
 */
export const getEvent = getEventConfig;

/**
 * Get Event Attendees
 * GET /api/v1/workstation/events/:eventId/attendees
 */
export const getEventAttendees = async (
  eventId: string,
  page?: number,
  limit?: number,
): Promise<EventAttendeesResponse> => {
  const params = new URLSearchParams();
  if (page !== undefined) {
    params.append('page', page.toString());
  }
  if (limit !== undefined) {
    params.append('limit', limit.toString());
  }

  const queryString = params.toString();
  return apiGet<EventAttendeesResponse>(
    `/workstation/events/${eventId}/attendees${queryString ? `?${queryString}` : ''}`,
  );
};

/**
 * Get Event Scans (Scan History)
 * GET /api/v1/workstation/events/:eventId/scans
 */
export const getEventScans = async (
  eventId: string,
  filters?: ScanHistoryFilters,
): Promise<EventScansResponse> => {
  const params = new URLSearchParams();

  if (filters?.facility) {
    params.append('facility', filters.facility);
  }

  // Handle scanType filter (support both scanType and status)
  const scanType = filters?.scanType || filters?.status;
  if (scanType) {
    params.append('status', scanType);
  }

  // Handle date filters (support both dateFrom/dateTo and startDate/endDate)
  const dateFrom = filters?.dateFrom || filters?.startDate;
  const dateTo = filters?.dateTo || filters?.endDate;

  if (dateFrom) {
    const date = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
    params.append('dateFrom', date.toISOString());
  }

  if (dateTo) {
    const date = dateTo instanceof Date ? dateTo : new Date(dateTo);
    params.append('dateTo', date.toISOString());
  }

  if (filters?.page) {
    params.append('page', filters.page.toString());
  }

  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  return apiGet<EventScansResponse>(
    `/workstation/events/${eventId}/scans${queryString ? `?${queryString}` : ''}`,
  );
};

/**
 * Update Event Scan Configuration
 * PUT /api/v1/workstation/events/:eventId/config
 * Requires: ADMIN or higher
 */
export const updateEventConfig = async (
  eventId: string,
  config: UpdateEventConfigRequest,
): Promise<UpdateEventConfigResponse> => {
  return apiPut<UpdateEventConfigResponse>(`/workstation/events/${eventId}/config`, config);
};

// ─── Badge Print Tracking ─────────────────────────────────────────────────────

export interface BadgePrintRecord {
  registrationId: string;
  printedAt: string;
  printedBy: string | null;
  templateId: string;
}

export interface BadgePrintsResponse {
  success: boolean;
  data: {
    printedRegistrationIds: string[];
    printJobs: BadgePrintRecord[];
    count: number;
  };
}

export interface CreateBadgePrintResponse {
  success: boolean;
  data: {
    printJob: {
      id: string;
      registrationId: string;
      templateId: string;
      status: string;
      printedAt: string;
    };
  };
}

/**
 * Record a badge print job (server-side tracking across workstations)
 * POST /api/v1/workstation/events/:eventId/badge-prints
 * Requires: TELLER or higher
 */
export const recordBadgePrint = async (
  eventId: string,
  registrationId: string,
  templateId: string,
): Promise<CreateBadgePrintResponse> => {
  return apiPost<CreateBadgePrintResponse>(`/workstation/events/${eventId}/badge-prints`, {
    registrationId,
    templateId,
  });
};

/**
 * Get which registrations have had badges printed for an event
 * GET /api/v1/workstation/events/:eventId/badge-prints
 * Requires: TELLER or higher
 */
export const getEventBadgePrints = async (eventId: string): Promise<BadgePrintsResponse> => {
  return apiGet<BadgePrintsResponse>(`/workstation/events/${eventId}/badge-prints`);
};
