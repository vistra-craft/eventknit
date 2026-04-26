import { prisma } from '../config/database.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { hashPassword } from './password.js';
import { logger } from './logger.js';

const SUPERVISOR_CREDENTIALS = {
  email: 'vistracraft@gmail.com',
  password: 'Somepass123!',
  firstName: 'Vistra',
  lastName: 'Craft',
  role: UserRole.SUPERADMIN,
};

/**
 * Ensure super admin user exists in the database
 * Called automatically on server startup
 */
export const ensureSuperAdmin = async (): Promise<void> => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.SUPERADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPERADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        logger.info('Super admin role updated');
      }
      return;
    }

    const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);
    await prisma.user.create({
      data: {
        email: SUPERVISOR_CREDENTIALS.email,
        password: hashedPassword,
        firstName: SUPERVISOR_CREDENTIALS.firstName,
        lastName: SUPERVISOR_CREDENTIALS.lastName,
        role: SUPERVISOR_CREDENTIALS.role,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    logger.info('Super admin created');
  } catch (error) {
    logger.error('Failed to ensure super admin:', error);
  }
};

/**
 * Ensure default subscription plans exist in the database
 * Called automatically on server startup
 */
export const ensureSubscriptionPlans = async (): Promise<void> => {
  try {
    // Features are stored cumulatively — each tier includes all features from tiers below it.
    const standardFeatures = [
      'attendee_list',           // view attendee names + contact info
      'export',                  // CSV attendee data export
      'email_attendees',         // email communication to consented attendees
      'forms',                   // participant forms + people management
      'custom_branding',         // remove EventKnit branding, custom colours
      'promo_codes',             // promotional / discount codes
      'whatsapp_delivery',       // WhatsApp ticket delivery
      'whatsapp_reminders',      // auto reminders 24h + 1h before event
      'team_members',            // up to 5 team members (check-in, managers)
      'tracking_links',          // UTM tracking links per channel
      'on_site_sales',           // walk-in ticket sales at the door
      'multi_day_events',        // multi-day event setup
      'event_templates',         // duplicate events, save templates
      'offline_scanning',        // offline QR scan mode (sync when back online)
      'realtime_checkin_dashboard', // live check-in count on organizer screen
      'post_event_survey',       // basic post-event attendee survey
    ] as string[];

    const premiumFeatures = [
      ...standardFeatures,
      'demographics',            // demographic data and segment breakdowns
      'analytics',               // advanced analytics: traffic, geographic, cohorts
      'advanced_export',         // Excel, custom formats, scheduled exports
      'heatmaps',                // geographic heatmaps of attendee origins
      'whatsapp_ai_registration',// conversational WhatsApp registration flow (coming soon)
      'whatsapp_broadcast',      // broadcast messages to past attendees
      'promoter_network',        // affiliate/promoter system with commission tracking
      'recurring_events',        // recurring event setup (daily/weekly/monthly)
      'seating_plans',           // drag-and-drop seating plan builder
      'embed_widget',            // embed ticketing widget on external sites
      'api_access',              // REST API + webhooks
      'split_payouts',           // split revenue between multiple recipients
      'priority_support',        // priority 24h support
      'tax_reports',             // tax reports + invoice generation
      'event_comparison',        // compare metrics across event history
      'revenue_forecast',        // payout forecast after fees
      'social_login',            // Google/Apple login for attendees
      'retargeting_pixels',      // Meta Pixel, Google Tag pass-through
      'early_payout',            // request early payout before event date
      'unlimited_team',          // unlimited team members (vs 5 on Standard)
    ] as string[];

    const enterpriseFeatures = [
      ...premiumFeatures,
      'white_label',             // full white-label / custom domain
      'custom_integrations',     // Salesforce, HubSpot, custom CRM
      'sso',                     // SSO / SAML integration
      'dedicated_support',       // dedicated account manager + SLA
      'on_site_hardware',        // scanner/printer rental + field support team
      'agency_management',       // manage multiple organizer sub-accounts
      'custom_analytics',        // data warehouse export, custom dashboards
    ] as string[];

    const plans = [
      {
        tier: SubscriptionTier.BASIC,
        name: 'Basic',
        description: 'Free forever. Create events, sell tickets via M-Pesa and card, scan QR codes with the mobile app, and view aggregate stats.',
        price: new Decimal(0),
        currency: 'KES',
        features: [] as string[],
      },
      {
        tier: SubscriptionTier.STANDARD,
        name: 'Standard',
        description: 'For growing organizers. Unlock attendee data, custom forms, WhatsApp delivery, team access, and reduced platform fees.',
        price: new Decimal(2999),
        currency: 'KES',
        features: standardFeatures,
      },
      {
        tier: SubscriptionTier.PREMIUM,
        name: 'Premium',
        description: 'For professional organizers. Full analytics, API access, WhatsApp AI registration, seating plans, promoter network, and more.',
        price: new Decimal(8999),
        currency: 'KES',
        features: premiumFeatures,
      },
      {
        tier: SubscriptionTier.ENTERPRISE,
        name: 'Enterprise',
        description: 'For agencies and large-scale organizers. White-label, SSO, dedicated support, custom integrations, and on-site hardware.',
        price: new Decimal(25000),
        currency: 'KES',
        features: enterpriseFeatures,
      },
    ];

    for (const plan of plans) {
      await prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        create: plan,
        update: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          features: plan.features,
        },
      });
    }

    logger.info('Subscription plans ready (BASIC, STANDARD, PREMIUM, ENTERPRISE)');
  } catch (error) {
    logger.error('Failed to ensure subscription plans:', error);
  }
};
