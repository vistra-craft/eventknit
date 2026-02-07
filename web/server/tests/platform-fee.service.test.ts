import { PlatformFeeService } from '../src/services/platform-fee.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('PlatformFeeService', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let registrationId: string;
  let paymentTransactionId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    // Clear all tables in correct order
    await prisma.$transaction(async (tx) => {
      await tx.refund.deleteMany();
      await tx.platformFee.deleteMany();
      await tx.organizerDisbursement.deleteMany();
      await tx.eventPaymentTransaction.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.eventInvitation.deleteMany();
      await tx.ticketTemplate.deleteMany();
      await tx.event.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.magicLinkToken.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.emailVerification.deleteMany();
      await tx.kYCDocument.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: await hashPassword('password123'),
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;

    // Create test attendee
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    attendeeId = attendee.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Paid Event',
        description: 'Test event description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '18:00',
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: false,
        price: 100,
        capacity: 10,
        availableSlots: 10,
      },
    });
    eventId = event.id;

    // Create test registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        quantity: 1,
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: 'COMPLETED',
        totalAmount: 10000, // 100.00 NGN
      },
    });
    registrationId = registration.id;

    // Create test payment transaction
    const paymentTransaction = await prisma.eventPaymentTransaction.create({
      data: {
        transactionNumber: 'EPT-2024-000001',
        gatewayReference: 'gw-001',
        gatewayAmount: 10000,
        paystackReference: 'test_ref_001',
        paystackAmount: 1000000, // 10000 in kobo
        currency: 'NGN',
        amount: 10000, // 100.00 NGN
        paymentMethod: 'PAYSTACK',
        paymentStatus: 'success',
        paymentDate: new Date(),
        eventId,
        registrationId,
        attendeeEmail: 'attendee@test.com',
        attendeeName: 'Attendee Test',
      },
    });
    paymentTransactionId = paymentTransaction.id;
  });

  describe('calculatePlatformFee', () => {
    it('should calculate platform fee correctly with default 10%', () => {
      const result = PlatformFeeService.calculatePlatformFee(10000);
      expect(result.grossAmount).toBe(10000);
      expect(result.feePercentage).toBe(10.0);
      expect(result.feeAmount).toBe(1000); // 10% of 10000
      expect(result.organizerAmount).toBe(9000); // 10000 - 1000
    });

    it('should calculate platform fee with custom percentage', () => {
      const result = PlatformFeeService.calculatePlatformFee(10000, 15.0);
      expect(result.feePercentage).toBe(15.0);
      expect(result.feeAmount).toBe(1500);
      expect(result.organizerAmount).toBe(8500);
    });

    it('should apply minimum fee if configured', () => {
      const result = PlatformFeeService.calculatePlatformFee(1000, 10.0, {
        feePercentage: 10.0,
        minimumFee: 200,
      });
      expect(result.feeAmount).toBe(200); // Minimum fee applied
      expect(result.organizerAmount).toBe(800);
    });

    it('should apply maximum fee if configured', () => {
      const result = PlatformFeeService.calculatePlatformFee(100000, 10.0, {
        feePercentage: 10.0,
        maximumFee: 5000,
      });
      expect(result.feeAmount).toBe(5000); // Maximum fee applied
      expect(result.organizerAmount).toBe(95000);
    });

    it('should not exceed gross amount', () => {
      const result = PlatformFeeService.calculatePlatformFee(100, 150.0); // 150% fee
      expect(result.feeAmount).toBe(100); // Capped at gross amount
      expect(result.organizerAmount).toBe(0);
    });
  });

  describe('createPlatformFee', () => {
    it('should create platform fee for a payment transaction', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not connected');
        return;
      }

      const result = await PlatformFeeService.createPlatformFee(paymentTransactionId);

      expect(result.id).toBeDefined();
      expect(result.feeNumber).toMatch(/^PF-\d{4}-\d{6}$/);
      expect(result.feeAmount).toBe(1000); // 10% of 10000
      expect(result.organizerAmount).toBe(9000);

      // Verify in database
      const fee = await prisma.platformFee.findUnique({
        where: { id: result.id },
      });
      expect(fee).toBeDefined();
      expect(Number(fee?.feeAmount)).toBe(1000);
      expect(Number(fee?.organizerAmount)).toBe(9000);
      expect(fee?.status).toBe('calculated');
    });

    it('should not create duplicate platform fee', async () => {
      if (!dbConnected) return;

      // Create first fee
      const firstResult = await PlatformFeeService.createPlatformFee(paymentTransactionId);
      expect(firstResult.id).toBeDefined();

      // Try to create again
      const secondResult = await PlatformFeeService.createPlatformFee(paymentTransactionId);
      expect(secondResult.id).toBe(firstResult.id); // Should return existing

      // Verify only one fee exists
      const fees = await prisma.platformFee.findMany({
        where: { transactionId: paymentTransactionId },
      });
      expect(fees.length).toBe(1);
    });

    it('should throw error if transaction not found', async () => {
      if (!dbConnected) return;

      await expect(
        PlatformFeeService.createPlatformFee('non-existent-id'),
      ).rejects.toThrow('Payment transaction not found');
    });
  });

  describe('getPlatformFeeByTransaction', () => {
    it('should get platform fee by transaction ID', async () => {
      if (!dbConnected) return;

      // Create platform fee first
      const created = await PlatformFeeService.createPlatformFee(paymentTransactionId);

      const fee = await PlatformFeeService.getPlatformFeeByTransaction(paymentTransactionId);

      expect(fee.id).toBe(created.id);
      expect(fee.transaction).toBeDefined();
      expect(fee.transaction.event).toBeDefined();
    });

    it('should throw error if fee not found', async () => {
      if (!dbConnected) return;

      await expect(
        PlatformFeeService.getPlatformFeeByTransaction('non-existent-id'),
      ).rejects.toThrow('Platform fee not found');
    });
  });

  describe('getEventPlatformFees', () => {
    it('should get all platform fees for an event', async () => {
      if (!dbConnected) return;

      // Create platform fee
      await PlatformFeeService.createPlatformFee(paymentTransactionId);

      const fees = await PlatformFeeService.getEventPlatformFees(eventId);

      expect(fees.length).toBe(1);
      expect(fees[0].eventId).toBe(eventId);
      expect(fees[0].transaction).toBeDefined();
    });

    it('should filter by status', async () => {
      if (!dbConnected) return;

      await PlatformFeeService.createPlatformFee(paymentTransactionId);

      const fees = await PlatformFeeService.getEventPlatformFees(eventId, {
        status: 'calculated',
      });

      expect(fees.length).toBe(1);
      expect(fees[0].status).toBe('calculated');
    });
  });

  describe('getEventPlatformFeeSummary', () => {
    it('should calculate platform fee summary for an event', async () => {
      if (!dbConnected) return;

      // Create platform fee
      await PlatformFeeService.createPlatformFee(paymentTransactionId);

      const summary = await PlatformFeeService.getEventPlatformFeeSummary(eventId);

      expect(summary.totalFees).toBe(1000);
      expect(summary.totalOrganizerAmount).toBe(9000);
      expect(summary.totalTransactions).toBe(1);
      expect(summary.pendingCount).toBe(1);
      expect(summary.disbursedCount).toBe(0);
    });
  });
});

