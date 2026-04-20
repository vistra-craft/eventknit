import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { AdvancedTicketTypesService } from '../../../src/services/advanced-ticket-types.service.js';
import { NotFoundError, ValidationError } from '../../../src/utils/errors.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('AdvancedTicketTypesService', () => {
  const mockOrganizer = {
    id: 'organizer-123',
    email: 'organizer@test.com',
  };

  const mockEvent = {
    id: 'event-123',
    organizerId: mockOrganizer.id,
    title: 'Test Event',
    deletedAt: null,
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('createTicketType', () => {
    const ticketData = {
      eventId: mockEvent.id,
      name: 'VIP Ticket',
      basePrice: 100,
      maxPerOrder: 2,
      rules: { dynamic: true },
    };

    it('should create advanced ticket type successfully', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({
        id: 'ticket-package-123',
        organizerId: mockOrganizer.id,
        eventId: mockEvent.id,
        name: ticketData.name,
        price: ticketData.basePrice,
        maxQuantity: ticketData.maxPerOrder,
        type: 'group',
      } as any);

      // Act
      const result = await AdvancedTicketTypesService.createTicketType(
        mockOrganizer.id,
        ticketData,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('ticket-package-123');
      expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: mockOrganizer.id,
            eventId: ticketData.eventId,
            name: ticketData.name,
            price: ticketData.basePrice,
            maxQuantity: ticketData.maxPerOrder, // Service maps maxPerOrder to maxQuantity
            type: 'group',
          }),
        }),
      );
    });

    it('should throw error if event not found', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AdvancedTicketTypesService.createTicketType(mockOrganizer.id, ticketData),
      ).rejects.toThrow(NotFoundError);

      await expect(
        AdvancedTicketTypesService.createTicketType(mockOrganizer.id, ticketData),
      ).rejects.toThrow('Event not found');
    });

    it('should verify event belongs to organizer', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({ id: 'ticket-123' } as any);

      // Act
      await AdvancedTicketTypesService.createTicketType(mockOrganizer.id, ticketData);

      // Assert
      expect(prismaMock.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: ticketData.eventId,
            organizerId: mockOrganizer.id,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should handle optional maxPerOrder', async () => {
      // Arrange
      const dataWithoutMax = { ...ticketData, maxPerOrder: undefined };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({ id: 'ticket-123' } as any);

      // Act
      await AdvancedTicketTypesService.createTicketType(mockOrganizer.id, dataWithoutMax);

      // Assert
      expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maxQuantity: undefined,
          }),
        }),
      );
    });
  });

  describe('createTicketPackage', () => {
    const basePackageData = {
      eventId: mockEvent.id,
      name: 'Group Package',
      description: 'Group discount package',
      type: 'group' as const,
      price: 500,
      minQuantity: 5,
      maxQuantity: 10,
    };

    it('should create group package successfully', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({
        id: 'package-123',
        ...basePackageData,
      } as any);

      // Act
      const result = await AdvancedTicketTypesService.createTicketPackage(
        mockOrganizer.id,
        basePackageData,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('package-123');
    });

    it('should create bundle package with bundle items', async () => {
      // Arrange
      const bundleData = {
        eventId: mockEvent.id,
        name: 'VIP Bundle',
        type: 'bundle' as const,
        price: 300,
        bundleItems: [
          { itemType: 'ticket', quantity: 2 },
          { itemType: 'merch', quantity: 1 },
        ],
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({ id: 'bundle-123' } as any);

      // Act
      const result = await AdvancedTicketTypesService.createTicketPackage(
        mockOrganizer.id,
        bundleData,
      );

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'bundle',
            bundleItems: bundleData.bundleItems,
          }),
        }),
      );
    });

    it('should create donation package with donation settings', async () => {
      // Arrange
      const donationData = {
        eventId: mockEvent.id,
        name: 'Donation Ticket',
        type: 'donation' as const,
        isDonation: true,
        minDonation: 10,
        maxDonation: 1000,
        suggestedAmounts: [25, 50, 100, 250],
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({ id: 'donation-123' } as any);

      // Act
      const result = await AdvancedTicketTypesService.createTicketPackage(
        mockOrganizer.id,
        donationData,
      );

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'donation',
            isDonation: true,
            minDonation: 10,
            maxDonation: 1000,
          }),
        }),
      );
    });

    it('should throw error if event not found', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, basePackageData),
      ).rejects.toThrow(NotFoundError);

      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, basePackageData),
      ).rejects.toThrow('Event not found');
    });

    it('should throw error if donation package missing isDonation flag', async () => {
      // Arrange
      const invalidDonationData = {
        eventId: mockEvent.id,
        name: 'Invalid Donation',
        type: 'donation' as const,
        isDonation: false,
        minDonation: 10,
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);

      // Act & Assert
      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, invalidDonationData),
      ).rejects.toThrow(ValidationError);

      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, invalidDonationData),
      ).rejects.toThrow('Donation type must have isDonation set to true');
    });

    it('should throw error if minDonation > maxDonation', async () => {
      // Arrange
      const invalidDonationData = {
        eventId: mockEvent.id,
        name: 'Invalid Donation',
        type: 'donation' as const,
        isDonation: true,
        minDonation: 1000,
        maxDonation: 10,
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);

      // Act & Assert
      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, invalidDonationData),
      ).rejects.toThrow(ValidationError);

      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, invalidDonationData),
      ).rejects.toThrow('Min donation must be less than max donation');
    });

    it('should throw error if bundle package has no bundle items', async () => {
      // Arrange
      const invalidBundleData = {
        eventId: mockEvent.id,
        name: 'Invalid Bundle',
        type: 'bundle' as const,
        price: 100,
        bundleItems: [],
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);

      // Act & Assert
      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, invalidBundleData),
      ).rejects.toThrow(ValidationError);

      await expect(
        AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, invalidBundleData),
      ).rejects.toThrow('Bundle type must have bundle items');
    });

    it('should handle reserved seating settings', async () => {
      // Arrange
      const seatingData = {
        ...basePackageData,
        hasReservedSeating: true,
        seatingChart: { sections: ['A', 'B', 'C'] },
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({ id: 'package-123' } as any);

      // Act
      await AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, seatingData);

      // Assert
      expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hasReservedSeating: true,
            seatingChart: seatingData.seatingChart,
          }),
        }),
      );
    });

    it('should handle availability time windows', async () => {
      // Arrange
      const availableFrom = new Date('2026-01-01');
      const availableUntil = new Date('2026-12-31');
      const timeWindowData = {
        ...basePackageData,
        availableFrom,
        availableUntil,
      };
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.ticketPackage.create.mockResolvedValue({ id: 'package-123' } as any);

      // Act
      await AdvancedTicketTypesService.createTicketPackage(mockOrganizer.id, timeWindowData);

      // Assert
      expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableFrom,
            availableUntil,
          }),
        }),
      );
    });
  });
});
