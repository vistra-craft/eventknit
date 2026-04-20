import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export interface CreateReportInput {
  eventId: string;
  reportedBy: string;
  category: string;
  description?: string;
  submittedIp?: string;
  userAgent?: string;
}

export interface GetReportsOptions {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface UpdateReportInput {
  status: string;
  reviewNotes?: string;
  reviewedBy?: string;
}

class EventReportService {
  /**
   * Create an event report
   */
  async createReport(data: CreateReportInput) {
    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { id: true, title: true, status: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    try {
      const report = await prisma.eventReport.create({
        data: {
          eventId: data.eventId,
          reportedBy: data.reportedBy,
          category: data.category,
          description: data.description || null,
          submittedIp: data.submittedIp,
          userAgent: data.userAgent,
        },
      });

      logger.info(`Event report created: ${report.id} for event ${data.eventId} by user ${data.reportedBy}`);
      return report;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError('You have already reported this event');
      }
      throw error;
    }
  }

  /**
   * Get paginated event reports with filters (admin only)
   */
  async getReports(options: GetReportsOptions = {}) {
    const { status, category, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [reports, total] = await Promise.all([
      prisma.eventReport.findMany({
        where,
        include: {
          event: { select: { id: true, title: true, organizerId: true } },
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eventReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a report's status (admin only)
   */
  async updateReport(id: string, data: UpdateReportInput) {
    const existing = await prisma.eventReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Report not found');
    }

    return prisma.eventReport.update({
      where: { id },
      data: {
        status: data.status,
        reviewNotes: data.reviewNotes,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Get report statistics (admin only)
   */
  async getReportStats() {
    const [statusCounts, categoryCounts] = await Promise.all([
      prisma.eventReport.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.eventReport.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const item of statusCounts) {
      byStatus[item.status] = item._count.status;
      total += item._count.status;
    }

    const byCategory: Record<string, number> = {};
    for (const item of categoryCounts) {
      byCategory[item.category] = item._count.category;
    }

    return {
      total,
      pending: byStatus['PENDING'] || 0,
      investigating: byStatus['INVESTIGATING'] || 0,
      resolved: byStatus['RESOLVED'] || 0,
      dismissed: byStatus['DISMISSED'] || 0,
      byCategory,
    };
  }

  /**
   * Check if a user has already reported an event
   */
  async hasUserReportedEvent(eventId: string, userId: string): Promise<boolean> {
    const report = await prisma.eventReport.findUnique({
      where: { eventId_reportedBy: { eventId, reportedBy: userId } },
      select: { id: true },
    });
    return !!report;
  }
}

export const eventReportService = new EventReportService();
