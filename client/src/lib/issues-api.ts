import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';
import type {
  Issue,
  IssueListResponse,
  KanbanBoard,
  IssueStats,
  IssueUser,
  IssueComment,
  IssueSubtask,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueStatus,
} from '@/types/issues';

const BASE = '/admin/issues';

// ── Board ────────────────────────────────────────────────────────────────────

export const getIssueBoard = (): Promise<{ success: boolean; data: KanbanBoard }> =>
  apiGet(`${BASE}/board`);

export const getIssueStats = (): Promise<{ success: boolean; data: IssueStats }> =>
  apiGet(`${BASE}/stats`);

export const getAssignableUsers = (): Promise<{ success: boolean; data: IssueUser[] }> =>
  apiGet(`${BASE}/assignable-users`);

// ── List (table view) ────────────────────────────────────────────────────────

export interface IssueListParams {
  status?: IssueStatus;
  priority?: string;
  type?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export const getIssues = (
  params: IssueListParams = {},
): Promise<{ success: boolean; data: IssueListResponse }> => {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.type) query.set('type', params.type);
  if (params.assigneeId) query.set('assigneeId', params.assigneeId);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.includeArchived) query.set('includeArchived', 'true');
  return apiGet(`${BASE}?${query.toString()}`);
};

// ── Single issue ─────────────────────────────────────────────────────────────

export const getIssue = (id: string): Promise<{ success: boolean; data: Issue }> =>
  apiGet(`${BASE}/${id}`);

export const createIssue = (
  payload: CreateIssuePayload,
): Promise<{ success: boolean; data: Issue }> => apiPost(BASE, payload);

export const updateIssue = (
  id: string,
  payload: UpdateIssuePayload,
): Promise<{ success: boolean; data: Issue }> => apiPut(`${BASE}/${id}`, payload);

export const updateIssueStatus = (
  id: string,
  status: IssueStatus,
  kanbanOrder?: number,
): Promise<{ success: boolean; data: Issue }> =>
  apiPatch(`${BASE}/${id}/status`, { status, kanbanOrder });

export const assignIssue = (
  id: string,
  assigneeId: string | null,
): Promise<{ success: boolean; data: Issue }> =>
  apiPatch(`${BASE}/${id}/assign`, { assigneeId });

export const archiveIssue = (id: string): Promise<{ success: boolean; data: Issue }> =>
  apiPatch(`${BASE}/${id}/archive`, {});

export const deleteIssue = (id: string): Promise<{ success: boolean }> =>
  apiDelete(`${BASE}/${id}`);

// ── Comments ─────────────────────────────────────────────────────────────────

export const addComment = (
  issueId: string,
  content: string,
  isInternal = false,
): Promise<{ success: boolean; data: IssueComment }> =>
  apiPost(`${BASE}/${issueId}/comments`, { content, isInternal });

export const deleteComment = (
  issueId: string,
  commentId: string,
): Promise<{ success: boolean }> => apiDelete(`${BASE}/${issueId}/comments/${commentId}`);

// ── Subtasks ─────────────────────────────────────────────────────────────────

export const addSubtask = (
  issueId: string,
  title: string,
  order?: number,
): Promise<{ success: boolean; data: IssueSubtask }> =>
  apiPost(`${BASE}/${issueId}/subtasks`, { title, order });

export const updateSubtask = (
  issueId: string,
  subtaskId: string,
  data: { title?: string; completed?: boolean; order?: number },
): Promise<{ success: boolean; data: IssueSubtask }> =>
  apiPatch(`${BASE}/${issueId}/subtasks/${subtaskId}`, data);

export const deleteSubtask = (
  issueId: string,
  subtaskId: string,
): Promise<{ success: boolean }> => apiDelete(`${BASE}/${issueId}/subtasks/${subtaskId}`);
