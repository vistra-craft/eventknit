/**
 * Facility Zone API
 * Handles facility access control zones, attendee assignments, and capacity management
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

// ==================== Types ====================

export interface FacilityZone {
  id: string;
  eventId: string;
  name: string;
  code: string;
  maxCapacity: number | null;
  currentOccupancy: number;
  accessStart: string | null;
  accessEnd: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, populated when included)
  facilities?: FacilityZoneMapping[];
  attendeeAccess?: AttendeeZoneAccess[];
  _count?: {
    facilities?: number;
    attendeeAccess?: number;
  };
}

export interface FacilityZoneMapping {
  id: string;
  facilityId: string;
  zoneId: string;
  facility?: {
    id: string;
    name: string;
  };
}

export interface AttendeeZoneAccess {
  id: string;
  registrationId: string;
  zoneId: string;
  grantedAt: string;
  grantedBy: string;
  expiresAt: string | null;
  isActive: boolean;
  accessCount: number;
  lastAccessAt: string | null;
  // Relations (optional)
  registration?: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  zone?: FacilityZone;
}

export interface FacilityMovement {
  id: string;
  registrationId: string;
  eventId: string;
  fromZoneId: string | null;
  toZoneId: string;
  movementType: 'entry' | 'zone_change' | 'exit';
  sequenceNumber: number;
  scannedAt: string;
  scannedBy: string;
  deviceInfo: Record<string, unknown> | null;
  // Relations (optional)
  fromZone?: FacilityZone | null;
  toZone?: FacilityZone;
  registration?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface ZoneCapacityInfo {
  zoneId: string;
  zoneName: string;
  currentOccupancy: number;
  maxCapacity: number | null;
  percentage: number;
  isAtCapacity: boolean;
  remainingSpots: number | null;
}

export interface ZoneAccessValidation {
  hasAccess: boolean;
  isActive: boolean;
  isExpired: boolean;
  isWithinTimeWindow: boolean;
  canEnter: boolean;
  reason?: string;
  access?: AttendeeZoneAccess;
}

// ==================== API Response Types ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== Facility Zone API ====================

/**
 * Create a new facility zone
 */
export const createFacilityZone = async (data: {
  eventId: string;
  name: string;
  code: string;
  maxCapacity?: number;
  accessStart?: string;
  accessEnd?: string;
}): Promise<ApiResponse<{ zone: FacilityZone }>> => {
  try {
    const response = await apiPost<ApiResponse<{ zone: FacilityZone }>>(
      '/zones',
      data
    );
    return response;
  } catch (error) {
    console.error('Error creating facility zone:', error);
    throw error;
  }
};

/**
 * Get all zones for an event
 */
export const getEventZones = async (
  eventId: string,
  params?: {
    includeCount?: boolean;
    isActive?: boolean;
  }
): Promise<ApiResponse<{ zones: FacilityZone[] }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.includeCount) queryParams.append('includeCount', 'true');
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ zones: FacilityZone[] }>>(
      `/events/${eventId}/zones${queryString ? `?${queryString}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching event zones:', error);
    throw error;
  }
};

/**
 * Get a single zone by ID
 */
export const getFacilityZoneById = async (
  zoneId: string,
  includeRelations?: boolean
): Promise<ApiResponse<{ zone: FacilityZone }>> => {
  try {
    const queryParams = includeRelations ? '?includeRelations=true' : '';
    const response = await apiGet<ApiResponse<{ zone: FacilityZone }>>(
      `/zones/${zoneId}${queryParams}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching facility zone:', error);
    throw error;
  }
};

/**
 * Update a facility zone
 */
export const updateFacilityZone = async (
  zoneId: string,
  data: Partial<{
    name: string;
    code: string;
    maxCapacity: number | null;
    accessStart: string | null;
    accessEnd: string | null;
    isActive: boolean;
  }>
): Promise<ApiResponse<{ zone: FacilityZone }>> => {
  try {
    const response = await apiPut<ApiResponse<{ zone: FacilityZone }>>(
      `/zones/${zoneId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error updating facility zone:', error);
    throw error;
  }
};

/**
 * Delete a facility zone
 */
export const deleteFacilityZone = async (
  zoneId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiDelete<ApiResponse<{ message: string }>>(
      `/zones/${zoneId}`
    );
    return response;
  } catch (error) {
    console.error('Error deleting facility zone:', error);
    throw error;
  }
};

// ==================== Facility Assignment ====================

/**
 * Assign a facility to a zone
 */
export const assignFacilityToZone = async (
  zoneId: string,
  facilityId: string
): Promise<ApiResponse<{ mapping: FacilityZoneMapping }>> => {
  try {
    const response = await apiPost<ApiResponse<{ mapping: FacilityZoneMapping }>>(
      `/zones/${zoneId}/facilities/${facilityId}`
    );
    return response;
  } catch (error) {
    console.error('Error assigning facility to zone:', error);
    throw error;
  }
};

/**
 * Remove a facility from a zone
 */
export const removeFacilityFromZone = async (
  zoneId: string,
  facilityId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiDelete<ApiResponse<{ message: string }>>(
      `/zones/${zoneId}/facilities/${facilityId}`
    );
    return response;
  } catch (error) {
    console.error('Error removing facility from zone:', error);
    throw error;
  }
};

