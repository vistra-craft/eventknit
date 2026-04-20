import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { PayoutManagementService } from '../../../src/services/payout-management.service.js';
import { ValidationError } from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('PayoutManagementService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const mockOrganizerId = 'organizer-123';

  const mockPayoutPreference = {
    id: 'pref-123',
    organizerId: mockOrganizerId,
    primaryMethod: 'bank_transfer',
    bankName: 'Test Bank',
    accountName: 'Test Account',
    accountNumber: '1234567890',
    bankCode: '001',
    routingNumber: null,
    paystackRecipientCode: null,
    alternativeMethods: null,
    autoPayoutEnabled: false,
    autoPayoutThreshold: null,
    autoPayoutSchedule: null,
    taxId: null,
    taxCountry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlatformFee = {
    id: 'fee-123',
    eventId: 'event-123',
    transactionId: 'txn-123',
    grossAmount: 100,
    platformFeePercent: 10,
    feeAmount: 10,
    organizerAmount: 90,
    currency: 'USD',
    status: 'calculated',
    disbursementId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    event: {
      id: 'event-123',
      title: 'Test Event',
    },
  };

  const mockDisbursement = {
    id: 'disb-123',
    disbursementNumber: 'DISB-123456',
    organizerId: mockOrganizerId,
    eventId: 'event-123',
    totalAmount: 90,
    currency: 'USD',
    paymentMethod: 'bank_transfer',
    bankName: 'Test Bank',
    accountName: 'Test Account',
    accountNumber: '1234567890',
    scheduledDate: new Date(),
    processedDate: null,
    status: 'pending',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    vi.clearAllMocks();
  });

  describe('getPayoutPreferences', () => {
    it('should return existing preferences if found', async () => {
      // Arrange
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);

      // Act
      const result = await PayoutManagementService.getPayoutPreferences(mockOrganizerId);

      // Assert
      expect(result).toEqual(mockPayoutPreference);
      expect(prisma.payoutPreference.findUnique).toHaveBeenCalledWith({
        where: { organizerId: mockOrganizerId },
      });
      expect(prisma.payoutPreference.create).not.toHaveBeenCalled();
    });

    it('should create default preferences if not found', async () => {
      // Arrange
      prisma.payoutPreference.findUnique.mockResolvedValue(null);
      const defaultPreferences = {
        ...mockPayoutPreference,
        bankName: null,
        accountName: null,
        accountNumber: null,
      };
      prisma.payoutPreference.create.mockResolvedValue(defaultPreferences as any);

      // Act
      const result = await PayoutManagementService.getPayoutPreferences(mockOrganizerId);

      // Assert
      expect(result).toEqual(defaultPreferences);
      expect(prisma.payoutPreference.create).toHaveBeenCalledWith({
        data: {
          organizerId: mockOrganizerId,
          primaryMethod: 'bank_transfer',
        },
      });
    });

    it('should handle errors and propagate them', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.payoutPreference.findUnique.mockRejectedValue(error);

      // Act & Assert
      await expect(
        PayoutManagementService.getPayoutPreferences(mockOrganizerId),
      ).rejects.toThrow('Database error');
    });
  });

  describe('updatePayoutPreferences', () => {
    it('should create preferences if they do not exist', async () => {
      // Arrange
      const updateData = {
        primaryMethod: 'bank_transfer',
        bankName: 'New Bank',
        accountName: 'New Account',
        accountNumber: '9876543210',
      };
      const newPreferences = {
        ...mockPayoutPreference,
        ...updateData,
      };
      prisma.payoutPreference.upsert.mockResolvedValue(newPreferences as any);

      // Act
      const result = await PayoutManagementService.updatePayoutPreferences(
        mockOrganizerId,
        updateData,
      );

      // Assert
      expect(result).toEqual(newPreferences);
      expect(prisma.payoutPreference.upsert).toHaveBeenCalledWith({
        where: { organizerId: mockOrganizerId },
        create: expect.objectContaining({
          organizerId: mockOrganizerId,
          primaryMethod: 'bank_transfer',
          bankName: 'New Bank',
          accountName: 'New Account',
          accountNumber: '9876543210',
        }),
        update: expect.objectContaining({
          primaryMethod: 'bank_transfer',
          bankName: 'New Bank',
          accountName: 'New Account',
          accountNumber: '9876543210',
        }),
      });
    });

    it('should update only provided fields', async () => {
      // Arrange
      const updateData = {
        bankName: 'Updated Bank',
      };
      const updatedPreferences = {
        ...mockPayoutPreference,
        bankName: 'Updated Bank',
      };
      prisma.payoutPreference.upsert.mockResolvedValue(updatedPreferences as any);

      // Act
      const result = await PayoutManagementService.updatePayoutPreferences(
        mockOrganizerId,
        updateData,
      );

      // Assert
      expect(result.bankName).toBe('Updated Bank');
      expect(prisma.payoutPreference.upsert).toHaveBeenCalled();
    });

    it('should handle all preference fields', async () => {
      // Arrange
      const completeData = {
        primaryMethod: 'paystack',
        bankName: 'Complete Bank',
        accountName: 'Complete Account',
        accountNumber: '1111111111',
        bankCode: '002',
        routingNumber: 'RT123',
        paystackRecipientCode: 'RCP_123',
        alternativeMethods: { paypal: 'test@paypal.com' },
        autoPayoutEnabled: true,
        autoPayoutThreshold: 1000,
        autoPayoutSchedule: 'weekly',
        taxId: 'TAX123',
        taxCountry: 'US',
      };
      prisma.payoutPreference.upsert.mockResolvedValue({
        ...mockPayoutPreference,
        ...completeData,
      } as any);

      // Act
      const result = await PayoutManagementService.updatePayoutPreferences(
        mockOrganizerId,
        completeData,
      );

      // Assert
      expect(result).toMatchObject(completeData);
    });

    it('should handle undefined fields without updating them', async () => {
      // Arrange
      const updateData = {
        bankName: 'Only Bank Name',
        accountName: undefined,
      };
      prisma.payoutPreference.upsert.mockResolvedValue(mockPayoutPreference as any);

      // Act
      await PayoutManagementService.updatePayoutPreferences(mockOrganizerId, updateData);

      // Assert
      const upsertCall = prisma.payoutPreference.upsert.mock.calls[0][0];
      expect(upsertCall.update).toHaveProperty('bankName');
      // accountName should not be in update object since it's undefined
    });

    it('should handle errors and propagate them', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.payoutPreference.upsert.mockRejectedValue(error);

      // Act & Assert
      await expect(
        PayoutManagementService.updatePayoutPreferences(mockOrganizerId, {}),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPayoutHistory', () => {
    const mockDisbursementWithRelations = {
      ...mockDisbursement,
      event: { id: 'event-123', title: 'Test Event' },
      platformFees: [
        {
          id: 'fee-123',
          feeAmount: 10,
          organizerAmount: 90,
        },
      ],
    };

    it('should return paginated disbursements with default limit 20', async () => {
      // Arrange
      prisma.organizerDisbursement.findMany.mockResolvedValue([mockDisbursementWithRelations] as any);
      prisma.organizerDisbursement.count.mockResolvedValue(1);

      // Act
      const result = await PayoutManagementService.getPayoutHistory(mockOrganizerId);

      // Assert
      expect(result.disbursements).toHaveLength(1);
      expect(result.limit).toBe(20);
      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith({
        where: { organizerId: mockOrganizerId },
        include: expect.objectContaining({
          event: expect.any(Object),
          platformFees: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
    });

    it('should handle custom pagination', async () => {
      // Arrange
      prisma.organizerDisbursement.findMany.mockResolvedValue([mockDisbursementWithRelations] as any);
      prisma.organizerDisbursement.count.mockResolvedValue(50);

      // Act
      const result = await PayoutManagementService.getPayoutHistory(mockOrganizerId, {
        page: 2,
        limit: 10,
      });

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(5);
      expect(result.hasMore).toBe(true);
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10, // (page 2 - 1) * limit 10
        }),
      );
    });

    it('should filter by status', async () => {
      // Arrange
      prisma.organizerDisbursement.findMany.mockResolvedValue([mockDisbursementWithRelations] as any);
      prisma.organizerDisbursement.count.mockResolvedValue(1);

      // Act
      await PayoutManagementService.getPayoutHistory(mockOrganizerId, {
        status: 'completed',
      });

      // Assert
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizerId: mockOrganizerId,
            status: 'completed',
          },
        }),
      );
    });

    it('should filter by date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      prisma.organizerDisbursement.findMany.mockResolvedValue([mockDisbursementWithRelations] as any);
      prisma.organizerDisbursement.count.mockResolvedValue(1);

      // Act
      await PayoutManagementService.getPayoutHistory(mockOrganizerId, {
        startDate,
        endDate,
      });

      // Assert
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizerId: mockOrganizerId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      );
    });

    it('should filter by start date only', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      prisma.organizerDisbursement.findMany.mockResolvedValue([mockDisbursementWithRelations] as any);
      prisma.organizerDisbursement.count.mockResolvedValue(1);

      // Act
      await PayoutManagementService.getPayoutHistory(mockOrganizerId, {
        startDate,
      });

      // Assert
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizerId: mockOrganizerId,
            createdAt: {
              gte: startDate,
            },
          },
        }),
      );
    });

    it('should handle errors and propagate them', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.organizerDisbursement.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(
        PayoutManagementService.getPayoutHistory(mockOrganizerId),
      ).rejects.toThrow('Database error');
    });
  });

  describe('schedulePayout', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    it('should throw ValidationError if scheduled date is not in the future', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

      // Act & Assert
      await expect(
        PayoutManagementService.schedulePayout(mockOrganizerId, {
          scheduledDate: pastDate,
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        PayoutManagementService.schedulePayout(mockOrganizerId, {
          scheduledDate: pastDate,
        }),
      ).rejects.toThrow('Scheduled date must be in the future');
    });

    it('should throw ValidationError if no pending payouts available', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([]);

      // Act & Assert
      await expect(
        PayoutManagementService.schedulePayout(mockOrganizerId, {
          scheduledDate: futureDate,
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        PayoutManagementService.schedulePayout(mockOrganizerId, {
          scheduledDate: futureDate,
        }),
      ).rejects.toThrow('No pending payouts available');
    });

    it('should calculate total amount from pending platform fees', async () => {
      // Arrange
      const fees = [
        { ...mockPlatformFee, organizerAmount: 90 },
        { ...mockPlatformFee, id: 'fee-124', organizerAmount: 110 },
      ];
      prisma.platformFee.findMany.mockResolvedValue(fees as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      const disbursementWithCalculatedAmount = { ...mockDisbursement, totalAmount: 200 };
      prisma.organizerDisbursement.create.mockResolvedValue(disbursementWithCalculatedAmount as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 2 } as any);

      // Act
      const result = await PayoutManagementService.schedulePayout(mockOrganizerId, {
        scheduledDate: futureDate,
      });

      // Assert
      expect(result.totalAmount).toBe(200); // 90 + 110
      expect(prisma.organizerDisbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 200,
          }),
        }),
      );
    });

    it('should use provided amount if specified', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([mockPlatformFee] as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      const customDisbursement = { ...mockDisbursement, totalAmount: 150 };
      prisma.organizerDisbursement.create.mockResolvedValue(customDisbursement as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      const result = await PayoutManagementService.schedulePayout(mockOrganizerId, {
        scheduledDate: futureDate,
        amount: 150,
      });

      // Assert
      expect(result.totalAmount).toBe(150);
      expect(prisma.organizerDisbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 150,
          }),
        }),
      );
    });

    it('should create disbursement with status pending', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([mockPlatformFee] as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      prisma.organizerDisbursement.create.mockResolvedValue(mockDisbursement as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      const result = await PayoutManagementService.schedulePayout(mockOrganizerId, {
        scheduledDate: futureDate,
      });

      // Assert
      expect(result.status).toBe('pending');
      expect(prisma.organizerDisbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'pending',
          }),
        }),
      );
    });

    it('should link platform fees to disbursement', async () => {
      // Arrange
      const fees = [
        { ...mockPlatformFee, id: 'fee-1' },
        { ...mockPlatformFee, id: 'fee-2' },
      ];
      prisma.platformFee.findMany.mockResolvedValue(fees as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      prisma.organizerDisbursement.create.mockResolvedValue({
        ...mockDisbursement,
        id: 'disb-new',
      } as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 2 } as any);

      // Act
      await PayoutManagementService.schedulePayout(mockOrganizerId, {
        scheduledDate: futureDate,
      });

      // Assert
      expect(prisma.platformFee.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['fee-1', 'fee-2'],
          },
        },
        data: {
          disbursementId: 'disb-new',
        },
      });
    });

    it('should use organizer payout preferences', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([mockPlatformFee] as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      prisma.organizerDisbursement.create.mockResolvedValue(mockDisbursement as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      await PayoutManagementService.schedulePayout(mockOrganizerId, {
        scheduledDate: futureDate,
      });

      // Assert
      expect(prisma.organizerDisbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: mockPayoutPreference.primaryMethod,
            bankName: mockPayoutPreference.bankName,
            accountName: mockPayoutPreference.accountName,
            accountNumber: mockPayoutPreference.accountNumber,
          }),
        }),
      );
    });

    it('should filter by eventId if provided', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([mockPlatformFee] as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      prisma.organizerDisbursement.create.mockResolvedValue(mockDisbursement as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      await PayoutManagementService.schedulePayout(mockOrganizerId, {
        eventId: 'event-specific',
        scheduledDate: futureDate,
      });

      // Assert
      expect(prisma.platformFee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventId: 'event-specific',
          }),
        }),
      );
    });

    it('should include notes if provided', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([mockPlatformFee] as any);
      prisma.payoutPreference.findUnique.mockResolvedValue(mockPayoutPreference as any);
      prisma.organizerDisbursement.create.mockResolvedValue(mockDisbursement as any);
      prisma.platformFee.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      await PayoutManagementService.schedulePayout(mockOrganizerId, {
        scheduledDate: futureDate,
        notes: 'Special payout request',
      });

      // Assert
      expect(prisma.organizerDisbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: 'Special payout request',
          }),
        }),
      );
    });

    it('should handle errors and propagate them', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.platformFee.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(
        PayoutManagementService.schedulePayout(mockOrganizerId, {
          scheduledDate: futureDate,
        }),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPayoutSummary', () => {
    it('should calculate pending amount from platform fees', async () => {
      // Arrange
      const pendingFees = [
        { ...mockPlatformFee, organizerAmount: 90 },
        { ...mockPlatformFee, id: 'fee-2', organizerAmount: 110 },
      ];
      prisma.platformFee.findMany.mockResolvedValue(pendingFees as any);
      prisma.organizerDisbursement.findMany
        .mockResolvedValueOnce([]) // completed disbursements
        .mockResolvedValueOnce([]); // pending disbursements

      // Act
      const result = await PayoutManagementService.getPayoutSummary(mockOrganizerId);

      // Assert
      expect(result.pending.amount).toBe(200); // 90 + 110
      expect(result.pending.count).toBe(2);
      expect(prisma.platformFee.findMany).toHaveBeenCalledWith({
        where: {
          event: {
            organizerId: mockOrganizerId,
          },
          status: 'calculated',
          disbursementId: null,
        },
      });
    });

    it('should calculate totalPaid from completed disbursements', async () => {
      // Arrange
      const completedDisbursements = [
        { ...mockDisbursement, totalAmount: 100, status: 'completed' },
        { ...mockDisbursement, id: 'disb-2', totalAmount: 150, status: 'completed' },
      ];
      prisma.platformFee.findMany.mockResolvedValue([]);
      prisma.organizerDisbursement.findMany
        .mockResolvedValueOnce(completedDisbursements as any) // completed
        .mockResolvedValueOnce([]); // pending

      // Act
      const result = await PayoutManagementService.getPayoutSummary(mockOrganizerId);

      // Assert
      expect(result.totalPaid).toBe(250); // 100 + 150
      expect(result.totalDisbursements).toBe(2);
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith({
        where: {
          organizerId: mockOrganizerId,
          status: 'completed',
        },
      });
    });

    it('should calculate scheduled amount from pending disbursements', async () => {
      // Arrange
      const pendingDisbursements = [
        { ...mockDisbursement, totalAmount: 80, status: 'pending' },
        { ...mockDisbursement, id: 'disb-2', totalAmount: 120, status: 'processing' },
      ];
      prisma.platformFee.findMany.mockResolvedValue([]);
      prisma.organizerDisbursement.findMany
        .mockResolvedValueOnce([]) // completed
        .mockResolvedValueOnce(pendingDisbursements as any); // pending/processing

      // Act
      const result = await PayoutManagementService.getPayoutSummary(mockOrganizerId);

      // Assert
      expect(result.scheduled.amount).toBe(200); // 80 + 120
      expect(result.scheduled.count).toBe(2);
      expect(prisma.organizerDisbursement.findMany).toHaveBeenCalledWith({
        where: {
          organizerId: mockOrganizerId,
          status: {
            in: ['pending', 'processing'],
          },
        },
      });
    });

    it('should return zeros when no data exists', async () => {
      // Arrange
      prisma.platformFee.findMany.mockResolvedValue([]);
      prisma.organizerDisbursement.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await PayoutManagementService.getPayoutSummary(mockOrganizerId);

      // Assert
      expect(result.pending.amount).toBe(0);
      expect(result.pending.count).toBe(0);
      expect(result.scheduled.amount).toBe(0);
      expect(result.scheduled.count).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.totalDisbursements).toBe(0);
    });

    it('should return complete summary with all categories', async () => {
      // Arrange
      const pendingFees = [{ ...mockPlatformFee, organizerAmount: 50 }];
      const completedDisbursements = [{ ...mockDisbursement, totalAmount: 200, status: 'completed' }];
      const pendingDisbursements = [{ ...mockDisbursement, totalAmount: 75, status: 'pending' }];

      prisma.platformFee.findMany.mockResolvedValue(pendingFees as any);
      prisma.organizerDisbursement.findMany
        .mockResolvedValueOnce(completedDisbursements as any)
        .mockResolvedValueOnce(pendingDisbursements as any);

      // Act
      const result = await PayoutManagementService.getPayoutSummary(mockOrganizerId);

      // Assert
      expect(result).toEqual({
        pending: {
          amount: 50,
          count: 1,
        },
        scheduled: {
          amount: 75,
          count: 1,
        },
        totalPaid: 200,
        totalDisbursements: 1,
      });
    });

    it('should handle errors and propagate them', async () => {
      // Arrange
      const error = new Error('Database error');
      prisma.platformFee.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(
        PayoutManagementService.getPayoutSummary(mockOrganizerId),
      ).rejects.toThrow('Database error');
    });
  });
});
