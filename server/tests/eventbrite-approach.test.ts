import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { DisbursementService } from '../src/services/disbursement.service';
import { PlatformFeeService } from '../src/services/platform-fee.service';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Tests for Eventbrite-style approach:
 * - No verification required to CREATE events
 * - Verification required to RECEIVE payouts
 * - No monthly limits on event creation
 */
describe('Eventbrite Approach: Event Creation and Payout Verification', () => {
  let dbConnected = false;
  let unverifiedOrganizerId: string;
  let unverifiedOrganizerToken: string;
  let verifiedOrganizerId: string;
  let verifiedOrganizerToken: string;
  let adminId: string;
  let _adminToken: string;

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

    const hashedPassword = await hashPassword('Test123!@$');

    // Create UNVERIFIED organizer (can create events but not receive payouts)
    const unverifiedOrganizer = await prisma.user.create({
      data: {
        email: 'unverified@test.com',
        password: hashedPassword,
        firstName: 'Unverified',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isIdentityVerified: false, // Not verified
        verificationLevel: 1,
      },
    });
    unverifiedOrganizerId = unverifiedOrganizer.id;
    unverifiedOrganizerToken = generateAccessToken({
      userId: unverifiedOrganizer.id,
      email: unverifiedOrganizer.email,
      role: unverifiedOrganizer.role,
    });

    // Create VERIFIED organizer (can create events AND receive payouts)
    const verifiedOrganizer = await prisma.user.create({
      data: {
        email: 'verified@test.com',
        password: hashedPassword,
        firstName: 'Verified',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isIdentityVerified: true, // Verified
        identityVerifiedAt: new Date(),
        verificationLevel: 2,
        kycStatus: 'APPROVED',
      },
    });
    verifiedOrganizerId = verifiedOrganizer.id;
    verifiedOrganizerToken = generateAccessToken({
      userId: verifiedOrganizer.id,
      email: verifiedOrganizer.email,
      role: verifiedOrganizer.role,
    });

    // Create admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    _adminToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });
  });

  describe('Event Creation (No Verification Required)', () => {
    it('should allow unverified organizer to create free events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Free Event by Unverified Organizer',
        description: 'Test free event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: true,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedOrganizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.isFree).toBe(true);
    });

    it('should allow unverified organizer to create paid events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Paid Event by Unverified Organizer',
        description: 'Test paid event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 50.00,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedOrganizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.isFree).toBe(false);
      expect(Number(response.body.data.event.price)).toBe(50.00);
    });

    it('should allow unverified organizer to create high-value paid events (no monthly limit)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create multiple high-value events that would exceed old $2,000 limit
      const eventData1 = {
        title: 'High Value Event 1',
        description: 'Test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 1000.00,
        capacity: 10, // Total potential: $10,000
      };

      const eventData2 = {
        title: 'High Value Event 2',
        description: 'Test event',
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 1500.00,
        capacity: 10, // Total potential: $15,000
      };

      const eventData3 = {
        title: 'High Value Event 3',
        description: 'Test event',
        startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 2000.00,
        capacity: 10, // Total potential: $20,000
      };

      // All should succeed - no monthly limit
      const response1 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedOrganizerToken}`)
        .send(eventData1)
        .expect(201);

      const response2 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedOrganizerToken}`)
        .send(eventData2)
        .expect(201);

      const response3 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedOrganizerToken}`)
        .send(eventData3)
        .expect(201);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response3.body.success).toBe(true);
    });

    it('should allow verified organizer to create paid events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Paid Event by Verified Organizer',
        description: 'Test paid event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 75.00,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${verifiedOrganizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
    });
  });

  describe('Payout Verification (Verification Required)', () => {
    let verifiedEventId: string;
    let unverifiedEventId: string;
    let _verifiedPlatformFeeId: string;
    let unverifiedPlatformFeeId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Create events for both organizers
      const verifiedEvent = await prisma.event.create({
        data: {
          title: 'Verified Event',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: verifiedOrganizerId,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });
      verifiedEventId = verifiedEvent.id;

      const unverifiedEvent = await prisma.event.create({
        data: {
          title: 'Unverified Event',
          description: 'Test event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          organizerId: unverifiedOrganizerId,
          status: EventStatus.APPROVED,
          isFree: false,
          price: 100,
        },
      });
      unverifiedEventId = unverifiedEvent.id;

      // Create registrations and payments
      const verifiedRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: verifiedEventId,
          attendeeId: verifiedOrganizerId,
          quantity: 1,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          totalAmount: 10000,
        },
      });

      const unverifiedRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: unverifiedEventId,
          attendeeId: unverifiedOrganizerId,
          quantity: 1,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          totalAmount: 10000,
        },
      });

      const verifiedPayment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-VERIFIED-001',
          gatewayReference: 'gw-ver-001',
          gatewayAmount: 10000,
          paystackReference: 'ref_verified_001',
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId: verifiedEventId,
          registrationId: verifiedRegistration.id,
          attendeeEmail: 'verified@test.com',
          attendeeName: 'Verified Organizer',
        },
      });

      const unverifiedPayment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-UNVERIFIED-001',
          gatewayReference: 'gw-unver-001',
          gatewayAmount: 10000,
          paystackReference: 'ref_unverified_001',
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId: unverifiedEventId,
          registrationId: unverifiedRegistration.id,
          attendeeEmail: 'unverified@test.com',
          attendeeName: 'Unverified Organizer',
        },
      });

      // Create platform fees
      const verifiedFee = await PlatformFeeService.createPlatformFee(verifiedPayment.id);
      _verifiedPlatformFeeId = verifiedFee.id;

      const _unverifiedFee = await PlatformFeeService.createPlatformFee(unverifiedPayment.id);
      unverifiedPlatformFeeId = _unverifiedFee.id;
    });

    it('should allow verified organizer to create disbursement', async () => {
      if (!dbConnected) return;

      const disbursement = await DisbursementService.createDisbursement(
        {
          eventId: verifiedEventId,
          organizerId: verifiedOrganizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      expect(disbursement.id).toBeDefined();
      expect(disbursement.status).toBe('pending');
      expect(disbursement.platformFees.length).toBe(1);
    });

    it('should reject disbursement creation for unverified organizer', async () => {
      if (!dbConnected) return;

      await expect(
        DisbursementService.createDisbursement(
          {
            eventId: unverifiedEventId,
            organizerId: unverifiedOrganizerId,
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('Identity verification is required to receive payouts');
    });

    it('should allow verified organizer to process disbursement', async () => {
      if (!dbConnected) return;

      const created = await DisbursementService.createDisbursement(
        {
          eventId: verifiedEventId,
          organizerId: verifiedOrganizerId,
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

    it('should reject disbursement processing for unverified organizer', async () => {
      if (!dbConnected) return;

      // Manually create disbursement record (bypassing createDisbursement check)
      // This simulates a disbursement created before verification check was added
      const disbursement = await prisma.organizerDisbursement.create({
        data: {
          disbursementNumber: 'DISB-UNVERIFIED-001',
          organizerId: unverifiedOrganizerId,
          eventId: unverifiedEventId,
          totalAmount: 9000,
          currency: 'NGN',
          paymentMethod: 'bank_transfer',
          status: 'pending',
          createdBy: adminId,
        },
      });

      // Link platform fee
      await prisma.platformFee.update({
        where: { id: unverifiedPlatformFeeId },
        data: {
          disbursementId: disbursement.id,
          status: 'disbursed',
        },
      });

      // Try to process - should fail
      await expect(
        DisbursementService.processDisbursement(
          disbursement.id,
          { paymentReference: 'PAY_REF_001' },
          adminId,
        ),
      ).rejects.toThrow('Identity verification is required to receive payouts');
    });
  });

  describe('Verification Flow Integration', () => {
    it('should allow organizer to create events before verification, then require verification for payouts', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Step 1: Create event without verification (should succeed)
      const eventData = {
        title: 'Event Before Verification',
        description: 'Test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 50.00,
      };

      const createResponse = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedOrganizerToken}`)
        .send(eventData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const eventId = createResponse.body.data.event.id;

      // Step 2: Create registration and payment (simulating ticket sales)
      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: unverifiedOrganizerId,
          quantity: 1,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          totalAmount: 5000,
        },
      });

      const payment = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: 'EPT-INTEGRATION-001',
          gatewayReference: 'gw-int-001',
          gatewayAmount: 5000,
          paystackReference: 'ref_integration_001',
          paystackAmount: 500000,
          currency: 'NGN',
          amount: 5000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId,
          registrationId: registration.id,
          attendeeEmail: 'unverified@test.com',
          attendeeName: 'Unverified Organizer',
        },
      });

      const _platformFee = await PlatformFeeService.createPlatformFee(payment.id);

      // Step 3: Try to create disbursement (should fail - no verification)
      await expect(
        DisbursementService.createDisbursement(
          {
            eventId,
            organizerId: unverifiedOrganizerId,
            paymentMethod: 'bank_transfer',
          },
          adminId,
        ),
      ).rejects.toThrow('Identity verification is required to receive payouts');

      // Step 4: Verify organizer
      await prisma.user.update({
        where: { id: unverifiedOrganizerId },
        data: {
          isIdentityVerified: true,
          identityVerifiedAt: new Date(),
          verificationLevel: 2,
          kycStatus: 'APPROVED',
        },
      });

      // Step 5: Now should be able to create disbursement
      const disbursement = await DisbursementService.createDisbursement(
        {
          eventId,
          organizerId: unverifiedOrganizerId,
          paymentMethod: 'bank_transfer',
        },
        adminId,
      );

      expect(disbursement.id).toBeDefined();
      expect(disbursement.status).toBe('pending');
    });
  });
});
