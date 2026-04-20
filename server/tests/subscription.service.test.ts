import { prisma } from '../src/config/database.js';
import { SubscriptionService } from '../src/services/subscription.service.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('SubscriptionService', () => {
  let dbConnected = false;
  let organizerId: string;
  let adminId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (_error) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await cleanupTestData();

    const password = await hashPassword('Organizer123!@$');

    // Create organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@subscription.test',
        password,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create admin (for override grantedBy)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@subscription.test',
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;

    // Seed subscription plans
    await prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.BASIC },
      create: { tier: SubscriptionTier.BASIC, name: 'Basic', price: new Decimal(0), features: [], isActive: true },
      update: { isActive: true, price: new Decimal(0) },
    });
    await prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.STANDARD },
      create: { tier: SubscriptionTier.STANDARD, name: 'Standard', price: new Decimal(0), features: ['attendee_list', 'export'], isActive: true },
      update: { isActive: true, price: new Decimal(0) },
    });
    await prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.PREMIUM },
      create: { tier: SubscriptionTier.PREMIUM, name: 'Premium', price: new Decimal(10), features: ['attendee_list', 'export', 'demographics', 'analytics', 'advanced_export'], isActive: true },
      update: { isActive: true, price: new Decimal(10) },
    });
  });

  describe('getSubscription', () => {
    it('should create default BASIC subscription if does not exist', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const subscription = await SubscriptionService.getSubscription(organizerId);

      expect(subscription).toBeDefined();
      expect(subscription.tier).toBe(SubscriptionTier.BASIC);
      expect(subscription.isActive).toBe(true);
      expect(subscription.organizerId).toBe(organizerId);
    });

    it('should return existing subscription if it exists', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create subscription first
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.STANDARD,
          isActive: true,
        },
      });

      const subscription = await SubscriptionService.getSubscription(organizerId);

      expect(subscription.tier).toBe(SubscriptionTier.STANDARD);
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade from BASIC to STANDARD (free)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const subscription = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.STANDARD,
      );

      expect(subscription.tier).toBe(SubscriptionTier.STANDARD);
      expect(subscription.billingEmail).toBeNull();
      expect(subscription.expiresAt).toBeNull();
      expect(subscription.nextBillingDate).toBeNull();
    });

    it('should fail to upgrade to PREMIUM without billing email', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.upgradeSubscription(
          organizerId,
          SubscriptionTier.PREMIUM,
        ),
      ).rejects.toThrow('Billing email is required');
    });

    it('should fail if trying to downgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Upgrade to STANDARD first
      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      // Try to "upgrade" to BASIC (should fail)
      await expect(
        SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.BASIC),
      ).rejects.toThrow('Cannot upgrade');
    });

    it('should fail if already at same or higher tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      // Try to upgrade to STANDARD again
      await expect(
        SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD),
      ).rejects.toThrow('Cannot upgrade');
    });
  });

  describe('downgradeSubscription', () => {
    it('should downgrade from STANDARD to BASIC', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Upgrade to STANDARD first
      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      // Downgrade to BASIC
      const subscription = await SubscriptionService.downgradeSubscription(
        organizerId,
        SubscriptionTier.BASIC,
      );

      expect(subscription.tier).toBe(SubscriptionTier.BASIC);
    });

    it('should fail if trying to upgrade via downgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.downgradeSubscription(organizerId, SubscriptionTier.STANDARD),
      ).rejects.toThrow('Cannot downgrade');
    });
  });

  describe('cancelSubscription', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Create PREMIUM subscription
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should cancel Premium subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const subscription = await SubscriptionService.cancelSubscription(organizerId);

      expect(subscription.isActive).toBe(false);
      expect(subscription.canceledAt).toBeDefined();
      expect(subscription.expiresAt).toBeDefined(); // Should remain until expiry
    });

    it('should fail to cancel non-paid subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set to STANDARD (free tier — price is 0)
      await prisma.organizerSubscription.update({
        where: { organizerId },
        data: { tier: SubscriptionTier.STANDARD },
      });

      await expect(
        SubscriptionService.cancelSubscription(organizerId),
      ).rejects.toThrow('Only paid subscriptions can be canceled');
    });
  });

  describe('hasFeatureAccess (DB-backed)', () => {
    it('should return false for attendee_list on BASIC tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'attendee_list');
      expect(hasAccess).toBe(false);
    });

    it('should return true for attendee_list on STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'attendee_list');
      expect(hasAccess).toBe(true);
    });

    it('should return false for demographics on STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(hasAccess).toBe(false);
    });

    it('should return true for demographics on PREMIUM tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create PREMIUM subscription directly (bypassing payment for test)
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(hasAccess).toBe(true);
    });

    it('should read features from SubscriptionPlan table', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Add a custom feature to STANDARD plan
      await prisma.subscriptionPlan.update({
        where: { tier: SubscriptionTier.STANDARD },
        data: { features: ['attendee_list', 'export', 'custom_feature'] },
      });

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const hasCustom = await SubscriptionService.hasFeatureAccess(organizerId, 'custom_feature');
      expect(hasCustom).toBe(true);

      const hasDemographics = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(hasDemographics).toBe(false);
    });
  });

  describe('getTier', () => {
    it('should return BASIC tier by default', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const tier = await SubscriptionService.getTier(organizerId);
      expect(tier).toBe(SubscriptionTier.BASIC);
    });

    it('should return correct tier after upgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const tier = await SubscriptionService.getTier(organizerId);
      expect(tier).toBe(SubscriptionTier.STANDARD);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // New tests for DB-backed plan management and overrides
  // ═══════════════════════════════════════════════════════════════════════

  describe('getPlans', () => {
    it('should return all seeded plans', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const plans = await SubscriptionService.getPlans();

      expect(plans).toHaveLength(3);
      const tiers = plans.map(p => p.tier);
      expect(tiers).toContain(SubscriptionTier.BASIC);
      expect(tiers).toContain(SubscriptionTier.STANDARD);
      expect(tiers).toContain(SubscriptionTier.PREMIUM);
    });

    it('should return correct features for each plan', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const plans = await SubscriptionService.getPlans();

      const basic = plans.find(p => p.tier === SubscriptionTier.BASIC);
      const standard = plans.find(p => p.tier === SubscriptionTier.STANDARD);
      const premium = plans.find(p => p.tier === SubscriptionTier.PREMIUM);

      expect(basic?.features).toEqual([]);
      expect(standard?.features).toContain('attendee_list');
      expect(standard?.features).toContain('export');
      expect(premium?.features).toContain('demographics');
      expect(premium?.features).toContain('analytics');
      expect(premium?.features).toContain('advanced_export');
    });
  });

  describe('updatePlan', () => {
    it('should update plan pricing', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const updated = await SubscriptionService.updatePlan(SubscriptionTier.PREMIUM, {
        price: 20,
      });

      expect(Number(updated.price)).toBe(20);
    });

    it('should update plan features', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const updated = await SubscriptionService.updatePlan(SubscriptionTier.STANDARD, {
        features: ['attendee_list', 'export', 'new_feature'],
      });

      expect(updated.features).toContain('new_feature');
      expect(updated.features).toHaveLength(3);
    });

    it('should update plan description', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const updated = await SubscriptionService.updatePlan(SubscriptionTier.BASIC, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should throw NotFoundError for non-existent tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Delete a plan then try to update it
      await prisma.subscriptionPlan.delete({ where: { tier: SubscriptionTier.BASIC } });

      await expect(
        SubscriptionService.updatePlan(SubscriptionTier.BASIC, { price: 5 }),
      ).rejects.toThrow('not found');
    });
  });

  describe('getEffectiveTier', () => {
    it('should return base tier when no override exists', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.BASIC);
    });

    it('should return override tier when higher than base', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Base tier is BASIC, override to PREMIUM
      await SubscriptionService.createOverride(organizerId, SubscriptionTier.PREMIUM, adminId, 'Test');

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.PREMIUM);
    });

    it('should return base tier when override is lower', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Upgrade to PREMIUM first
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
        },
      });

      // Override to STANDARD (lower than PREMIUM)
      await SubscriptionService.createOverride(organizerId, SubscriptionTier.STANDARD, adminId, 'Test');

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.PREMIUM); // Should keep the higher base tier
    });

    it('should ignore expired overrides', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create an expired override
      await prisma.subscriptionOverride.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          grantedBy: adminId,
          expiresAt: new Date(Date.now() - 1000), // Already expired
          isActive: true,
        },
      });

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.BASIC); // Should not use expired override
    });

    it('should ignore deactivated overrides', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.subscriptionOverride.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          grantedBy: adminId,
          isActive: false,
        },
      });

      const tier = await SubscriptionService.getEffectiveTier(organizerId);
      expect(tier).toBe(SubscriptionTier.BASIC);
    });
  });

  describe('hasFeatureAccess with overrides', () => {
    it('should grant PREMIUM features when override elevates from BASIC', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Base tier is BASIC (no features)
      const beforeAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(beforeAccess).toBe(false);

      // Grant PREMIUM override
      await SubscriptionService.createOverride(organizerId, SubscriptionTier.PREMIUM, adminId, 'Partnership');

      const afterAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(afterAccess).toBe(true);
    });
  });

  describe('createOverride', () => {
    it('should create an override', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const override = await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId, 'Trial period',
      );

      expect(override.organizerId).toBe(organizerId);
      expect(override.tier).toBe(SubscriptionTier.PREMIUM);
      expect(override.grantedBy).toBe(adminId);
      expect(override.reason).toBe('Trial period');
      expect(override.isActive).toBe(true);
      expect(override.expiresAt).toBeNull();
    });

    it('should create an override with expiry', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const override = await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId, 'Week trial', expiresAt,
      );

      expect(override.expiresAt).toEqual(expiresAt);
    });

    it('should deactivate existing overrides when creating a new one', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const first = await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.STANDARD, adminId, 'First',
      );

      const second = await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId, 'Second',
      );

      // First should be deactivated
      const firstRefreshed = await prisma.subscriptionOverride.findUnique({
        where: { id: first.id },
      });
      expect(firstRefreshed?.isActive).toBe(false);

      // Second should be active
      expect(second.isActive).toBe(true);
    });

    it('should throw NotFoundError for non-existent organizer', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.createOverride(
          '00000000-0000-0000-0000-000000000000', SubscriptionTier.PREMIUM, adminId,
        ),
      ).rejects.toThrow('not found');
    });
  });

  describe('removeOverride', () => {
    it('should deactivate an override', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const override = await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId, 'To remove',
      );

      const removed = await SubscriptionService.removeOverride(override.id);
      expect(removed.isActive).toBe(false);
    });

    it('should throw NotFoundError for non-existent override', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.removeOverride('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('not found');
    });
  });

  describe('getOverridesForOrganizer', () => {
    it('should return active overrides', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId, 'Active override',
      );

      const overrides = await SubscriptionService.getOverridesForOrganizer(organizerId);

      expect(overrides).toHaveLength(1);
      expect(overrides[0].tier).toBe(SubscriptionTier.PREMIUM);
      expect(overrides[0].grantedByUser).toBeDefined();
      expect(overrides[0].grantedByUser.email).toBe('admin@subscription.test');
    });

    it('should not return deactivated overrides', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const override = await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId,
      );
      await SubscriptionService.removeOverride(override.id);

      const overrides = await SubscriptionService.getOverridesForOrganizer(organizerId);
      expect(overrides).toHaveLength(0);
    });

    it('should not return expired overrides', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.subscriptionOverride.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          grantedBy: adminId,
          expiresAt: new Date(Date.now() - 1000),
          isActive: true,
        },
      });

      const overrides = await SubscriptionService.getOverridesForOrganizer(organizerId);
      expect(overrides).toHaveLength(0);
    });
  });

  describe('getOrganizerSubscriptionSummary', () => {
    it('should return full subscription summary', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.createOverride(
        organizerId, SubscriptionTier.PREMIUM, adminId, 'Summary test',
      );

      const summary = await SubscriptionService.getOrganizerSubscriptionSummary(organizerId);

      expect(summary.subscription).toBeDefined();
      expect(summary.subscription.tier).toBe(SubscriptionTier.BASIC);
      expect(summary.overrides).toHaveLength(1);
      expect(summary.effectiveTier).toBe(SubscriptionTier.PREMIUM);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // getActivePlans
  // ═══════════════════════════════════════════════════════════════════════

  describe('getActivePlans', () => {
    it('should return only active plans', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Deactivate one plan
      await prisma.subscriptionPlan.update({
        where: { tier: SubscriptionTier.BASIC },
        data: { isActive: false },
      });

      const plans = await SubscriptionService.getActivePlans();

      const tiers = plans.map(p => p.tier);
      expect(tiers).not.toContain(SubscriptionTier.BASIC);
      expect(tiers).toContain(SubscriptionTier.STANDARD);
      expect(tiers).toContain(SubscriptionTier.PREMIUM);
    });

    it('should include subscriber counts', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a subscription so count > 0
      await prisma.organizerSubscription.create({
        data: { organizerId, tier: SubscriptionTier.STANDARD, isActive: true },
      });

      const plans = await SubscriptionService.getActivePlans();
      const standard = plans.find(p => p.tier === SubscriptionTier.STANDARD);

      expect(standard?.subscriberCount).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Subscription Payment — initializeSubscriptionPayment
  // ═══════════════════════════════════════════════════════════════════════

  describe('initializeSubscriptionPayment', () => {
    it('should reject payment for a free tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          organizerId,
          SubscriptionTier.STANDARD, // price = 0
          'billing@test.com',
        ),
      ).rejects.toThrow('free tier');
    });

    it('should reject if not an upgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set organizer to PREMIUM already
      await prisma.organizerSubscription.create({
        data: { organizerId, tier: SubscriptionTier.PREMIUM, isActive: true, billingEmail: 'b@t.com' },
      });

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          organizerId,
          SubscriptionTier.PREMIUM,
          'billing@test.com',
        ),
      ).rejects.toThrow('Cannot upgrade');
    });

    it('should reject for non-existent organizer', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          '00000000-0000-0000-0000-000000000000',
          SubscriptionTier.PREMIUM,
          'billing@test.com',
        ),
      ).rejects.toThrow('not found');
    });

    it('should reject for inactive plan', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.subscriptionPlan.update({
        where: { tier: SubscriptionTier.PREMIUM },
        data: { isActive: false },
      });

      await expect(
        SubscriptionService.initializeSubscriptionPayment(
          organizerId,
          SubscriptionTier.PREMIUM,
          'billing@test.com',
        ),
      ).rejects.toThrow('not currently available');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Subscription Payment — handleSubscriptionPaymentSuccess
  // ═══════════════════════════════════════════════════════════════════════

  describe('handleSubscriptionPaymentSuccess', () => {
    const testReference = 'SUB-test1234-9999999';

    beforeEach(async () => {
      if (!dbConnected) return;

      // Create a pending payment record
      await prisma.subscriptionPayment.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          amount: new Decimal(10),
          currency: 'USD',
          gateway: 'PAYSTACK',
          gatewayReference: testReference,
          status: 'PENDING',
          billingEmail: 'billing@test.com',
        },
      });
    });

    it('should upgrade subscription and create PlatformIncome on success', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.handleSubscriptionPaymentSuccess(testReference, 'txn_123');

      // Payment record should be SUCCESS
      const payment = await prisma.subscriptionPayment.findUnique({
        where: { gatewayReference: testReference },
      });
      expect(payment?.status).toBe('SUCCESS');
      expect(payment?.gatewayTransactionId).toBe('txn_123');
      expect(payment?.paymentDate).toBeDefined();

      // Subscription should be PREMIUM
      const subscription = await prisma.organizerSubscription.findUnique({
        where: { organizerId },
      });
      expect(subscription?.tier).toBe(SubscriptionTier.PREMIUM);
      expect(subscription?.isActive).toBe(true);
      expect(subscription?.billingEmail).toBe('billing@test.com');
      expect(subscription?.expiresAt).toBeDefined();

      // PlatformIncome record should exist
      const income = await prisma.platformIncome.findFirst({
        where: { reference: testReference },
      });
      expect(income).toBeDefined();
      expect(income?.category).toBe('Subscription');
      expect(Number(income?.amount)).toBe(10);
      expect(income?.status).toBe('received');
    });

    it('should be idempotent — skip if already processed', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Process once
      await SubscriptionService.handleSubscriptionPaymentSuccess(testReference, 'txn_123');

      // Process again — should not throw or duplicate
      await SubscriptionService.handleSubscriptionPaymentSuccess(testReference, 'txn_456');

      // Still only one PlatformIncome
      const incomes = await prisma.platformIncome.findMany({
        where: { reference: testReference },
      });
      expect(incomes).toHaveLength(1);
    });

    it('should not process unknown reference', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Should not throw, just log and return
      await SubscriptionService.handleSubscriptionPaymentSuccess('SUB-unknown-000', 'txn_x');

      // No PlatformIncome created
      const income = await prisma.platformIncome.findFirst({
        where: { reference: 'SUB-unknown-000' },
      });
      expect(income).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Price-aware cancelSubscription
  // ═══════════════════════════════════════════════════════════════════════

  describe('cancelSubscription (price-aware)', () => {
    it('should cancel a paid subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // PREMIUM is paid (price=10 in seed)
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await SubscriptionService.cancelSubscription(organizerId);
      expect(result.isActive).toBe(false);
      expect(result.canceledAt).toBeDefined();
    });

    it('should reject cancel for BASIC (free) tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Default subscription is BASIC
      await SubscriptionService.getSubscription(organizerId); // creates BASIC

      await expect(
        SubscriptionService.cancelSubscription(organizerId),
      ).rejects.toThrow('Only paid subscriptions');
    });
  });
});
