/**
 * Checkpoint API Client
 * Handles all checkpoint-related API calls for MICE event management
 * Checkpoints are used for tracking attendee interactions beyond door entry (meals, gifts, sessions, etc.)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

/**
 * Checkpoint Type Enum
 */
export type CheckpointType =
  | 'DOOR'
  | 'MEAL'
  | 'GIFT'
  | 'SESSION'
  | 'REGISTRATION'
  | 'NETWORKING'
  | 'EXHIBITION'
  | 'CERTIFICATE'
  | 'CUSTOM';

/**
 * Eligibility Rules for checkpoint access
 */
export interface EligibilityRules {
  ticketTypes?: string[]; // Allowed ticket types
  tags?: string[]; // Required tags in registration data
  all?: boolean; // If true, all attendees are eligible
  excludeTicketTypes?: string[]; // Excluded ticket types
}

/**
 * Checkpoint definition
 */
export interface Checkpoint {
  id: string;
  eventId: string;
  name: string;
  type: CheckpointType;
  description?: string | null;
  location?: string | null;
  stationCode?: string | null;
  quota: number;
  quotaEnforced: boolean;
  eligibilityRules?: EligibilityRules | null;
  activeFrom?: string | null;
  activeTo?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  _count?: {
    scans: number;
    staffAssignments: number;
  };
  stats?: {
    totalScans: number;
    uniqueAttendees: number;
    staffCount: number;
  };
}

/**
 * Create Checkpoint Request
 */
export interface CreateCheckpointRequest {
  eventId: string;
  name: string;
  type?: CheckpointType;
  description?: string;
  location?: string;
  stationCode?: string;
  quota?: number;
  quotaEnforced?: boolean;
  eligibilityRules?: EligibilityRules;
  activeFrom?: string;
  activeTo?: string;
  displayOrder?: number;
}

/**
 * Update Checkpoint Request
 */
