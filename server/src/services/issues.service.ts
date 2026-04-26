import { prisma } from '../config/database.js';
import { IssueStatus, IssuePriority, IssueStoryPoints, IssueType, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateIssueData {
  title: string;
  type?: IssueType;
  priority?: IssuePriority;
  storyPoints?: IssueStoryPoints | null;
  description?: string | null;
  userStoryAs?: string | null;
  userStoryWant?: string | null;
  userStorySoThat?: string | null;
  needToKnow?: string | null;
  workNotes?: string | null;
  acceptanceCriteria?: Array<{ id: string; text: string; completed: boolean }> | null;
  tags?: string[];
  dueDate?: Date | null;
  assigneeId?: string | null;
  templateId?: string | null;
  blockedByIds?: string[];
}

export interface UpdateIssueData {
  title?: string;
  type?: IssueType;
  priority?: IssuePriority;
  storyPoints?: IssueStoryPoints | null;
  description?: string | null;
  userStoryAs?: string | null;
  userStoryWant?: string | null;
  userStorySoThat?: string | null;
  needToKnow?: string | null;
  workNotes?: string | null;
  acceptanceCriteria?: Array<{ id: string; text: string; completed: boolean }> | null;
  tags?: string[];
  dueDate?: Date | null;
  assigneeId?: string | null;
  blockedByIds?: string[];
}

export interface IssueFilters {
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
} as const;

const issueInclude = {
  reporter: { select: userSelect },
  assignee: { select: userSelect },
  subtasks: { orderBy: { order: 'asc' as const } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: userSelect } },
  },
  blockedBy: {
    where: { deletedAt: null },
    select: { id: true, number: true, title: true, status: true },
  },
  blocking: {
    where: { deletedAt: null },
    select: { id: true, number: true, title: true, status: true },
  },
} as const;

