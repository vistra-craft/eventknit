import { ReconciliationService } from '../src/services/reconciliation.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('ReconciliationService', () => {
  let dbConnected = false;
  let organizerId: string;
  let adminId: string;
  let eventId: string;
  let registrationId: string;
  let _paymentTransactionId: string;

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
      await tx.paymentReconciliation.deleteMany();
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
        attendeeId: organizerId,
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
    _paymentTransactionId = paymentTransaction.id;
  });

  describe('getReconciliation', () => {
    it('should get reconciliation by ID', async () => {
      if (!dbConnected) return;

      // Create a reconciliation record manually for testing
      const reconciliation = await prisma.paymentReconciliation.create({
        data: {
          reconciliationNumber: 'REC-2024-000001',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          totalPaystackTransactions: 1,
          totalSystemTransactions: 1,
          matchedTransactions: 1,
          unmatchedTransactions: 0,
          totalPaystackAmount: 10000,
          totalSystemAmount: 10000,
          discrepancyAmount: 0,
          status: 'completed',
          reconciledBy: adminId,
        },
      });

      const result = await ReconciliationService.getReconciliation(reconciliation.id);

      expect(result.id).toBe(reconciliation.id);
      expect(result.reconciliationNumber).toBe('REC-2024-000001');
      expect(result.reconciler).toBeDefined();
    });

    it('should throw error if reconciliation not found', async () => {
      if (!dbConnected) return;

      await expect(
        ReconciliationService.getReconciliation('non-existent-id'),
      ).rejects.toThrow('Reconciliation not found');
    });
  });

  describe('getReconciliations', () => {
    it('should get all reconciliations', async () => {
      if (!dbConnected) return;

      // Create test reconciliations
      await prisma.paymentReconciliation.create({
        data: {
          reconciliationNumber: 'REC-2024-000001',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          totalPaystackTransactions: 1,
          totalSystemTransactions: 1,
          matchedTransactions: 1,
          unmatchedTransactions: 0,
          totalPaystackAmount: 10000,
          totalSystemAmount: 10000,
          discrepancyAmount: 0,
          status: 'completed',
          reconciledBy: adminId,
        },
      });

      const reconciliations = await ReconciliationService.getReconciliations();

      expect(reconciliations.length).toBeGreaterThan(0);
    });

    it('should filter by event ID', async () => {
      if (!dbConnected) return;

      await prisma.paymentReconciliation.create({
        data: {
          reconciliationNumber: 'REC-2024-000001',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          totalPaystackTransactions: 1,
          totalSystemTransactions: 1,
          matchedTransactions: 1,
          unmatchedTransactions: 0,
          totalPaystackAmount: 10000,
          totalSystemAmount: 10000,
          discrepancyAmount: 0,
          status: 'completed',
          eventId,
          reconciledBy: adminId,
        },
      });

      const reconciliations = await ReconciliationService.getReconciliations({
        eventId,
      });

      expect(reconciliations.length).toBeGreaterThan(0);
      expect(reconciliations[0].eventId).toBe(eventId);
    });

    it('should filter by status', async () => {
      if (!dbConnected) return;

      await prisma.paymentReconciliation.create({
        data: {
          reconciliationNumber: 'REC-2024-000001',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          totalPaystackTransactions: 1,
          totalSystemTransactions: 1,
          matchedTransactions: 1,
          unmatchedTransactions: 0,
          totalPaystackAmount: 10000,
          totalSystemAmount: 10000,
          discrepancyAmount: 0,
          status: 'discrepancies_found',
          reconciledBy: adminId,
        },
      });

      const reconciliations = await ReconciliationService.getReconciliations({
        status: 'discrepancies_found',
      });

      expect(reconciliations.length).toBeGreaterThan(0);
      expect(reconciliations[0].status).toBe('discrepancies_found');
    });
  });

  // Note: reconcilePayments and autoFixDiscrepancies tests would require:
  // 1. Mocking Paystack API calls
  // 2. Setting up test Paystack credentials
  // 3. Creating actual payment transactions in Paystack test environment
  // These are better suited for integration tests with proper test infrastructure.
});

