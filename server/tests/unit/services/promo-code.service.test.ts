import { PrismaClient, DiscountType, PromoCodeScope } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  ValidationError,
  NotFoundError,
} from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'batch-uuid-1234'),
}));

import { PromoCodeService, CreatePromoCodeData, BulkGenerateData } from '../../../src/services/promo-code.service.js';

describe('PromoCodeService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  // --- Shared mock data ---

  const organizerId = 'org-550e8400-e29b-41d4-a716-446655440000';
  const userId = 'user-660e8400-e29b-41d4-a716-446655440001';
  const eventId = 'evt-770e8400-e29b-41d4-a716-446655440002';
  const promoCodeId = 'promo-880e8400-e29b-41d4-a716-446655440003';

  const now = new Date('2026-06-15T12:00:00Z');
  const pastDate = new Date('2026-01-01T00:00:00Z');
  const futureDate = new Date('2026-12-31T23:59:59Z');
  const farFutureDate = new Date('2027-06-01T00:00:00Z');

  const mockPercentagePromoCode = {
    id: promoCodeId,
    code: 'SAVE20',
    organizerId,
    eventId,
    scope: PromoCodeScope.EVENT,
    eventIds: [],
    discountType: DiscountType.PERCENTAGE,
    discountValue: new Decimal(20),
    minOrderAmount: null,
    maxDiscount: null,
    applicableTicketTypes: [],
    isActive: true,
    firstTimeOnly: false,
    isStackable: false,
    isReferral: false,
    referrerUserId: null,
    codePrefix: null,
    batchId: null,
    campaignName: null,
    campaignSource: null,
    isTiered: false,
    discountTiers: null,
    usageLimit: 100,
    usedCount: 5,
    maxUsesPerUser: 3,
    validFrom: pastDate,
    validUntil: futureDate,
    createdAt: pastDate,
    updatedAt: now,
    createdBy: organizerId,
  };

  const mockFixedPromoCode = {
    ...mockPercentagePromoCode,
    id: 'promo-990e8400-e29b-41d4-a716-446655440004',
    code: 'FLAT50',
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: new Decimal(50),
  };

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =============================================
  // 1. validatePromoCode
  // =============================================
  describe('validatePromoCode', () => {
    it('should validate a valid percentage promo code and calculate discount', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(mockPercentagePromoCode as any);
      prisma.promoCodeRedemption.count.mockResolvedValue(0);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        200,
        userId,
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(40); // 20% of 200
      expect(result.promoCodeId).toBe(promoCodeId);
      expect(result.promoCode).toEqual({
        id: promoCodeId,
        code: 'SAVE20',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
      });
      expect(prisma.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
    });

    it('should validate a valid fixed amount promo code', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(mockFixedPromoCode as any);
      prisma.promoCodeRedemption.count.mockResolvedValue(0);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'FLAT50',
        eventId,
        null,
        200,
        userId,
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(50);
      expect(result.promoCode?.discountType).toBe(DiscountType.FIXED_AMOUNT);
    });

    it('should return invalid for non-existent code', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'NONEXISTENT',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid promo code');
    });

    it('should return invalid for expired code', async () => {
      // Arrange
      const expired = {
        ...mockPercentagePromoCode,
        validUntil: new Date('2026-01-15T00:00:00Z'), // Before "now" (June 15, 2026)
      };
      prisma.promoCode.findUnique.mockResolvedValue(expired as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code has expired');
    });

    it('should return invalid for code not yet valid (validFrom in future)', async () => {
      // Arrange
      const notYetValid = {
        ...mockPercentagePromoCode,
        validFrom: farFutureDate, // After "now"
      };
      prisma.promoCode.findUnique.mockResolvedValue(notYetValid as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('This promo code is not valid yet');
    });

    it('should return invalid when usage limit exceeded', async () => {
      // Arrange
      const exhausted = {
        ...mockPercentagePromoCode,
        usageLimit: 10,
        usedCount: 10,
      };
      prisma.promoCode.findUnique.mockResolvedValue(exhausted as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code has reached its usage limit');
    });

    it('should return invalid when user exceeded maxUsesPerUser', async () => {
      // Arrange
      const codeWithUserLimit = {
        ...mockPercentagePromoCode,
        maxUsesPerUser: 2,
      };
      prisma.promoCode.findUnique.mockResolvedValue(codeWithUserLimit as any);
      prisma.promoCodeRedemption.count.mockResolvedValue(2); // User already used it 2 times

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'You have already used this promo code the maximum number of times',
      );
      expect(prisma.promoCodeRedemption.count).toHaveBeenCalledWith({
        where: {
          promoCodeId,
          userId,
        },
      });
    });

    it('should return invalid when minimum order amount not met', async () => {
      // Arrange
      const codeWithMinOrder = {
        ...mockPercentagePromoCode,
        minOrderAmount: new Decimal(500),
      };
      prisma.promoCode.findUnique.mockResolvedValue(codeWithMinOrder as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        200, // Below 500 minimum
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum order amount');
    });

    it('should return invalid for inactive code', async () => {
      // Arrange
      const inactive = {
        ...mockPercentagePromoCode,
        isActive: false,
      };
      prisma.promoCode.findUnique.mockResolvedValue(inactive as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is no longer active');
    });

    it('should apply maxDiscount cap on percentage codes', async () => {
      // Arrange
      const capped = {
        ...mockPercentagePromoCode,
        discountValue: new Decimal(50), // 50%
        maxDiscount: new Decimal(30),   // Capped at $30
      };
      prisma.promoCode.findUnique.mockResolvedValue(capped as any);
      prisma.promoCodeRedemption.count.mockResolvedValue(0);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        200, // 50% of 200 = 100, but cap is 30
        userId,
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(30);
    });

    it('should return invalid for wrong event scope (EVENT scope, different eventId)', async () => {
      // Arrange
      const codeForDifferentEvent = {
        ...mockPercentagePromoCode,
        eventId: 'evt-different-event',
        scope: PromoCodeScope.EVENT,
      };
      prisma.promoCode.findUnique.mockResolvedValue(codeForDifferentEvent as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId, // Our event ID, different from code's eventId
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is not valid for this event');
    });

    it('should return invalid for MULTI_EVENT scope when event not in eventIds', async () => {
      // Arrange
      const multiEventCode = {
        ...mockPercentagePromoCode,
        scope: PromoCodeScope.MULTI_EVENT,
        eventId: null,
        eventIds: ['evt-aaa', 'evt-bbb'],
      };
      prisma.promoCode.findUnique.mockResolvedValue(multiEventCode as any);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId, // Not in eventIds
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is not valid for this event');
    });

    it('should accept PLATFORM scope code for any event', async () => {
      // Arrange
      const platformCode = {
        ...mockPercentagePromoCode,
        scope: PromoCodeScope.PLATFORM,
        eventId: null,
        organizerId: null,
      };
      prisma.promoCode.findUnique.mockResolvedValue(platformCode as any);
      prisma.promoCodeRedemption.count.mockResolvedValue(0);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should convert code to uppercase before lookup', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);

      // Act
      await PromoCodeService.validatePromoCode(
        'save20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(prisma.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
    });

    it('should not discount below zero (discount capped at totalAmount)', async () => {
      // Arrange
      const bigFixed = {
        ...mockFixedPromoCode,
        discountValue: new Decimal(500), // $500 off on $100 order
      };
      prisma.promoCode.findUnique.mockResolvedValue(bigFixed as any);
      prisma.promoCodeRedemption.count.mockResolvedValue(0);

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'FLAT50',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(100); // Capped at totalAmount
    });

    it('should return invalid for firstTimeOnly code when user has previous purchases', async () => {
      // Arrange
      const firstTimeCode = {
        ...mockPercentagePromoCode,
        firstTimeOnly: true,
        maxUsesPerUser: null, // No per-user limit check needed
      };
      prisma.promoCode.findUnique.mockResolvedValue(firstTimeCode as any);
      prisma.eventRegistration.count.mockResolvedValue(1); // Has previous purchases

      // Act
      const result = await PromoCodeService.validatePromoCode(
        'SAVE20',
        eventId,
        null,
        100,
        userId,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is only valid for first-time customers');
    });
  });

  // =============================================
  // 2. createPromoCode
  // =============================================
  describe('createPromoCode', () => {
    const validCreateData: CreatePromoCodeData = {
      code: 'NEWCODE',
      scope: PromoCodeScope.EVENT,
      eventId,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      validFrom: pastDate,
      validUntil: futureDate,
    };

    it('should create a promo code with valid data', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null); // No duplicate
      const createdCode = {
        id: promoCodeId,
        code: 'NEWCODE',
        organizerId,
        scope: PromoCodeScope.EVENT,
        eventId,
        eventIds: [],
        discountType: DiscountType.PERCENTAGE,
        discountValue: new Decimal(20),
        minOrderAmount: null,
        maxDiscount: null,
        applicableTicketTypes: [],
        usageLimit: null,
        maxUsesPerUser: 1,
        validFrom: pastDate,
        validUntil: futureDate,
        isActive: true,
        firstTimeOnly: false,
        isStackable: false,
        isReferral: false,
        referrerUserId: null,
        codePrefix: null,
        batchId: null,
        campaignName: null,
        campaignSource: null,
        isTiered: false,
        discountTiers: null,
        createdBy: organizerId,
        createdAt: now,
        updatedAt: now,
        event: { id: eventId, title: 'Test Event' },
        organizer: {
          id: organizerId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };
      prisma.promoCode.create.mockResolvedValue(createdCode as any);

      // Act
      const result = await PromoCodeService.createPromoCode(
        organizerId,
        validCreateData,
        false,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.code).toBe('NEWCODE');
      expect(prisma.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'NEWCODE' },
      });
      expect(prisma.promoCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'NEWCODE',
            organizerId,
            scope: PromoCodeScope.EVENT,
            eventId,
            discountType: DiscountType.PERCENTAGE,
            discountValue: expect.any(Decimal),
            isActive: true,
          }),
          include: expect.objectContaining({
            event: expect.any(Object),
            organizer: expect.any(Object),
          }),
        }),
      );
    });

    it('should throw ValidationError for duplicate code', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(mockPercentagePromoCode as any);

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, validCreateData, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, validCreateData, false),
      ).rejects.toThrow('A promo code with this code already exists');
    });

    it('should throw ValidationError if validUntil before validFrom', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const invalidDates: CreatePromoCodeData = {
        ...validCreateData,
        validFrom: futureDate,
        validUntil: pastDate, // Before validFrom
      };

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, invalidDates, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, invalidDates, false),
      ).rejects.toThrow('Valid until date must be after valid from date');
    });

    it('should throw ValidationError if percentage discount > 100', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const invalidDiscount: CreatePromoCodeData = {
        ...validCreateData,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 150,
      };

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, invalidDiscount, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, invalidDiscount, false),
      ).rejects.toThrow('Percentage discount cannot exceed 100%');
    });

    it('should throw ValidationError if discount value <= 0', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const zeroDiscount: CreatePromoCodeData = {
        ...validCreateData,
        discountValue: 0,
      };

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, zeroDiscount, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, zeroDiscount, false),
      ).rejects.toThrow('Discount value must be greater than 0');
    });

    it('should throw ValidationError for non-admin creating PLATFORM scope', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const platformData: CreatePromoCodeData = {
        ...validCreateData,
        scope: PromoCodeScope.PLATFORM,
        eventId: undefined,
      };

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, platformData, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, platformData, false),
      ).rejects.toThrow('Only administrators can create platform-wide promo codes');
    });

    it('should allow admin to create PLATFORM scope code', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const platformData: CreatePromoCodeData = {
        ...validCreateData,
        scope: PromoCodeScope.PLATFORM,
        eventId: undefined,
      };
      prisma.promoCode.create.mockResolvedValue({
        id: promoCodeId,
        code: 'NEWCODE',
        scope: PromoCodeScope.PLATFORM,
        organizerId: null,
        event: null,
        organizer: null,
      } as any);

      // Act
      const result = await PromoCodeService.createPromoCode(
        organizerId,
        platformData,
        true, // isAdmin = true
      );

      // Assert
      expect(result).toBeDefined();
      expect(prisma.promoCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scope: PromoCodeScope.PLATFORM,
            organizerId: null,
          }),
        }),
      );
    });

    it('should uppercase the code before creating', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const lowercaseData: CreatePromoCodeData = {
        ...validCreateData,
        code: 'lowercase',
      };
      prisma.promoCode.create.mockResolvedValue({
        id: promoCodeId,
        code: 'LOWERCASE',
      } as any);

      // Act
      await PromoCodeService.createPromoCode(organizerId, lowercaseData, false);

      // Assert
      expect(prisma.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'LOWERCASE' },
      });
      expect(prisma.promoCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'LOWERCASE',
          }),
        }),
      );
    });

    it('should throw ValidationError for EVENT scope without eventId', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const noEventId: CreatePromoCodeData = {
        ...validCreateData,
        scope: PromoCodeScope.EVENT,
        eventId: undefined,
      };

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, noEventId, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, noEventId, false),
      ).rejects.toThrow('Event ID is required for single-event promo codes');
    });

    it('should throw ValidationError for MULTI_EVENT scope without eventIds', async () => {
      // Arrange
      prisma.promoCode.findUnique.mockResolvedValue(null);
      const noEventIds: CreatePromoCodeData = {
        ...validCreateData,
        scope: PromoCodeScope.MULTI_EVENT,
        eventId: undefined,
        eventIds: [],
      };

      // Act & Assert
      await expect(
        PromoCodeService.createPromoCode(organizerId, noEventIds, false),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.createPromoCode(organizerId, noEventIds, false),
      ).rejects.toThrow('At least one event must be selected for multi-event promo codes');
    });
  });

  // =============================================
  // 3. getPromoCodes
  // =============================================
  describe('getPromoCodes', () => {
    it('should return promo codes for organizer', async () => {
      // Arrange
      const mockCodes = [
        {
          ...mockPercentagePromoCode,
          event: { id: eventId, title: 'Test Event' },
          _count: { redemptions: 5 },
        },
        {
          ...mockFixedPromoCode,
          event: { id: eventId, title: 'Test Event' },
          _count: { redemptions: 10 },
        },
      ];
      prisma.promoCode.findMany.mockResolvedValue(mockCodes as any);

      // Act
      const result = await PromoCodeService.getPromoCodes(organizerId);

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.promoCode.findMany).toHaveBeenCalledWith({
        where: { organizerId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by eventId when provided', async () => {
      // Arrange
      prisma.promoCode.findMany.mockResolvedValue([]);

      // Act
      await PromoCodeService.getPromoCodes(organizerId, eventId);

      // Assert
      expect(prisma.promoCode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizerId,
            eventId,
          },
        }),
      );
    });
  });

  // =============================================
  // 4. getPromoCodeById
  // =============================================
  describe('getPromoCodeById', () => {
    it('should return promo code with ownership check', async () => {
      // Arrange
      const mockResult = {
        ...mockPercentagePromoCode,
        event: { id: eventId, title: 'Test Event' },
        organizer: {
          id: organizerId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        _count: { redemptions: 5 },
      };
      prisma.promoCode.findFirst.mockResolvedValue(mockResult as any);

      // Act
      const result = await PromoCodeService.getPromoCodeById(promoCodeId, organizerId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(promoCodeId);
      expect(prisma.promoCode.findFirst).toHaveBeenCalledWith({
        where: {
          id: promoCodeId,
          organizerId,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundError when code not found', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        PromoCodeService.getPromoCodeById('nonexistent-id', organizerId),
      ).rejects.toThrow(NotFoundError);

      await expect(
        PromoCodeService.getPromoCodeById('nonexistent-id', organizerId),
      ).rejects.toThrow('Promo code not found');
    });

    it('should throw NotFoundError when code not owned by organizer', async () => {
      // Arrange
      // findFirst with both id AND organizerId returns null when ownership doesn't match
      prisma.promoCode.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        PromoCodeService.getPromoCodeById(promoCodeId, 'different-organizer-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // =============================================
  // 5. updatePromoCode
  // =============================================
  describe('updatePromoCode', () => {
    it('should update promo code fields', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(mockPercentagePromoCode as any);
      const updatedCode = {
        ...mockPercentagePromoCode,
        discountValue: new Decimal(25),
        isActive: false,
        event: { id: eventId, title: 'Test Event' },
      };
      prisma.promoCode.update.mockResolvedValue(updatedCode as any);

      // Act
      const result = await PromoCodeService.updatePromoCode(
        promoCodeId,
        organizerId,
        { discountValue: 25, isActive: false },
      );

      // Assert
      expect(result).toBeDefined();
      expect(prisma.promoCode.findFirst).toHaveBeenCalledWith({
        where: {
          id: promoCodeId,
          organizerId,
        },
      });
      expect(prisma.promoCode.update).toHaveBeenCalledWith({
        where: { id: promoCodeId },
        data: expect.objectContaining({
          discountValue: expect.any(Decimal),
          isActive: false,
        }),
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    });

    it('should throw ValidationError for duplicate code on update', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(mockPercentagePromoCode as any);
      // New code already taken by another promo code
      prisma.promoCode.findUnique.mockResolvedValue({
        id: 'another-promo-id',
        code: 'TAKEN',
      } as any);

      // Act & Assert
      await expect(
        PromoCodeService.updatePromoCode(promoCodeId, organizerId, { code: 'TAKEN' }),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.updatePromoCode(promoCodeId, organizerId, { code: 'TAKEN' }),
      ).rejects.toThrow('A promo code with this code already exists');
    });

    it('should throw NotFoundError for non-existent code', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        PromoCodeService.updatePromoCode('nonexistent', organizerId, { isActive: false }),
      ).rejects.toThrow(NotFoundError);

      await expect(
        PromoCodeService.updatePromoCode('nonexistent', organizerId, { isActive: false }),
      ).rejects.toThrow('Promo code not found');
    });

    it('should not check uniqueness if code is unchanged', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(mockPercentagePromoCode as any);
      prisma.promoCode.update.mockResolvedValue({
        ...mockPercentagePromoCode,
        event: { id: eventId, title: 'Test Event' },
      } as any);

      // Act
      await PromoCodeService.updatePromoCode(promoCodeId, organizerId, {
        code: 'SAVE20', // Same code as existing
      });

      // Assert - findUnique should NOT be called for uniqueness check
      // (only findFirst for ownership check)
      expect(prisma.promoCode.findUnique).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // 6. deletePromoCode
  // =============================================
  describe('deletePromoCode', () => {
    it('should delete promo code with ownership check', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(mockPercentagePromoCode as any);
      prisma.promoCode.delete.mockResolvedValue(mockPercentagePromoCode as any);

      // Act
      const result = await PromoCodeService.deletePromoCode(promoCodeId, organizerId);

      // Assert
      expect(result).toEqual({ success: true });
      expect(prisma.promoCode.findFirst).toHaveBeenCalledWith({
        where: {
          id: promoCodeId,
          organizerId,
        },
      });
      expect(prisma.promoCode.delete).toHaveBeenCalledWith({
        where: { id: promoCodeId },
      });
    });

    it('should throw NotFoundError when code not found', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        PromoCodeService.deletePromoCode('nonexistent-id', organizerId),
      ).rejects.toThrow(NotFoundError);

      await expect(
        PromoCodeService.deletePromoCode('nonexistent-id', organizerId),
      ).rejects.toThrow('Promo code not found');
    });

    it('should throw NotFoundError when code not owned by organizer', async () => {
      // Arrange
      prisma.promoCode.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        PromoCodeService.deletePromoCode(promoCodeId, 'wrong-organizer'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // =============================================
  // 7. bulkGenerateCodes
  // =============================================
  describe('bulkGenerateCodes', () => {
    const validBulkData: BulkGenerateData = {
      count: 3,
      prefix: 'SUMMER',
      scope: PromoCodeScope.EVENT,
      eventId,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      validFrom: pastDate,
      validUntil: futureDate,
    };

    it('should generate multiple codes with prefix', async () => {
      // Arrange
      // Each generated code checks for uniqueness
      prisma.promoCode.findUnique.mockResolvedValue(null); // All codes available

      // Mock the transaction
      const mockTx = mockDeep<PrismaClient>();
      mockTx.promoCode.create.mockResolvedValue({} as any);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
        return fn(mockTx);
      });

      // Act
      const result = await PromoCodeService.bulkGenerateCodes(organizerId, validBulkData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.codes).toHaveLength(3);
      expect(result.count).toBe(3);
      expect(result.batchId).toBe('batch-uuid-1234');
      result.codes.forEach((code) => {
        expect(code).toMatch(/^SUMMER-[A-Z0-9]{6}$/);
      });
    });

    it('should throw ValidationError for count > 1000', async () => {
      // Arrange
      const tooMany: BulkGenerateData = {
        ...validBulkData,
        count: 1001,
      };

      // Act & Assert
      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, tooMany),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, tooMany),
      ).rejects.toThrow('Count must be between 1 and 1000');
    });

    it('should throw ValidationError for count < 1', async () => {
      // Arrange
      const tooFew: BulkGenerateData = {
        ...validBulkData,
        count: 0,
      };

      // Act & Assert
      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, tooFew),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, tooFew),
      ).rejects.toThrow('Count must be between 1 and 1000');
    });

    it('should throw ValidationError if validUntil before validFrom', async () => {
      // Arrange
      const invalidDates: BulkGenerateData = {
        ...validBulkData,
        validFrom: futureDate,
        validUntil: pastDate,
      };

      // Act & Assert
      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, invalidDates),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, invalidDates),
      ).rejects.toThrow('Valid until date must be after valid from date');
    });

    it('should throw ValidationError if discount value <= 0', async () => {
      // Arrange
      const zeroDiscount: BulkGenerateData = {
        ...validBulkData,
        discountValue: -5,
      };

      // Act & Assert
      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, zeroDiscount),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, zeroDiscount),
      ).rejects.toThrow('Discount value must be greater than 0');
    });

    it('should throw ValidationError if percentage discount > 100', async () => {
      // Arrange
      const overDiscount: BulkGenerateData = {
        ...validBulkData,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 110,
      };

      // Act & Assert
      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, overDiscount),
      ).rejects.toThrow(ValidationError);

      await expect(
        PromoCodeService.bulkGenerateCodes(organizerId, overDiscount),
      ).rejects.toThrow('Percentage discount cannot exceed 100%');
    });

    it('should sanitize prefix by removing non-alphanumeric characters', async () => {
      // Arrange
      const dirtyPrefix: BulkGenerateData = {
        ...validBulkData,
        count: 1,
        prefix: 'sum-mer!@#',
      };
      prisma.promoCode.findUnique.mockResolvedValue(null);

      const mockTx = mockDeep<PrismaClient>();
      mockTx.promoCode.create.mockResolvedValue({} as any);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => {
        return fn(mockTx);
      });

      // Act
      const result = await PromoCodeService.bulkGenerateCodes(organizerId, dirtyPrefix);

      // Assert - prefix should be sanitized to only A-Z0-9
      result.codes.forEach((code) => {
        expect(code).toMatch(/^SUMMER-[A-Z0-9]{6}$/);
      });
    });
  });

  // =============================================
  // 8. applyPromoCode
  // =============================================
  describe('applyPromoCode', () => {
    it('should create redemption and increment usedCount', async () => {
      // Arrange
      const registrationId = 'reg-aabbccdd-1234-5678-9012-345678901234';
      const originalAmount = 200;
      const discountAmount = 40;
      const mockRedemption = {
        id: 'redemption-123',
        promoCodeId,
        registrationId,
        userId,
        discountAmount: new Decimal(discountAmount),
        originalAmount: new Decimal(originalAmount),
        finalAmount: new Decimal(originalAmount - discountAmount),
        redeemedAt: now,
      };
      prisma.promoCodeRedemption.create.mockResolvedValue(mockRedemption as any);
      prisma.promoCode.update.mockResolvedValue({} as any);

      // Act
      const result = await PromoCodeService.applyPromoCode(
        promoCodeId,
        registrationId,
        userId,
        originalAmount,
        discountAmount,
      );

      // Assert
      expect(result).toEqual(mockRedemption);
      expect(prisma.promoCodeRedemption.create).toHaveBeenCalledWith({
        data: {
          promoCodeId,
          registrationId,
          userId,
          discountAmount: new Decimal(40),
          originalAmount: new Decimal(200),
          finalAmount: new Decimal(160),
        },
      });
      expect(prisma.promoCode.update).toHaveBeenCalledWith({
        where: { id: promoCodeId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    });
  });

  // =============================================
  // 9. getPromoCodeStats (admin)
  // =============================================
  describe('getPromoCodeStats', () => {
    it('should return platform-wide statistics', async () => {
      // Arrange
      prisma.promoCode.count
        .mockResolvedValueOnce(100) // totalCodes
        .mockResolvedValueOnce(75)  // activeCodes
        .mockResolvedValueOnce(20)  // platformCodes
        .mockResolvedValueOnce(30)  // organizerCodes
        .mockResolvedValueOnce(40)  // eventCodes
        .mockResolvedValueOnce(10); // multiEventCodes

      prisma.promoCodeRedemption.count.mockResolvedValue(500); // totalRedemptions

      prisma.promoCodeRedemption.aggregate.mockResolvedValue({
        _sum: {
          discountAmount: new Decimal(12500),
        },
        _count: null,
        _avg: null,
        _min: null,
        _max: null,
      } as any);

      // Act
      const result = await PromoCodeService.getPromoCodeStats();

      // Assert
      expect(result).toEqual({
        totalCodes: 100,
        activeCodes: 75,
        inactiveCodes: 25,
        totalRedemptions: 500,
        totalDiscountGiven: 12500,
        byScope: {
          platform: 20,
          organizer: 30,
          event: 40,
          multiEvent: 10,
        },
      });

      // Verify all counts were called
      expect(prisma.promoCode.count).toHaveBeenCalledTimes(6);
      expect(prisma.promoCode.count).toHaveBeenCalledWith(); // totalCodes
      expect(prisma.promoCode.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(prisma.promoCode.count).toHaveBeenCalledWith({
        where: { scope: PromoCodeScope.PLATFORM },
      });
      expect(prisma.promoCode.count).toHaveBeenCalledWith({
        where: { scope: PromoCodeScope.ORGANIZER },
      });
      expect(prisma.promoCode.count).toHaveBeenCalledWith({
        where: { scope: PromoCodeScope.EVENT },
      });
      expect(prisma.promoCode.count).toHaveBeenCalledWith({
        where: { scope: PromoCodeScope.MULTI_EVENT },
      });
      expect(prisma.promoCodeRedemption.aggregate).toHaveBeenCalledWith({
        _sum: {
          discountAmount: true,
        },
      });
    });

    it('should handle zero discount sum gracefully', async () => {
      // Arrange
      prisma.promoCode.count.mockResolvedValue(0);
      prisma.promoCodeRedemption.count.mockResolvedValue(0);
      prisma.promoCodeRedemption.aggregate.mockResolvedValue({
        _sum: {
          discountAmount: null,
        },
        _count: null,
        _avg: null,
        _min: null,
        _max: null,
      } as any);

      // Act
      const result = await PromoCodeService.getPromoCodeStats();

      // Assert
      expect(result.totalDiscountGiven).toBe(0);
      expect(result.totalCodes).toBe(0);
      expect(result.inactiveCodes).toBe(0);
    });
  });
});