export class IssuesService {
  static async createIssue(data: CreateIssueData, reporterId: string) {
    const { blockedByIds = [], ...rest } = data;

    if (rest.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: rest.assigneeId } });
      if (!assignee) throw new ValidationError('Assignee not found');
    }

    const issue = await prisma.issue.create({
      data: {
        ...rest,
        createdById: reporterId,
        acceptanceCriteria: rest.acceptanceCriteria
          ? (rest.acceptanceCriteria as Prisma.InputJsonValue)
          : undefined,
        blockedBy: blockedByIds.length
          ? { connect: blockedByIds.map((id) => ({ id })) }
          : undefined,
      },
      include: issueInclude,
    });

    logger.info(`Issue #${issue.number} created by ${reporterId}`);
    return issue;
  }

  static async getIssues(filters: IssueFilters = {}) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.IssueWhereInput = {
      deletedAt: null,
    };

    if (!filters.includeArchived) {
      where.status = filters.status ?? { not: IssueStatus.ARCHIVED };
    } else if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) where.priority = filters.priority;
    if (filters.type) where.type = filters.type;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { kanbanOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          reporter: { select: userSelect },
          assignee: { select: userSelect },
          subtasks: { orderBy: { order: 'asc' } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    return { issues, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getIssueById(id: string) {
    const issue = await prisma.issue.findFirst({
      where: { id, deletedAt: null },
      include: issueInclude,
    });
    if (!issue) throw new NotFoundError('Issue not found');
    return issue;
  }

  static async getKanbanBoard() {
    const issues = await prisma.issue.findMany({
      where: { deletedAt: null, status: { not: IssueStatus.ARCHIVED } },
      orderBy: [{ kanbanOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        reporter: { select: userSelect },
        assignee: { select: userSelect },
        subtasks: { orderBy: { order: 'asc' } },
        _count: { select: { comments: true } },
      },
    });

    const columns: Record<string, typeof issues> = {
      [IssueStatus.NOT_STARTED]: [],
      [IssueStatus.BLOCKED]: [],
      [IssueStatus.IN_PROGRESS]: [],
      [IssueStatus.UNDER_REVIEW]: [],
      [IssueStatus.DONE]: [],
    };

    for (const issue of issues) {
      columns[issue.status]?.push(issue);
    }

    return columns;
  }

  static async getStats() {
    const [statusCounts, priorityCounts, total] = await Promise.all([
      prisma.issue.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.issue.groupBy({
        by: ['priority'],
        where: { deletedAt: null, status: { not: IssueStatus.ARCHIVED } },
        _count: true,
      }),
      prisma.issue.count({ where: { deletedAt: null } }),
    ]);

    return { statusCounts, priorityCounts, total };
  }

  static async updateIssue(id: string, data: UpdateIssueData) {
    const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Issue not found');

    const { blockedByIds, ...rest } = data;

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        ...rest,
        acceptanceCriteria: rest.acceptanceCriteria !== undefined
          ? rest.acceptanceCriteria === null
            ? Prisma.JsonNull
            : (rest.acceptanceCriteria as Prisma.InputJsonValue)
          : undefined,
        ...(blockedByIds !== undefined && {
          blockedBy: { set: blockedByIds.map((bid) => ({ id: bid })) },
        }),
      },
      include: issueInclude,
    });

    return issue;
  }

  static async updateStatus(id: string, status: IssueStatus, kanbanOrder?: number) {
    const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Issue not found');

    return prisma.issue.update({
      where: { id },
      data: {
        status,
        ...(kanbanOrder !== undefined && { kanbanOrder }),
      },
      include: issueInclude,
    });
  }

  static async assignIssue(id: string, assigneeId: string | null) {
    const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Issue not found');

    if (assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee) throw new ValidationError('Assignee not found');
    }

    return prisma.issue.update({
      where: { id },
      data: { assigneeId },
      include: issueInclude,
    });
  }

  static async archiveIssue(id: string) {
    const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Issue not found');

    return prisma.issue.update({
      where: { id },
      data: { status: IssueStatus.ARCHIVED },
      include: issueInclude,
    });
  }

  static async deleteIssue(id: string) {
    const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Issue not found');

    await prisma.issue.update({ where: { id }, data: { deletedAt: new Date() } });
    logger.info(`Issue ${id} soft-deleted`);
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  static async addComment(issueId: string, authorId: string, content: string, isInternal: boolean) {
    const issue = await prisma.issue.findFirst({ where: { id: issueId, deletedAt: null } });
    if (!issue) throw new NotFoundError('Issue not found');

    return prisma.issueComment.create({
      data: { issueId, authorId, content, isInternal },
      include: { author: { select: userSelect } },
    });
  }

  static async deleteComment(commentId: string, requesterId: string, isSuperAdmin: boolean) {
    const comment = await prisma.issueComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');
    if (!isSuperAdmin && comment.authorId !== requesterId) {
      throw new AuthorizationError('You can only delete your own comments');
    }
    await prisma.issueComment.delete({ where: { id: commentId } });
  }

  // ── Subtasks ────────────────────────────────────────────────────────────────

  static async addSubtask(issueId: string, title: string, order?: number) {
    const issue = await prisma.issue.findFirst({ where: { id: issueId, deletedAt: null } });
    if (!issue) throw new NotFoundError('Issue not found');

    const nextOrder = order ?? (await prisma.issueSubtask.count({ where: { issueId } }));

    return prisma.issueSubtask.create({
      data: { issueId, title, order: nextOrder },
    });
  }

  static async updateSubtask(
    subtaskId: string,
    data: { title?: string; completed?: boolean; order?: number },
  ) {
    const subtask = await prisma.issueSubtask.findUnique({ where: { id: subtaskId } });
    if (!subtask) throw new NotFoundError('Subtask not found');
    return prisma.issueSubtask.update({ where: { id: subtaskId }, data });
  }

  static async deleteSubtask(subtaskId: string) {
    const subtask = await prisma.issueSubtask.findUnique({ where: { id: subtaskId } });
    if (!subtask) throw new NotFoundError('Subtask not found');
    await prisma.issueSubtask.delete({ where: { id: subtaskId } });
  }

  // ── Assignable users ─────────────────────────────────────────────────────────

  static async getAssignableUsers() {
    return prisma.user.findMany({
      where: {
        role: { in: ['SUPERADMIN', 'ADMIN'] },
        status: 'ACTIVE',
      },
      select: userSelect,
      orderBy: { firstName: 'asc' },
    });
  }
}
