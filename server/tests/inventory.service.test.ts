import { InventoryService } from '../src/services/inventory.service';
import { prisma } from '../src/config/database';

// Mock ioredis
vi.mock('ioredis', () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    setex: vi.fn(),
    incrby: vi.fn(),
    exists: vi.fn(),
    eval: vi.fn(),
    mget: vi.fn(),
    pipeline: vi.fn(() => ({
      setex: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
    status: 'ready',
  }));
  return { default: RedisMock, Redis: RedisMock };
});

vi.mock('../src/config/database', () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

const prismaMock = prisma as unknown as {
  event: {
    findUnique: vi.Mock;
    findMany: vi.Mock;
    update: vi.Mock;
  };
  $transaction: vi.Mock;
};

describe('InventoryService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.$transaction.mockImplementation((fn) => fn(prisma));
  });

  const mockEvent = {
    id: 'evt-1',
    capacity: 100,
    availableSlots: 50,
  };

  describe('getAvailable', () => {
    it('returns available slots from database when Redis unavailable', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);

      const available = await InventoryService.getAvailable('evt-1');

      expect(available).toBe(50);
      expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        select: { capacity: true, availableSlots: true },
      });
    });

    it('returns 0 when event not found', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const available = await InventoryService.getAvailable('evt-999');

      expect(available).toBe(0);
    });

    it('returns capacity when availableSlots is null', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        availableSlots: null,
      });

      const available = await InventoryService.getAvailable('evt-1');

      expect(available).toBe(100);
    });
  });

  describe('reserve (database fallback)', () => {
    it('successfully reserves inventory', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        availableSlots: 48,
      });

      const result = await InventoryService.reserve('evt-1', 2);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(48);
    });

    it('fails when not enough inventory', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        availableSlots: 1,
      });

      const result = await InventoryService.reserve('evt-1', 5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not enough inventory');
    });

    it('fails when event not found', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      const result = await InventoryService.reserve('evt-999', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('succeeds with unlimited capacity (null)', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        capacity: null,
        availableSlots: null,
      });

      const result = await InventoryService.reserve('evt-1', 100);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });
  });

  describe('release', () => {
    it('releases inventory back to event', async () => {
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        availableSlots: 52,
      });

      await InventoryService.release('evt-1', 2);

      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: {
          availableSlots: {
            increment: 2,
          },
        },
      });
    });
  });

  describe('getInventoryBatch', () => {
    it('returns inventory for multiple events', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'evt-1', availableSlots: 50, capacity: 100 },
        { id: 'evt-2', availableSlots: 25, capacity: 50 },
      ]);

      const result = await InventoryService.getInventoryBatch(['evt-1', 'evt-2']);

      expect(result.get('evt-1')).toBe(50);
      expect(result.get('evt-2')).toBe(25);
    });

    it('handles missing events', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'evt-1', availableSlots: 50, capacity: 100 },
      ]);

      const result = await InventoryService.getInventoryBatch(['evt-1', 'evt-999']);

      expect(result.get('evt-1')).toBe(50);
      expect(result.has('evt-999')).toBe(false);
    });
  });

  describe('isRedisAvailable', () => {
    it('returns false when Redis not initialized', () => {
      // Redis is not initialized in tests by default
      const available = InventoryService.isRedisAvailable();
      expect(available).toBe(false);
    });
  });

  describe('syncFromDatabase', () => {
    it('returns 0 when Redis not available', async () => {
      const result = await InventoryService.syncFromDatabase();
      expect(result.synced).toBe(0);
    });
  });
});
