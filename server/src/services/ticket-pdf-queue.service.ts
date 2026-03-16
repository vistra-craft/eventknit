/**
 * Ticket PDF Queue Service
 *
 * Async PDF generation using BullMQ for high-throughput ticket processing.
 * Separates confirmation email from ticket delivery for better UX.
 */

import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { PDFService } from './pdf.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { TicketService } from './ticket.service.js';
import { registerQueueForMonitoring } from './queue-monitor.js';

// Redis configuration for BullMQ
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
const QUEUE_NAME = 'ticket-pdf-generation';

// Parse Redis URL to get connection options
const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6380', 10),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6380 };
  }
};

const connection = parseRedisUrl(REDIS_URL);

export interface TicketPdfJobData {
  registrationId: string;
  eventId: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  qrCodeDataUrl?: string;
  priority?: number; // 1 = high, 5 = low
}

export interface TicketPdfResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

let queue: Queue<TicketPdfJobData, TicketPdfResult> | null = null;
let worker: Worker<TicketPdfJobData, TicketPdfResult> | null = null;

export class TicketPdfQueueService {
  /**
   * Initialize the PDF generation queue and worker
   */
  static async initialize(): Promise<void> {
    try {
      // Create queue
      queue = new Queue<TicketPdfJobData, TicketPdfResult>(QUEUE_NAME, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      });

      // Create worker
      worker = new Worker<TicketPdfJobData, TicketPdfResult>(
        QUEUE_NAME,
        async (job: Job<TicketPdfJobData, TicketPdfResult>) => {
          return this.processJob(job);
        },
        {
          connection,
          concurrency: 5, // Process 5 jobs concurrently
        },
      );

      // Event handlers
      worker.on('completed', (job) => {
        logger.debug(`PDF job ${job.id} completed for registration ${job.data.registrationId}`);
      });

      worker.on('failed', (job, error) => {
        const maxAttempts = job?.opts?.attempts ?? 3;
        const attemptsMade = job?.attemptsMade ?? 0;

        if (attemptsMade >= maxAttempts) {
          // All retries exhausted — alert ops (dead letter queue event)
          logger.error('[DLQ] PDF job permanently failed after all retries', {
            jobId: job?.id,
            registrationId: job?.data?.registrationId,
            eventId: job?.data?.eventId,
            attendeeEmail: job?.data?.attendeeEmail,
            attemptsMade,
            maxAttempts,
            error: error.message,
          });
        } else {
          logger.warn(`PDF job ${job?.id} failed (attempt ${attemptsMade}/${maxAttempts}):`, error.message);
        }
      });

      // Register with Bull Board dashboard
      registerQueueForMonitoring(queue);

      logger.info('Ticket PDF queue service initialized');
    } catch (error) {
      logger.warn('Failed to initialize PDF queue, using sync mode:', error);
      queue = null;
      worker = null;
    }
  }

  /**
   * Shutdown the queue and worker
   */
  static async shutdown(): Promise<void> {
    if (worker) {
      await worker.close();
      worker = null;
    }

    if (queue) {
      await queue.close();
      queue = null;
    }

    logger.info('Ticket PDF queue service shut down');
  }

  /**
   * Add a job to generate ticket PDF
   */
  static async addJob(data: TicketPdfJobData): Promise<string> {
    try {
      // Update registration status to PENDING (use updateMany to avoid throwing if record not yet visible)
      await prisma.eventRegistration.updateMany({
        where: { id: data.registrationId },
        data: {
          ticketPdfStatus: 'PENDING',
        },
      });

      // If queue is not available, generate synchronously
      if (!queue) {
        logger.debug('Queue not available, generating PDF synchronously');
        await this.generatePdfSync(data);
        return 'sync';
      }

      // Add to queue with priority
      const job = await queue.add('generate-pdf', data, {
        priority: data.priority || 3,
        jobId: `pdf-${data.registrationId}-${Date.now()}`,
      });

      logger.info(`PDF generation job queued: ${job.id} for registration ${data.registrationId}`);
      return job.id || 'unknown';
    } catch (error) {
      logger.error('Error adding PDF job:', error);

      // Fall back to sync generation
      await this.generatePdfSync(data);
      return 'sync-fallback';
    }
  }

  /**
   * Process a PDF generation job
   */
  private static async processJob(
    job: Job<TicketPdfJobData, TicketPdfResult>,
  ): Promise<TicketPdfResult> {
    const { registrationId } = job.data;

    try {
      // Update status to GENERATING
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          ticketPdfStatus: 'GENERATING',
        },
      });

      // Generate PDF
      const pdfUrl = await this.generatePdf(job.data);

      // Update registration with PDF URL
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          ticketPdfUrl: pdfUrl,
          ticketPdfStatus: 'READY',
          ticketPdfGeneratedAt: new Date(),
        },
      });

      // Queue ticket email with PDF
      await this.queueTicketEmail(registrationId, pdfUrl);

      return {
        success: true,
        pdfUrl,
      };
    } catch (error) {
      logger.error(`PDF generation failed for registration ${registrationId}:`, error);

      // Update status to FAILED
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          ticketPdfStatus: 'FAILED',
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate PDF synchronously (fallback)
   */
  private static async generatePdfSync(data: TicketPdfJobData): Promise<void> {
    try {
      await prisma.eventRegistration.updateMany({
        where: { id: data.registrationId },
        data: { ticketPdfStatus: 'GENERATING' },
      });

      const pdfUrl = await this.generatePdf(data);

      await prisma.eventRegistration.update({
        where: { id: data.registrationId },
        data: {
          ticketPdfUrl: pdfUrl,
          ticketPdfStatus: 'READY',
          ticketPdfGeneratedAt: new Date(),
        },
      });

      // Send ticket email
      await this.queueTicketEmail(data.registrationId, pdfUrl);

      logger.info(`PDF generated synchronously for registration ${data.registrationId}`);
    } catch (error) {
      // Use updateMany to avoid throwing if registration doesn't exist
      await prisma.eventRegistration.updateMany({
        where: { id: data.registrationId },
        data: { ticketPdfStatus: 'FAILED' },
      }).catch((updateErr) => {
        logger.error(`Failed to mark registration ${data.registrationId} as FAILED:`, updateErr);
      });
      throw error;
    }
  }

  /**
   * Generate the actual PDF
   */
  private static async generatePdf(data: TicketPdfJobData): Promise<string> {
    // Generate PDF using PDFService with registrationId
    // The PDFService.generateTicketPDF fetches all needed data from the database
    const pdfBuffer = await PDFService.generateTicketPDF(data.registrationId);

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadBuffer(pdfBuffer, {
      folder: `tickets/${data.eventId}`,
      public_id: `ticket-${data.registrationId}`,
      resource_type: 'raw',
      format: 'pdf',
    });

    return uploadResult.secureUrl;
  }

  /**
   * Send Email 2: Ticket delivery email (called after PDF is ready).
   * Fetches full registration data from DB and delegates to TicketService.
   */
  private static async queueTicketEmail(
    registrationId: string,
    _pdfUrl: string,
  ): Promise<void> {
    try {
      // Fetch full registration data needed by sendTicketEmail
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          ticketLineItems: true,
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              startDate: true,
              endDate: true,
              startTime: true,
              endTime: true,
              venue: true,
              location: true,
              address: true,
              isOnline: true,
              onlineLink: true,
              image: true,
              currency: true,
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                  email: true,
                },
              },
            },
          },
          attendee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyAffiliation: true,
            },
          },
        },
      });

      if (!registration) {
        logger.warn(`[queueTicketEmail] Registration ${registrationId} not found`);
        return;
      }

      // Idempotency guard — skip if ticket email was already sent (prevents duplicate delivery on job retry)
      if (registration.ticketEmailSentAt) {
        logger.info(`[queueTicketEmail] Ticket email already sent at ${registration.ticketEmailSentAt.toISOString()} for registration ${registrationId} — skipping`);
        return;
      }

      // Retrieve account invitation token if still valid (user hasn't set up account yet)
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: registration.attendeeId,
          token: { not: null },
          expiresAt: { gt: new Date() },
          verified: false,
        },
        select: { token: true },
      });

      await TicketService.sendTicketEmail({
        id: registration.id,
        ticketType: registration.ticketType,
        quantity: registration.quantity,
        totalAmount: registration.totalAmount,
        createdAt: registration.createdAt,
        backupCode: registration.backupCode,
        registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
        ticketLineItems: registration.ticketLineItems.map(item => ({
          ticketType: item.ticketType,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        accountInvitationToken: emailVerification?.token ?? null,
        pdfUrl: registration.ticketPdfUrl, // Pass pre-generated URL to skip double PDF generation
        event: registration.event,
        attendee: registration.attendee,
      });

      logger.info(`[queueTicketEmail] Ticket email sent to ${registration.attendee.email} for registration ${registrationId}`);
    } catch (error) {
      logger.error('[queueTicketEmail] Error sending ticket email:', error);
    }
  }

  /**
   * Get queue status
   */
  static async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    isAvailable: boolean;
  }> {
    if (!queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        isAvailable: false,
      };
    }

    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        isAvailable: true,
      };
    } catch (error) {
      logger.error('Error getting queue status:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        isAvailable: false,
      };
    }
  }

  /**
   * Retry failed jobs
   */
  static async retryFailed(): Promise<number> {
    if (!queue) {
      return 0;
    }

    try {
      const failedJobs = await queue.getFailed();
      let retried = 0;

      for (const job of failedJobs) {
        await job.retry();
        retried++;
      }

      logger.info(`Retried ${retried} failed PDF jobs`);
      return retried;
    } catch (error) {
      logger.error('Error retrying failed jobs:', error);
      return 0;
    }
  }

  /**
   * Add bulk PDF generation jobs (for batch registration)
   */
  static async addBulkJobs(jobs: TicketPdfJobData[]): Promise<string[]> {
    const jobIds: string[] = [];

    for (const jobData of jobs) {
      const jobId = await this.addJob(jobData);
      jobIds.push(jobId);
    }

    logger.info(`Added ${jobs.length} PDF generation jobs to queue`);
    return jobIds;
  }
}
