import { apiGet, apiPost, apiPatch, type ApiResponse } from './api';

export type ContactQueryStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type ContactQueryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ContactQueryResponse {
  id: string;
  queryId: string;
  response: string;
  sentBy: string;
  isInternal: boolean;
  sentAt: string;
  agent?: { id: string; firstName: string; lastName: string };
}

export interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactQueryStatus;
  priority: ContactQueryPriority;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedAgent?: { id: string; firstName: string; lastName: string; email: string } | null;
  _count?: { responses: number };
}

export interface ContactQueryDetail extends ContactQuery {
  responses: ContactQueryResponse[];
}

export interface ContactQueryListResult {
  queries: ContactQuery[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactQueryFilters {
  status?: ContactQueryStatus;
  priority?: ContactQueryPriority;
  search?: string;
  page?: number;
  limit?: number;
}

const buildParams = (filters?: Record<string, string | number | undefined>): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const listContactQueries = (filters?: ContactQueryFilters) =>
  apiGet<ApiResponse<ContactQueryListResult>>(
    `/admin/support/contact-queries${buildParams(filters as Record<string, string | number | undefined>)}`,
  );

export const getContactQuery = (id: string) =>
  apiGet<ApiResponse<{ query: ContactQueryDetail }>>(`/admin/support/contact-queries/${id}`);

export const updateContactQueryStatus = (id: string, status: ContactQueryStatus) =>
  apiPatch<ApiResponse<ContactQuery>>(`/admin/support/contact-queries/${id}/status`, { status });

export const replyToContactQuery = (id: string, response: string) =>
  apiPost<ApiResponse<{ response: ContactQueryResponse }>>(
    `/admin/support/contact-queries/${id}/reply`,
    { response },
  );

export const addContactQueryNote = (id: string, note: string) =>
  apiPost<ApiResponse<{ response: ContactQueryResponse }>>(
    `/admin/support/contact-queries/${id}/notes`,
    { note },
  );

export const getContactQueryStatistics = () =>
  apiGet<ApiResponse<{ statistics: { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> } }>>(
    '/admin/support/contact-queries/statistics',
  );
