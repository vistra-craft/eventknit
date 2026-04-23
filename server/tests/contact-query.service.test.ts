import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactQueryService } from '../src/services/contact-query.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { SupportQueryStatus, SupportPriority } from '@prisma/client';
import { prisma } from '../src/config/database';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../src/config/database', () => ({
  prisma: {
    contactQuery: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    contactQueryResponse: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../src/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock email service — fire-and-forget, we just verify it was called
vi.mock('../src/services/email.service', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue({ success: true, attempts: 1 }),
  },
}));

// ── Typed prisma mock helpers ─────────────────────────────────────────────────

const db = prisma as unknown as {
  contactQuery: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
  contactQueryResponse: {
    create: ReturnType<typeof vi.fn>;
  };
};

const { emailService } = await import('../src/services/email.service');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const stubQuery = {
  id: 'cq-1',
  name: 'Alice',
  email: 'alice@example.com',
  subject: 'Ticket issue',
  message: 'I cannot download my ticket.',
  status: SupportQueryStatus.NEW,
  priority: SupportPriority.MEDIUM,
  assignedTo: null,
  resolvedAt: null,
  createdAt: new Date('2026-01-01T10:00:00Z'),
  updatedAt: new Date('2026-01-01T10:00:00Z'),
};

// ── Test suites ───────────────────────────────────────────────────────────────

