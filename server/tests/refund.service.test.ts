import { RefundService } from '../src/services/refund.service';
import { PlatformFeeService } from '../src/services/platform-fee.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('RefundService', () => {
  let dbConnected = false;
  let organizerId: string;
  let adminId: string;
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

    // Clear all tables
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

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await hashPassword('password123'),
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    adminId = admin.id;

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
        totalAmount: 10000,
      },
    });
    registrationId = registration.id;

    // Create test payment transaction
    const paymentTransaction = await prisma.eventPaymentTransaction.create({
      data: {
        transactionNumber: 'EPT-2024-000001',
        paystackReference: 'test_ref_001',
        paystackAmount: 1000000,
        currency: 'NGN',
        amount: 10000,
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

    // Create platform fee
    await PlatformFeeService.createPlatformFee(paymentTransactionId);
  });

  describe('createRefund', () => {
    it('should create full refund request', async () => {
      if (!dbConnected) return;

      const refund = await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'Customer requested cancellation',
          refundType: 'full',
        },
        adminId,
      );

      expect(refund.id).toBeDefined();
      expect(refund.refundNumber).toMatch(/^REF-\d{4}-\d{6}$/);
      expect(Number(refund.refundAmount)).toBe(10000); // Full amount
      expect(refund.refundType).toBe('full');
      expect(refund.status).toBe('pending');
      expect(refund.platformFeeRefund).toBeDefined(); // Should include platform fee refund
    });

    it('should create partial refund request', async () => {
      if (!dbConnected) return;

      const refund = await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundAmount: 5000,
          refundReason: 'Partial refund for cancellation',
          refundType: 'partial',
        },
        adminId,
      );

      expect(Number(refund.refundAmount)).toBe(5000);
      expect(refund.refundType).toBe('partial');
      expect(refund.platformFeeRefund).toBeNull(); // Partial refunds don't refund platform fee
    });

    it('should throw error if refund already exists', async () => {
      if (!dbConnected) return;

      await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'First refund',
          refundType: 'full',
        },
        adminId,
      );

      await expect(
        RefundService.createRefund(
          {
            transactionId: paymentTransactionId,
            refundReason: 'Second refund',
            refundType: 'full',
          },
          adminId,
        ),
      ).rejects.toThrow('Refund already exists for this transaction');
    });

    it('should throw error if refund amount exceeds transaction amount', async () => {
      if (!dbConnected) return;

      await expect(
        RefundService.createRefund(
          {
            transactionId: paymentTransactionId,
            refundAmount: 20000, // More than transaction amount
            refundReason: 'Invalid refund',
            refundType: 'partial',
          },
          adminId,
        ),
      ).rejects.toThrow('Refund amount cannot exceed transaction amount');
    });
  });

  describe('getRefund', () => {
    it('should get refund by ID', async () => {
      if (!dbConnected) return;

      const created = await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'Test refund',
          refundType: 'full',
        },
        adminId,
      );

      const refund = await RefundService.getRefund(created.id, adminId);

      expect(refund.id).toBe(created.id);
      expect(refund.transaction).toBeDefined();
      expect(refund.requester).toBeDefined();
    });

    it('should enforce authorization for organizers', async () => {
      if (!dbConnected) return;

      const created = await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'Test refund',
          refundType: 'full',
        },
        adminId,
      );

      // Create another organizer
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password: await hashPassword('password123'),
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Other organizer should not access refunds for events they don't own
      await expect(RefundService.getRefund(created.id, otherOrganizer.id)).rejects.toThrow(
        'Access denied',
      );
    });
  });

  describe('getEventRefunds', () => {
    it('should get all refunds for an event', async () => {
      if (!dbConnected) return;

      await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'Test refund',
          refundType: 'full',
        },
        adminId,
      );

      const refunds = await RefundService.getEventRefunds(eventId);

      expect(refunds.length).toBe(1);
      expect(refunds[0].eventId).toBe(eventId);
    });

    it('should filter by status', async () => {
      if (!dbConnected) return;

      await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'Test refund',
          refundType: 'full',
        },
        adminId,
      );

      const pendingRefunds = await RefundService.getEventRefunds(eventId, {
        status: 'pending',
      });

      expect(pendingRefunds.length).toBe(1);
      expect(pendingRefunds[0].status).toBe('pending');
    });
  });

  describe('getEventRefundSummary', () => {
    it('should calculate refund summary for an event', async () => {
      if (!dbConnected) return;

      const refund = await RefundService.createRefund(
        {
          transactionId: paymentTransactionId,
          refundReason: 'Test refund',
          refundType: 'full',
        },
        adminId,
      );

      // Complete the refund
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const summary = await RefundService.getEventRefundSummary(eventId);

      expect(summary.totalRefunded).toBe(10000);
      expect(summary.totalCount).toBe(1);
      expect(summary.completedCount).toBe(1);
      expect(summary.fullRefunds).toBe(1);
    });
  });

  // Note: processRefund and completeRefund tests would require mocking Paystack API
  // which is more complex. These are integration tests that would be better suited
  // for a separate integration test suite with actual Paystack test credentials.
});

