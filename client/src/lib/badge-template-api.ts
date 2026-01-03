/**
 * Badge Template API
 * Handles badge template management and PDF generation for event badges
 * Uses real backend API for persistence
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

// ==================== Types ====================

export type BadgeSize = '4x3' | '3.5x2.25' | '4x6' | 'A6' | 'custom';
export type ElementType = 'text' | 'image' | 'qr' | 'shape' | 'logo' | 'barcode';
export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'bold' | 'light';

export interface BadgeElement {
  id: string;
  type: ElementType;
  // Content - can be static or dynamic (using {{variable}})
  content: string;
  // Position & Size (in mm for print accuracy)
  x: number;
  y: number;
  width: number;
  height: number;
  // Text styling
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: FontWeight;
  textAlign?: TextAlign;
  lineHeight?: number;
  // Colors
  color?: string;
  backgroundColor?: string;
  // Border
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Effects
  opacity?: number;
  rotation?: number;
  // Layer
  zIndex: number;
  // Visibility
  isVisible?: boolean;
  // Lock position
  isLocked?: boolean;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
  // Badge dimensions in mm
  width: number;
  height: number;
  // Preset size or custom
  sizePreset: BadgeSize;
  // Orientation
  orientation: 'portrait' | 'landscape';
  // Background
  backgroundColor: string;
  backgroundImage?: string;
  // Elements
  elements: BadgeElement[];
  // Metadata
  isDefault: boolean;
  isCustom: boolean;
  isActive?: boolean;
  eventId?: string; // Optional - if template is event-specific
  organizerId?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PrintJob {
  id: string;
  templateId: string;
  attendeeId: string;
  attendeeName: string;
  eventId: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface AttendeeData {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  ticketType: string;
  ticketCategory?: string;
  qrCode: string;
  backupCode?: string;
  avatarUrl?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  badgePrinted: boolean;
  badgePrintedAt?: string;
  customFields?: Record<string, string>;
}

// ==================== Size Presets ====================

export const BADGE_SIZE_PRESETS: Record<BadgeSize, { width: number; height: number; label: string }> = {
  '4x3': { width: 101.6, height: 76.2, label: '4" × 3" (Standard)' },
  '3.5x2.25': { width: 88.9, height: 57.15, label: '3.5" × 2.25" (Business Card)' },
  '4x6': { width: 101.6, height: 152.4, label: '4" × 6" (Large)' },
  'A6': { width: 105, height: 148, label: 'A6 (105mm × 148mm)' },
  'custom': { width: 100, height: 80, label: 'Custom Size' },
};

// ==================== Default Templates (Fallback) ====================

const DEFAULT_TEMPLATES: BadgeTemplate[] = [
  {
    id: 'default-standard',
    name: 'Standard Event Badge',
    description: 'Clean, professional badge with QR code',
    width: 101.6,
    height: 76.2,
    sizePreset: '4x3',
    orientation: 'landscape',
    backgroundColor: '#ffffff',
    elements: [
      {
        id: 'event-title',
        type: 'text',
        content: '{{eventTitle}}',
        x: 10,
        y: 8,
        width: 81.6,
        height: 10,
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1a1a1a',
        zIndex: 1,
      },
      {
        id: 'attendee-name',
        type: 'text',
        content: '{{fullName}}',
        x: 10,
        y: 25,
        width: 60,
        height: 12,
        fontSize: 18,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#000000',
        zIndex: 2,
      },
      {
        id: 'company',
        type: 'text',
        content: '{{company}}',
        x: 10,
        y: 40,
        width: 60,
        height: 8,
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#666666',
        zIndex: 3,
      },
      {
        id: 'job-title',
        type: 'text',
        content: '{{jobTitle}}',
        x: 10,
        y: 50,
        width: 60,
        height: 6,
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#888888',
        zIndex: 4,
      },
      {
        id: 'ticket-type',
        type: 'text',
        content: '{{ticketType}}',
        x: 10,
        y: 62,
        width: 40,
        height: 8,
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#0066cc',
        backgroundColor: '#e6f0ff',
        borderRadius: 4,
        zIndex: 5,
      },
      {
        id: 'qr-code',
        type: 'qr',
        content: '{{qrCode}}',
        x: 73,
        y: 22,
        width: 24,
        height: 24,
        zIndex: 6,
      },
    ],
    isDefault: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-vip',
    name: 'VIP Badge',
    description: 'Premium badge design for VIP attendees',
    width: 101.6,
    height: 76.2,
    sizePreset: '4x3',
    orientation: 'landscape',
    backgroundColor: '#1a1a2e',
    elements: [
      {
        id: 'vip-label',
        type: 'text',
        content: 'VIP',
        x: 10,
        y: 6,
        width: 20,
        height: 8,
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1a1a2e',
        backgroundColor: '#ffd700',
        borderRadius: 4,
        zIndex: 1,
      },
      {
        id: 'event-title',
        type: 'text',
        content: '{{eventTitle}}',
        x: 35,
        y: 6,
        width: 56,
        height: 8,
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'right',
        color: '#cccccc',
        zIndex: 2,
      },
      {
        id: 'attendee-name',
        type: 'text',
        content: '{{fullName}}',
        x: 10,
        y: 22,
        width: 60,
        height: 14,
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#ffffff',
        zIndex: 3,
      },
      {
        id: 'company',
        type: 'text',
        content: '{{company}}',
        x: 10,
        y: 40,
        width: 60,
        height: 8,
        fontSize: 13,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#aaaaaa',
        zIndex: 4,
      },
      {
        id: 'job-title',
        type: 'text',
        content: '{{jobTitle}}',
        x: 10,
        y: 52,
        width: 60,
        height: 6,
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#888888',
        zIndex: 5,
      },
      {
        id: 'qr-code',
        type: 'qr',
        content: '{{qrCode}}',
        x: 73,
        y: 20,
        width: 24,
        height: 24,
        backgroundColor: '#ffffff',
        borderRadius: 4,
        zIndex: 6,
      },
      {
        id: 'gold-bar',
        type: 'shape',
        content: '',
        x: 0,
        y: 70,
        width: 101.6,
        height: 6.2,
        backgroundColor: '#ffd700',
        zIndex: 0,
      },
    ],
    isDefault: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-speaker',
    name: 'Speaker Badge',
    description: 'Distinguished badge for event speakers',
    width: 101.6,
    height: 76.2,
    sizePreset: '4x3',
    orientation: 'landscape',
    backgroundColor: '#0d47a1',
    elements: [
      {
        id: 'speaker-label',
        type: 'text',
        content: 'SPEAKER',
        x: 10,
        y: 6,
        width: 30,
        height: 8,
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0d47a1',
        backgroundColor: '#ffffff',
        borderRadius: 4,
        zIndex: 1,
      },
      {
        id: 'event-title',
        type: 'text',
        content: '{{eventTitle}}',
        x: 45,
        y: 6,
        width: 46,
        height: 8,
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'right',
        color: '#bbdefb',
        zIndex: 2,
      },
      {
        id: 'attendee-name',
        type: 'text',
        content: '{{fullName}}',
        x: 10,
        y: 22,
        width: 60,
        height: 14,
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#ffffff',
        zIndex: 3,
      },
      {
        id: 'company',
        type: 'text',
        content: '{{company}}',
        x: 10,
        y: 40,
        width: 60,
        height: 8,
        fontSize: 13,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#90caf9',
        zIndex: 4,
      },
      {
        id: 'job-title',
        type: 'text',
        content: '{{jobTitle}}',
        x: 10,
        y: 52,
        width: 60,
        height: 6,
        fontSize: 10,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#64b5f6',
        zIndex: 5,
      },
      {
        id: 'qr-code',
        type: 'qr',
        content: '{{qrCode}}',
        x: 73,
        y: 20,
        width: 24,
        height: 24,
        backgroundColor: '#ffffff',
        borderRadius: 4,
        zIndex: 6,
      },
    ],
    isDefault: true,
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ==================== LocalStorage Keys (for print jobs - kept local) ====================

const STORAGE_KEYS = {
  PRINT_JOBS: 'eventknit_print_jobs',
};

// ==================== API Response Types ====================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== Template API ====================

/**
 * Get all badge templates from backend
 */
