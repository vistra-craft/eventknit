import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { TicketResaleService } from '../../../src/services/ticket-resale.service.js';
import { NotFoundError, ValidationError } from '../../../src/utils/errors.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('TicketResaleService', () => {
  const futureDate = new Date('2026-12-31');
  const _pastDate = new Date('2024-01-01');

  const mockUser = {
    id: 'seller-123',
    email: 'seller@example.com',
    firstName: 'John',
    lastName: 'Seller',
  };

  const mockBuyer = {
    id: 'buyer-123',
    email: 'buyer@example.com',
    firstName: 'Jane',
    lastName: 'Buyer',
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    startDate: futureDate,
    endDate: futureDate,
    currency: 'USD',
    category: 'Music',
    location: 'Test Venue',
    image: 'event.jpg',
  };

  const mockRegistration = {
    id: 'registration-123',
    eventId: mockEvent.id,
    attendeeId: mockUser.id,
    totalAmount: new Decimal(100),
    event: mockEvent,
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('listTicketForResale', () => {
    it('should list ticket for resale successfully', async () => {
      // Arrange
      const resalePrice = 120;
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketResale.findUnique.mockResolvedValue(null);
      prismaMock.ticketResale.create.mockResolvedValue({
        id: 'resale-123',
        registrationId: mockRegistration.id,
        sellerId: mockUser.id,
        originalPrice: new Decimal(100),
        resalePrice: new Decimal(resalePrice),
        currency: 'USD',
        platformFee: new Decimal(12), // 10% of 120
        sellerPayout: new Decimal(108), // 120 - 12
        status: 'LISTED',
        registration: mockRegistration,
        seller: mockUser,
      } as any);

      // Act
      const result = await TicketResaleService.listTicketForResale(
        mockUser.id,
        mockRegistration.id,
        resalePrice,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.sellerId).toBe(mockUser.id);
      expect(prismaMock.ticketResale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sellerId: mockUser.id,
            resalePrice: expect.any(Decimal),
            platformFee: expect.any(Decimal),
            sellerPayout: expect.any(Decimal),
            status: 'LISTED',
          }),
        }),
      );
    });

    it('should calculate platform fee correctly (10%)', async () => {
      // Arrange
      const resalePrice = 100;
      const expectedFee = 10; // 10% of 100
      const expectedPayout = 90; // 100 - 10

      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketResale.findUnique.mockResolvedValue(null);
      prismaMock.ticketResale.create.mockResolvedValue({
        id: 'resale-123',
        platformFee: new Decimal(expectedFee),
        sellerPayout: new Decimal(expectedPayout),
      } as any);

      // Act
      await TicketResaleService.listTicketForResale(
        mockUser.id,
        mockRegistration.id,
        resalePrice,
      );

      // Assert
      expect(prismaMock.ticketResale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            platformFee: expect.any(Decimal),
            sellerPayout: expect.any(Decimal),
          }),
        }),
      );
    });

    it('should set custom expiration date when provided', async () => {
      // Arrange
      const customExpiration = new Date('2026-12-15');
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketResale.findUnique.mockResolvedValue(null);
      prismaMock.ticketResale.create.mockResolvedValue({
        id: 'resale-123',
        expiresAt: customExpiration,
      } as any);

      // Act
      await TicketResaleService.listTicketForResale(
        mockUser.id,
        mockRegistration.id,
        100,
        customExpiration,
      );

      // Assert
      expect(prismaMock.ticketResale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: customExpiration,
          }),
        }),
      );
    });

    it('should set default expiration 7 days before event when not provided', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketResale.findUnique.mockResolvedValue(null);
      prismaMock.ticketResale.create.mockResolvedValue({
        id: 'resale-123',
      } as any);

      // Act
      await TicketResaleService.listTicketForResale(
        mockUser.id,
        mockRegistration.id,
        100,
      );

      // Assert
      expect(prismaMock.ticketResale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw error if registration not found', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TicketResaleService.listTicketForResale(mockUser.id, 'invalid-id', 100),
      ).rejects.toThrow(NotFoundError);

      await expect(
        TicketResaleService.listTicketForResale(mockUser.id, 'invalid-id', 100),
      ).rejects.toThrow('Registration not found');
    });

    it('should throw error if user does not own the ticket', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        TicketResaleService.listTicketForResale('wrong-user-id', mockRegistration.id, 100),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketResaleService.listTicketForResale('wrong-user-id', mockRegistration.id, 100),
      ).rejects.toThrow('You can only resell your own tickets');
    });

    it('should throw error if ticket is already listed', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketResale.findUnique.mockResolvedValue({
        id: 'existing-resale',
        status: 'LISTED',
      } as any);

      // Act & Assert
      await expect(
        TicketResaleService.listTicketForResale(mockUser.id, mockRegistration.id, 100),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketResaleService.listTicketForResale(mockUser.id, mockRegistration.id, 100),
      ).rejects.toThrow('Ticket is already listed for resale');
    });
  });

  describe('getMarketplaceTickets', () => {
    const mockResaleTickets = [
      {
        id: 'resale-1',
        resalePrice: new Decimal(100),
        expiresAt: futureDate,
        status: 'LISTED',
        registration: { event: mockEvent },
        seller: mockUser,
      },
      {
        id: 'resale-2',
        resalePrice: new Decimal(150),
        expiresAt: futureDate,
        status: 'LISTED',
        registration: { event: mockEvent },
        seller: mockUser,
      },
    ];

    it('should get all marketplace tickets', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue(mockResaleTickets as any);
      prismaMock.ticketResale.count.mockResolvedValue(2);

      // Act
      const result = await TicketResaleService.getMarketplaceTickets();

      // Assert
      expect(result.tickets).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'LISTED',
            expiresAt: { gt: expect.any(Date) },
          }),
        }),
      );
    });

    it('should filter by eventId', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleTickets[0]] as any);
      prismaMock.ticketResale.count.mockResolvedValue(1);

      // Act
      const result = await TicketResaleService.getMarketplaceTickets({
        eventId: mockEvent.id,
      });

      // Assert
      expect(result.tickets).toHaveLength(1);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            registration: { eventId: mockEvent.id },
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleTickets[0]] as any);
      prismaMock.ticketResale.count.mockResolvedValue(1);

      // Act
      const result = await TicketResaleService.getMarketplaceTickets({
        minPrice: 50,
        maxPrice: 120,
      });

      // Assert
      expect(result.tickets).toHaveLength(1);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resalePrice: {
              gte: expect.any(Decimal),
              lte: expect.any(Decimal),
            },
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleTickets[0]] as any);
      prismaMock.ticketResale.count.mockResolvedValue(25);

      // Act
      const result = await TicketResaleService.getMarketplaceTickets({
        page: 2,
        limit: 10,
      });

      // Assert
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(3);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should exclude expired listings', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleTickets[0]] as any);
      prismaMock.ticketResale.count.mockResolvedValue(1);

      // Act
      await TicketResaleService.getMarketplaceTickets();

      // Assert
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: { gt: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('getUserResales', () => {
    const mockUserResales = [
      {
        id: 'resale-1',
        sellerId: mockUser.id,
        status: 'LISTED',
        registration: { event: mockEvent },
        buyer: null,
      },
      {
        id: 'resale-2',
        sellerId: mockUser.id,
        status: 'SOLD',
        registration: { event: mockEvent },
        buyer: mockBuyer,
      },
    ];

    it('should get all user resales', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue(mockUserResales as any);

      // Act
      const result = await TicketResaleService.getUserResales(mockUser.id);

      // Assert
      expect(result).toHaveLength(2);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerId: mockUser.id },
        }),
      );
    });

    it('should filter by status', async () => {
      // Arrange
      prismaMock.ticketResale.findMany.mockResolvedValue([mockUserResales[0]] as any);

      // Act
      const result = await TicketResaleService.getUserResales(mockUser.id, 'LISTED');

      // Assert
      expect(result).toHaveLength(1);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sellerId: mockUser.id,
            status: 'LISTED',
          },
        }),
      );
    });
  });

  describe('purchaseResaleTicket (deprecated)', () => {
    it('should throw ValidationError since direct purchase is deprecated', async () => {
      await expect(
        TicketResaleService.purchaseResaleTicket('any-user', 'any-resale'),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketResaleService.purchaseResaleTicket('any-user', 'any-resale'),
      ).rejects.toThrow('Direct purchase is no longer supported');
    });
  });

  describe('cancelResale', () => {
    const mockResale = {
      id: 'resale-123',
      sellerId: mockUser.id,
      status: 'LISTED',
    };

    it('should cancel resale successfully', async () => {
      // Arrange
      prismaMock.ticketResale.findUnique.mockResolvedValue(mockResale as any);
      prismaMock.ticketResale.update.mockResolvedValue({
        ...mockResale,
        status: 'CANCELLED',
      } as any);

      // Act
      const result = await TicketResaleService.cancelResale(mockUser.id, mockResale.id);

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.ticketResale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockResale.id },
          data: expect.objectContaining({
            status: 'CANCELLED',
          }),
        }),
      );
    });

    it('should throw error if resale not found', async () => {
      // Arrange
      prismaMock.ticketResale.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TicketResaleService.cancelResale(mockUser.id, 'invalid-id'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        TicketResaleService.cancelResale(mockUser.id, 'invalid-id'),
      ).rejects.toThrow('Resale listing not found');
    });

    it('should throw error if user is not the seller', async () => {
      // Arrange
      prismaMock.ticketResale.findUnique.mockResolvedValue(mockResale as any);

      // Act & Assert
      await expect(
        TicketResaleService.cancelResale('wrong-user-id', mockResale.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketResaleService.cancelResale('wrong-user-id', mockResale.id),
      ).rejects.toThrow('You can only cancel your own listings');
    });

    it('should throw error if resale is not listed', async () => {
      // Arrange
      const soldResale = { ...mockResale, status: 'SOLD' };
      prismaMock.ticketResale.findUnique.mockResolvedValue(soldResale as any);

      // Act & Assert
      await expect(
        TicketResaleService.cancelResale(mockUser.id, mockResale.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketResaleService.cancelResale(mockUser.id, mockResale.id),
      ).rejects.toThrow('Only active listings can be cancelled');
    });
  });
});
