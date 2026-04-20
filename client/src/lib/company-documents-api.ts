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

export const getCompanyDocuments = (params?: {
  category?: CompanyDocCategory;
  type?: CompanyDocType;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.type) query.set('type', params.type);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiGet<ListDocumentsResponse['data']>(
    `/admin/company-documents${qs ? `?${qs}` : ''}`,
  );
};

export const getCompanyDocumentById = (id: string) =>
  apiGet<SingleDocumentResponse['data']>(`/admin/company-documents/${id}`);

export const createDocumentLink = (data: {
  name: string;
  description?: string;
  category: CompanyDocCategory;
  type: Exclude<CompanyDocType, 'FILE'>;
  externalUrl: string;
}) => apiPost<SingleDocumentResponse['data']>('/admin/company-documents/link', data);

export const uploadDocumentFile = (data: {
  name: string;
  description?: string;
  category: CompanyDocCategory;
  file: File;
}) => {
  const form = new FormData();
  form.append('name', data.name);
  form.append('category', data.category);
  form.append('file', data.file);
  if (data.description) form.append('description', data.description);
  return apiPost<SingleDocumentResponse['data']>('/admin/company-documents/upload', form);
};

export const updateCompanyDocument = (
  id: string,
  data: { name?: string; description?: string; category?: CompanyDocCategory; externalUrl?: string },
) => apiPatch<SingleDocumentResponse['data']>(`/admin/company-documents/${id}`, data);

export const deleteCompanyDocument = (id: string) =>
  apiDelete<{ success: boolean; message: string }>(`/admin/company-documents/${id}`);
