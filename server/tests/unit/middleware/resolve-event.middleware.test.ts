import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { resolveEventId, resolveEventIdParam } from '../../../src/middleware/resolve-event.middleware.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

describe('resolveEventId middleware', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    prisma = (databaseModule as unknown as { prisma: DeepMockProxy<PrismaClient> }).prisma;
    mockReset(prisma);
    mockReq = { params: {} as Record<string, string> };
    mockRes = {};
    nextFn = vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
  });

  describe('with default param name (id)', () => {
    it('should pass through when param is a valid UUID', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockReq.params = { id: uuid };

      await resolveEventIdParam(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith();
      expect(mockReq.params!.id).toBe(uuid);
      // Should NOT query database for a UUID
      expect(prisma.event.findFirst).not.toHaveBeenCalled();
    });

    it('should resolve a slug to UUID', async () => {
      const slug = 'ai-machine-learning-workshop-2026';
      const resolvedUUID = '550e8400-e29b-41d4-a716-446655440000';
      mockReq.params = { id: slug };

      (prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: resolvedUUID,
      });

      await resolveEventIdParam(mockReq as Request, mockRes as Response, nextFn);

      expect(prisma.event.findFirst).toHaveBeenCalledWith({
        where: { slug, deletedAt: null },
        select: { id: true },
      });
      expect(mockReq.params!.id).toBe(resolvedUUID);
      expect(nextFn).toHaveBeenCalledWith();
    });

    it('should call next with NotFoundError when slug does not match any event', async () => {
      mockReq.params = { id: 'nonexistent-slug' };

      (prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await resolveEventIdParam(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should call next with NotFoundError when param is missing', async () => {
      mockReq.params = {};

      await resolveEventIdParam(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should forward database errors to next', async () => {
      mockReq.params = { id: 'some-slug' };
      const dbError = new Error('Database connection failed');

      (prisma.event.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(dbError);

      await resolveEventIdParam(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith(dbError);
    });
  });

  describe('with custom param name (eventId)', () => {
    it('should resolve slug using the custom param name', async () => {
      const slug = 'tech-conference-2026';
      const resolvedUUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      mockReq.params = { eventId: slug };

      (prisma.event.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: resolvedUUID,
      });

      const middleware = resolveEventId('eventId');
      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(mockReq.params!.eventId).toBe(resolvedUUID);
      expect(nextFn).toHaveBeenCalledWith();
    });

    it('should pass through when custom param is a valid UUID', async () => {
      const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      mockReq.params = { eventId: uuid };

      const middleware = resolveEventId('eventId');
      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith();
      expect(prisma.event.findFirst).not.toHaveBeenCalled();
    });
  });
});
