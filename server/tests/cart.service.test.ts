import { CartService } from '../src/services/cart.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

// Define CartStatus locally since migration may not have been run yet
const CartStatus = {
  ACTIVE: 'ACTIVE',
  RESERVED: 'RESERVED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  ABANDONED: 'ABANDONED',
} as const;

vi.mock('../src/config/database', () => ({
  prisma: {
    cartReservation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    cartItem: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

const prismaMock = prisma as unknown as {
  cartReservation: {
    findFirst: vi.Mock;
    findUnique: vi.Mock;
    findMany: vi.Mock;
    create: vi.Mock;
    update: vi.Mock;
    count: vi.Mock;
  };
  cartItem: {
    create: vi.Mock;
    update: vi.Mock;
    delete: vi.Mock;
    count: vi.Mock;
  };
  event: {
    findUnique: vi.Mock;
    update: vi.Mock;
  };
  $transaction: vi.Mock;
};

describe('CartService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset $transaction to pass through the function
    prismaMock.$transaction.mockImplementation((fn) => fn(prisma));
  });

  const mockEvent = {
    id: 'evt-1',
    title: 'Test Event',
    startDate: new Date('2024-12-01'),
    image: null,
    capacity: 100,
    availableSlots: 50,
    maxTicketsPerUser: 10,
  };

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    sessionId: 'session-123',
    status: CartStatus.ACTIVE,
    expiresAt: new Date(Date.now() + 8 * 60 * 1000),
    items: [],
  };

  describe('createCart', () => {
    it('returns existing active cart if one exists', async () => {
      const existingCart = {
        ...mockCart,
        items: [],
      };
      prismaMock.cartReservation.findFirst.mockResolvedValue(existingCart);
      prismaMock.cartReservation.update.mockResolvedValue({
        ...existingCart,
        expiresAt: new Date(Date.now() + 8 * 60 * 1000),
      });

      const result = await CartService.createCart({
        sessionId: 'session-123',
        userId: 'user-1',
      });

      expect(result.id).toBe('cart-1');
      expect(prismaMock.cartReservation.create).not.toHaveBeenCalled();
    });

    it('creates new cart when none exists', async () => {
      prismaMock.cartReservation.findFirst.mockResolvedValue(null);
      prismaMock.cartReservation.create.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const result = await CartService.createCart({
        sessionId: 'session-456',
        userId: 'user-2',
      });

      expect(prismaMock.cartReservation.create).toHaveBeenCalled();
      expect(result.sessionId).toBe('session-123');
    });
  });

  describe('getCart', () => {
    it('returns cart when found', async () => {
      prismaMock.cartReservation.findFirst.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const result = await CartService.getCart(undefined, 'session-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cart-1');
    });

    it('returns null when no active cart exists', async () => {
      prismaMock.cartReservation.findFirst.mockResolvedValue(null);

      const result = await CartService.getCart(undefined, 'session-999');

      expect(result).toBeNull();
    });
  });

  describe('addItem', () => {
    it('throws NotFoundError when cart not found', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue(null);

      await expect(
        CartService.addItem('cart-999', {
          eventId: 'evt-1',
          ticketType: 'General',
          quantity: 1,
          unitPrice: 50,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when cart is not active', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        status: CartStatus.EXPIRED,
        items: [],
      });

      await expect(
        CartService.addItem('cart-1', {
          eventId: 'evt-1',
          ticketType: 'General',
          quantity: 1,
          unitPrice: 50,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when cart has expired', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        expiresAt: new Date(Date.now() - 1000), // Expired
        items: [],
      });

      await expect(
        CartService.addItem('cart-1', {
          eventId: 'evt-1',
          ticketType: 'General',
          quantity: 1,
          unitPrice: 50,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws NotFoundError when event not found', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(
        CartService.addItem('cart-1', {
          eventId: 'evt-999',
          ticketType: 'General',
          quantity: 1,
          unitPrice: 50,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when not enough tickets available', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        availableSlots: 2,
      });

      await expect(
        CartService.addItem('cart-1', {
          eventId: 'evt-1',
          ticketType: 'General',
          quantity: 5,
          unitPrice: 50,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when exceeding max tickets per user', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });
      prismaMock.event.findUnique.mockResolvedValue({
        ...mockEvent,
        maxTicketsPerUser: 5,
      });

      await expect(
        CartService.addItem('cart-1', {
          eventId: 'evt-1',
          ticketType: 'General',
          quantity: 10,
          unitPrice: 50,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('creates new cart item successfully', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.cartItem.create.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        eventId: 'evt-1',
        ticketType: 'General',
        quantity: 2,
        unitPrice: 50,
      });
      prismaMock.cartReservation.update.mockResolvedValue({
        ...mockCart,
        items: [
          {
            id: 'item-1',
            eventId: 'evt-1',
            ticketType: 'General',
            quantity: 2,
            unitPrice: 50,
            seatIds: [],
            promoCodeId: null,
            discountAmount: null,
            event: mockEvent,
          },
        ],
      });

      const result = await CartService.addItem('cart-1', {
        eventId: 'evt-1',
        ticketType: 'General',
        quantity: 2,
        unitPrice: 50,
      });

      expect(prismaMock.cartItem.create).toHaveBeenCalled();
      expect(result.items.length).toBe(1);
    });
  });

  describe('reserveCart', () => {
    it('throws NotFoundError when cart not found', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue(null);

      await expect(CartService.reserveCart('cart-999')).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when cart is empty', async () => {
      prismaMock.cartReservation.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      await expect(CartService.reserveCart('cart-1')).rejects.toThrow(ValidationError);
    });

    it('reserves cart and locks inventory', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            eventId: 'evt-1',
            quantity: 2,
            inventoryLocked: false,
          },
        ],
      };

      prismaMock.cartReservation.findUnique.mockResolvedValue(cartWithItems);
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.event.update.mockResolvedValue({
        ...mockEvent,
        availableSlots: 48,
      });
      prismaMock.cartItem.update.mockResolvedValue({
        ...cartWithItems.items[0],
        inventoryLocked: true,
      });
      prismaMock.cartReservation.update.mockResolvedValue({
        ...cartWithItems,
        status: CartStatus.RESERVED,
        reservedAt: new Date(),
        items: [
          {
            ...cartWithItems.items[0],
            inventoryLocked: true,
            event: mockEvent,
          },
        ],
      });

      const result = await CartService.reserveCart('cart-1');

      expect(result.status).toBe(CartStatus.RESERVED);
    });
  });

  describe('releaseExpiredCarts', () => {
    it('releases expired carts and restores inventory', async () => {
      const expiredCart = {
        id: 'cart-expired',
        items: [
          {
            id: 'item-1',
            eventId: 'evt-1',
            quantity: 2,
            inventoryLocked: true,
          },
        ],
      };

      prismaMock.cartReservation.findMany.mockResolvedValue([expiredCart]);
      prismaMock.event.update.mockResolvedValue(mockEvent);
      prismaMock.cartReservation.update.mockResolvedValue({
        ...expiredCart,
        status: CartStatus.EXPIRED,
      });

      const result = await CartService.releaseExpiredCarts();

      expect(result.released).toBe(1);
      expect(result.inventoryRestored).toBe(1);
    });

    it('returns zero when no expired carts', async () => {
      prismaMock.cartReservation.findMany.mockResolvedValue([]);

      const result = await CartService.releaseExpiredCarts();

      expect(result.released).toBe(0);
      expect(result.inventoryRestored).toBe(0);
    });
  });

  describe('getCartStats', () => {
    it('returns cart statistics', async () => {
      prismaMock.cartReservation.count
        .mockResolvedValueOnce(5) // active
        .mockResolvedValueOnce(2) // reserved
        .mockResolvedValueOnce(1); // expiring
      prismaMock.cartItem.count.mockResolvedValue(10);

      const stats = await CartService.getCartStats();

      expect(stats.activeCarts).toBe(5);
      expect(stats.reservedCarts).toBe(2);
      expect(stats.expiringInMinutes).toBe(1);
      expect(stats.totalItemsInCarts).toBe(10);
    });
  });
});
