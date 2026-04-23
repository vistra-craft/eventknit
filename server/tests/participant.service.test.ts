import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ParticipantService } from '../src/services/participant.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';
import { ParticipantType, ParticipantStatus } from '@prisma/client';

vi.mock('../src/config/database', () => ({
  prisma: {
    eventParticipant: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../src/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const db = prisma as unknown as {
  eventParticipant: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  event: {
    findFirst: ReturnType<typeof vi.fn>;
  };
};

const EVENT_ID = 'event-1';
const ADDER_ID = 'user-1';

const makeParticipant = (overrides = {}) => ({
  id: 'p-1',
  eventId: EVENT_ID,
  userId: null,
  user: null,
  type: ParticipantType.SPEAKER,
  status: ParticipantStatus.INVITED,
  name: 'Jane Speaker',
  email: 'jane@example.com',
  phone: null,
  company: 'Acme Corp',
  bio: null,
  website: null,
  linkedin: null,
  twitter: null,
  avatarUrl: null,
  metadata: null,
  customType: null,
  formResponseId: null,
  addedById: ADDER_ID,
  addedBy: { id: ADDER_ID, firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
  reviewedById: null,
  reviewedBy: null,
  reviewedAt: null,
  reviewNotes: null,
  formResponse: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

describe('ParticipantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // list
  // ─────────────────────────────────────────────────────────
  describe('list', () => {
    it('should return paginated participants', async () => {
      const mockList = [makeParticipant(), makeParticipant({ id: 'p-2', name: 'Bob Sponsor', type: ParticipantType.SPONSOR })];
      db.eventParticipant.findMany.mockResolvedValue(mockList);
      db.eventParticipant.count.mockResolvedValue(2);

      const result = await ParticipantService.list(EVENT_ID, { page: 1, limit: 20 });

      expect(db.eventParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventId: EVENT_ID }, skip: 0, take: 20 }),
      );
      expect(result).toEqual({ participants: mockList, total: 2, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter by type', async () => {
      db.eventParticipant.findMany.mockResolvedValue([]);
      db.eventParticipant.count.mockResolvedValue(0);

      await ParticipantService.list(EVENT_ID, { type: ParticipantType.SPONSOR });

      expect(db.eventParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: ParticipantType.SPONSOR }) }),
      );
    });

    it('should filter by status', async () => {
      db.eventParticipant.findMany.mockResolvedValue([]);
      db.eventParticipant.count.mockResolvedValue(0);

      await ParticipantService.list(EVENT_ID, { status: ParticipantStatus.APPROVED });

      expect(db.eventParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ParticipantStatus.APPROVED }) }),
      );
    });

    it('should search by name, email, or company', async () => {
      db.eventParticipant.findMany.mockResolvedValue([]);
      db.eventParticipant.count.mockResolvedValue(0);

      await ParticipantService.list(EVENT_ID, { search: 'jane' });

      expect(db.eventParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'jane', mode: 'insensitive' } },
              { email: { contains: 'jane', mode: 'insensitive' } },
              { company: { contains: 'jane', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      db.eventParticipant.findMany.mockResolvedValue([]);
      db.eventParticipant.count.mockResolvedValue(45);

      const result = await ParticipantService.list(EVENT_ID, { page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });

    it.each([
      ParticipantType.PERFORMER,
      ParticipantType.VENDOR,
      ParticipantType.JUDGE,
      ParticipantType.MEDIA,
      ParticipantType.STAFF,
      ParticipantType.VIP,
    ] as const)('should filter list by type %s', async (type) => {
      db.eventParticipant.findMany.mockResolvedValue([]);
      db.eventParticipant.count.mockResolvedValue(0);

      await ParticipantService.list(EVENT_ID, { type });

      expect(db.eventParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type }) }),
      );
    });

    it.each([
      ParticipantStatus.PENDING,
      ParticipantStatus.CONFIRMED,
      ParticipantStatus.DECLINED,
    ] as const)('should filter list by status %s', async (status) => {
      db.eventParticipant.findMany.mockResolvedValue([]);
      db.eventParticipant.count.mockResolvedValue(0);

      await ParticipantService.list(EVENT_ID, { status });

      expect(db.eventParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status }) }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // getById
  // ─────────────────────────────────────────────────────────
  describe('getById', () => {
    it('should return a participant by ID', async () => {
      const mock = makeParticipant();
      db.eventParticipant.findFirst.mockResolvedValue(mock);

      const result = await ParticipantService.getById(EVENT_ID, 'p-1');

      expect(db.eventParticipant.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p-1', eventId: EVENT_ID } }),
      );
      expect(result).toEqual(mock);
    });

    it('should throw NotFoundError when participant does not exist', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(null);

      await expect(ParticipantService.getById(EVENT_ID, 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a speaker participant', async () => {
      db.event.findFirst.mockResolvedValue({ id: EVENT_ID });
      const mock = makeParticipant();
      db.eventParticipant.create.mockResolvedValue(mock);

      const result = await ParticipantService.create(
        EVENT_ID,
        { name: 'Jane Speaker', email: 'jane@example.com', type: ParticipantType.SPEAKER },
        ADDER_ID,
      );

      expect(db.eventParticipant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: EVENT_ID,
          name: 'Jane Speaker',
          email: 'jane@example.com',
          type: ParticipantType.SPEAKER,
          addedById: ADDER_ID,
          status: ParticipantStatus.INVITED,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mock);
    });

    it('should throw NotFoundError when event does not exist', async () => {
      db.event.findFirst.mockResolvedValue(null);

      await expect(
        ParticipantService.create(EVENT_ID, { name: 'X', email: 'x@x.com', type: ParticipantType.SPEAKER }, ADDER_ID),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when CUSTOM type has no customType', async () => {
      db.event.findFirst.mockResolvedValue({ id: EVENT_ID });

      await expect(
        ParticipantService.create(EVENT_ID, { name: 'X', email: 'x@x.com', type: ParticipantType.CUSTOM }, ADDER_ID),
      ).rejects.toThrow(ValidationError);
    });

    it('should create a CUSTOM participant with customType label', async () => {
      db.event.findFirst.mockResolvedValue({ id: EVENT_ID });
      const mock = makeParticipant({ type: ParticipantType.CUSTOM, customType: 'DJ' });
      db.eventParticipant.create.mockResolvedValue(mock);

      const result = await ParticipantService.create(
        EVENT_ID,
        { name: 'DJ Mix', email: 'dj@example.com', type: ParticipantType.CUSTOM, customType: 'DJ' },
        ADDER_ID,
      );

      expect(db.eventParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ customType: 'DJ' }) }),
      );
      expect(result).toEqual(mock);
    });

    it.each([
      [ParticipantType.PERFORMER, 'Amina Artist', 'amina@stage.com'],
      [ParticipantType.VENDOR,    'Quick Bites',  'vendor@food.com'],
      [ParticipantType.JUDGE,     'Prof. Osei',   'osei@uni.ac.ke'],
      [ParticipantType.MEDIA,     'Daily Post',   'press@daily.co'],
      [ParticipantType.STAFF,     'Gate Lead',    'staff@event.com'],
      [ParticipantType.VIP,       'Hon. Wanjiku',  'vip@office.ke'],
      [ParticipantType.MEDIA,     'Pulse Kenya',  'editor@pulse.co.ke'],
    ] as const)('should create a %s participant', async (type, name, email) => {
      db.event.findFirst.mockResolvedValue({ id: EVENT_ID });
      const mock = makeParticipant({ type, name, email });
      db.eventParticipant.create.mockResolvedValue(mock);

      const result = await ParticipantService.create(EVENT_ID, { name, email, type }, ADDER_ID);

      expect(db.eventParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type, name, email }) }),
      );
      expect(result).toEqual(mock);
    });
  });

  // ─────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update participant metadata', async () => {
      const existing = makeParticipant();
      const updated = { ...existing, name: 'Jane Updated', company: 'New Corp' };
      db.eventParticipant.findFirst.mockResolvedValue(existing);
      db.eventParticipant.update.mockResolvedValue(updated);

      const result = await ParticipantService.update('event-1', 'p-1', {
        name: 'Jane Updated',
        company: 'New Corp',
      });

      expect(db.eventParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: expect.objectContaining({ name: 'Jane Updated', company: 'New Corp', updatedAt: expect.any(Date) }),
        include: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when participant does not exist', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(null);

      await expect(ParticipantService.update(EVENT_ID, 'nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when CUSTOM type has empty customType', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant({ type: ParticipantType.CUSTOM }));

      await expect(
        ParticipantService.update(EVENT_ID, 'p-1', { customType: '' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // review
  // ─────────────────────────────────────────────────────────
  describe('review', () => {
    it('should approve a participant', async () => {
      const existing = makeParticipant();
      const approved = { ...existing, status: ParticipantStatus.APPROVED, reviewedById: 'admin-1', reviewedAt: new Date() };
      db.eventParticipant.findFirst.mockResolvedValue(existing);
      db.eventParticipant.update.mockResolvedValue(approved);

      const result = await ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.APPROVED, 'admin-1');

      expect(db.eventParticipant.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: expect.objectContaining({
          status: ParticipantStatus.APPROVED,
          reviewedById: 'admin-1',
          reviewedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(approved);
    });

    it('should reject a participant with review notes', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant());
      db.eventParticipant.update.mockResolvedValue(makeParticipant({ status: ParticipantStatus.REJECTED }));

      await ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.REJECTED, 'admin-1', 'Not a good fit');

      expect(db.eventParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ParticipantStatus.REJECTED, reviewNotes: 'Not a good fit' }),
        }),
      );
    });

    it('should waitlist a participant', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant());
      db.eventParticipant.update.mockResolvedValue(makeParticipant({ status: ParticipantStatus.WAITLISTED }));

      await ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.WAITLISTED, 'admin-1');

      expect(db.eventParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: ParticipantStatus.WAITLISTED }) }),
      );
    });

    it('should mark a participant as under review', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant({ status: ParticipantStatus.PENDING }));
      db.eventParticipant.update.mockResolvedValue(makeParticipant({ status: ParticipantStatus.UNDER_REVIEW }));

      await ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.UNDER_REVIEW, 'admin-1');

      expect(db.eventParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: ParticipantStatus.UNDER_REVIEW }) }),
      );
    });

    it('should confirm a participant after approval', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant({ status: ParticipantStatus.APPROVED }));
      db.eventParticipant.update.mockResolvedValue(makeParticipant({ status: ParticipantStatus.CONFIRMED }));

      await ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.CONFIRMED, 'admin-1');

      expect(db.eventParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: ParticipantStatus.CONFIRMED }) }),
      );
    });

    it('should mark a participant as declined', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant({ status: ParticipantStatus.APPROVED }));
      db.eventParticipant.update.mockResolvedValue(makeParticipant({ status: ParticipantStatus.DECLINED }));

      await ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.DECLINED, 'admin-1', 'Unable to attend');

      expect(db.eventParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ParticipantStatus.DECLINED, reviewNotes: 'Unable to attend' }),
        }),
      );
    });

    it('should throw NotFoundError when participant does not exist', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(null);

      await expect(
        ParticipantService.review(EVENT_ID, 'nonexistent', ParticipantStatus.APPROVED, 'admin-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid review status (INVITED)', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant());

      await expect(
        ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.INVITED, 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid review status (PENDING)', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant());

      await expect(
        ParticipantService.review(EVENT_ID, 'p-1', ParticipantStatus.PENDING, 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete a participant', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(makeParticipant());
      db.eventParticipant.delete.mockResolvedValue(undefined);

      await ParticipantService.delete(EVENT_ID, 'p-1');

      expect(db.eventParticipant.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });

    it('should throw NotFoundError when participant does not exist', async () => {
      db.eventParticipant.findFirst.mockResolvedValue(null);

      await expect(ParticipantService.delete(EVENT_ID, 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
