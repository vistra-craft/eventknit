/**
 * Email Template API Functions
 * Handles CRUD operations for email templates
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { ApiResponse } from './api';

// ==================== Types ====================

export interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  htmlContent: string;
  textContent?: string;
  description?: string;
  category?: string; // campaign, announcement, notification, system
  variables?: Record<string, string>; // Available template variables
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateData {
  name: string;
  subject?: string;
  htmlContent: string;
  textContent?: string;
  description?: string;
  category?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
  isDefault?: boolean;
}

export type UpdateEmailTemplateData = Partial<CreateEmailTemplateData>;

export interface EmailTemplatesResponse {
  templates: EmailTemplate[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== API Functions ====================

/**
 * Create a new email template
 */
export const createEmailTemplate = async (
  data: CreateEmailTemplateData
): Promise<ApiResponse<{ template: EmailTemplate }>> => {
  return apiPost<ApiResponse<{ template: EmailTemplate }>>(
    '/admin/communications/email-templates',
    data
  );
};

/**
 * Get all email templates with optional filters
 */
export const getEmailTemplates = async (params?: {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<EmailTemplatesResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  return apiGet<ApiResponse<EmailTemplatesResponse>>(
    `/admin/communications/email-templates${query ? `?${query}` : ''}`
  );
};

/**
 * Get email template by ID
 */
export const getEmailTemplateById = async (
  id: string
): Promise<ApiResponse<{ template: EmailTemplate }>> => {
  return apiGet<ApiResponse<{ template: EmailTemplate }>>(
    `/admin/communications/email-templates/${id}`
  );
};

/**
 * Update an email template
 */
export const updateEmailTemplate = async (
  id: string,
  data: UpdateEmailTemplateData
): Promise<ApiResponse<{ template: EmailTemplate }>> => {
  return apiPut<ApiResponse<{ template: EmailTemplate }>>(
    `/admin/communications/email-templates/${id}`,
    data
  );
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete<ApiResponse<{ success: boolean }>>(
    `/admin/communications/email-templates/${id}`
  );
};

// ==================== Helper Functions ====================

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (
  category: string
): Promise<ApiResponse<EmailTemplatesResponse>> => {
  return getEmailTemplates({ category, isActive: true });
};

/**
 * Get active templates only
 */
export const getActiveTemplates = async (): Promise<ApiResponse<EmailTemplatesResponse>> => {
  return getEmailTemplates({ isActive: true });
};

/**
 * Search templates by name or description
 */
export const searchTemplates = async (
  searchTerm: string
): Promise<ApiResponse<EmailTemplatesResponse>> => {
  return getEmailTemplates({ search: searchTerm });
};
