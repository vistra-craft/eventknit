/**
 * Invoice API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, apiFetch, type ApiResponse } from './api';

// ==================== Types ====================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  transactionId: string;
  registrationId: string;
  eventId: string;
  issueDate: string;
  dueDate?: string;
  status: string;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  currency: string;
  billToName: string;
  billToEmail: string;
  billToAddress?: string;
  billToCity?: string;
  billToState?: string;
  billToCountry?: string;
  billToZipCode?: string;
  templateId?: string;
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  sentAt?: string;
  sentTo?: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  event?: {
    id: string;
    title: string;
  };
  registration?: {
    attendee: {
      firstName?: string;
      lastName?: string;
      email: string;
    };
  };
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType?: string;
  itemId?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  htmlContent: string;
  cssContent?: string;
  variables?: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Invoice Functions ====================

export const createInvoice = async (data: {
  transactionId: string;
  templateId?: string;
  includeTax?: boolean;
  taxRate?: number;
  dueDate?: string;
  notes?: string;
  terms?: string;
}): Promise<ApiResponse<{ invoice: Invoice }>> => {
  return apiPost('/admin/invoices', data);
};

export const getInvoiceById = async (invoiceId: string): Promise<ApiResponse<{ invoice: Invoice }>> => {
  return apiGet(`/user-dashboard/invoices/${invoiceId}`);
};

export const getInvoiceByNumber = async (invoiceNumber: string): Promise<ApiResponse<{ invoice: Invoice }>> => {
  return apiGet(`/user-dashboard/invoices/number/${invoiceNumber}`);
};

export const getUserInvoices = async (filters?: {
  status?: string;
  eventId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/invoices?${queryString}` : '/user-dashboard/invoices';
  return apiGet(endpoint);
};

export const getEventInvoices = async (eventId: string, filters?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/organizer-dashboard/events/${eventId}/invoices?${queryString}`
    : `/organizer-dashboard/events/${eventId}/invoices`;
  return apiGet(endpoint);
};

export const generateInvoiceHTML = async (invoiceId: string): Promise<string> => {
  const response = await apiFetch(`/user-dashboard/invoices/${invoiceId}/html`);
  if (!response.ok) throw new Error('Failed to generate invoice HTML');
  return response.text();
};

export const downloadInvoice = async (invoiceId: string): Promise<void> => {
  const response = await apiFetch(`/user-dashboard/invoices/${invoiceId}/download`);
  if (!response.ok) throw new Error('Failed to download invoice');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceId}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const markInvoiceAsSent = async (invoiceId: string, sentTo: string): Promise<ApiResponse<{ invoice: Invoice }>> => {
  return apiPost(`/admin/invoices/${invoiceId}/send`, { sentTo });
};

export const updateInvoiceStatus = async (invoiceId: string, status: string): Promise<ApiResponse<{ invoice: Invoice }>> => {
  return apiPut(`/admin/invoices/${invoiceId}/status`, { status });
};

// ==================== Invoice Template Functions ====================

export const createInvoiceTemplate = async (data: {
  name: string;
  description?: string;
  type?: string;
  htmlContent: string;
  cssContent?: string;
  variables?: Record<string, unknown>;
  isDefault?: boolean;
}): Promise<ApiResponse<{ template: InvoiceTemplate }>> => {
  return apiPost('/admin/invoices/templates', data);
};

export const getInvoiceTemplates = async (filters?: {
  type?: string;
  isActive?: boolean;
  includeInactive?: boolean;
}): Promise<ApiResponse<{ templates: InvoiceTemplate[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
  if (filters?.includeInactive) queryParams.append('includeInactive', 'true');

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/admin/invoices/templates?${queryString}` : '/admin/invoices/templates';
  return apiGet(endpoint);
};

export const getInvoiceTemplateById = async (templateId: string): Promise<ApiResponse<{ template: InvoiceTemplate }>> => {
  return apiGet(`/admin/invoices/templates/${templateId}`);
};

export const getDefaultInvoiceTemplate = async (): Promise<ApiResponse<{ template: InvoiceTemplate }>> => {
  return apiGet('/admin/invoices/templates/default');
};

export const updateInvoiceTemplate = async (templateId: string, data: {
  name?: string;
  description?: string;
  type?: string;
  htmlContent?: string;
  cssContent?: string;
  variables?: Record<string, unknown>;
  isDefault?: boolean;
  isActive?: boolean;
}): Promise<ApiResponse<{ template: InvoiceTemplate }>> => {
  return apiPut(`/admin/invoices/templates/${templateId}`, data);
};

export const deleteInvoiceTemplate = async (templateId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/admin/invoices/templates/${templateId}`);
};
