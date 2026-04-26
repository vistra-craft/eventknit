/**
 * Tests for PlatformFeeService methods not covered by platform-fee.service.test.ts:
 *  - getGlobalFeeConfig  (reads finance.* SystemSettings with 5-min cache)
 *  - invalidateFeeConfigCache
 *  - createPlatformFee using SystemSettings-configured rate (not just 7.5% default)
 *  - updatePlatformFeeStatus
 *  - getPendingDisbursementFees
 */

import { PlatformFeeService } from '../src/services/platform-fee.service.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

describe('PlatformFeeService — config and extended methods', () => {
  let dbConnected = false;
  let organizerId: string;
  let eventId: string;
  let transactionId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      console.warn('⚠️  Database not available. Tests will be skipped.');
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try { await prisma.$disconnect(); } catch { /* ignore */ }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await cleanupTestData();

    // Flush any stale finance SystemSettings and platform fee records
    await prisma.$transaction(async (tx) => {
      await tx.platformIncome.deleteMany();
      await tx.platformFee.deleteMany();
      await tx.eventPaymentTransaction.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.ticketTemplate.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();
    });
    await prisma.systemSettings.deleteMany({
      where: { key: { startsWith: 'finance.' } },
    });

    // Always start with a cold cache so tests don't bleed into each other
    PlatformFeeService.invalidateFeeConfigCache();

    const password = await bcrypt.hash('Test123!@$', 12);

    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@fee-config.test',
        password,
        firstName: 'Fee',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;

    const event = await prisma.event.create({
      data: {
        title: 'Fee Config Test Event',
        description: 'desc',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate:   new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '18:00',
        location: 'Nairobi',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: false,
        price: 200,
        capacity: 50,
        availableSlots: 50,
      },
    });
    eventId = event.id;

    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@fee-config.test',
        password,
        firstName: 'Att',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee.id,
        quantity: 1,
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: 'COMPLETED',
        totalAmount: 20000,
      },
    });

    const txn = await prisma.eventPaymentTransaction.create({
      data: {
        transactionNumber: 'EPT-FC-000001',
        gatewayReference: 'gw-fc-001',
        gatewayAmount: 20000,
        paystackReference: 'pay_fc_001',
        paystackAmount: 2000000,
        currency: 'KES',
        amount: 20000,
        paymentMethod: 'PAYSTACK',
        paymentStatus: 'success',
        paymentDate: new Date(),
        eventId,
        registrationId: registration.id,
        attendeeEmail: 'attendee@fee-config.test',
        attendeeName: 'Att Test',
      },
    });
    transactionId = txn.id;
  });

  // ─── helpers ───────────────────────────────────────────────────────────────

  async function setSetting(key: string, value: string) {
    await prisma.systemSettings.upsert({
      where: { key },
      create: { key, value, type: 'number', category: 'general', isPublic: false, isEncrypted: false },
      update: { value },
    });
  }

  // ─── getGlobalFeeConfig ───────────────────────────────────────────────────

  describe('getGlobalFeeConfig', () => {
    it('returns 7.5% default when no SystemSettings exist', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      const config = await PlatformFeeService.getGlobalFeeConfig();

      expect(config.feePercentage).toBe(7.5);
      expect(config.minimumFee).toBe(0);
      expect(config.maximumFee).toBe(0);
    });

    it('returns configured feePercentage from SystemSettings', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.platformFeePercentage', '5');

      const config = await PlatformFeeService.getGlobalFeeConfig();

      expect(config.feePercentage).toBe(5);
    });

    it('returns configured minimumFee from SystemSettings', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.minimumFee', '500');

      const config = await PlatformFeeService.getGlobalFeeConfig();

      expect(config.minimumFee).toBe(500);
    });

    it('returns configured maximumFee from SystemSettings', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.maximumFee', '10000');

      const config = await PlatformFeeService.getGlobalFeeConfig();

      expect(config.maximumFee).toBe(10000);
    });

    it('returns all four config fields together', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.platformFeePercentage', '3');
      await setSetting('finance.minimumFee', '200');
      await setSetting('finance.maximumFee', '5000');
      await setSetting('finance.fixedFeePerTicket', '0');

      const config = await PlatformFeeService.getGlobalFeeConfig();

      expect(config.feePercentage).toBe(3);
      expect(config.minimumFee).toBe(200);
      expect(config.maximumFee).toBe(5000);
      expect(config.fixedFeePerTicket).toBe(0);
    });

    it('falls back to 7.5% when the stored value is not a valid number', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.platformFeePercentage', 'not-a-number');

      const config = await PlatformFeeService.getGlobalFeeConfig();

      // Number('not-a-number') = NaN → falls back to DEFAULT_FEE_PERCENTAGE via || operator
      expect(config.feePercentage).toBe(7.5);
    });

    it('caches results — second call returns same config without re-reading DB', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.platformFeePercentage', '4');

      const first = await PlatformFeeService.getGlobalFeeConfig();
      expect(first.feePercentage).toBe(4);

      // Change DB value — cache should mask this
      await setSetting('finance.platformFeePercentage', '9');

      const second = await PlatformFeeService.getGlobalFeeConfig();
      expect(second.feePercentage).toBe(4); // still cached at 4
    });
  });

  // ─── invalidateFeeConfigCache ─────────────────────────────────────────────

  describe('invalidateFeeConfigCache', () => {
    it('after invalidation, next call re-fetches from DB', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await setSetting('finance.platformFeePercentage', '4');
      const first = await PlatformFeeService.getGlobalFeeConfig();
      expect(first.feePercentage).toBe(4);

      // Update DB, then invalidate cache
      await setSetting('finance.platformFeePercentage', '6');
      PlatformFeeService.invalidateFeeConfigCache();

      const second = await PlatformFeeService.getGlobalFeeConfig();
      expect(second.feePercentage).toBe(6); // fetched fresh from DB
    });

    it('calling invalidate when cache is already empty does not throw', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      // Cache is already null from beforeEach
      expect(() => PlatformFeeService.invalidateFeeConfigCache()).not.toThrow();
    });
  });

  // ─── createPlatformFee — SystemSettings-driven rate ───────────────────────

  describe('createPlatformFee — SystemSettings rate', () => {
    it('uses configured rate from SystemSettings instead of 7.5% default', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      // Configure 5% platform fee
      await setSetting('finance.platformFeePercentage', '5');

      const result = await PlatformFeeService.createPlatformFee(transactionId);

      // 5% of 20000 = 1000
      expect(result.feeAmount).toBe(1000);
      expect(result.organizerAmount).toBe(19000);
    });

    it('uses explicit feePercentage override over SystemSettings rate', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      // SystemSettings says 5%
      await setSetting('finance.platformFeePercentage', '5');

      // Explicit override: 10%
      const result = await PlatformFeeService.createPlatformFee(transactionId, 10);

      // 10% of 20000 = 2000
      expect(result.feeAmount).toBe(2000);
      expect(result.organizerAmount).toBe(18000);
    });

    it('applies minimumFee from SystemSettings when calculated fee is below it', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      // 1% of 20000 = 200, but minimumFee = 500, so fee should be 500
      await setSetting('finance.platformFeePercentage', '1');
      await setSetting('finance.minimumFee', '500');

      const result = await PlatformFeeService.createPlatformFee(transactionId);

      expect(result.feeAmount).toBe(500);
      expect(result.organizerAmount).toBe(19500);
    });
  });

  // ─── updatePlatformFeeStatus ──────────────────────────────────────────────

  describe('updatePlatformFeeStatus', () => {
    it('updates status to disbursed', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      const created = await PlatformFeeService.createPlatformFee(transactionId);

      const updated = await PlatformFeeService.updatePlatformFeeStatus(created.id, 'disbursed');

      expect(updated.status).toBe('disbursed');
    });

    it('transitions status from calculated to processing', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      const created = await PlatformFeeService.createPlatformFee(transactionId);
      expect(created).toBeDefined();

      const updated = await PlatformFeeService.updatePlatformFeeStatus(created.id, 'processing');

      expect(updated.status).toBe('processing');
      // disbursementId remains null when not provided
      expect(updated.disbursementId).toBeNull();
    });

    it('throws NotFoundError for a non-existent fee ID', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await expect(
        PlatformFeeService.updatePlatformFeeStatus(
          '00000000-0000-0000-0000-000000000000',
          'disbursed',
        ),
      ).rejects.toThrow('not found');
    });
  });

  // ─── getPendingDisbursementFees ───────────────────────────────────────────

  describe('getPendingDisbursementFees', () => {
    it('returns calculated fees without disbursementId for the event', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await PlatformFeeService.createPlatformFee(transactionId);

      const pending = await PlatformFeeService.getPendingDisbursementFees(eventId, organizerId);

      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe('calculated');
      expect(pending[0].disbursementId).toBeNull();
      expect(pending[0].transaction).toBeDefined();
    });

    it('returns empty array when no pending fees exist', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      // No fees created
      const pending = await PlatformFeeService.getPendingDisbursementFees(eventId, organizerId);

      expect(pending).toHaveLength(0);
    });

    it('excludes fees that are already disbursed', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      const created = await PlatformFeeService.createPlatformFee(transactionId);

      // Mark it as disbursed
      await PlatformFeeService.updatePlatformFeeStatus(created.id, 'disbursed');

      const pending = await PlatformFeeService.getPendingDisbursementFees(eventId, organizerId);

      // 'disbursed' status is excluded since the service filters by status='calculated'
      expect(pending).toHaveLength(0);
    });

    it('excludes fees for a different organizer', async () => {
      if (!dbConnected) { console.log('⏭️  Skipping test - database not connected'); return; }

      await PlatformFeeService.createPlatformFee(transactionId);

      const otherOrganizerId = '00000000-0000-0000-0000-000000000099';
      const pending = await PlatformFeeService.getPendingDisbursementFees(eventId, otherOrganizerId);

      expect(pending).toHaveLength(0);
    });
  });
});
