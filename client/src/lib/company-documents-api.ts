import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompanyDocCategory =
  | 'LEGAL'
  | 'FINANCIAL'
  | 'HR'
  | 'OPERATIONS'
  | 'MARKETING'
  | 'COMPLIANCE'
  | 'CONTRACTS'
  | 'POLICIES'
  | 'OTHER';

export type CompanyDocType =
  | 'FILE'
  | 'GOOGLE_DOC'
  | 'GOOGLE_SHEET'
  | 'GOOGLE_SLIDES'
  | 'EXTERNAL_LINK';

export interface DocumentUploader {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  description: string | null;
  category: CompanyDocCategory;
  type: CompanyDocType;
  fileUrl: string | null;
  externalUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: DocumentUploader;
  createdAt: string;
  updatedAt: string;
}

export interface ListDocumentsResponse {
  success: boolean;
  data: {
    documents: CompanyDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleDocumentResponse {
  success: boolean;
  data: { document: CompanyDocument };
  message?: string;
}

// ─── Label maps (shared with UI) ──────────────────────────────────────────────

export const CATEGORY_LABELS: Record<CompanyDocCategory, string> = {
  LEGAL: 'Legal',
  FINANCIAL: 'Financial',
  HR: 'Human Resources',
  OPERATIONS: 'Operations',
  MARKETING: 'Marketing',
  COMPLIANCE: 'Compliance',
  CONTRACTS: 'Contracts',
  POLICIES: 'Policies',
  OTHER: 'Other',
};

export const DOC_TYPE_LABELS: Record<CompanyDocType, string> = {
  FILE: 'Uploaded File',
  GOOGLE_DOC: 'Google Doc',
  GOOGLE_SHEET: 'Google Sheet',
  GOOGLE_SLIDES: 'Google Slides',
  EXTERNAL_LINK: 'External Link',
};

// ─── API functions ────────────────────────────────────────────────────────────

export const getCompanyDocuments = async (params?: {
  category?: CompanyDocCategory;
  type?: CompanyDocType;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ListDocumentsResponse['data']> => {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.type) query.set('type', params.type);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const response = await apiGet<ListDocumentsResponse>(
    `/admin/company-documents${qs ? `?${qs}` : ''}`,
  );
  return response.data;
};

export const getCompanyDocumentById = async (id: string): Promise<SingleDocumentResponse['data']> => {
  const response = await apiGet<SingleDocumentResponse>(`/admin/company-documents/${id}`);
  return response.data;
};

export const createDocumentLink = async (data: {
  name: string;
  description?: string;
  category: CompanyDocCategory;
  type: Exclude<CompanyDocType, 'FILE'>;
  externalUrl: string;
}): Promise<SingleDocumentResponse['data']> => {
  const response = await apiPost<SingleDocumentResponse>('/admin/company-documents/link', data);
  return response.data;
};

export const uploadDocumentFile = async (data: {
  name: string;
  description?: string;
  category: CompanyDocCategory;
  file: File;
}): Promise<SingleDocumentResponse['data']> => {
  const form = new FormData();
  form.append('name', data.name);
  form.append('category', data.category);
  form.append('file', data.file);
  if (data.description) form.append('description', data.description);
  const response = await apiPost<SingleDocumentResponse>('/admin/company-documents/upload', form);
  return response.data;
};

export const updateCompanyDocument = async (
  id: string,
  data: { name?: string; description?: string; category?: CompanyDocCategory; externalUrl?: string },
): Promise<SingleDocumentResponse['data']> => {
  const response = await apiPatch<SingleDocumentResponse>(`/admin/company-documents/${id}`, data);
  return response.data;
};

export const deleteCompanyDocument = (id: string) =>
  apiDelete<{ success: boolean; message: string }>(`/admin/company-documents/${id}`);
