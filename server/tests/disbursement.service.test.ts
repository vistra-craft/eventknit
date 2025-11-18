import { DisbursementService } from '../src/services/disbursement.service';
import { PlatformFeeService } from '../src/services/platform-fee.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('DisbursementService', () => {
  let dbConnected = false;
  let organizerId: string;
  let adminId: string;
  let eventId: string;
  let registrationId: string;
  let paymentTransactionId: string;
  let platformFeeId: string;

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
        attendeeId: organizerId, // Use organizer as attendee for simplicity
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
        attendeeEmail: 'organizer@test.com',
        attendeeName: 'Organizer Test',
      },
    });
    paymentTransactionId = paymentTransaction.id;

    // Create platform fee
    const platformFee = await PlatformFeeService.createPlatformFee(paymentTransactionId);
    platformFeeId = platformFee.id;
  });

  describe('createDisbursement', () => {
    it('should create disbursement with all pending fees', async () => {
      if (!dbConnected) return;

      const disbursement = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
          bankAccount: '1234567890',
          bankName: 'Test Bank',
          accountName: 'Organizer Test',
          accountNumber: '1234567890',
        },
        adminId,
      );

      expect(disbursement.id).toBeDefined();
      expect(disbursement.disbursementNumber).toMatch(/^DISB-\d{4}-\d{6}$/);
      expect(Number(disbursement.totalAmount)).toBe(9000); // Organizer amount from platform fee
      expect(disbursement.status).toBe('pending');
      expect(disbursement.platformFees.length).toBe(1);

      // Verify platform fee is linked
      const fee = await prisma.platformFee.findUnique({
        where: { id: platformFeeId },
      });
      expect(fee?.disbursementId).toBe(disbursement.id);
      expect(fee?.status).toBe('disbursed');
    });

    it('should create disbursement with specific fees', async () => {
      if (!dbConnected) return;

      const disbursement = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          platformFeeIds: [platformFeeId],
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      expect(disbursement.id).toBeDefined();
      expect(disbursement.platformFees.length).toBe(1);
    });

    it('should throw error if no pending fees', async () => {
      if (!dbConnected) return;

      // Create and use all fees
      await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      // Try to create another with no fees
      await expect(
        DisbursementService.createDisbursement(
          {
            eventId,
            organizerId,
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('No pending platform fees to disburse');
    });

    it('should throw error if event does not belong to organizer', async () => {
      if (!dbConnected) return;

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

      await expect(
        DisbursementService.createDisbursement(
          {
            eventId,
            organizerId: otherOrganizer.id, // Wrong organizer
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('Event does not belong to this organizer');
    });
  });

  describe('getDisbursement', () => {
    it('should get disbursement by ID', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      const disbursement = await DisbursementService.getDisbursement(created.id);

      expect(disbursement.id).toBe(created.id);
      expect(disbursement.event).toBeDefined();
      expect(disbursement.organizer).toBeDefined();
      expect(disbursement.platformFees.length).toBe(1);
    });

    it('should enforce authorization for organizers', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
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

      await expect(
        DisbursementService.getDisbursement(created.id, otherOrganizer.id),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('processDisbursement', () => {
    it('should process a pending disbursement', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      const processed = await DisbursementService.processDisbursement(
        created.id,
        {
          paymentReference: 'PAY_REF_001',
        },
        adminId,
      );

      expect(processed.status).toBe('processing');
      expect(processed.processedAt).toBeDefined();
      expect(processed.paymentReference).toBe('PAY_REF_001');
    });

    it('should throw error if disbursement not in pending status', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      // Process it
      await DisbursementService.processDisbursement(created.id, {}, adminId);

      // Try to process again
      await expect(
        DisbursementService.processDisbursement(created.id, {}, adminId),
      ).rejects.toThrow('Cannot process disbursement with status: processing');
    });
  });

  describe('completeDisbursement', () => {
    it('should complete a processing disbursement', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      await DisbursementService.processDisbursement(created.id, {}, adminId);

      const completed = await DisbursementService.completeDisbursement(
        created.id,
        'PAY_REF_001',
        adminId,
      );

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
      expect(completed.paymentReference).toBe('PAY_REF_001');
    });
  });

  describe('getOrganizerDisbursementSummary', () => {
    it('should calculate disbursement summary', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      await DisbursementService.processDisbursement(created.id, {}, adminId);
      await DisbursementService.completeDisbursement(created.id, 'PAY_REF_001', adminId);

      const summary = await DisbursementService.getOrganizerDisbursementSummary(organizerId);

      expect(summary.totalDisbursed).toBe(9000);
      expect(summary.totalPending).toBe(0);
      expect(summary.completedCount).toBe(1);
      expect(summary.pendingCount).toBe(0);
    });
  });
});

