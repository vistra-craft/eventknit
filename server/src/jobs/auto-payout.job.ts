import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { EventStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { DisbursementService } from '../services/disbursement.service.js';
import { PayoutManagementService } from '../services/payout-management.service.js';
import { PlatformFeeService } from '../services/platform-fee.service.js';
import { NotificationService } from '../services/notification.service.js';
import { emailService } from '../services/email.service.js';
import { subtractBusinessDays } from '../utils/business-days.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';

/**
 * Automatic Post-Event Payout Job
 *
 * Runs every hour. Finds paid events whose end date is past the configurable
 * grace period (default: 5 business days) and auto-creates disbursements for
 * eligible organizers. Also processes scheduled disbursements that have
 * reached their scheduledDate.
 *
 * Eligibility criteria for auto-payout:
 * 1. Event status is APPROVED or COMPLETED
 * 2. Event ended at least N business days ago (grace period for refund/chargeback window)
 * 3. Organizer has approved KYC and verified identity
 * 4. Organizer has autoPayoutEnabled = true in PayoutPreference
 * 5. Organizer has valid bank details configured
 * 6. Pending (undisbursed) platform fees exist for the event
 * 7. Payout amount meets the organizer's minimum threshold (if set)
 *
 * Industry reference: Humanitix model — automatic payout 2-5 business days
 * after event ends, included in daily automatic sweeps.
 */
export class AutoPayoutJob {
  private static readonly CRON_SCHEDULE = '0 * * * *'; // Every hour at minute 0
  private static task: cron.ScheduledTask | null = null;

  /**
   * Check if database is available before processing
   */
  private static async isDatabaseAvailable(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Main entry point: process automatic payouts and scheduled disbursements
   */
  static async processAutoPayouts(): Promise<void> {
    try {
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping auto-payout job');
        return;
      }

      if (!config.payout.autoPayoutEnabled) {
        logger.debug('Auto-payout is disabled system-wide, skipping');
        return;
      }

      const now = new Date();
      const gracePeriod = config.payout.gracePeriodBusinessDays;

      logger.info('Starting auto-payout job');

      // Step 1: Create automatic payouts for eligible post-event disbursements
      const autoPayoutsCreated = await this.createAutoPayouts(now, gracePeriod);

      // Step 2: Process scheduled disbursements that have reached their date
      const scheduledProcessed = await this.processScheduledDisbursements();

      if (autoPayoutsCreated > 0 || scheduledProcessed > 0) {
        logger.info(
          `Auto-payout job completed. Created ${autoPayoutsCreated} auto-payouts, processed ${scheduledProcessed} scheduled disbursements`,
        );
      } else {
        logger.debug('No auto-payouts or scheduled disbursements to process');
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Can\'t reach database server') ||
          error.message.includes('P1001') ||
          error.constructor.name === 'PrismaClientInitializationError')
      ) {
        logger.warn('Database connection error during auto-payout job, skipping this run:', error.message);
        return;
      }
      logger.error('Error in auto-payout job:', error);
    }
  }

  /**
   * Find eligible events and create automatic disbursements.
   *
   * Query strategy: We fetch all events that ended before the cutoff date
   * (not a narrow window). Idempotency is guaranteed because
   * PlatformFeeService.getPendingDisbursementFees() only returns fees with
   * disbursementId = null — once fees are linked to a disbursement, they
   * won't appear again.
   */
  private static async createAutoPayouts(now: Date, gracePeriodDays: number): Promise<number> {
    const cutoffDate = subtractBusinessDays(now, gracePeriodDays);

    // Find events that ended before the cutoff date
    const eligibleEvents = await prisma.event.findMany({
      where: {
        status: {
          in: [EventStatus.APPROVED, EventStatus.COMPLETED],
        },
        deletedAt: null,
        isFree: false,
        OR: [
          {
            endDate: {
              lte: cutoffDate,
            },
          },
          // Events without endDate — use startDate as proxy (same-day event)
          {
            endDate: null,
            startDate: {
              lte: cutoffDate,
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        organizerId: true,
        currency: true,
        organizer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            organizationName: true,
            isIdentityVerified: true,
            kycStatus: true,
          },
        },
      },
    });

    let payoutsCreated = 0;

    for (const event of eligibleEvents) {
      try {
        await this.processEventPayout(event, gracePeriodDays);
        payoutsCreated++;
      } catch (error) {
        // Per-event error isolation — one failure must not block others
        if (error instanceof SkipEventError) {
          logger.debug(error.message);
        } else {
          logger.error(`Failed to create auto-payout for event ${event.id} (${event.title}):`, error);
        }
      }
    }

    return payoutsCreated;
  }

  /**
   * Process a single event for automatic payout.
   * Throws SkipEventError for expected skip conditions (logged as debug).
   * Throws other errors for unexpected failures (logged as error by caller).
   */
  private static async processEventPayout(
    event: {
      id: string;
      title: string;
      organizerId: string;
      currency: string;
      organizer: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        organizationName: string | null;
        isIdentityVerified: boolean;
        kycStatus: string | null;
      };
    },
    gracePeriodDays: number,
  ): Promise<void> {
    // Organizer identity verification
    if (!event.organizer.isIdentityVerified) {
      throw new SkipEventError(
        `Organizer ${event.organizerId} not identity-verified, skipping event ${event.id}`,
      );
    }

    // Organizer KYC approval
    if (event.organizer.kycStatus !== 'APPROVED') {
      throw new SkipEventError(
        `Organizer ${event.organizerId} KYC not approved (${event.organizer.kycStatus}), skipping event ${event.id}`,
      );
    }

    // Payout preferences: auto-payout enabled + bank details configured
    const preferences = await PayoutManagementService.getPayoutPreferences(event.organizerId);

    if (!preferences.autoPayoutEnabled) {
      throw new SkipEventError(
        `Auto-payout disabled for organizer ${event.organizerId}, skipping event ${event.id}`,
      );
    }

    if (!preferences.bankName || !preferences.accountNumber || !preferences.accountName) {
      throw new SkipEventError(
        `Incomplete bank details for organizer ${event.organizerId}, skipping event ${event.id}`,
      );
    }

    // Pending platform fees (undisbursed)
    const pendingFees = await PlatformFeeService.getPendingDisbursementFees(
      event.id,
      event.organizerId,
    );

    if (pendingFees.length === 0) {
      throw new SkipEventError(`No pending fees for event ${event.id}, skipping`);
    }

    // Threshold check
    const totalAmount = pendingFees.reduce(
      (sum, fee) => sum + Number(fee.organizerAmount),
      0,
    );

    if (preferences.autoPayoutThreshold && totalAmount < Number(preferences.autoPayoutThreshold)) {
      throw new SkipEventError(
        `Payout amount ${totalAmount} below threshold ${preferences.autoPayoutThreshold} for event ${event.id}, skipping`,
      );
    }

    // Create the disbursement (createdBy: null for automated payouts)
    const disbursement = await DisbursementService.createDisbursement(
      {
        eventId: event.id,
        organizerId: event.organizerId,
        paymentMethod: preferences.primaryMethod,
        bankName: preferences.bankName,
        accountName: preferences.accountName,
        accountNumber: preferences.accountNumber,
        notes: `Automatic post-event payout. Grace period: ${gracePeriodDays} business days.`,
      },
      null,
    );

    // Audit log for the automated disbursement
    await createAuditLog({
      userId: event.organizerId,
      action: AuditActions.DISBURSEMENT_AUTO_CREATED,
      entity: 'OrganizerDisbursement',
      entityId: disbursement.id,
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        organizerId: event.organizerId,
        totalAmount: totalAmount.toString(),
        feeCount: pendingFees.length,
        automated: true,
        gracePeriodDays,
      },
    });

    // Notify organizer
    await this.notifyOrganizerPayoutInitiated(event, disbursement, preferences, totalAmount, pendingFees[0]?.currency || event.currency || 'NGN');

    logger.info(
      `Auto-payout created: ${disbursement.id} for event: ${event.id} (${event.title}), ` +
      `organizer: ${event.organizerId}, amount: ${totalAmount}`,
    );
  }

  /**
   * Send in-app notification and email when a payout is automatically initiated
   */
  private static async notifyOrganizerPayoutInitiated(
    event: {
      id: string;
      title: string;
      organizer: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        organizationName: string | null;
      };
    },
    disbursement: { id: string; disbursementNumber: string },
    preferences: { primaryMethod: string; bankName: string | null; accountNumber: string | null },
    totalAmount: number,
    currency: string,
  ): Promise<void> {
    const organizerName =
      event.organizer.organizationName ||
      `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() ||
      'Organizer';

    const formattedAmount = `${currency} ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const maskedAccount = preferences.accountNumber
      ? `****${preferences.accountNumber.slice(-4)}`
      : '';

    // In-app notification
    await NotificationService.sendNotification({
      userId: event.organizer.id,
      type: NotificationType.PAYOUT_INITIATED,
      title: `Payout initiated for "${event.title}"`,
      message: `Your payout of ${formattedAmount} for "${event.title}" has been initiated and will be sent to your bank account (${maskedAccount}).`,
      priority: NotificationPriority.HIGH,
      eventId: event.id,
      data: {
        disbursementId: disbursement.id,
        disbursementNumber: disbursement.disbursementNumber,
        amount: totalAmount,
        currency,
      },
    });

    // Email notification
    const dashboardUrl = `${process.env.CLIENT_URL || 'https://eventknit.com'}/organizer/payouts`;
    await emailService.sendPayoutInitiatedEmail(event.organizer.email, {
      organizerName,
      eventTitle: event.title,
      amount: formattedAmount,
      currency,
      paymentMethod: preferences.primaryMethod,
      bankName: preferences.bankName || undefined,
      accountNumber: maskedAccount,
      disbursementNumber: disbursement.disbursementNumber,
      dashboardUrl,
    });
  }

  /**
   * Process scheduled disbursements whose scheduledDate has passed.
   * Uses the existing DisbursementService.getScheduledDisbursementsReadyToProcess().
   */
  private static async processScheduledDisbursements(): Promise<number> {
    const readyDisbursements = await DisbursementService.getScheduledDisbursementsReadyToProcess();

    let processed = 0;
    for (const disbursement of readyDisbursements) {
      try {
        logger.info(
          `Scheduled disbursement ${disbursement.id} is ready to process ` +
          `for event: ${disbursement.event.title}, organizer: ${disbursement.organizer.email}`,
        );

        // TODO: Integrate with Paystack Transfer API or bank transfer API
        // to automatically initiate the bank transfer. For now, the admin
        // processes these manually via POST /api/v1/admin/finance/disbursements/:id/process.

        processed++;
      } catch (error) {
        logger.error(`Failed to process scheduled disbursement ${disbursement.id}:`, error);
      }
    }

    return processed;
  }

  /**
   * Start the scheduled cron job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Auto-payout job is already running');
      return;
    }

    try {
      this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
        await this.processAutoPayouts();
      });

      logger.info('✅ Auto-payout job started');
    } catch (error) {
      logger.error('Failed to start auto-payout job:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduled cron job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Auto-payout job stopped');
    }
  }
}

/**
 * Internal error type for expected skip conditions.
 * Distinguished from real errors so callers can log at debug level.
 */
class SkipEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkipEventError';
  }
}
