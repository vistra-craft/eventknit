import { prisma } from '../config/database.js';
import { SupportQueryStatus, SupportPriority, Prisma } from '@prisma/client';
import { emailService } from './email.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateContactQueryData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactQueryFilters {
  status?: SupportQueryStatus;
  priority?: SupportPriority;
  search?: string;
  page?: number;
  limit?: number;
}

export class ContactQueryService {
  static async createQuery(data: CreateContactQueryData) {
    try {
      return await prisma.contactQuery.create({ data });
    } catch (error) {
      logger.error('Failed to create contact query:', error);
      throw new ValidationError('Failed to submit contact query');
    }
  }

  static async getQueries(filters?: ContactQueryFilters) {
    const page = filters?.page ?? 1;
    const limit = Math.min(filters?.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ContactQueryWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [queries, total] = await Promise.all([
      prisma.contactQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAgent: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { responses: true } },
        },
      }),
      prisma.contactQuery.count({ where }),
    ]);

    return {
      queries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getQueryById(id: string) {
    const query = await prisma.contactQuery.findUnique({
      where: { id },
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        responses: {
          orderBy: { sentAt: 'asc' },
          include: {
            agent: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!query) throw new NotFoundError('Contact query not found');
    return query;
  }

  static async updateStatus(id: string, status: SupportQueryStatus) {
    const query = await prisma.contactQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundError('Contact query not found');

    return prisma.contactQuery.update({
      where: { id },
      data: {
        status,
        ...(status === SupportQueryStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
      },
    });
  }

  static async updatePriority(id: string, priority: SupportPriority) {
    const query = await prisma.contactQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundError('Contact query not found');

    return prisma.contactQuery.update({ where: { id }, data: { priority } });
  }

  static async replyToQuery(id: string, agentId: string, responseText: string) {
    const query = await prisma.contactQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundError('Contact query not found');

    const [response] = await Promise.all([
      prisma.contactQueryResponse.create({
        data: { queryId: id, response: responseText, sentBy: agentId, isInternal: false },
        include: { agent: { select: { id: true, firstName: true, lastName: true } } },
      }),
      // Move to IN_PROGRESS only if still NEW
      query.status === SupportQueryStatus.NEW
        ? prisma.contactQuery.update({
          where: { id },
          data: { status: SupportQueryStatus.IN_PROGRESS },
        })
        : Promise.resolve(null),
    ]);

    // Fire-and-forget email — log but never throw
    emailService
      .sendEmail({
        to: query.email,
        subject: `Re: ${query.subject}`,
        html: buildReplyHtml(query.name, responseText, query.subject),
        text: `Hi ${query.name},\n\n${responseText}\n\n---\nIn reply to: ${query.subject}\n\nEventKnit Support Team`,
      })
      .then((result) => {
        if (!result.success) {
          logger.warn(`Contact reply email failed for query ${id}: ${result.error?.message}`);
        }
      });

    return response;
  }

  static async addInternalNote(id: string, agentId: string, note: string) {
    const query = await prisma.contactQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundError('Contact query not found');

    return prisma.contactQueryResponse.create({
      data: { queryId: id, response: note, sentBy: agentId, isInternal: true },
      include: { agent: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  static async getStatistics() {
    const [total, byStatus, byPriority] = await Promise.all([
      prisma.contactQuery.count(),
      prisma.contactQuery.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.contactQuery.groupBy({ by: ['priority'], _count: { id: true } }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, item) => { acc[item.status] = item._count.id; return acc; },
        {} as Record<string, number>,
      ),
      byPriority: byPriority.reduce(
        (acc, item) => { acc[item.priority] = item._count.id; return acc; },
        {} as Record<string, number>,
      ),
    };
  }
}

function buildReplyHtml(name: string, replyText: string, originalSubject: string): string {
  const escaped = replyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\n/g, '<br/>');
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <p>Hi ${name},</p>
      <p>${withBreaks}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #888; font-size: 13px;">In reply to your message: <em>${originalSubject}</em></p>
      <p style="color: #888; font-size: 13px;">EventKnit Support Team</p>
    </div>
  `;
}
