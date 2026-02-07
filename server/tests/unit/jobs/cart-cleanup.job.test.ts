import { CartCleanupJob } from '../../../src/jobs/cart-cleanup.job';
import { CartService } from '../../../src/services/cart.service';
import { prisma } from '../../../src/config/database';

jest.mock('../../../src/services/cart.service');
jest.mock('../../../src/config/database', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

const CartServiceMock = CartService as jest.Mocked<typeof CartService>;
const prismaMock = prisma as unknown as { $queryRaw: jest.Mock };

describe('CartCleanupJob', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ result: 1 }]);
  });

  afterEach(() => {
    CartCleanupJob.stop();
  });

  describe('cleanupExpiredCarts', () => {
    it('calls CartService.releaseExpiredCarts', async () => {
      CartServiceMock.releaseExpiredCarts.mockResolvedValue({
        released: 3,
        inventoryRestored: 5,
      });

      await CartCleanupJob.cleanupExpiredCarts();

      expect(CartServiceMock.releaseExpiredCarts).toHaveBeenCalled();
    });

    it('handles database unavailability gracefully', async () => {
      prismaMock.$queryRaw.mockRejectedValue(new Error('Can\'t reach database server'));

      // Should not throw
      await expect(CartCleanupJob.cleanupExpiredCarts()).resolves.not.toThrow();
      expect(CartServiceMock.releaseExpiredCarts).not.toHaveBeenCalled();
    });

    it('handles CartService errors gracefully', async () => {
      CartServiceMock.releaseExpiredCarts.mockRejectedValue(new Error('Cleanup failed'));

      // Should not throw
      await expect(CartCleanupJob.cleanupExpiredCarts()).resolves.not.toThrow();
    });
  });

  describe('getCleanupStats', () => {
    it('returns cart statistics', async () => {
      CartServiceMock.getCartStats.mockResolvedValue({
        activeCarts: 10,
        reservedCarts: 5,
        expiringInMinutes: 2,
        totalItemsInCarts: 25,
      });

      const stats = await CartCleanupJob.getCleanupStats();

      expect(stats.activeCartsCount).toBe(10);
      expect(stats.reservedCartsCount).toBe(5);
      expect(stats.expiringInFiveMinutes).toBe(2);
      expect(stats.totalItemsInCarts).toBe(25);
    });

    it('returns zeros on database error', async () => {
      CartServiceMock.getCartStats.mockRejectedValue(
        new Error('Can\'t reach database server'),
      );

      const stats = await CartCleanupJob.getCleanupStats();

      expect(stats.activeCartsCount).toBe(0);
      expect(stats.reservedCartsCount).toBe(0);
    });
  });

  describe('start/stop', () => {
    it('starts and stops without error', () => {
      expect(() => CartCleanupJob.start()).not.toThrow();
      expect(() => CartCleanupJob.stop()).not.toThrow();
    });

    it('handles multiple start calls', () => {
      CartCleanupJob.start();
      expect(() => CartCleanupJob.start()).not.toThrow(); // Should warn but not throw
      CartCleanupJob.stop();
    });
  });
});
