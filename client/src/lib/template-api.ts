/**
 * Template API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from './api';

/**
 * Template Element
 */
export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'qrcode' | 'barcode' | 'line' | 'rectangle';
  x: number;
  y: number;
  xPercent?: number;
  yPercent?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  text?: string;
  content?: string;
  field?: string;
  rotation?: number;
  align?: 'left' | 'center' | 'right';
  zIndex?: number;
}

/**
 * Template Data
 */
export interface TemplateData {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  backgroundUrl?: string;
  width?: number;
  height?: number;
  unit?: 'px' | 'mm' | 'in';
  elements?: TemplateElement[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Create Template Data
 */
export interface CreateTemplateData {
  name: string;
  description?: string;
  backgroundUrl?: string;
  width?: number;
  height?: number;
  unit?: 'px' | 'mm' | 'in';
  elements?: TemplateElement[];
  isDefault?: boolean;
}

/**
 * Update Template Data
 */
export interface UpdateTemplateData {
  name?: string;
  description?: string;
  backgroundUrl?: string;
  width?: number;
  height?: number;
  unit?: 'px' | 'mm' | 'in';
  elements?: TemplateElement[];
  isDefault?: boolean;
}

/**
 * Template Response
 */
export interface TemplateResponse {
  success: boolean;
  message?: string;
  data: {
    template: TemplateData;
  };
}

/**
 * Templates List Response
 */
export interface TemplatesListResponse {
  success: boolean;
  data: {
    templates: TemplateData[];
  };
}

/**
 * Create a new template for an event
 */
export const createTemplate = async (
  eventId: string,
  data: CreateTemplateData
): Promise<TemplateResponse> => {
  return apiPost<TemplateResponse>(`/templates/events/${eventId}`, data);
};

/**
 * Get all templates for an event
 */
export const getEventTemplates = async (
  eventId: string
): Promise<TemplatesListResponse> => {
  return apiGet<TemplatesListResponse>(`/templates/events/${eventId}`);
};

/**
 * Get template by ID
 */
export const getTemplateById = async (
  templateId: string
): Promise<TemplateResponse> => {
  return apiGet<TemplateResponse>(`/templates/${templateId}`);
};

/**
 * Get default template for an event (public - for printing)
 */
export const getDefaultTemplate = async (
  eventId: string
): Promise<TemplateResponse> => {
  // Public endpoint - no auth required
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const response = await fetch(`${API_BASE_URL}/templates/events/${eventId}/default`);
  const data = await response.json();
  
  if (!response.ok) {
    throw {
      success: false,
      message: data.message || 'Failed to fetch template',
    };
  }
  
  return data;
};

/**
 * Update template
 */
export const updateTemplate = async (
  templateId: string,
  data: UpdateTemplateData
): Promise<TemplateResponse> => {
  return apiPut<TemplateResponse>(`/templates/${templateId}`, data);
};

/**
 * Delete template
 */
export const deleteTemplate = async (
  templateId: string
): Promise<ApiResponse<void>> => {
  return apiDelete<ApiResponse<void>>(`/templates/${templateId}`);
};

/**
 * Duplicate template
 */
export const duplicateTemplate = async (
  templateId: string,
  name: string
): Promise<TemplateResponse> => {
  return apiPost<TemplateResponse>(`/templates/${templateId}/duplicate`, { name });
};


