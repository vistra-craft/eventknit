import { DisbursementService } from '../src/services/disbursement.service';
import { PlatformFeeService } from '../src/services/platform-fee.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { cleanupTestData } from './test-helpers';

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
      await cleanupTestData(tx);
    });

    // Create test organizer with identity verification and KYC approval (required for payouts)
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
        isIdentityVerified: true, // Required for payouts (Eventbrite approach)
        identityVerifiedAt: new Date(),
        verificationLevel: 3,
        kycStatus: 'APPROVED', // Required for payouts
        kycSubmittedAt: new Date(),
        kycApprovedAt: new Date(),
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
        role: UserRole.ADMIN,
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
        gatewayReference: 'gw-001',
        gatewayAmount: 10000,
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

  describe('Eventbrite Approach: Verification Required for Payouts', () => {
    it('should fail to create disbursement without identity verification', async () => {
      if (!dbConnected) return;

      // Create organizer without identity verification
      const unverifiedOrganizer = await prisma.user.create({
        data: {
          email: 'unverified@test.com',
          password: await hashPassword('password123'),
          firstName: 'Unverified',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: false, // Not verified
          verificationLevel: 1,
        },
      });

      // Create event for unverified organizer
      const unverifiedEvent = await prisma.event.create({
        data: {
          title: 'Unverified Event',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: unverifiedOrganizer.id,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });

      // Create platform fee for unverified organizer
      const unverifiedRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: unverifiedEvent.id,
          attendeeId: unverifiedOrganizer.id,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          totalAmount: 10000,
        },
      });

      const unverifiedPayment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-2024-000002',
          gatewayReference: 'gw-002',
          gatewayAmount: 20000,
          paystackReference: 'test_ref_002',
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId: unverifiedEvent.id,
          registrationId: unverifiedRegistration.id,
          attendeeEmail: 'unverified@test.com',
          attendeeName: 'Unverified Organizer',
        },
      });

      const _unverifiedFee = await PlatformFeeService.createPlatformFee(unverifiedPayment.id);

      // Try to create disbursement - should fail without verification
      await expect(
        DisbursementService.createDisbursement(
          {
            eventId: unverifiedEvent.id,
            organizerId: unverifiedOrganizer.id,
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('Identity verification is required to receive payouts');
    });

    it('should fail to process disbursement without identity verification', async () => {
      if (!dbConnected) return;

      // Create organizer without identity verification
      const unverifiedOrganizer = await prisma.user.create({
        data: {
          email: 'unverified2@test.com',
          password: await hashPassword('password123'),
          firstName: 'Unverified',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: false,
          verificationLevel: 1,
        },
      });

      // Create event and fees (organizer can create events without verification)
      const unverifiedEvent = await prisma.event.create({
        data: {
          title: 'Unverified Event 2',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: unverifiedOrganizer.id,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });

      const unverifiedRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: unverifiedEvent.id,
          attendeeId: unverifiedOrganizer.id,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          totalAmount: 10000,
        },
      });

      const unverifiedPayment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-2024-000003',
          gatewayReference: 'gw-003',
          gatewayAmount: 30000,
          paystackReference: 'test_ref_003',
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId: unverifiedEvent.id,
          registrationId: unverifiedRegistration.id,
          attendeeEmail: 'unverified2@test.com',
          attendeeName: 'Unverified Organizer',
        },
      });

      await PlatformFeeService.createPlatformFee(unverifiedPayment.id);

      // Manually create a disbursement record (bypassing createDisbursement which checks verification)
      // This simulates a scenario where disbursement was created before verification check was added
      const disbursement = await prisma.organizerDisbursement.create({
        data: {
          disbursementNumber: 'DISB-2024-000001',
          organizerId: unverifiedOrganizer.id,
          eventId: unverifiedEvent.id,
          totalAmount: 9000,
          currency: 'NGN',
          paymentMethod: 'bank_transfer',
          status: 'pending',
          createdBy: adminId,
        },
      });

      // Try to process disbursement - should fail without verification
      await expect(
        DisbursementService.processDisbursement(
          disbursement.id,
          { paymentReference: 'PAY_REF_001' },
          adminId,
        ),
      ).rejects.toThrow('Identity verification is required to receive payouts');
    });

    it('should fail to create disbursement without KYC approval', async () => {
      if (!dbConnected) return;

      // Create organizer with identity verification but no KYC
      const noKycOrganizer = await prisma.user.create({
        data: {
          email: 'nokyc@test.com',
          password: await hashPassword('password123'),
          firstName: 'NoKyc',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: true,
          identityVerifiedAt: new Date(),
          verificationLevel: 2,
          kycStatus: null, // No KYC submitted
        },
      });

      // Create event for this organizer
      const noKycEvent = await prisma.event.create({
        data: {
          title: 'No KYC Event',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: noKycOrganizer.id,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });

      // Create platform fee for this organizer
      const noKycRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: noKycEvent.id,
          attendeeId: noKycOrganizer.id,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          totalAmount: 10000,
        },
      });

      const noKycPayment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-2024-000010',
          gatewayReference: 'gw-010',
          gatewayAmount: 10000,
          paystackReference: 'test_ref_010',
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId: noKycEvent.id,
          registrationId: noKycRegistration.id,
          attendeeEmail: 'nokyc@test.com',
          attendeeName: 'NoKyc Organizer',
        },
      });

      await PlatformFeeService.createPlatformFee(noKycPayment.id);

      await expect(
        DisbursementService.createDisbursement(
          {
            eventId: noKycEvent.id,
            organizerId: noKycOrganizer.id,
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('KYC verification must be approved before payouts can be processed');
    });

    it('should fail to create disbursement with pending KYC status', async () => {
      if (!dbConnected) return;

      // Create organizer with identity verification but pending KYC
      const pendingKycOrganizer = await prisma.user.create({
        data: {
          email: 'pendingkyc@test.com',
          password: await hashPassword('password123'),
          firstName: 'PendingKyc',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: true,
          identityVerifiedAt: new Date(),
          verificationLevel: 2,
          kycStatus: 'PENDING',
          kycSubmittedAt: new Date(),
        },
      });

      const pendingKycEvent = await prisma.event.create({
        data: {
          title: 'Pending KYC Event',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: pendingKycOrganizer.id,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });

      const pendingKycRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: pendingKycEvent.id,
          attendeeId: pendingKycOrganizer.id,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          totalAmount: 10000,
        },
      });

      const pendingKycPayment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-2024-000011',
          gatewayReference: 'gw-011',
          gatewayAmount: 10000,
          paystackReference: 'test_ref_011',
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId: pendingKycEvent.id,
          registrationId: pendingKycRegistration.id,
          attendeeEmail: 'pendingkyc@test.com',
          attendeeName: 'PendingKyc Organizer',
        },
      });

      await PlatformFeeService.createPlatformFee(pendingKycPayment.id);

      await expect(
        DisbursementService.createDisbursement(
          {
            eventId: pendingKycEvent.id,
            organizerId: pendingKycOrganizer.id,
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('KYC verification must be approved before payouts can be processed');
    });

    it('should fail to process disbursement without KYC approval', async () => {
      if (!dbConnected) return;

      // Create organizer with identity but no KYC
      const noKycOrganizer2 = await prisma.user.create({
        data: {
          email: 'nokyc2@test.com',
          password: await hashPassword('password123'),
          firstName: 'NoKyc2',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: true,
          identityVerifiedAt: new Date(),
          verificationLevel: 2,
          kycStatus: 'REJECTED',
        },
      });

      const noKycEvent2 = await prisma.event.create({
        data: {
          title: 'No KYC Event 2',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: noKycOrganizer2.id,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });

      // Manually create a disbursement record (bypassing createDisbursement)
      const disbursement = await prisma.organizerDisbursement.create({
        data: {
          disbursementNumber: 'DISB-2024-000010',
          organizerId: noKycOrganizer2.id,
          eventId: noKycEvent2.id,
          totalAmount: 9000,
          currency: 'NGN',
          paymentMethod: 'bank_transfer',
          status: 'pending',
          createdBy: adminId,
        },
      });

      await expect(
        DisbursementService.processDisbursement(
          disbursement.id,
          { paymentReference: 'PAY_REF_KYC' },
          adminId,
        ),
      ).rejects.toThrow('KYC verification must be approved before payouts can be processed');
    });

    it('should successfully create disbursement with identity verification and KYC approval', async () => {
      if (!dbConnected) return;

      // Use the verified organizer from beforeEach (has kycStatus: APPROVED)
      const disbursement = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      expect(disbursement.id).toBeDefined();
      expect(disbursement.status).toBe('pending');
    });

    it('should successfully create automated disbursement with createdBy null', async () => {
      if (!dbConnected) return;

      // Automated payouts pass null for createdBy
      const disbursement = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId,
          paymentMethod: 'bank_transfer',
          notes: 'Automatic post-event payout. Grace period: 5 business days.',
        },
        null, // Automated payout — no admin user
      );

      expect(disbursement.id).toBeDefined();
      expect(disbursement.status).toBe('pending');

      // Verify the disbursement has no createdBy
      const fetched = await DisbursementService.getDisbursement(disbursement.id);
      expect(fetched.creator).toBeNull();
    });

    it('should successfully process disbursement with identity verification and KYC approval', async () => {
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
        { paymentReference: 'PAY_REF_001' },
        adminId,
      );

      expect(processed.status).toBe('processing');
      expect(processed.paymentReference).toBe('PAY_REF_001');
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

