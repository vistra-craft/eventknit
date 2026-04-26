import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIssueBoard,
  getIssues,
  getIssue,
  getIssueStats,
  getAssignableUsers,
  createIssue,
  updateIssue,
  updateIssueStatus,
  assignIssue,
  archiveIssue,
  deleteIssue,
  addComment,
  deleteComment,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  type IssueListParams,
} from '@/lib/issues-api';
import type {
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueStatus,
} from '@/types/issues';
import { useToast } from '@/hooks/useToast';

export const issueKeys = {
  all: ['issues'] as const,
  board: () => [...issueKeys.all, 'board'] as const,
  stats: () => [...issueKeys.all, 'stats'] as const,
  assignable: () => [...issueKeys.all, 'assignable-users'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (params: IssueListParams) => [...issueKeys.lists(), params] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useIssueBoard() {
  return useQuery({
    queryKey: issueKeys.board(),
    queryFn: async () => {
      const res = await getIssueBoard();
      return res.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useIssueStats() {
  return useQuery({
    queryKey: issueKeys.stats(),
    queryFn: async () => {
      const res = await getIssueStats();
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: issueKeys.assignable(),
    queryFn: async () => {
      const res = await getAssignableUsers();
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useIssueList(params: IssueListParams = {}) {
  return useQuery({
    queryKey: issueKeys.list(params),
    queryFn: async () => {
      const res = await getIssues(params);
      return res.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useIssueDetail(id: string) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: async () => {
      const res = await getIssue(id);
      return res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateIssue() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: CreateIssuePayload) => createIssue(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.board() });
      qc.invalidateQueries({ queryKey: issueKeys.lists() });
      qc.invalidateQueries({ queryKey: issueKeys.stats() });
      toast({ title: 'Issue created' });
    },
    onError: () => toast({ title: 'Failed to create issue', variant: 'destructive' }),
  });
}

export function useUpdateIssue(id: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: UpdateIssuePayload) => updateIssue(id, payload),
    onSuccess: (res) => {
      // Merge into existing cache — update responses omit blockedBy/blocking relations
      qc.setQueryData(issueKeys.detail(id), (old: unknown) =>
        old ? { ...(old as object), ...res.data } : res.data,
      );
      qc.invalidateQueries({ queryKey: issueKeys.board() });
      qc.invalidateQueries({ queryKey: issueKeys.lists() });
      toast({ title: 'Issue updated' });
    },
    onError: () => toast({ title: 'Failed to update issue', variant: 'destructive' }),
  });
}

export function useUpdateIssueStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      status,
      kanbanOrder,
    }: {
      id: string;
      status: IssueStatus;
      kanbanOrder?: number;
    }) => updateIssueStatus(id, status, kanbanOrder),
    onSuccess: (res) => {
      qc.setQueryData(issueKeys.detail(res.data.id), (old: unknown) =>
        old ? { ...(old as object), ...res.data } : res.data,
      );
      qc.invalidateQueries({ queryKey: issueKeys.board() });
      qc.invalidateQueries({ queryKey: issueKeys.lists() });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
      qc.invalidateQueries({ queryKey: issueKeys.board() });
    },
  });
}

export function useAssignIssue(id: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (assigneeId: string | null) => assignIssue(id, assigneeId),
    onSuccess: (res) => {
      qc.setQueryData(issueKeys.detail(id), (old: unknown) =>
        old ? { ...(old as object), ...res.data } : res.data,
      );
      qc.invalidateQueries({ queryKey: issueKeys.board() });
      toast({ title: res.data.assigneeId ? 'Issue assigned' : 'Assignee removed' });
    },
    onError: () => toast({ title: 'Failed to assign issue', variant: 'destructive' }),
  });
}

export function useArchiveIssue() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => archiveIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.board() });
      qc.invalidateQueries({ queryKey: issueKeys.lists() });
      qc.invalidateQueries({ queryKey: issueKeys.stats() });
      toast({ title: 'Issue archived' });
    },
    onError: () => toast({ title: 'Failed to archive issue', variant: 'destructive' }),
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.board() });
      qc.invalidateQueries({ queryKey: issueKeys.lists() });
      qc.invalidateQueries({ queryKey: issueKeys.stats() });
      toast({ title: 'Issue deleted' });
    },
    onError: () => toast({ title: 'Failed to delete issue', variant: 'destructive' }),
  });
}

// ── Comment mutations ────────────────────────────────────────────────────────

export function useAddComment(issueId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ content, isInternal }: { content: string; isInternal?: boolean }) =>
      addComment(issueId, content, isInternal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
    },
    onError: () => toast({ title: 'Failed to add comment', variant: 'destructive' }),
  });
}

export function useDeleteComment(issueId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(issueId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      toast({ title: 'Comment deleted' });
    },
    onError: () => toast({ title: 'Failed to delete comment', variant: 'destructive' }),
  });
}

// ── Subtask mutations ────────────────────────────────────────────────────────

export function useAddSubtask(issueId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ title, order }: { title: string; order?: number }) =>
      addSubtask(issueId, title, order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.board() });
    },
    onError: () => toast({ title: 'Failed to add subtask', variant: 'destructive' }),
  });
}

export function useUpdateSubtask(issueId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      subtaskId,
      data,
    }: {
      subtaskId: string;
      data: { title?: string; completed?: boolean; order?: number };
    }) => updateSubtask(issueId, subtaskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.board() });
    },
    onError: () => toast({ title: 'Failed to update subtask', variant: 'destructive' }),
  });
}

export function useDeleteSubtask(issueId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(issueId, subtaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.board() });
    },
    onError: () => toast({ title: 'Failed to delete subtask', variant: 'destructive' }),
  });
}
