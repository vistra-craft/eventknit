import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { IssuesService } from '../services/issues.service.js';
import { IssueStatus, IssuePriority, IssueType, UserRole } from '@prisma/client';

type IdParam = { id: string };
type SubtaskParam = { id: string; subtaskId: string };
type CommentParam = { id: string; commentId: string };

export class IssuesController {
  /**
   * GET /api/v1/admin/issues/board
   * Returns issues grouped by status column for Kanban view
   */
  static async getBoard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const columns = await IssuesService.getKanbanBoard();
      res.status(200).json({ success: true, data: columns });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/issues/stats
   */
  static async getStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await IssuesService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/issues/assignable-users
   */
  static async getAssignableUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await IssuesService.getAssignableUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/issues
   */
  static async list(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, priority, type, assigneeId, search, page, limit, includeArchived } =
        req.query;

      const filters: Parameters<typeof IssuesService.getIssues>[0] = {};

      if (
        typeof status === 'string' &&
        Object.values(IssueStatus).includes(status as IssueStatus)
      ) {
        filters.status = status as IssueStatus;
      }
      if (
        typeof priority === 'string' &&
        Object.values(IssuePriority).includes(priority as IssuePriority)
      ) {
        filters.priority = priority as IssuePriority;
      }
      if (
        typeof type === 'string' &&
        Object.values(IssueType).includes(type as IssueType)
      ) {
        filters.type = type as IssueType;
      }
      if (typeof assigneeId === 'string') filters.assigneeId = assigneeId;
      if (typeof search === 'string') filters.search = search;
      if (typeof page === 'string') filters.page = parseInt(page, 10);
      if (typeof limit === 'string') filters.limit = parseInt(limit, 10);
      if (includeArchived === 'true') filters.includeArchived = true;

      const result = await IssuesService.getIssues(filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/issues
   */
  static async create(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const reporterId = req.user!.id;
      const issue = await IssuesService.createIssue(req.body, reporterId);
      res.status(201).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/issues/:id
   */
  static async getOne(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const issue = await IssuesService.getIssueById(req.params.id);
      res.status(200).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/issues/:id
   */
  static async update(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const issue = await IssuesService.updateIssue(req.params.id, req.body);
      res.status(200).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/issues/:id/status
   * Used by drag-and-drop and manual status changes
   */
  static async updateStatus(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status, kanbanOrder } = req.body as { status: IssueStatus; kanbanOrder?: number };
      const issue = await IssuesService.updateStatus(
        req.params.id,
        status,
        kanbanOrder,
      );
      res.status(200).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/issues/:id/assign
   */
  static async assign(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { assigneeId } = req.body as { assigneeId?: string | null };
      const issue = await IssuesService.assignIssue(req.params.id, assigneeId ?? null);
      res.status(200).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/issues/:id/archive
   * SUPERADMIN only
   */
  static async archive(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const issue = await IssuesService.archiveIssue(req.params.id);
      res.status(200).json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/issues/:id
   * SUPERADMIN only — soft delete
   */
  static async remove(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await IssuesService.deleteIssue(req.params.id);
      res.status(200).json({ success: true, message: 'Issue deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/issues/:id/comments
   */
  static async addComment(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { content, isInternal = false } = req.body as {
        content: string;
        isInternal?: boolean;
      };
      const comment = await IssuesService.addComment(
        req.params.id,
        req.user!.id,
        content,
        isInternal,
      );
      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/issues/:id/comments/:commentId
   */
  static async deleteComment(
    req: AuthenticatedRequest<CommentParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const isSuperAdmin = req.user!.role === UserRole.SUPERADMIN;
      await IssuesService.deleteComment(req.params.commentId, req.user!.id, isSuperAdmin);
      res.status(200).json({ success: true, message: 'Comment deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ── Subtasks ────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/issues/:id/subtasks
   */
  static async addSubtask(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { title, order } = req.body as { title: string; order?: number };
      const subtask = await IssuesService.addSubtask(req.params.id, title, order);
      res.status(201).json({ success: true, data: subtask });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/issues/:id/subtasks/:subtaskId
   */
  static async updateSubtask(
    req: AuthenticatedRequest<SubtaskParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const subtask = await IssuesService.updateSubtask(req.params.subtaskId, req.body);
      res.status(200).json({ success: true, data: subtask });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/issues/:id/subtasks/:subtaskId
   */
  static async deleteSubtask(
    req: AuthenticatedRequest<SubtaskParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await IssuesService.deleteSubtask(req.params.subtaskId);
      res.status(200).json({ success: true, message: 'Subtask deleted' });
    } catch (error) {
      next(error);
    }
  }
}