export const getBadgeTemplates = async (params?: {
  eventId?: string;
  organizerId?: string;
  includeDefaults?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: { templates: BadgeTemplate[]; total?: number } }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.organizerId) queryParams.append('organizerId', params.organizerId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ templates: BadgeTemplate[]; total: number }>>(
      `/badge-templates${queryString ? `?${queryString}` : ''}`
    );

    if (response.success && response.data) {
      // Convert backend format to client format
      const templates = response.data.templates.map(convertBackendToClient);

      // Combine with defaults if requested
      const includeDefaults = params?.includeDefaults !== false;
      const allTemplates = includeDefaults
        ? [...DEFAULT_TEMPLATES.filter(d => !templates.some(t => t.name === d.name)), ...templates]
        : templates;

      return {
        success: true,
        data: { templates: allTemplates, total: response.data.total },
      };
    }

    // Fallback to defaults if API fails
    return {
      success: true,
      data: { templates: DEFAULT_TEMPLATES },
    };
  } catch (error) {
    console.error('Error getting badge templates from API:', error);
    // Fallback to defaults
    return {
      success: true,
      data: { templates: DEFAULT_TEMPLATES },
    };
  }
};

/**
 * Get a single badge template by ID
 */
export const getBadgeTemplateById = async (
  id: string
): Promise<{ success: boolean; data: { template: BadgeTemplate | null } }> => {
  try {
    // Check defaults first (they have static IDs)
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) {
      return { success: true, data: { template: defaultTemplate } };
    }

    const response = await apiGet<ApiResponse<{ template: BadgeTemplate }>>(
      `/badge-templates/${id}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { template: convertBackendToClient(response.data.template) },
      };
    }

    return { success: false, data: { template: null } };
  } catch (error) {
    console.error('Error getting badge template:', error);
    return { success: false, data: { template: null } };
  }
};

/**
 * Create a new badge template
 */
export const createBadgeTemplate = async (
  data: Omit<BadgeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>
): Promise<{ success: boolean; data: { template: BadgeTemplate } }> => {
  try {
    const response = await apiPost<ApiResponse<{ template: BadgeTemplate }>>(
      '/badge-templates',
      {
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        sizePreset: data.sizePreset,
        orientation: data.orientation,
        backgroundColor: data.backgroundColor,
        elements: data.elements,
        eventId: data.eventId,
        organizerId: data.organizerId,
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { template: convertBackendToClient(response.data.template) },
      };
    }

    throw new Error('Failed to create template');
  } catch (error) {
    console.error('Error creating badge template:', error);
    throw error;
  }
};

/**
 * Update a badge template
 */
export const updateBadgeTemplate = async (
  id: string,
  data: Partial<BadgeTemplate>
): Promise<{ success: boolean; data: { template: BadgeTemplate } }> => {
  try {
    // If it's a default template, create a copy instead
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) {
      return createBadgeTemplate({
        ...defaultTemplate,
        ...data,
        name: data.name || `${defaultTemplate.name} (Custom)`,
        isCustom: true,
      });
    }

    const response = await apiPut<ApiResponse<{ template: BadgeTemplate }>>(
      `/badge-templates/${id}`,
      {
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        sizePreset: data.sizePreset,
        orientation: data.orientation,
        backgroundColor: data.backgroundColor,
        elements: data.elements,
        isDefault: data.isDefault,
        isActive: data.isActive,
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { template: convertBackendToClient(response.data.template) },
      };
    }

    throw new Error('Failed to update template');
  } catch (error) {
    console.error('Error updating badge template:', error);
    throw error;
  }
};

/**
 * Delete a badge template
 */
export const deleteBadgeTemplate = async (
  id: string
): Promise<{ success: boolean }> => {
  try {
    // Cannot delete default templates
    if (DEFAULT_TEMPLATES.some(t => t.id === id)) {
      throw new Error('Cannot delete default templates');
    }

    const response = await apiDelete<ApiResponse<void>>(`/badge-templates/${id}`);
    return { success: response.success };
  } catch (error) {
    console.error('Error deleting badge template:', error);
    throw error;
  }
};

/**
 * Duplicate a badge template
 */
export const duplicateBadgeTemplate = async (
  id: string,
  newName?: string
): Promise<{ success: boolean; data: { template: BadgeTemplate } }> => {
  try {
    const response = await apiPost<ApiResponse<{ template: BadgeTemplate }>>(
      `/badge-templates/${id}/duplicate`,
      { name: newName }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { template: convertBackendToClient(response.data.template) },
      };
    }

    // Fallback for default templates
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (defaultTemplate) {
      return createBadgeTemplate({
        ...defaultTemplate,
        name: newName || `${defaultTemplate.name} (Copy)`,
        isCustom: true,
      });
    }

    throw new Error('Failed to duplicate template');
  } catch (error) {
    console.error('Error duplicating badge template:', error);
    throw error;
  }
};

/**
 * Set a template as default
 */
export const setDefaultTemplate = async (
  id: string
): Promise<{ success: boolean; data: { template: BadgeTemplate } }> => {
  try {
    const response = await apiPost<ApiResponse<{ template: BadgeTemplate }>>(
      `/badge-templates/${id}/set-default`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { template: convertBackendToClient(response.data.template) },
      };
    }

    throw new Error('Failed to set default template');
  } catch (error) {
    console.error('Error setting default template:', error);
    throw error;
  }
};

/**
 * Get the default template
 */
export const getDefaultTemplate = async (params?: {
  organizerId?: string;
  eventId?: string;
}): Promise<{ success: boolean; data: { template: BadgeTemplate | null } }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.organizerId) queryParams.append('organizerId', params.organizerId);
    if (params?.eventId) queryParams.append('eventId', params.eventId);

    const queryString = queryParams.toString();
    const response = await apiGet<ApiResponse<{ template: BadgeTemplate | null }>>(
      `/badge-templates/default${queryString ? `?${queryString}` : ''}`
    );

    if (response.success && response.data?.template) {
      return {
        success: true,
        data: { template: convertBackendToClient(response.data.template) },
      };
    }

    // Fallback to first default template
    return {
      success: true,
      data: { template: DEFAULT_TEMPLATES[0] },
    };
  } catch (error) {
    console.error('Error getting default template:', error);
    return {
      success: true,
      data: { template: DEFAULT_TEMPLATES[0] },
    };
  }
};

// ==================== Helper Functions ====================

/**
 * Convert backend template format to client format
 */
function convertBackendToClient(template: BadgeTemplate): BadgeTemplate {
  return {
    ...template,
    sizePreset: (template.sizePreset || '4x3') as BadgeSize,
    orientation: template.orientation as 'portrait' | 'landscape',
    elements: Array.isArray(template.elements) ? template.elements : [],
    isCustom: !template.isDefault,
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
  };
}

// ==================== Print Job API (Local Storage) ====================

/**
 * Create a print job
 */
export const createPrintJob = async (
  templateId: string,
  attendeeId: string,
  attendeeName: string,
  eventId: string
): Promise<{ success: boolean; data: { job: PrintJob } }> => {
  const job: PrintJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId,
    attendeeId,
    attendeeName,
    eventId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const stored = localStorage.getItem(STORAGE_KEYS.PRINT_JOBS);
  const jobs: PrintJob[] = stored ? JSON.parse(stored) : [];
  jobs.unshift(job);
  // Keep only last 100 jobs
  localStorage.setItem(STORAGE_KEYS.PRINT_JOBS, JSON.stringify(jobs.slice(0, 100)));

  return { success: true, data: { job } };
};

/**
 * Update print job status
 */
export const updatePrintJobStatus = async (
  jobId: string,
  status: PrintJob['status'],
  error?: string
): Promise<{ success: boolean; data: { job: PrintJob } }> => {
  const stored = localStorage.getItem(STORAGE_KEYS.PRINT_JOBS);
  const jobs: PrintJob[] = stored ? JSON.parse(stored) : [];

  const index = jobs.findIndex(j => j.id === jobId);
  if (index === -1) {
    throw new Error('Print job not found');
  }

  jobs[index] = {
    ...jobs[index],
    status,
    error,
    completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
  };

  localStorage.setItem(STORAGE_KEYS.PRINT_JOBS, JSON.stringify(jobs));
  return { success: true, data: { job: jobs[index] } };
};

/**
 * Get print jobs
 */
export const getPrintJobs = async (params?: {
  eventId?: string;
  status?: PrintJob['status'];
  limit?: number;
}): Promise<{ success: boolean; data: { jobs: PrintJob[] } }> => {
  const stored = localStorage.getItem(STORAGE_KEYS.PRINT_JOBS);
  let jobs: PrintJob[] = stored ? JSON.parse(stored) : [];

  if (params?.eventId) {
    jobs = jobs.filter(j => j.eventId === params.eventId);
  }
  if (params?.status) {
    jobs = jobs.filter(j => j.status === params.status);
  }
  if (params?.limit) {
    jobs = jobs.slice(0, params.limit);
  }

  return { success: true, data: { jobs } };
};

// ==================== Variable Helpers ====================

/**
 * Available template variables
 */
export const TEMPLATE_VARIABLES = [
  { key: 'eventTitle', label: 'Event Title', example: 'Tech Summit 2025' },
  { key: 'eventDate', label: 'Event Date', example: 'July 2-3, 2025' },
  { key: 'eventVenue', label: 'Event Venue', example: 'KICC, Nairobi' },
  { key: 'fullName', label: 'Full Name', example: 'John Doe' },
  { key: 'firstName', label: 'First Name', example: 'John' },
  { key: 'lastName', label: 'Last Name', example: 'Doe' },
  { key: 'email', label: 'Email', example: 'john@example.com' },
  { key: 'phone', label: 'Phone', example: '+254 700 123 456' },
  { key: 'company', label: 'Company', example: 'TechCorp Ltd' },
  { key: 'jobTitle', label: 'Job Title', example: 'Software Engineer' },
  { key: 'ticketType', label: 'Ticket Type', example: 'VIP' },
  { key: 'ticketCategory', label: 'Ticket Category', example: 'Early Bird' },
  { key: 'registrationId', label: 'Registration ID', example: 'REG-12345' },
  { key: 'qrCode', label: 'QR Code', example: 'QR data' },
  { key: 'backupCode', label: 'Backup Code', example: 'ABCD1234XY' },
];

/**
 * Replace template variables with actual data
 */
export const replaceTemplateVariables = (
  content: string,
  data: Record<string, string | undefined>
): string => {
  let result = content;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
};

/**
 * Convert attendee data to template variables
 */
export const attendeeToVariables = (
  attendee: AttendeeData,
  eventData?: { title?: string; date?: string; venue?: string }
): Record<string, string> => {
  return {
    eventTitle: eventData?.title || '',
    eventDate: eventData?.date || '',
    eventVenue: eventData?.venue || '',
    fullName: attendee.fullName,
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    email: attendee.email,
    phone: attendee.phone || '',
    company: attendee.company || '',
    jobTitle: attendee.jobTitle || '',
    ticketType: attendee.ticketType,
    ticketCategory: attendee.ticketCategory || '',
    registrationId: attendee.registrationId,
    qrCode: attendee.qrCode,
    backupCode: attendee.backupCode || '',
    ...attendee.customFields,
  };
};

// ==================== PDF Generation Helpers ====================

/**
 * Convert mm to pixels for screen display (96 DPI)
 */
export const mmToPixels = (mm: number, dpi: number = 96): number => {
  return (mm / 25.4) * dpi;
};

/**
 * Convert pixels to mm
 */
export const pixelsToMm = (pixels: number, dpi: number = 96): number => {
  return (pixels / dpi) * 25.4;
};

/**
 * Generate a unique element ID
 */
export const generateElementId = (): string => {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
