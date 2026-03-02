import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { emailService } from '../services/email.service.js';
import { NotificationPriority } from '@prisma/client';
import { escapeHtml } from '../utils/sanitize.js';

interface DigestItem {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  eventId: string | null;
  eventTitle: string | null;
  priority: NotificationPriority;
  createdAt: Date;
}

interface UserDigest {
  userId: string;
  email: string;
  firstName: string | null;
  items: DigestItem[];
}

/**
 * Email Digest Job
 *
 * Sends daily and weekly email digests to users who have opted for digest notifications
 * - Daily digest: Runs every day at 8:00 AM UTC
 * - Weekly digest: Runs every Monday at 8:00 AM UTC
 */
export class EmailDigestJob {
  private static readonly DAILY_CRON_SCHEDULE = '0 8 * * *'; // Every day at 8:00 AM
  private static readonly WEEKLY_CRON_SCHEDULE = '0 8 * * 1'; // Every Monday at 8:00 AM
  private static dailyTask: cron.ScheduledTask | null = null;
  private static weeklyTask: cron.ScheduledTask | null = null;

  /**
   * Check if database is available
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
   * Process and send digests
   */
  private static async processDigests(digestType: 'DAILY' | 'WEEKLY'): Promise<void> {
    try {
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping email digest job');
        return;
      }

      logger.info(`Starting ${digestType.toLowerCase()} email digest job...`);

      // Get all pending digest items grouped by user
      const pendingItems = await prisma.emailDigestQueue.findMany({
        where: {
          digestType,
          status: 'PENDING',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      if (pendingItems.length === 0) {
        logger.info(`No pending ${digestType.toLowerCase()} digest items`);
        return;
      }

      // Group items by user
      const userDigests = new Map<string, DigestItem[]>();
      for (const item of pendingItems) {
        const items = userDigests.get(item.userId) || [];
        items.push({
          id: item.id,
          notificationType: item.notificationType,
          title: item.title,
          message: item.message,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          priority: item.priority,
          createdAt: item.createdAt,
        });
        userDigests.set(item.userId, items);
      }

      logger.info(`Processing ${digestType.toLowerCase()} digests for ${userDigests.size} users`);

      let successCount = 0;
      let failCount = 0;

      // Process each user's digest
      for (const [userId, items] of userDigests) {
        try {
          // Get user details
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              status: true,
            },
          });

          if (!user || user.status !== 'ACTIVE') {
            // Skip inactive users, mark items as expired
            await prisma.emailDigestQueue.updateMany({
              where: {
                userId,
                status: 'PENDING',
                digestType,
              },
              data: {
                status: 'EXPIRED',
              },
            });
            continue;
          }

          // Send digest email
          await this.sendDigestEmail({
            userId,
            email: user.email,
            firstName: user.firstName,
            items,
          }, digestType);

          // Mark items as sent
          const itemIds = items.map(i => i.id);
          await prisma.emailDigestQueue.updateMany({
            where: {
              id: { in: itemIds },
            },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          successCount++;
        } catch (error) {
          logger.error(`Failed to send ${digestType.toLowerCase()} digest to user ${userId}:`, error);
          failCount++;
        }
      }

      logger.info(
        `${digestType} digest job completed: ${successCount} sent, ${failCount} failed`,
      );
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001')
      )) {
        logger.warn('Database connection error during digest job, skipping this run');
        return;
      }
      logger.error(`Error during ${digestType.toLowerCase()} digest job:`, error);
    }
  }

  /**
   * Send the digest email
   */
  private static async sendDigestEmail(
    digest: UserDigest,
    digestType: 'DAILY' | 'WEEKLY',
  ): Promise<void> {
    const periodLabel = digestType === 'DAILY' ? 'today' : 'this week';
    const subjectPeriod = digestType === 'DAILY' ? 'Daily' : 'Weekly';

    // Group items by event
    const eventGroups = new Map<string | null, DigestItem[]>();
    for (const item of digest.items) {
      const key = item.eventId || 'general';
      const group = eventGroups.get(key) || [];
      group.push(item);
      eventGroups.set(key, group);
    }

    // Build HTML content for the digest
    let itemsHtml = '';
    for (const [key, items] of eventGroups) {
      const eventTitle = escapeHtml(items[0]?.eventTitle || 'General Updates');
      if (key !== 'general') {
        itemsHtml += `<h3 style="color: #333; margin-top: 20px;">${eventTitle}</h3>`;
      }

      for (const item of items) {
        const priorityColor = item.priority === 'HIGH' ? '#e53e3e' :
          item.priority === 'MEDIUM' ? '#dd6b20' : '#718096';
        itemsHtml += `
          <div style="background: #f7fafc; border-left: 4px solid ${priorityColor}; padding: 12px; margin: 10px 0; border-radius: 4px;">
            <strong style="color: #2d3748;">${escapeHtml(item.title)}</strong>
            <p style="color: #4a5568; margin: 8px 0 0 0; font-size: 14px;">${escapeHtml(item.message)}</p>
          </div>
        `;
      }
    }

    await emailService.sendDigestEmail(digest.email, {
      userName: digest.firstName || 'there',
      digestType: subjectPeriod,
      periodLabel,
      itemCount: digest.items.length,
      itemsHtml,
    });
  }

  /**
   * Add a notification to the digest queue
   */
  static async queueForDigest(data: {
    userId: string;
    notificationId: string;
    digestType: 'DAILY' | 'WEEKLY';
    notificationType: string;
    title: string;
    message: string;
    eventId?: string;
    eventTitle?: string;
    priority?: NotificationPriority;
    expiresAt?: Date;
  }): Promise<void> {
    await prisma.emailDigestQueue.create({
      data: {
        userId: data.userId,
        notificationId: data.notificationId,
        digestType: data.digestType,
        notificationType: data.notificationType as string,
        title: data.title,
        message: data.message,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        priority: data.priority || NotificationPriority.MEDIUM,
        expiresAt: data.expiresAt,
        status: 'PENDING',
      },
    });

    logger.debug(`Notification ${data.notificationId} queued for ${data.digestType.toLowerCase()} digest`);
  }

  /**
   * Start both daily and weekly digest jobs
   */
  static start(): void {
    // Start daily digest job
    if (!this.dailyTask) {
      this.dailyTask = cron.schedule(
        this.DAILY_CRON_SCHEDULE,
        async () => {
          logger.info('Running scheduled daily email digest job...');
          await this.processDigests('DAILY');
        },
        { timezone: 'UTC' },
      );
      logger.info('Daily email digest job scheduled: Every day at 8:00 AM UTC');
    }

    // Start weekly digest job
    if (!this.weeklyTask) {
      this.weeklyTask = cron.schedule(
        this.WEEKLY_CRON_SCHEDULE,
        async () => {
          logger.info('Running scheduled weekly email digest job...');
          await this.processDigests('WEEKLY');
        },
        { timezone: 'UTC' },
      );
      logger.info('Weekly email digest job scheduled: Every Monday at 8:00 AM UTC');
    }
  }

  /**
   * Stop both digest jobs
   */
  static stop(): void {
    if (this.dailyTask) {
      this.dailyTask.stop();
      this.dailyTask = null;
      logger.info('Daily email digest job stopped');
    }
    if (this.weeklyTask) {
      this.weeklyTask.stop();
      this.weeklyTask = null;
      logger.info('Weekly email digest job stopped');
    }
  }

  /**
   * Manually trigger digest processing (for testing)
   */
  static async triggerDigest(digestType: 'DAILY' | 'WEEKLY'): Promise<void> {
    await this.processDigests(digestType);
  }

  /**
   * Clean up old sent/expired digest items
   */
  static async cleanupOldItems(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.emailDigestQueue.deleteMany({
      where: {
        status: { in: ['SENT', 'EXPIRED'] },
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info(`Cleaned up ${result.count} old digest queue items`);
    return result.count;
  }
}
