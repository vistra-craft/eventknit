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

// Redis configuration for BullMQ
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'ticket-pdf-generation';

// Parse Redis URL to get connection options
const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
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
        logger.error(`PDF job ${job?.id} failed:`, error);
      });

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
      // Update registration status to PENDING
      await prisma.eventRegistration.update({
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
      await prisma.eventRegistration.update({
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
      await prisma.eventRegistration.update({
        where: { id: data.registrationId },
        data: { ticketPdfStatus: 'FAILED' },
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

    return uploadResult.secure_url;
  }

  /**
   * Queue ticket email (separate from confirmation)
   */
  private static async queueTicketEmail(
    registrationId: string,
    _pdfUrl: string,
  ): Promise<void> {
    try {
      // Get registration details
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          attendee: {
            select: {
              email: true,
              firstName: true,
            },
          },
          event: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!registration) {
        return;
      }

      // Update email tracking
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          ticketEmailStatus: 'PENDING',
        },
      });

      // Note: Actual email sending would be done here or via another queue
      // For now, we just mark it as ready to send
      logger.info(`Ticket email queued for ${registration.attendee.email}`);
    } catch (error) {
      logger.error('Error queueing ticket email:', error);
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