export interface UpdateCheckpointRequest {
  name?: string;
  type?: CheckpointType;
  description?: string;
  location?: string;
  stationCode?: string;
  quota?: number;
  quotaEnforced?: boolean;
  eligibilityRules?: EligibilityRules;
  activeFrom?: string;
  activeTo?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Checkpoint Scan Request
 */
export interface CheckpointScanRequest {
  code: string; // QR code or backup code
  eventId: string;
  deviceId?: string;
  deviceType?: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'KIOSK';
  notes?: string;
}

/**
 * Checkpoint Scan Result
 */
export interface CheckpointScanResult {
  success: boolean;
  scanId?: string;
  checkpointId: string;
  registrationId: string;
  attendeeName?: string;
  ticketType?: string;
  scanNumber?: number;
  quotaRemaining?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Checkpoint Scan Record
 */
export interface CheckpointScanRecord {
  id: string;
  checkpointId: string;
  registrationId: string;
  eventId: string;
  scannedBy: string;
  scannedAt: string;
  isValid: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  scanNumber: number;
  deviceId?: string | null;
  deviceType?: string | null;
  notes?: string | null;
  registration: {
    attendee: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

/**
 * Checkpoint Statistics
 */
export interface CheckpointStats {
  checkpointId: string;
  checkpointName: string;
  type: CheckpointType;
  totalScans: number;
  uniqueAttendees: number;
  quota: number;
  activeNow: boolean;
}

/**
 * Checkpoint Staff Assignment
 */
export interface CheckpointStaff {
  id: string;
  checkpointId: string;
  staffId: string;
  assignedAt: string;
  assignedBy: string;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  isActive: boolean;
  staff: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
}

/**
 * Event Checkpoint Summary
 */
export interface EventCheckpointSummary {
  eventId: string;
  totalRegistrations: number;
  checkpoints: Array<{
    id: string;
    name: string;
    type: CheckpointType;
    stationCode?: string | null;
    isActive: boolean;
    quota: number;
    totalScans: number;
    uniqueAttendees: number;
    completionRate: number;
  }>;
}

/**
 * Attendee Checkpoint Status
 */
export interface AttendeeCheckpointStatus {
  checkpointId: string;
  checkpointName: string;
  type: CheckpointType;
  stationCode?: string | null;
  quota: number;
  scansUsed: number;
  quotaRemaining: number; // -1 means unlimited
  isEligible: boolean;
  eligibilityReason?: string;
  lastScan: string | null;
}

/**
 * Eligibility Check Result
 */
export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

// ============================================
// API Response Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================
// Checkpoint CRUD Operations
// ============================================

/**
 * Create a new checkpoint
 * POST /api/v1/checkpoints
 */
export const createCheckpoint = async (data: CreateCheckpointRequest): Promise<ApiResponse<Checkpoint>> => {
  return apiPost<ApiResponse<Checkpoint>>('/checkpoints', data);
};

/**
 * Get checkpoint by ID
 * GET /api/v1/checkpoints/:checkpointId
 */
export const getCheckpoint = async (checkpointId: string): Promise<ApiResponse<Checkpoint>> => {
  return apiGet<ApiResponse<Checkpoint>>(`/checkpoints/${checkpointId}`);
};

/**
 * Get checkpoints for an event
 * GET /api/v1/checkpoints/event/:eventId
 */
export const getEventCheckpoints = async (
  eventId: string,
  options?: {
    type?: CheckpointType;
    isActive?: boolean;
    includeStats?: boolean;
  },
): Promise<ApiResponse<Checkpoint[]>> => {
  const params = new URLSearchParams();

  if (options?.type) {
    params.append('type', options.type);
  }
  if (options?.isActive !== undefined) {
    params.append('isActive', options.isActive.toString());
  }
  if (options?.includeStats) {
    params.append('includeStats', 'true');
  }

  const queryString = params.toString();
  return apiGet<ApiResponse<Checkpoint[]>>(
    `/checkpoints/event/${eventId}${queryString ? `?${queryString}` : ''}`,
  );
};

/**
 * Update checkpoint
 * PUT /api/v1/checkpoints/:checkpointId
 */
export const updateCheckpoint = async (
  checkpointId: string,
  data: UpdateCheckpointRequest,
): Promise<ApiResponse<Checkpoint>> => {
  return apiPut<ApiResponse<Checkpoint>>(`/checkpoints/${checkpointId}`, data);
};

/**
 * Delete checkpoint
 * DELETE /api/v1/checkpoints/:checkpointId
 */
export const deleteCheckpoint = async (checkpointId: string): Promise<ApiResponse<{ message: string }>> => {
  return apiDelete<ApiResponse<{ message: string }>>(`/checkpoints/${checkpointId}`);
};

/**
 * Duplicate checkpoint
 * POST /api/v1/checkpoints/:checkpointId/duplicate
 */
export const duplicateCheckpoint = async (
  checkpointId: string,
  newName?: string,
): Promise<ApiResponse<Checkpoint>> => {
  return apiPost<ApiResponse<Checkpoint>>(`/checkpoints/${checkpointId}/duplicate`, { name: newName });
};

// ============================================
// Checkpoint Scanning Operations
// ============================================

/**
 * Scan at checkpoint
 * POST /api/v1/checkpoints/:checkpointId/scan
 */
export const scanCheckpoint = async (
  checkpointId: string,
  request: CheckpointScanRequest,
): Promise<ApiResponse<CheckpointScanResult>> => {
  return apiPost<ApiResponse<CheckpointScanResult>>(`/checkpoints/${checkpointId}/scan`, request);
};

/**
 * Get checkpoint scans
 * GET /api/v1/checkpoints/:checkpointId/scans
 */
export const getCheckpointScans = async (
  checkpointId: string,
  options?: {
    page?: number;
    limit?: number;
    scannedBy?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<ApiResponse<{ scans: CheckpointScanRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
  const params = new URLSearchParams();

  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.scannedBy) params.append('scannedBy', options.scannedBy);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ scans: CheckpointScanRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(
    `/checkpoints/${checkpointId}/scans${queryString ? `?${queryString}` : ''}`,
  );
};

/**
 * Get checkpoint statistics
 * GET /api/v1/checkpoints/:checkpointId/stats
 */
export const getCheckpointStats = async (checkpointId: string): Promise<ApiResponse<CheckpointStats>> => {
  return apiGet<ApiResponse<CheckpointStats>>(`/checkpoints/${checkpointId}/stats`);
};

// ============================================
// Event Checkpoint Summary
// ============================================

/**
 * Get event checkpoint summary with stats
 * GET /api/v1/checkpoints/event/:eventId/summary
 */
export const getEventCheckpointSummary = async (eventId: string): Promise<ApiResponse<EventCheckpointSummary>> => {
  return apiGet<ApiResponse<EventCheckpointSummary>>(`/checkpoints/event/${eventId}/summary`);
};

// ============================================
// Checkpoint Staff Management
// ============================================

/**
 * Assign staff to checkpoint
 * POST /api/v1/checkpoints/:checkpointId/staff
 */
export const assignCheckpointStaff = async (
  checkpointId: string,
  staffId: string,
  options?: {
    shiftStart?: string;
    shiftEnd?: string;
  },
): Promise<ApiResponse<CheckpointStaff>> => {
  return apiPost<ApiResponse<CheckpointStaff>>(`/checkpoints/${checkpointId}/staff`, {
    staffId,
    ...options,
  });
};

/**
 * Get checkpoint staff
 * GET /api/v1/checkpoints/:checkpointId/staff
 */
export const getCheckpointStaff = async (checkpointId: string): Promise<ApiResponse<CheckpointStaff[]>> => {
  return apiGet<ApiResponse<CheckpointStaff[]>>(`/checkpoints/${checkpointId}/staff`);
};

/**
 * Remove staff from checkpoint
 * DELETE /api/v1/checkpoints/:checkpointId/staff/:staffId
 */
export const removeCheckpointStaff = async (
  checkpointId: string,
  staffId: string,
): Promise<ApiResponse<{ message: string }>> => {
  return apiDelete<ApiResponse<{ message: string }>>(`/checkpoints/${checkpointId}/staff/${staffId}`);
};

// ============================================
// Attendee Checkpoint Operations
// ============================================

/**
 * Get attendee checkpoint status
 * GET /api/v1/checkpoints/attendee/:registrationId
 */
export const getAttendeeCheckpointStatus = async (
  registrationId: string,
  eventId: string,
): Promise<ApiResponse<AttendeeCheckpointStatus[]>> => {
  return apiGet<ApiResponse<AttendeeCheckpointStatus[]>>(
    `/checkpoints/attendee/${registrationId}?eventId=${eventId}`,
  );
};

/**
 * Check attendee eligibility for checkpoint
 * GET /api/v1/checkpoints/:checkpointId/eligibility/:registrationId
 */
export const checkEligibility = async (
  checkpointId: string,
  registrationId: string,
): Promise<ApiResponse<EligibilityResult>> => {
  return apiGet<ApiResponse<EligibilityResult>>(
    `/checkpoints/${checkpointId}/eligibility/${registrationId}`,
  );
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get checkpoint type display name
 */
export const getCheckpointTypeLabel = (type: CheckpointType): string => {
  const labels: Record<CheckpointType, string> = {
    DOOR: 'Door/Entry',
    MEAL: 'Meal',
    GIFT: 'Gift',
    SESSION: 'Session',
    REGISTRATION: 'Registration',
    NETWORKING: 'Networking',
    EXHIBITION: 'Exhibition',
    CERTIFICATE: 'Certificate',
    CUSTOM: 'Custom',
  };
  return labels[type] || type;
};

/**
 * Get checkpoint type icon name (for lucide-react)
 */
export const getCheckpointTypeIcon = (type: CheckpointType): string => {
  const icons: Record<CheckpointType, string> = {
    DOOR: 'DoorOpen',
    MEAL: 'UtensilsCrossed',
    GIFT: 'Gift',
    SESSION: 'Presentation',
    REGISTRATION: 'ClipboardCheck',
    NETWORKING: 'Users',
    EXHIBITION: 'Store',
    CERTIFICATE: 'Award',
    CUSTOM: 'Tag',
  };
  return icons[type] || 'Tag';
};

/**
 * Format quota display
 */
export const formatQuota = (quota: number): string => {
  return quota === 0 ? 'Unlimited' : `${quota}x`;
};

/**
 * Check if checkpoint is currently active based on time window
 */
export const isCheckpointActive = (checkpoint: Checkpoint): boolean => {
  if (!checkpoint.isActive) return false;

  const now = new Date();

  if (checkpoint.activeFrom) {
    const from = new Date(checkpoint.activeFrom);
    if (now < from) return false;
  }

  if (checkpoint.activeTo) {
    const to = new Date(checkpoint.activeTo);
    if (now > to) return false;
  }

  return true;
};

/**
 * Get all checkpoint type options for select inputs
 */
export const checkpointTypeOptions = [
  { value: 'DOOR', label: 'Door/Entry' },
  { value: 'MEAL', label: 'Meal' },
  { value: 'GIFT', label: 'Gift' },
  { value: 'SESSION', label: 'Session' },
  { value: 'REGISTRATION', label: 'Registration' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'EXHIBITION', label: 'Exhibition' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;
