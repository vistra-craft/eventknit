import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { eventReportService } from '../../../src/services/event-report.service.js';
import { NotFoundError, ConflictError } from '../../../src/utils/errors.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('EventReportService', () => {
  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    status: 'PUBLISHED',
  };

  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  const mockReport = {
    id: 'report-123',
    eventId: mockEvent.id,
    reportedBy: mockUser.id,
    category: 'SPAM',
    description: 'This event looks like spam',
    status: 'PENDING',
    submittedIp: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createReport', () => {
    it('should create a report successfully', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);
      prismaMock.eventReport.create.mockResolvedValue(mockReport as any);

      const result = await eventReportService.createReport({
        eventId: mockEvent.id,
        reportedBy: mockUser.id,
        category: 'SPAM',
        description: 'This event looks like spam',
        submittedIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockReport);
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { id: mockEvent.id },
        select: { id: true, title: true, status: true },
      });
      expect(prismaMock.eventReport.create).toHaveBeenCalledWith({
        data: {
          eventId: mockEvent.id,
          reportedBy: mockUser.id,
          category: 'SPAM',
          description: 'This event looks like spam',
          submittedIp: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should throw NotFoundError when event does not exist', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(
        eventReportService.createReport({
          eventId: 'nonexistent',
          reportedBy: mockUser.id,
          category: 'FRAUD_SCAM',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on duplicate report (P2002)', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);
      prismaMock.eventReport.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        eventReportService.createReport({
          eventId: mockEvent.id,
          reportedBy: mockUser.id,
          category: 'SPAM',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should set description to null when not provided', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);
      prismaMock.eventReport.create.mockResolvedValue({ ...mockReport, description: null } as any);

      await eventReportService.createReport({
        eventId: mockEvent.id,
        reportedBy: mockUser.id,
        category: 'SAFETY',
      });

      expect(prismaMock.eventReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: null }),
      });
    });
  });

  describe('getReports', () => {
    it('should return paginated reports with defaults', async () => {
      prismaMock.eventReport.findMany.mockResolvedValue([mockReport] as any);
      prismaMock.eventReport.count.mockResolvedValue(1);

      const result = await eventReportService.getReports();

      expect(result.reports).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prismaMock.eventReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should apply status filter', async () => {
      prismaMock.eventReport.findMany.mockResolvedValue([]);
      prismaMock.eventReport.count.mockResolvedValue(0);

      await eventReportService.getReports({ status: 'PENDING' });

      expect(prismaMock.eventReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
        }),
      );
    });

    it('should apply category filter', async () => {
      prismaMock.eventReport.findMany.mockResolvedValue([]);
      prismaMock.eventReport.count.mockResolvedValue(0);

      await eventReportService.getReports({ category: 'FRAUD_SCAM' });

      expect(prismaMock.eventReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'FRAUD_SCAM' },
        }),
      );
    });

    it('should apply both status and category filters', async () => {
      prismaMock.eventReport.findMany.mockResolvedValue([]);
      prismaMock.eventReport.count.mockResolvedValue(0);

      await eventReportService.getReports({ status: 'PENDING', category: 'SPAM' });

      expect(prismaMock.eventReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING', category: 'SPAM' },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      prismaMock.eventReport.findMany.mockResolvedValue([]);
      prismaMock.eventReport.count.mockResolvedValue(50);

      const result = await eventReportService.getReports({ page: 3, limit: 10 });

      expect(result.pagination.totalPages).toBe(5);
      expect(prismaMock.eventReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe('updateReport', () => {
    it('should update report status', async () => {
      const updatedReport = { ...mockReport, status: 'INVESTIGATING', reviewedBy: 'admin-1', reviewedAt: expect.any(Date) };
      prismaMock.eventReport.findUnique.mockResolvedValue(mockReport as any);
      prismaMock.eventReport.update.mockResolvedValue(updatedReport as any);

      const result = await eventReportService.updateReport('report-123', {
        status: 'INVESTIGATING',
        reviewedBy: 'admin-1',
      });

      expect(result.status).toBe('INVESTIGATING');
      expect(prismaMock.eventReport.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: {
          status: 'INVESTIGATING',
          reviewNotes: undefined,
          reviewedBy: 'admin-1',
          reviewedAt: expect.any(Date),
        },
      });
    });

    it('should update report with review notes', async () => {
      prismaMock.eventReport.findUnique.mockResolvedValue(mockReport as any);
      prismaMock.eventReport.update.mockResolvedValue({ ...mockReport, status: 'RESOLVED', reviewNotes: 'Checked and resolved' } as any);

      await eventReportService.updateReport('report-123', {
        status: 'RESOLVED',
        reviewNotes: 'Checked and resolved',
        reviewedBy: 'admin-1',
      });

      expect(prismaMock.eventReport.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          reviewNotes: 'Checked and resolved',
        }),
      });
    });

    it('should throw NotFoundError when report does not exist', async () => {
      prismaMock.eventReport.findUnique.mockResolvedValue(null);

      await expect(
        eventReportService.updateReport('nonexistent', {
          status: 'RESOLVED',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getReportStats', () => {
    it('should return aggregated stats', async () => {
      prismaMock.eventReport.groupBy.mockResolvedValueOnce([
        { status: 'PENDING', _count: { status: 5 } },
        { status: 'INVESTIGATING', _count: { status: 2 } },
        { status: 'RESOLVED', _count: { status: 10 } },
        { status: 'DISMISSED', _count: { status: 3 } },
      ] as any);
      prismaMock.eventReport.groupBy.mockResolvedValueOnce([
        { category: 'SPAM', _count: { category: 8 } },
        { category: 'FRAUD_SCAM', _count: { category: 7 } },
        { category: 'SAFETY', _count: { category: 5 } },
      ] as any);

      const result = await eventReportService.getReportStats();

      expect(result.total).toBe(20);
      expect(result.pending).toBe(5);
      expect(result.investigating).toBe(2);
      expect(result.resolved).toBe(10);
      expect(result.dismissed).toBe(3);
      expect(result.byCategory).toEqual({
        SPAM: 8,
        FRAUD_SCAM: 7,
        SAFETY: 5,
      });
    });

    it('should return zeros when no reports exist', async () => {
      prismaMock.eventReport.groupBy.mockResolvedValueOnce([] as any);
      prismaMock.eventReport.groupBy.mockResolvedValueOnce([] as any);

      const result = await eventReportService.getReportStats();

      expect(result.total).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.investigating).toBe(0);
      expect(result.resolved).toBe(0);
      expect(result.dismissed).toBe(0);
      expect(result.byCategory).toEqual({});
    });
  });

  describe('hasUserReportedEvent', () => {
    it('should return true when user has reported event', async () => {
      prismaMock.eventReport.findUnique.mockResolvedValue({ id: 'report-123' } as any);

      const result = await eventReportService.hasUserReportedEvent('event-123', 'user-123');

      expect(result).toBe(true);
      expect(prismaMock.eventReport.findUnique).toHaveBeenCalledWith({
        where: { eventId_reportedBy: { eventId: 'event-123', reportedBy: 'user-123' } },
        select: { id: true },
      });
    });

    it('should return false when user has not reported event', async () => {
      prismaMock.eventReport.findUnique.mockResolvedValue(null);

      const result = await eventReportService.hasUserReportedEvent('event-123', 'user-123');

      expect(result).toBe(false);
    });
  });
});