describe('ContactQueryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createQuery ─────────────────────────────────────────────────────────────

  describe('createQuery', () => {
    it('creates and returns a new contact query', async () => {
      db.contactQuery.create.mockResolvedValue(stubQuery);

      const result = await ContactQueryService.createQuery({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Ticket issue',
        message: 'I cannot download my ticket.',
      });

      expect(db.contactQuery.create).toHaveBeenCalledWith({
        data: {
          name: 'Alice',
          email: 'alice@example.com',
          subject: 'Ticket issue',
          message: 'I cannot download my ticket.',
        },
      });
      expect(result).toEqual(stubQuery);
    });

    it('wraps database errors as ValidationError', async () => {
      db.contactQuery.create.mockRejectedValue(new Error('DB down'));

      await expect(
        ContactQueryService.createQuery({
          name: 'Alice',
          email: 'alice@example.com',
          subject: 'Test',
          message: 'Hello',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  // ── getQueries ──────────────────────────────────────────────────────────────

  describe('getQueries', () => {
    it('returns paginated queries with defaults', async () => {
      db.contactQuery.findMany.mockResolvedValue([stubQuery]);
      db.contactQuery.count.mockResolvedValue(1);

      const result = await ContactQueryService.getQueries();

      expect(result.queries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies status and priority filters', async () => {
      db.contactQuery.findMany.mockResolvedValue([]);
      db.contactQuery.count.mockResolvedValue(0);

      await ContactQueryService.getQueries({
        status: SupportQueryStatus.RESOLVED,
        priority: SupportPriority.HIGH,
      });

      expect(db.contactQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SupportQueryStatus.RESOLVED,
            priority: SupportPriority.HIGH,
          }),
        }),
      );
    });

    it('applies search as OR across name / email / subject / message', async () => {
      db.contactQuery.findMany.mockResolvedValue([]);
      db.contactQuery.count.mockResolvedValue(0);

      await ContactQueryService.getQueries({ search: 'ticket' });

      expect(db.contactQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'ticket' }) }),
            ]),
          }),
        }),
      );
    });

    it('caps limit at 100', async () => {
      db.contactQuery.findMany.mockResolvedValue([]);
      db.contactQuery.count.mockResolvedValue(0);

      await ContactQueryService.getQueries({ limit: 9999 });

      expect(db.contactQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  // ── getQueryById ────────────────────────────────────────────────────────────

  describe('getQueryById', () => {
    it('returns the query when found', async () => {
      db.contactQuery.findUnique.mockResolvedValue({ ...stubQuery, responses: [] });

      const result = await ContactQueryService.getQueryById('cq-1');
      expect(result.id).toBe('cq-1');
    });

    it('throws NotFoundError when query does not exist', async () => {
      db.contactQuery.findUnique.mockResolvedValue(null);

      await expect(ContactQueryService.getQueryById('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('updates status and sets resolvedAt when status is RESOLVED', async () => {
      db.contactQuery.findUnique.mockResolvedValue(stubQuery);
      db.contactQuery.update.mockResolvedValue({
        ...stubQuery,
        status: SupportQueryStatus.RESOLVED,
        resolvedAt: new Date(),
      });

      await ContactQueryService.updateStatus('cq-1', SupportQueryStatus.RESOLVED);

      expect(db.contactQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SupportQueryStatus.RESOLVED,
            resolvedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('updates status without setting resolvedAt for non-resolved transitions', async () => {
      db.contactQuery.findUnique.mockResolvedValue(stubQuery);
      db.contactQuery.update.mockResolvedValue({
        ...stubQuery,
        status: SupportQueryStatus.IN_PROGRESS,
      });

      await ContactQueryService.updateStatus('cq-1', SupportQueryStatus.IN_PROGRESS);

      const call = db.contactQuery.update.mock.calls[0][0];
      expect(call.data).not.toHaveProperty('resolvedAt');
    });

    it('throws NotFoundError when query does not exist', async () => {
      db.contactQuery.findUnique.mockResolvedValue(null);

      await expect(
        ContactQueryService.updateStatus('missing', SupportQueryStatus.CLOSED),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── replyToQuery ─────────────────────────────────────────────────────────────

  describe('replyToQuery', () => {
    const stubResponse = {
      id: 'resp-1',
      queryId: 'cq-1',
      response: 'Your ticket is attached.',
      sentBy: 'agent-1',
      isInternal: false,
      sentAt: new Date(),
      agent: { id: 'agent-1', firstName: 'Bob', lastName: 'Smith' },
    };

    it('creates a response record and advances NEW query to IN_PROGRESS', async () => {
      db.contactQuery.findUnique.mockResolvedValue(stubQuery); // status: NEW
      db.contactQueryResponse.create.mockResolvedValue(stubResponse);
      db.contactQuery.update.mockResolvedValue({
        ...stubQuery,
        status: SupportQueryStatus.IN_PROGRESS,
      });

      const result = await ContactQueryService.replyToQuery(
        'cq-1',
        'agent-1',
        'Your ticket is attached.',
      );

      expect(db.contactQueryResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queryId: 'cq-1',
            sentBy: 'agent-1',
            isInternal: false,
          }),
        }),
      );
      expect(db.contactQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SupportQueryStatus.IN_PROGRESS }),
        }),
      );
      expect(result).toEqual(stubResponse);
    });

    it('does not transition status when query is already IN_PROGRESS', async () => {
      db.contactQuery.findUnique.mockResolvedValue({
        ...stubQuery,
        status: SupportQueryStatus.IN_PROGRESS,
      });
      db.contactQueryResponse.create.mockResolvedValue(stubResponse);

      await ContactQueryService.replyToQuery('cq-1', 'agent-1', 'Follow-up reply.');

      expect(db.contactQuery.update).not.toHaveBeenCalled();
    });

    it('calls emailService.sendEmail with sender address and Re: subject', async () => {
      db.contactQuery.findUnique.mockResolvedValue(stubQuery);
      db.contactQueryResponse.create.mockResolvedValue(stubResponse);
      db.contactQuery.update.mockResolvedValue(stubQuery);

      await ContactQueryService.replyToQuery('cq-1', 'agent-1', 'Hello Alice!');

      // Give the fire-and-forget promise a tick to execute
      await new Promise((r) => setTimeout(r, 0));

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@example.com',
          subject: 'Re: Ticket issue',
        }),
      );
    });

    it('throws NotFoundError when query does not exist', async () => {
      db.contactQuery.findUnique.mockResolvedValue(null);

      await expect(
        ContactQueryService.replyToQuery('missing', 'agent-1', 'Hello'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── addInternalNote ──────────────────────────────────────────────────────────

  describe('addInternalNote', () => {
    it('creates an internal (isInternal: true) response and does not send email', async () => {
      db.contactQuery.findUnique.mockResolvedValue(stubQuery);
      db.contactQueryResponse.create.mockResolvedValue({
        id: 'note-1',
        queryId: 'cq-1',
        response: 'Internal note here.',
        sentBy: 'agent-1',
        isInternal: true,
        sentAt: new Date(),
        agent: { id: 'agent-1', firstName: 'Bob', lastName: 'Smith' },
      });

      await ContactQueryService.addInternalNote('cq-1', 'agent-1', 'Internal note here.');

      expect(db.contactQueryResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isInternal: true }),
        }),
      );
      await new Promise((r) => setTimeout(r, 0));
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when query does not exist', async () => {
      db.contactQuery.findUnique.mockResolvedValue(null);

      await expect(
        ContactQueryService.addInternalNote('missing', 'agent-1', 'note'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── getStatistics ────────────────────────────────────────────────────────────

  describe('getStatistics', () => {
    it('returns total and breakdowns by status and priority', async () => {
      db.contactQuery.count.mockResolvedValue(5);
      db.contactQuery.groupBy
        .mockResolvedValueOnce([
          { status: 'NEW', _count: { id: 3 } },
          { status: 'RESOLVED', _count: { id: 2 } },
        ])
        .mockResolvedValueOnce([{ priority: 'MEDIUM', _count: { id: 5 } }]);

      const stats = await ContactQueryService.getStatistics();

      expect(stats.total).toBe(5);
      expect(stats.byStatus['NEW']).toBe(3);
      expect(stats.byStatus['RESOLVED']).toBe(2);
      expect(stats.byPriority['MEDIUM']).toBe(5);
    });
  });
});