// ==================== Attendee Access Management ====================

/**
 * Bulk assign attendees to a zone
 */
export const bulkAssignAttendeesToZone = async (
  zoneId: string,
  registrationIds: string[],
  expiresAt?: string
): Promise<ApiResponse<{ successCount: number; failureCount: number; errors?: string[] }>> => {
  try {
    const response = await apiPost<ApiResponse<{ successCount: number; failureCount: number; errors?: string[] }>>(
      `/zones/${zoneId}/attendees/bulk-assign`,
      { registrationIds, expiresAt }
    );
    return response;
  } catch (error) {
    console.error('Error bulk assigning attendees:', error);
    throw error;
  }
};

/**
 * Get attendees with access to a zone
 */
export const getZoneAttendees = async (
  zoneId: string,
  params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<{ attendees: AttendeeZoneAccess[]; total: number }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ attendees: AttendeeZoneAccess[]; total: number }>>(
      `/zones/${zoneId}/attendees${queryString ? `?${queryString}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching zone attendees:', error);
    throw error;
  }
};

/**
 * Revoke zone access for an attendee
 */
export const revokeZoneAccess = async (
  zoneId: string,
  registrationId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiDelete<ApiResponse<{ message: string }>>(
      `/zones/${zoneId}/attendees/${registrationId}`
    );
    return response;
  } catch (error) {
    console.error('Error revoking zone access:', error);
    throw error;
  }
};

// ==================== Access Validation ====================

/**
 * Validate if an attendee can access a zone
 */
export const validateZoneAccess = async (
  zoneId: string,
  registrationId: string
): Promise<ApiResponse<{ validation: ZoneAccessValidation }>> => {
  try {
    const response = await apiGet<ApiResponse<{ validation: ZoneAccessValidation }>>(
      `/zones/${zoneId}/access/check/${registrationId}`
    );
    return response;
  } catch (error) {
    console.error('Error validating zone access:', error);
    throw error;
  }
};

/**
 * Check zone capacity status
 */
export const checkZoneCapacity = async (
  zoneId: string
): Promise<ApiResponse<{ capacity: ZoneCapacityInfo }>> => {
  try {
    const response = await apiGet<ApiResponse<{ capacity: ZoneCapacityInfo }>>(
      `/zones/${zoneId}/capacity`
    );
    return response;
  } catch (error) {
    console.error('Error checking zone capacity:', error);
    throw error;
  }
};

// ==================== Movement Tracking ====================

/**
 * Get movement history for an event
 */
export const getEventMovements = async (
  eventId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    zoneId?: string;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<{ movements: FacilityMovement[]; total: number }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.zoneId) queryParams.append('zoneId', params.zoneId);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ movements: FacilityMovement[]; total: number }>>(
      `/events/${eventId}/movements${queryString ? `?${queryString}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching event movements:', error);
    throw error;
  }
};

/**
 * Get movement history for a specific attendee
 */
export const getAttendeeMovements = async (
  registrationId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<{ movements: FacilityMovement[]; total: number }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ movements: FacilityMovement[]; total: number }>>(
      `/registrations/${registrationId}/movements${queryString ? `?${queryString}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching attendee movements:', error);
    throw error;
  }
};

// ==================== Analytics ====================

/**
 * Get zone analytics summary
 */
export const getZoneAnalytics = async (
  eventId: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<{ analytics: Record<string, unknown> }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ analytics: Record<string, unknown> }>>(
      `/events/${eventId}/zones/analytics${queryString ? `?${queryString}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching zone analytics:', error);
    throw error;
  }
};
