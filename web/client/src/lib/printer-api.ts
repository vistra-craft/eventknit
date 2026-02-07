/**
 * Printer API Client
 * Handles all printer-related API calls for printer management and print jobs
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

// ==================== Types ====================

export interface Printer {
  id: string;
  eventId: string | null;
  name: string;
  driver: 'cups' | 'windows' | 'printnode';
  deviceId: string;
  host: string | null;
  port: number | null;
  apiKey: string | null;
  supportedSizes: string[];
  paperSize: string | null;
  orientation: string | null;
  isOnline: boolean;
  isActive: boolean;
  lastChecked: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  event?: {
    id: string;
    title: string;
  };
  _count?: {
    printJobs: number;
  };
}

export interface PrintJob {
  id: string;
  printerId: string;
  templateId: string;
  registrationId: string;
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  copies: number;
  pdfUrl: string | null;
  sentToPrinter: string | null;
  printedAt: string | null;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  printer?: {
    id: string;
    name: string;
    driver: string;
  };
  registration?: {
    attendee: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface PrinterStatus {
  id: string;
  name: string;
  isOnline: boolean;
  driver: string;
  lastChecked?: string;
}

export interface DiscoveredPrinter {
  name: string;
  deviceId: string;
  driver: string;
  isAvailable: boolean;
}

// ==================== API Response Types ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== Printer Discovery ====================

/**
 * Discover available printers on the system
 */
export const discoverPrinters = async (
  driver: 'cups' | 'windows'
): Promise<ApiResponse<{ printers: DiscoveredPrinter[] }>> => {
  try {
    const response = await apiGet<ApiResponse<{ printers: DiscoveredPrinter[] }>>(
      `/printers/discover?driver=${driver}`
    );
    return response;
  } catch (error) {
    console.error('Error discovering printers:', error);
    throw error;
  }
};

// ==================== Printer Management ====================

/**
 * Register a new printer
 */
export const registerPrinter = async (data: {
  name: string;
  driver: 'cups' | 'windows' | 'printnode';
  deviceId: string;
  host?: string;
  port?: number;
  apiKey?: string;
  supportedSizes?: string[];
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  eventId?: string;
}): Promise<ApiResponse<{ printer: Printer }>> => {
  try {
    const response = await apiPost<ApiResponse<{ printer: Printer }>>(
      '/printers',
      data
    );
    return response;
  } catch (error) {
    console.error('Error registering printer:', error);
    throw error;
  }
};

/**
 * Get all printers
 */
export const getPrinters = async (params?: {
  eventId?: string;
  includeInactive?: boolean;
}): Promise<ApiResponse<{ printers: Printer[] }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.includeInactive) queryParams.append('includeInactive', 'true');

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ printers: Printer[] }>>(
      `/printers${queryString ? `?${queryString}` : ''}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching printers:', error);
    throw error;
  }
};

/**
 * Get printer by ID
 */
export const getPrinterById = async (
  printerId: string
): Promise<ApiResponse<{ printer: Printer }>> => {
  try {
    const response = await apiGet<ApiResponse<{ printer: Printer }>>(
      `/printers/${printerId}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching printer:', error);
    throw error;
  }
};

/**
 * Update printer configuration
 */
export const updatePrinter = async (
  printerId: string,
  data: Partial<{
    name: string;
    host: string;
    port: number;
    apiKey: string;
    supportedSizes: string[];
    paperSize: string;
    orientation: string;
    isActive: boolean;
  }>
): Promise<ApiResponse<{ printer: Printer }>> => {
  try {
    const response = await apiPut<ApiResponse<{ printer: Printer }>>(
      `/printers/${printerId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error updating printer:', error);
    throw error;
  }
};

/**
 * Delete a printer
 */
export const deletePrinter = async (
  printerId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiDelete<ApiResponse<{ message: string }>>(
      `/printers/${printerId}`
    );
    return response;
  } catch (error) {
    console.error('Error deleting printer:', error);
    throw error;
  }
};

/**
 * Check printer status
 */
export const checkPrinterStatus = async (
  printerId: string
): Promise<ApiResponse<{ status: PrinterStatus }>> => {
  try {
    const response = await apiGet<ApiResponse<{ status: PrinterStatus }>>(
      `/printers/${printerId}/status`
    );
    return response;
  } catch (error) {
    console.error('Error checking printer status:', error);
    throw error;
  }
};

/**
 * Test printer with a sample page
 */
export const testPrinter = async (
  printerId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiPost<ApiResponse<{ message: string }>>(
      `/printers/${printerId}/test`
    );
    return response;
  } catch (error) {
    console.error('Error testing printer:', error);
    throw error;
  }
};

// ==================== Print Job Management ====================

/**
 * Create a print job
 */
export const createPrintJob = async (data: {
  printerId: string;
  templateId: string;
  registrationId: string;
  copies?: number;
  priority?: number;
}): Promise<ApiResponse<{ printJob: PrintJob }>> => {
  try {
    const response = await apiPost<ApiResponse<{ printJob: PrintJob }>>(
      '/print-jobs',
      data
    );
    return response;
  } catch (error) {
    console.error('Error creating print job:', error);
    throw error;
  }
};

/**
 * Bulk create print jobs
 */
export const bulkCreatePrintJobs = async (data: {
  printerId: string;
  templateId: string;
  registrationIds: string[];
  copies?: number;
  priority?: number;
}): Promise<ApiResponse<{
  successCount: number;
  failureCount: number;
  total: number;
  jobs: PrintJob[];
  errors: Array<{ message: string; registrationId?: string }>;
}>> => {
  try {
    const response = await apiPost<ApiResponse<{
      successCount: number;
      failureCount: number;
      total: number;
      jobs: PrintJob[];
      errors: Array<{ message: string; registrationId?: string }>;
    }>>('/print-jobs/bulk', data);
    return response;
  } catch (error) {
    console.error('Error bulk creating print jobs:', error);
    throw error;
  }
};

/**
 * Get print jobs with filters
 */
export const getPrintJobs = async (params?: {
  printerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  jobs: PrintJob[];
  total: number;
  page: number;
  limit: number;
}>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.printerId) queryParams.append('printerId', params.printerId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{
      jobs: PrintJob[];
      total: number;
      page: number;
      limit: number;
    }>>(`/print-jobs${queryString ? `?${queryString}` : ''}`);
    return response;
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    throw error;
  }
};

/**
 * Cancel a print job
 */
export const cancelPrintJob = async (
  jobId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiPost<ApiResponse<{ message: string }>>(
      `/print-jobs/${jobId}/cancel`
    );
    return response;
  } catch (error) {
    console.error('Error cancelling print job:', error);
    throw error;
  }
};

// ==================== Utility Functions ====================

/**
 * Get printer status color
 */
export const getPrinterStatusColor = (isOnline: boolean): string => {
  return isOnline ? 'bg-green-500' : 'bg-red-500';
};

/**
 * Get print job status color
 */
export const getPrintJobStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'printing':
      return 'bg-blue-500';
    case 'queued':
      return 'bg-yellow-500';
    case 'failed':
      return 'bg-red-500';
    case 'cancelled':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
};

/**
 * Get driver display name
 */
export const getDriverDisplayName = (driver: string): string => {
  switch (driver) {
    case 'cups':
      return 'CUPS (Mac/Linux)';
    case 'windows':
      return 'Windows Print Server';
    case 'printnode':
      return 'PrintNode Cloud';
    default:
      return driver;
  }
};
