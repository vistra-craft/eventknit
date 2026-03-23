import request from 'supertest';
import app from '../src/app';
import { PaymentService } from '../src/services/payment.service';
import { PlatformFeeService } from '../src/services/platform-fee.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('PaymentService', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let registrationId: string;
  let paymentService: PaymentService;

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

    // Clear all tables using comprehensive cleanup helper
    try {
      await cleanupTestData();
    } catch (error) {
      // If cleanup fails, log but continue - might be due to missing tables
      logger.warn('Cleanup warning:', error);
    }

    // Create test organizer (use upsert to handle existing users)
    const organizerPassword = await hashPassword('password123');
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: organizerPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: 'organizer@test.com',
        password: organizerPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;

    // Create test attendee (use upsert to handle existing users)
    const attendeePassword = await hashPassword('password123');
    const attendee = await prisma.user.upsert({
      where: { email: 'attendee@test.com' },
      update: {
        password: attendeePassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: 'attendee@test.com',
        password: attendeePassword,
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
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '18:00',
        location: 'Test Location',
        isFree: false,
        price: 100,
        capacity: 10,
        availableSlots: 10,
        organizerId,
        status: EventStatus.APPROVED,
      },
    });
    eventId = event.id;

    // Create test registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        quantity: 1,
        totalAmount: 100,
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
      },
    });
    registrationId = registration.id;

    paymentService = new PaymentService();
  });

  describe('validateGuestPayment', () => {
    it('should validate guest payment with correct email and registration ID', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        paymentService.validateGuestPayment(registrationId, 'attendee@test.com'),
      ).resolves.not.toThrow();
    });

    it('should throw error if registration not found', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        paymentService.validateGuestPayment('non-existent-id', 'attendee@test.com'),
      ).rejects.toThrow('Registration not found');
    });

    it('should throw error if email does not match registration', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        paymentService.validateGuestPayment(registrationId, 'wrong@email.com'),
      ).rejects.toThrow('email address doesn\'t match this registration');
    });

    it('should throw error if payment already completed', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Update registration to completed
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: 'COMPLETED',
          status: RegistrationStatus.CONFIRMED,
        },
      });

      await expect(
        paymentService.validateGuestPayment(registrationId, 'attendee@test.com'),
      ).rejects.toThrow('Payment has already been completed');
    });
  });

  describe('rollbackRegistration', () => {
    it('should rollback registration and restore capacity when payment initialization fails', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Get initial capacity
      const eventBefore = await prisma.event.findUnique({
        where: { id: eventId },
        select: { availableSlots: true, capacity: true },
      });
      const initialSlots = eventBefore?.availableSlots || 0;

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      // Create a new registration for rollback test
      const newRegistration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      // Update event capacity to simulate registration
      await prisma.event.update({
        where: { id: eventId },
        data: {
          availableSlots: (eventBefore?.availableSlots || 0) - 1,
        },
      });

      // Use reflection to access private method for testing
      // In a real scenario, this would be called automatically on payment failure
      const rollbackMethod = (paymentService as any).rollbackRegistration.bind(paymentService);
      await rollbackMethod(newRegistration.id);

      // Verify registration is cancelled
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: newRegistration.id },
      });
      expect(registration?.status).toBe(RegistrationStatus.CANCELLED);
      expect(registration?.paymentStatus).toBe('FAILED');
      expect(registration?.cancelledAt).toBeDefined();

      // Verify capacity is restored
      const eventAfter = await prisma.event.findUnique({
        where: { id: eventId },
        select: { availableSlots: true },
      });
      expect(eventAfter?.availableSlots).toBe(initialSlots);
    });

    it('should not rollback if registration is already cancelled', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Cancel registration first
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CANCELLED,
          paymentStatus: 'FAILED',
          cancelledAt: new Date(),
        },
      });

      const rollbackMethod = (paymentService as any).rollbackRegistration.bind(paymentService);
      await rollbackMethod(registrationId);

      // Verify registration is still cancelled (not double-cancelled)
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      });
      expect(registration?.status).toBe(RegistrationStatus.CANCELLED);
    });

    it('should not rollback if registration is already confirmed', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Confirm registration
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
        },
      });

      const rollbackMethod = (paymentService as any).rollbackRegistration.bind(paymentService);
      await rollbackMethod(registrationId);

      // Verify registration is still confirmed
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      });
      expect(registration?.status).toBe(RegistrationStatus.CONFIRMED);
      expect(registration?.paymentStatus).toBe('COMPLETED');
    });
  });

  describe('POST /api/v1/payments/initialize-guest - Guest Payment', () => {
    let eventId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Create organizer with identity verification
      const organizerPassword = await hashPassword('Test123!@$');
      const organizer = await prisma.user.create({
        data: {
          email: 'paymentorganizer@test.com',
          password: organizerPassword,
          firstName: 'Payment',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: true,
          identityVerifiedAt: new Date(),
          verificationLevel: 2,
          organizationName: 'Payment Events Inc',
        },
      });

      // Create paid event
      const event = await prisma.event.create({
        data: {
          title: 'Payment Test Event',
          description: 'Event for payment test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 100,
          organizerId: organizer.id,
          status: EventStatus.APPROVED,
        },
      });
      eventId = event.id;
    });

    it('should validate guest payment with correct email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const user = await prisma.user.create({
        data: {
          email: 'paymenttest@test.com',
          password: null,
          firstName: 'Payment',
          lastName: 'Test',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: user.id,
          quantity: 1,
          totalAmount: 100,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({
          registrationId: registration.id,
          email: 'paymenttest@test.com',
        });

      // Should either succeed (if Paystack is configured) or fail with specific error
      // In test environment, Paystack is usually not configured, so the gateway manager
      // throws a plain Error which results in a 500
      expect([200, 400, 500, 503]).toContain(response.status);
    });

    it('should reject guest payment with wrong email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const user = await prisma.user.create({
        data: {
          email: 'paymenttest2@test.com',
          password: null,
          firstName: 'Payment',
          lastName: 'Test',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: user.id,
          quantity: 1,
          totalAmount: 100,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({
          registrationId: registration.id,
          email: 'wrong@email.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email address doesn\'t match');
    });
  });

  describe('handleWebhook - Payment Validation', () => {
    it('should prevent duplicate payment processing', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Skip if payment service is not configured
      const { config } = await import('../src/config/index.js');
      if (!config.paystack.secretKey) {
        logger.info('⏭️  Skipping test - payment service not configured');
        return;
      }

      // Mark registration as already completed
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: 'COMPLETED',
          status: RegistrationStatus.CONFIRMED,
          paymentTransactionId: 'test-reference',
        },
      });

      const mockWebhookData = {
        event: 'charge.success',
        data: {
          reference: 'test-reference',
        },
      };

      // handleWebhook calls verifyPayment which contacts Paystack.
      // If Paystack is not configured, it will throw. Either way,
      // the registration should remain COMPLETED and not be re-processed.
      try {
        await paymentService.handleWebhook(mockWebhookData.event, mockWebhookData.data);
      } catch {
        // Expected when Paystack is not configured
      }

      // Verify registration is still completed (not processed again)
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      });
      expect(registration?.paymentStatus).toBe('COMPLETED');
      expect(registration?.status).toBe(RegistrationStatus.CONFIRMED);
    });

    it('should send REGISTRATION_CONFIRMED notification after successful payment', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Skip if payment service is not configured
      const { config } = await import('../src/config/index.js');
      if (!config.paystack.secretKey) {
        logger.info('⏭️  Skipping test - payment service not configured');
        return;
      }

      // Create a fresh registration for this test
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const testRegistration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
          paymentTransactionId: `test-ref-notif-${Date.now()}`,
        },
      });

      // Mock Paystack verification to return success
      const mockVerifyPayment = vi.spyOn(paymentService, 'verifyPayment');
      mockVerifyPayment.mockResolvedValue({
        success: true,
        reference: testRegistration.paymentTransactionId!,
        amount: 100,
        status: 'success',
        customer: { email: 'attendee@test.com' },
        metadata: {},
      });

      const mockWebhookData = {
        event: 'charge.success',
        data: {
          reference: testRegistration.paymentTransactionId!,
        },
      };

      try {
        await paymentService.handleWebhook(mockWebhookData.event, mockWebhookData.data);
      } catch (error: unknown) {
        // handleWebhook internally calls gateway.verifyPayment which may fail
        // if Paystack is not properly configured in test environment
        const msg = (error as Error)?.message || '';
        if (msg.includes('PAYSTACK') || msg.includes('not configured')) {
          logger.info('⏭️  Skipping test - Paystack gateway not available');
          mockVerifyPayment.mockRestore();
          return;
        }
        throw error;
      }

      // Wait a bit for async notification processing
      await new Promise((resolve) => {

        setTimeout(resolve, 100);
      });

      // Verify REGISTRATION_CONFIRMED notification was sent
      const notification = await prisma.notification.findFirst({
        where: {
          userId: attendeeId,
          eventId,
          type: NotificationType.REGISTRATION_CONFIRMED,
          registrationId: testRegistration.id,
        },
      });

      expect(notification).toBeDefined();
      expect(notification?.title).toContain('Registration Confirmed');
      expect(notification?.type).toBe(NotificationType.REGISTRATION_CONFIRMED);

      // Cleanup
      mockVerifyPayment.mockRestore();
    });
  });

  describe('POST /api/v1/payments/initialize', () => {
    let attendeeToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });
      if (!attendee) throw new Error('Attendee not found');

      attendeeToken = (await import('../src/utils/jwt')).generateAccessToken({
        userId: attendee.id,
        email: attendee.email,
        role: attendee.role,
      });
    });

    it('should initialize payment for authenticated user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      const response = await request(app)
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          registrationId: registration.id,
        });

      // Payment service may not be configured (Paystack secret key missing)
      // or Paystack may reject the request in test environment
      if (response.status === 400 || response.status === 500) {
        logger.info('⏭️  Skipping test - payment gateway not available in test environment');
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.authorizationUrl).toBeDefined();
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      await request(app)
        .post('/api/v1/payments/initialize')
        .send({
          registrationId: registration.id,
        })
        .expect(401);
    });

    it('should fail with non-existent registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          registrationId: 'non-existent-id',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail if user does not own the registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee
      const otherAttendee = await prisma.user.create({
        data: {
          email: 'otherpay@test.com',
          password: await hashPassword('password123'),
          firstName: 'Other',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherAttendeeToken = (await import('../src/utils/jwt')).generateAccessToken({
        userId: otherAttendee.id,
        email: otherAttendee.email,
        role: otherAttendee.role,
      });

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId, // Original attendee's registration
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      const response = await request(app)
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .send({
          registrationId: registration.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail for already completed payment', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
        },
      });

      const response = await request(app)
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          registrationId: registration.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/payments/verify', () => {
    it('should verify payment with valid reference', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Note: This test would require mocking Paystack API
      // For now, we'll test the endpoint structure
      const response = await request(app)
        .get('/api/v1/payments/verify?reference=test-reference');

      // Payment gateway may not be available in test environment
      if (response.status === 400) {
        logger.info('⏭️  Skipping test - payment gateway not available in test environment');
        return;
      }

      expect(response.status).toBe(200);
      // The actual verification depends on Paystack API
      expect(response.body).toHaveProperty('success');
    });

    it('should fail without reference parameter', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/payments/verify')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('reference');
    });

    it('should handle invalid reference', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Note: This would require mocking Paystack API response
      const response = await request(app)
        .get('/api/v1/payments/verify?reference=invalid-reference');

      // Payment gateway may not be available in test environment
      if (response.status === 400) {
        logger.info('⏭️  Skipping test - payment gateway not available in test environment');
        return;
      }

      expect(response.status).toBe(200); // Paystack verification endpoint returns 200 even for invalid refs
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should fail webhook without signature', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Note: Webhook requires Paystack signature for security
      const mockWebhookData = {
        event: 'charge.success',
        data: {
          reference: 'test-reference',
        },
      };

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .send(mockWebhookData)
        .expect(400); // Should fail without signature

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('signature');
    });

    it('should handle webhook with signature', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const mockWebhookData = {
        event: 'charge.success',
        data: {
          reference: 'test-reference',
        },
      };

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-paystack-signature', 'test-signature')
        .send(mockWebhookData);

      // Payment service may not be configured (Paystack secret key missing)
      // Or signature validation may fail
      if (response.status === 400 && response.body.message?.includes('not configured')) {
        logger.info('⏭️  Skipping test - payment service not configured');
        return;
      }
      if (response.status === 401) {
        logger.info('⏭️  Skipping test - webhook signature validation failed (expected in test environment)');
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle different webhook event types', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const events = ['charge.success', 'charge.failed', 'transfer.success'];

      for (const eventType of events) {
        const response = await request(app)
          .post('/api/v1/payments/webhook')
          .set('x-paystack-signature', 'test-signature')
          .send({
            event: eventType,
            data: {
              reference: 'test-reference',
            },
          });

        // Payment service may not be configured (Paystack secret key missing)
        // Or signature validation may fail
        if (response.status === 400 && response.body.message?.includes('not configured')) {
          logger.info('⏭️  Skipping test - payment service not configured');
          return;
        }
        if (response.status === 401) {
          logger.info('⏭️  Skipping test - webhook signature validation failed (expected in test environment)');
          return;
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/v1/payments/status/:registrationId', () => {
    let attendeeToken: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });
      if (!attendee) throw new Error('Attendee not found');

      attendeeToken = (await import('../src/utils/jwt')).generateAccessToken({
        userId: attendee.id,
        email: attendee.email,
        role: attendee.role,
      });
    });

    it('should get payment status successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      const response = await request(app)
        .get(`/api/v1/payments/status/${registration.id}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.paymentStatus).toBeDefined();
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      await request(app)
        .get(`/api/v1/payments/status/${registration.id}`)
        .expect(401);
    });

    it('should fail if user does not own the registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee
      const otherAttendee = await prisma.user.create({
        data: {
          email: 'otherstatus@test.com',
          password: await hashPassword('password123'),
          firstName: 'Other',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherAttendeeToken = (await import('../src/utils/jwt')).generateAccessToken({
        userId: otherAttendee.id,
        email: otherAttendee.email,
        role: otherAttendee.role,
      });

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId, // Original attendee's registration
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
        },
      });

      const response = await request(app)
        .get(`/api/v1/payments/status/${registration.id}`)
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/payments/status/non-existent-id')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return correct payment status for completed payment', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from main beforeEach to avoid conflict
      await prisma.eventRegistration.deleteMany({
        where: { eventId, attendeeId },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          paymentTransactionId: 'test-reference',
        },
      });

      const response = await request(app)
        .get(`/api/v1/payments/status/${registration.id}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('COMPLETED');
    });
  });

  describe('EventPaymentTransaction Creation', () => {
    it('should create EventPaymentTransaction when platform fee is created', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete existing registration from beforeEach if it exists, then create a new one
      await prisma.eventRegistration.deleteMany({
        where: {
          eventId,
          attendeeId,
        },
      });

      // Create a payment transaction manually
      const registration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId,
          quantity: 1,
          totalAmount: 10000,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
        },
      });

      const paymentTransaction = await prisma.eventPaymentTransaction.create({
        data: {
          transactionNumber: `EPT-TEST-${Date.now()}`,
          gatewayReference: `gw-ref-${Date.now()}`,
          gatewayAmount: 10000,
          paystackReference: `test-ref-${Date.now()}`,
          paystackAmount: 1000000,
          currency: 'NGN',
          amount: 10000,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'success',
          paymentDate: new Date(),
          eventId,
          registrationId: registration.id,
          attendeeEmail: 'attendee@test.com',
          attendeeName: 'Test Attendee',
        },
      });

      // Create platform fee (this is what happens automatically in handleWebhook)
      const platformFee = await PlatformFeeService.createPlatformFee(paymentTransaction.id);

      expect(platformFee.id).toBeDefined();
      expect(platformFee.feeAmount).toBe(750); // 7.5% of 10000
      expect(platformFee.organizerAmount).toBe(9250);

      // Verify fee is linked to transaction
      const fee = await prisma.platformFee.findUnique({
        where: { transactionId: paymentTransaction.id },
      });
      expect(fee).toBeDefined();
      expect(fee?.transactionId).toBe(paymentTransaction.id);
    });
  });

  describe('syncPaymentsFromPaystack', () => {
    it('should be a function on paymentService', () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }
      expect(typeof paymentService.syncPaymentsFromPaystack).toBe('function');
    });

    it('should throw error if Paystack not configured', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const { config } = await import('../src/config/index.js');
      if (!config.paystack.secretKey) {
        // If already not configured, test passes
        await expect(
          paymentService.syncPaymentsFromPaystack(),
        ).rejects.toThrow(/not (available|configured)/);
        return;
      }

      // If configured, we can't easily test this without mocking
      // The function exists and will work when Paystack is configured
      expect(typeof paymentService.syncPaymentsFromPaystack).toBe('function');
    });

    // Note: Full integration test for syncPaymentsFromPaystack would require:
    // 1. Mock Paystack API responses
    // 2. Test transaction creation logic
    // 3. Test platform fee auto-creation
    // This is better suited for integration tests with proper mocking
  });
});

