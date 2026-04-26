import { prisma } from '../src/config/database.js';
import { SubscriptionService } from '../src/services/subscription.service.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

describe('SubscriptionService — ENTERPRISE tier', () => {
  let dbConnected = false;
  let organizerId: string;
  let adminId: string;

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
    if (dbConnected) await prisma.$disconnect();
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await cleanupTestData();
    // SubscriptionPlan is NOT truncated by cleanupTestData (it doesn't cascade from User/Event)
    // Delete explicitly to avoid stale data from other test files
    await prisma.subscriptionPlan.deleteMany();

    const password = await bcrypt.hash('Organizer123!@$', 12);

    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@enterprise.test',
        password,
        firstName: 'Enterprise',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Enterprise Events Inc',
      },
    });
    organizerId = organizer.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin@enterprise.test',
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;

    // Seed all 4 plans with realistic prices
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          tier: SubscriptionTier.BASIC,
          name: 'Basic',
          price: new Decimal(0),
          currency: 'KES',
          features: [],
          isActive: true,
        },
        {
          tier: SubscriptionTier.STANDARD,
          name: 'Standard',
          price: new Decimal(2999),
          currency: 'KES',
          features: ['attendee_list', 'export', 'forms'],
          isActive: true,
        },
        {
          tier: SubscriptionTier.PREMIUM,
          name: 'Premium',
          price: new Decimal(8999),
          currency: 'KES',
          features: ['attendee_list', 'export', 'forms', 'demographics', 'analytics'],
          isActive: true,
        },
        {
          tier: SubscriptionTier.ENTERPRISE,
          name: 'Enterprise',
          price: new Decimal(25000),
          currency: 'KES',
          features: [
            'attendee_list',
            'export',
            'forms',
            'demographics',
            'analytics',
            'white_label',
            'sso',
            'agency_management',
          ],
          isActive: true,
        },
      ],
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // upgradeSubscription — ENTERPRISE paths
  // ═══════════════════════════════════════════════════════════════════════

  describe('upgradeSubscription — ENTERPRISE paths', () => {
    it('BASIC → ENTERPRISE with billing email succeeds and sets expiresAt and billingEmail', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const result = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        'billing@enterprise.test',
      );

      expect(result.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(result.billingEmail).toBe('billing@enterprise.test');
      expect(result.expiresAt).not.toBeNull();
      expect(result.isActive).toBe(true);
    });

    it('BASIC → ENTERPRISE without billing email throws ValidationError containing "Billing email"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.ENTERPRISE),
      ).rejects.toThrow('Billing email');
    });

    it('STANDARD → ENTERPRISE with billing email succeeds', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Manually set organizer to STANDARD (bypassing the paid check for setup)
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.STANDARD,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        'billing@enterprise.test',
      );

      expect(result.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(result.isActive).toBe(true);
    });

    it('PREMIUM → ENTERPRISE with billing email succeeds', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        'billing@enterprise.test',
      );

      expect(result.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(result.isActive).toBe(true);
    });

    it('Already at ENTERPRISE → upgrading to ENTERPRISE throws ValidationError containing "Cannot upgrade"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        SubscriptionService.upgradeSubscription(
          organizerId,
          SubscriptionTier.ENTERPRISE,
          'billing@enterprise.test',
        ),
      ).rejects.toThrow('Cannot upgrade');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // upgradeSubscription — STANDARD/PREMIUM paths require billing email
  // ═══════════════════════════════════════════════════════════════════════

  describe('upgradeSubscription — STANDARD/PREMIUM paths (price > 0)', () => {
    it('BASIC → STANDARD with billing email succeeds and stores billing email', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const result = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.STANDARD,
        'billing@standard.test',
      );

      expect(result.tier).toBe(SubscriptionTier.STANDARD);
      expect(result.billingEmail).toBe('billing@standard.test');
      expect(result.isActive).toBe(true);
    });

    it('BASIC → STANDARD without billing email throws ValidationError', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD),
      ).rejects.toThrow('Billing email');
    });

    it('BASIC → PREMIUM with billing email succeeds', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const result = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.PREMIUM,
        'billing@premium.test',
      );

      expect(result.tier).toBe(SubscriptionTier.PREMIUM);
      expect(result.billingEmail).toBe('billing@premium.test');
      expect(result.isActive).toBe(true);
      expect(result.expiresAt).not.toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // downgradeSubscription — from ENTERPRISE
  // ═══════════════════════════════════════════════════════════════════════

  describe('downgradeSubscription — from ENTERPRISE', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Set organizer to ENTERPRISE for downgrade tests
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('ENTERPRISE → PREMIUM succeeds, result tier is PREMIUM, expiresAt is preserved', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const before = await prisma.organizerSubscription.findUnique({ where: { organizerId } });
      const originalExpiresAt = before?.expiresAt;

      const result = await SubscriptionService.downgradeSubscription(
        organizerId,
        SubscriptionTier.PREMIUM,
      );

      expect(result.tier).toBe(SubscriptionTier.PREMIUM);
      // isPaid = true for PREMIUM, so expiresAt is preserved from the ENTERPRISE subscription
      expect(result.expiresAt).not.toBeNull();
      expect(result.expiresAt?.getTime()).toBe(originalExpiresAt?.getTime());
    });

    it('ENTERPRISE → STANDARD succeeds, result tier is STANDARD, expiresAt is preserved', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const before = await prisma.organizerSubscription.findUnique({ where: { organizerId } });
      const originalExpiresAt = before?.expiresAt;

      const result = await SubscriptionService.downgradeSubscription(
        organizerId,
        SubscriptionTier.STANDARD,
      );

      expect(result.tier).toBe(SubscriptionTier.STANDARD);
      // isPaid = true for STANDARD (not BASIC), so expiresAt is preserved
      expect(result.expiresAt).not.toBeNull();
      expect(result.expiresAt?.getTime()).toBe(originalExpiresAt?.getTime());
    });

    it('ENTERPRISE → BASIC succeeds, result tier is BASIC, expiresAt is null', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const result = await SubscriptionService.downgradeSubscription(
        organizerId,
        SubscriptionTier.BASIC,
      );

      expect(result.tier).toBe(SubscriptionTier.BASIC);
      // isPaid = false for BASIC target, so expiresAt is cleared
      expect(result.expiresAt).toBeNull();
      expect(result.nextBillingDate).toBeNull();
    });

    it('Trying to upgrade via downgrade (BASIC → ENTERPRISE) throws ValidationError containing "Cannot downgrade"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a separate BASIC organizer for this test
      const password = await bcrypt.hash('Test123!@$', 12);
      const basicOrganizer = await prisma.user.create({
        data: {
          email: 'basic-organizer@enterprise.test',
          password,
          firstName: 'Basic',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Basic Events Inc',
        },
      });

      // basicOrganizer has no subscription yet → getSubscription will create BASIC
      await SubscriptionService.getSubscription(basicOrganizer.id);

      await expect(
        SubscriptionService.downgradeSubscription(basicOrganizer.id, SubscriptionTier.ENTERPRISE),
      ).rejects.toThrow('Cannot downgrade');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // cancelSubscription — price-based (not hardcoded tier)
  // ═══════════════════════════════════════════════════════════════════════

  describe('cancelSubscription — price-based', () => {
    it('ENTERPRISE subscription (paid) cancels successfully: isActive=false, canceledAt is set', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await SubscriptionService.cancelSubscription(organizerId);

      expect(result.isActive).toBe(false);
      expect(result.canceledAt).not.toBeNull();
      expect(result.canceledAt).toBeDefined();
    });

    it('STANDARD subscription (paid, price=2999) cancels successfully', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.STANDARD,
          isActive: true,
          billingEmail: 'billing@standard.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await SubscriptionService.cancelSubscription(organizerId);

      expect(result.isActive).toBe(false);
      expect(result.canceledAt).not.toBeNull();
    });

    it('BASIC subscription (price=0) throws ValidationError "Only paid subscriptions"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create BASIC subscription explicitly
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.BASIC,
          isActive: true,
        },
      });

      await expect(
        SubscriptionService.cancelSubscription(organizerId),
      ).rejects.toThrow('Only paid subscriptions');
    });

    it('BASIC via getSubscription upsert also cannot be canceled', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // getSubscription creates a BASIC subscription if none exists
      await SubscriptionService.getSubscription(organizerId);

      // Verify the subscription exists with BASIC tier
      const sub = await prisma.organizerSubscription.findUnique({ where: { organizerId } });
      expect(sub?.tier).toBe(SubscriptionTier.BASIC);

      await expect(
        SubscriptionService.cancelSubscription(organizerId),
      ).rejects.toThrow('Only paid subscriptions');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getEffectiveTier — ENTERPRISE scenarios
  // ═══════════════════════════════════════════════════════════════════════

  describe('getEffectiveTier — ENTERPRISE', () => {
    it('Organizer with ENTERPRISE subscription returns ENTERPRISE', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.ENTERPRISE);
    });

    it('BASIC subscription + ENTERPRISE override returns ENTERPRISE', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Organizer starts with BASIC (default)
      await SubscriptionService.getSubscription(organizerId);

      await SubscriptionService.createOverride(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        adminId,
        'Partnership deal',
      );

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.ENTERPRISE);
    });

    it('ENTERPRISE subscription + STANDARD override (lower) returns ENTERPRISE (base wins)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Override to STANDARD (lower than ENTERPRISE base)
      await SubscriptionService.createOverride(
        organizerId,
        SubscriptionTier.STANDARD,
        adminId,
        'Override lower than base',
      );

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.ENTERPRISE); // base wins
    });

    it('ENTERPRISE subscription that expired returns BASIC', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
        },
      });

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.BASIC);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // hasFeatureAccess — ENTERPRISE features
  // ═══════════════════════════════════════════════════════════════════════

  describe('hasFeatureAccess — ENTERPRISE features', () => {
    it('white_label not accessible at BASIC → false', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // BASIC is the default
      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'white_label');
      expect(hasAccess).toBe(false);
    });

    it('white_label not accessible at STANDARD → false', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.STANDARD,
          isActive: true,
          billingEmail: 'billing@standard.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'white_label');
      expect(hasAccess).toBe(false);
    });

    it('white_label not accessible at PREMIUM → false', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@premium.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'white_label');
      expect(hasAccess).toBe(false);
    });

    it('white_label accessible at ENTERPRISE → true', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'white_label');
      expect(hasAccess).toBe(true);
    });

    it('sso accessible at ENTERPRISE → true', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'sso');
      expect(hasAccess).toBe(true);
    });

    it('attendee_list accessible at ENTERPRISE (inherited from STANDARD features) → true', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'attendee_list');
      expect(hasAccess).toBe(true);
    });

    it('ENTERPRISE override on BASIC subscription grants white_label access → true', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Base tier is BASIC (default — no subscription record needed)
      const beforeAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'white_label');
      expect(beforeAccess).toBe(false);

      // Grant ENTERPRISE override
      await SubscriptionService.createOverride(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        adminId,
        'Enterprise trial',
      );

      const afterAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'white_label');
      expect(afterAccess).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getPlans and getActivePlans
  // ═══════════════════════════════════════════════════════════════════════

  describe('getPlans and getActivePlans', () => {
    it('getPlans returns all 4 tiers', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const plans = await SubscriptionService.getPlans();

      expect(plans).toHaveLength(4);
      const tiers = plans.map(p => p.tier);
      expect(tiers).toContain(SubscriptionTier.BASIC);
      expect(tiers).toContain(SubscriptionTier.STANDARD);
      expect(tiers).toContain(SubscriptionTier.PREMIUM);
      expect(tiers).toContain(SubscriptionTier.ENTERPRISE);
    });

    it('getActivePlans returns 4 tiers when all active', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const plans = await SubscriptionService.getActivePlans();

      expect(plans).toHaveLength(4);
      const tiers = plans.map(p => p.tier);
      expect(tiers).toContain(SubscriptionTier.ENTERPRISE);
    });

    it('When ENTERPRISE is deactivated, getActivePlans returns 3 tiers', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.subscriptionPlan.update({
        where: { tier: SubscriptionTier.ENTERPRISE },
        data: { isActive: false },
      });

      const plans = await SubscriptionService.getActivePlans();

      expect(plans).toHaveLength(3);
      const tiers = plans.map(p => p.tier);
      expect(tiers).not.toContain(SubscriptionTier.ENTERPRISE);
      expect(tiers).toContain(SubscriptionTier.BASIC);
      expect(tiers).toContain(SubscriptionTier.STANDARD);
      expect(tiers).toContain(SubscriptionTier.PREMIUM);
    });

    it('ENTERPRISE plan has correct features including white_label and sso', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const plans = await SubscriptionService.getPlans();
      const enterprise = plans.find(p => p.tier === SubscriptionTier.ENTERPRISE);

      expect(enterprise).toBeDefined();
      expect(enterprise?.features).toContain('white_label');
      expect(enterprise?.features).toContain('sso');
      expect(enterprise?.features).toContain('agency_management');
      expect(enterprise?.features).toContain('attendee_list');
      expect(Number(enterprise?.price)).toBe(25000);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // initializeSubscriptionPayment — ENTERPRISE validation
  // ═══════════════════════════════════════════════════════════════════════

  describe('initializeSubscriptionPayment — ENTERPRISE validation', () => {
    it('ENTERPRISE plan inactive throws ValidationError "not currently available"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.subscriptionPlan.update({
        where: { tier: SubscriptionTier.ENTERPRISE },
        data: { isActive: false },
      });

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          organizerId,
          SubscriptionTier.ENTERPRISE,
          'billing@enterprise.test',
        ),
      ).rejects.toThrow('not currently available');
    });

    it('Already at ENTERPRISE throws ValidationError "Cannot upgrade"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.ENTERPRISE,
          isActive: true,
          billingEmail: 'billing@enterprise.test',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          organizerId,
          SubscriptionTier.ENTERPRISE,
          'billing@enterprise.test',
        ),
      ).rejects.toThrow('Cannot upgrade');
    });

    it('Organizer not found (bad UUID) throws NotFoundError "not found"', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          '00000000-0000-0000-0000-000000000000',
          SubscriptionTier.ENTERPRISE,
          'billing@enterprise.test',
        ),
      ).rejects.toThrow('not found');
    });

    it('BASIC to ENTERPRISE with valid billing email passes validation checks before gateway call', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // The gateway call will fail in test environment (no network/API key).
      // We assert that the error is NOT a ValidationError (meaning validation passed)
      // and that any thrown error is not about organizer, plan availability, or upgrade direction.
      try {
        await SubscriptionService.initializeSubscriptionPayment(
          organizerId,
          SubscriptionTier.ENTERPRISE,
          'billing@enterprise.test',
        );
        // If it succeeds (unlikely in test env), that's also fine
      } catch (err: any) {
        // Ensure it is NOT a validation-level rejection
        expect(err.message).not.toMatch(/not found/i);
        expect(err.message).not.toMatch(/not currently available/i);
        expect(err.message).not.toMatch(/Cannot upgrade/i);
        expect(err.message).not.toMatch(/Billing email/i);
        expect(err.message).not.toMatch(/free tier/i);
        // The error at this point is from the gateway/network layer
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // createOverride with ENTERPRISE
  // ═══════════════════════════════════════════════════════════════════════

  describe('createOverride with ENTERPRISE', () => {
    it('Creating ENTERPRISE override on BASIC organizer succeeds with tier ENTERPRISE', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const override = await SubscriptionService.createOverride(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        adminId,
        'Enterprise partnership',
      );

      expect(override.organizerId).toBe(organizerId);
      expect(override.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(override.grantedBy).toBe(adminId);
      expect(override.reason).toBe('Enterprise partnership');
      expect(override.isActive).toBe(true);
    });

    it('Getting effective tier after ENTERPRISE override on BASIC organizer returns ENTERPRISE', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Base tier is BASIC (default)
      const baseTier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(baseTier).toBe(SubscriptionTier.BASIC);

      await SubscriptionService.createOverride(
        organizerId,
        SubscriptionTier.ENTERPRISE,
        adminId,
        'Enterprise override',
      );

      const effectiveTier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(effectiveTier).toBe(SubscriptionTier.ENTERPRISE);
    });
  });
});
