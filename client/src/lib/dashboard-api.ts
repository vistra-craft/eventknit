/**
 * Dashboard API Client
 * Handles all dashboard-related API calls for real-time metrics and analytics
 */

import { apiGet } from './api';

// ==================== Types ====================

export interface RealtimeMetrics {
  totalCheckedIn: number;
  totalScans: number;
  currentOccupancy: number;
  activeStaff: number;
  recentScansPerMinute: number;
}

export interface RecentScan {
  id: string;
  scannedAt: string;
  checkpointName: string;
  facilityName?: string;
  zoneName?: string;
  attendee: {
    id: string;
    fullName: string;
    email: string;
    ticketType?: string;
    photo?: string;
  };
  scannedBy: {
    id: string;
    fullName: string;
  };
}

export interface HeatmapData {
  facility: string;
  facilityId: string;
  hourlyScans: {
    hour: string;
    scanCount: number;
  }[];
}

export interface StaffMetric {
  staffId: string;
  staffName: string;
  totalScans: number;
  scansPerHour: number;
  avgScanTime: number;
  lastScanAt?: string;
}

export interface CapacityStatus {
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  currentOccupancy: number;
  maxCapacity: number | null;
  percentFull: number;
  isFull: boolean;
}

export interface AttendanceTrend {
  timestamp: string;
  scanCount: number;
  checkInCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== API Functions ====================

/**
 * Get real-time metrics for event dashboard
 */
export const getRealtimeMetrics = async (
  eventId: string
): Promise<ApiResponse<{ metrics: RealtimeMetrics }>> => {
  try {
    const response = await apiGet<ApiResponse<{ metrics: RealtimeMetrics }>>(
      `/dashboard/events/${eventId}/realtime-metrics`
    );
    return response;
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    throw error;
  }
};

/**
 * Get recent scans with attendee details
 */
export const getRecentScans = async (
  eventId: string,
  limit: number = 100
): Promise<ApiResponse<{ scans: RecentScan[]; count: number }>> => {
  try {
    const response = await apiGet<ApiResponse<{ scans: RecentScan[]; count: number }>>(
      `/dashboard/events/${eventId}/recent-scans?limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    throw error;
  }
};

/**
 * Get facility heatmap data
 */
export const getFacilityHeatmap = async (
  eventId: string,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<{ heatmap: HeatmapData[] }>> => {
  try {
    const response = await apiGet<ApiResponse<{ heatmap: HeatmapData[] }>>(
      `/dashboard/events/${eventId}/heatmap?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching facility heatmap:', error);
    throw error;
  }
};

/**
 * Get staff performance metrics
 */
export const getStaffMetrics = async (
  eventId: string
): Promise<ApiResponse<{ metrics: StaffMetric[]; count: number }>> => {
  try {
    const response = await apiGet<ApiResponse<{ metrics: StaffMetric[]; count: number }>>(
      `/dashboard/events/${eventId}/staff-metrics`
    );
    return response;
  } catch (error) {
    console.error('Error fetching staff metrics:', error);
    throw error;
  }
};

/**
 * Get capacity overview for all zones
 */
export const getCapacityOverview = async (
  eventId: string
): Promise<ApiResponse<{ zones: CapacityStatus[]; count: number }>> => {
  try {
    const response = await apiGet<ApiResponse<{ zones: CapacityStatus[]; count: number }>>(
      `/dashboard/events/${eventId}/capacity-overview`
    );
    return response;
  } catch (error) {
    console.error('Error fetching capacity overview:', error);
    throw error;
  }
};

/**
 * Get attendance trend data
 */
export const getAttendanceTrend = async (
  eventId: string,
  interval: 'hourly' | 'daily' = 'hourly'
): Promise<ApiResponse<{ trend: AttendanceTrend[]; count: number; interval: string }>> => {
  try {
    const response = await apiGet<ApiResponse<{ trend: AttendanceTrend[]; count: number; interval: string }>>(
      `/dashboard/events/${eventId}/attendance-trend?interval=${interval}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching attendance trend:', error);
    throw error;
  }
};
