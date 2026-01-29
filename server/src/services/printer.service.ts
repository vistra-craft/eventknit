/**
 * Printer Service
 * Handles printer management, PDF generation, and print job processing
 * Supports CUPS (Linux/Mac), Windows Print Server, and PrintNode cloud printing
 */

import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { uploadImageToCloudinary } from './cloudinary.service.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

// ==================== Types ====================

export interface PrinterConfig {
  name: string;
  driver: 'cups' | 'windows' | 'printnode';
  deviceId: string;
  host?: string;
  port?: number;
  apiKey?: string;
  supportedSizes?: string[];
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  eventId?: string;
}

export interface PrintJobData {
  printerId: string;
  templateId: string;
  registrationId: string;
  copies?: number;
  priority?: number;
  createdBy: string;
}

export interface PrinterStatus {
  id: string;
  name: string;
  isOnline: boolean;
  driver: string;
  lastChecked?: Date;
}

// ==================== Printer Service ====================

export class PrinterService {
  /**
   * Discover available printers on the system
   */
  static async discoverPrinters(driver: 'cups' | 'windows'): Promise<any[]> {
    try {
      if (driver === 'cups') {
        return await this.discoverCUPSPrinters();
      } else if (driver === 'windows') {
        return await this.discoverWindowsPrinters();
      }
      return [];
    } catch (error) {
      logger.error('Failed to discover printers:', error);
      throw new ValidationError(`Failed to discover ${driver} printers`);
    }
  }

  /**
   * Discover CUPS printers (Linux/Mac)
   */
  private static async discoverCUPSPrinters(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('lpstat -p -d');
      const lines = stdout.split('\n').filter(line => line.startsWith('printer'));

      const printers = lines.map(line => {
        const match = line.match(/printer\s+(\S+)/);
        if (match) {
          return {
            name: match[1],
            deviceId: match[1],
            driver: 'cups',
            isAvailable: line.includes('enabled'),
          };
        }
        return null;
      }).filter(Boolean);

      logger.info(`Discovered ${printers.length} CUPS printers`);
      return printers;
    } catch (error) {
      logger.warn('CUPS not available or no printers found:', error);
      return [];
    }
  }

  /**
   * Discover Windows printers
   */
  private static async discoverWindowsPrinters(): Promise<any[]> {
    try {
      const { stdout } = await execAsync('wmic printer get name,status /format:csv');
      const lines = stdout.split('\n').slice(1).filter(line => line.trim());

      const printers = lines.map(line => {
        const [, name, status] = line.split(',');
        if (name) {
          const statusTrimmed = status?.trim().toLowerCase() || '';
          // Windows printers can have various ready states
          const availableStatuses = ['ok', 'idle', 'ready'];
          return {
            name: name.trim(),
            deviceId: name.trim(),
            driver: 'windows',
            isAvailable: availableStatuses.includes(statusTrimmed),
          };
        }
        return null;
      }).filter(Boolean);

      logger.info(`Discovered ${printers.length} Windows printers`);
      return printers;
    } catch (error) {
      logger.warn('Windows printing not available or no printers found:', error);
      return [];
    }
  }

  /**
   * Register a new printer
   */
  static async registerPrinter(config: PrinterConfig, createdBy: string) {
    try {
      // Validate configuration
      if (!config.name || !config.driver || !config.deviceId) {
        throw new ValidationError('Printer name, driver, and deviceId are required');
      }

      // For PrintNode, validate API key
      if (config.driver === 'printnode' && !config.apiKey) {
        throw new ValidationError('API key required for PrintNode printers');
      }

      const printer = await prisma.printer.create({
        data: {
          name: config.name,
          driver: config.driver,
          deviceId: config.deviceId,
          host: config.host,
          port: config.port,
          apiKey: config.apiKey,
          supportedSizes: config.supportedSizes || ['4x3', 'A6'],
          paperSize: config.paperSize || '4x3',
          orientation: config.orientation || 'landscape',
          eventId: config.eventId,
          isOnline: false,
          isActive: true,
          createdBy,
        },
      });

      // Check printer status immediately
      await this.checkPrinterStatus(printer.id);

      logger.info(`Printer registered: ${printer.id} (${config.name})`);
      return printer;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      logger.error('Failed to register printer:', error);
      throw new ValidationError('Failed to register printer');
    }
  }

  /**
   * Get all printers
   */
  static async getPrinters(eventId?: string, includeInactive = false) {
    const where: any = {};

    if (eventId) {
      where.OR = [
        { eventId },
        { eventId: null }, // Include platform-wide printers
      ];
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.printer.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            printJobs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get printer by ID
   */
  static async getPrinterById(printerId: string) {
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!printer) {
      throw new NotFoundError('Printer not found');
    }

    return printer;
  }

  /**
   * Update printer configuration
   */
  static async updatePrinter(printerId: string, updates: Partial<PrinterConfig>) {
    try {
      const printer = await prisma.printer.update({
        where: { id: printerId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      logger.info(`Printer updated: ${printerId}`);
      return printer;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Printer not found');
      }
      logger.error('Failed to update printer:', error);
      throw new ValidationError('Failed to update printer');
    }
  }

  /**
   * Delete a printer (soft delete to preserve print job history)
   */
  static async deletePrinter(printerId: string) {
    try {
      const printer = await prisma.printer.findUnique({
        where: { id: printerId },
      });

      if (!printer) {
        throw new NotFoundError('Printer not found');
      }

      // Soft delete - set isActive to false to preserve print job history
      await prisma.printer.update({
        where: { id: printerId },
        data: { isActive: false },
      });

      logger.info(`Printer deactivated: ${printerId}`);
      return { message: 'Printer deleted successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to delete printer:', error);
      throw new ValidationError('Failed to delete printer');
    }
  }

  /**
   * Check printer status and update database
   */
  static async checkPrinterStatus(printerId: string): Promise<PrinterStatus> {
    const printer = await this.getPrinterById(printerId);

    let isOnline = false;

    try {
      if (printer.driver === 'cups') {
        isOnline = await this.checkCUPSPrinterStatus(printer.deviceId);
      } else if (printer.driver === 'windows') {
        isOnline = await this.checkWindowsPrinterStatus(printer.deviceId);
      } else if (printer.driver === 'printnode') {
        isOnline = await this.checkPrintNodeStatus(printer.deviceId, printer.apiKey!);
      }
    } catch (error) {
      logger.warn(`Failed to check printer status for ${printerId}:`, error);
    }

    // Update status in database
    await prisma.printer.update({
      where: { id: printerId },
      data: {
        isOnline,
        lastChecked: new Date(),
      },
    });

    return {
      id: printer.id,
      name: printer.name,
      isOnline,
      driver: printer.driver,
      lastChecked: new Date(),
    };
  }

  /**
   * Check CUPS printer status
   */
  private static async checkCUPSPrinterStatus(deviceId: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`lpstat -p ${deviceId}`);
      return stdout.includes('enabled') || stdout.includes('idle');
    } catch {
      return false;
    }
  }

  /**
   * Check Windows printer status
   */
  private static async checkWindowsPrinterStatus(deviceId: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`wmic printer where "name='${deviceId}'" get status`);
      return stdout.includes('OK') || stdout.includes('Idle');
    } catch {
      return false;
    }
  }

  /**
   * Check PrintNode printer status
   */
  private static async checkPrintNodeStatus(deviceId: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.printnode.com/printers/${deviceId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey  }:`).toString('base64')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.state === 'online';
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Test print a sample page
   */
  static async testPrinter(printerId: string, _createdBy: string) {
    const printer = await this.getPrinterById(printerId);

    // Check if printer is online
    const status = await this.checkPrinterStatus(printerId);
    if (!status.isOnline) {
      throw new ValidationError('Printer is offline');
    }

    // Create a simple test PDF
    const pdfPath = join(tmpdir(), `test-${randomBytes(8).toString('hex')}.pdf`);
    const doc = new PDFDocument({ size: 'A4' });
    const stream = createWriteStream(pdfPath);

    doc.pipe(stream);
    doc.fontSize(20).text('EventKnit Test Page', 100, 100);
    doc.fontSize(12).text(`Printer: ${printer.name}`, 100, 150);
    doc.fontSize(12).text(`Time: ${new Date().toISOString()}`, 100, 170);
    doc.end();

    await new Promise<void>((resolve) => stream.on('finish', () => resolve()));

    // Send to printer
    try {
      await this.sendToPrinter(printer, pdfPath);
      logger.info(`Test page sent to printer: ${printerId}`);
      return { success: true, message: 'Test page sent successfully' };
    } catch (error) {
      logger.error('Failed to send test page:', error);
      throw new ValidationError('Failed to send test page to printer');
    }
  }

  /**
   * Send PDF file to printer
   */
  private static async sendToPrinter(printer: any, pdfPath: string): Promise<void> {
    if (printer.driver === 'cups') {
      await this.printViaCUPS(printer, pdfPath);
    } else if (printer.driver === 'windows') {
      await this.printViaWindows(printer, pdfPath);
    } else if (printer.driver === 'printnode') {
      await this.printViaPrintNode(printer, pdfPath);
    }
  }

  /**
   * Print via CUPS
   */
  private static async printViaCUPS(printer: any, pdfPath: string): Promise<void> {
    const command = `lp -d ${printer.deviceId} ${pdfPath}`;
    await execAsync(command);
    logger.info(`Printed via CUPS to ${printer.deviceId}`);
  }

  /**
   * Print via Windows
   */
  private static async printViaWindows(printer: any, pdfPath: string): Promise<void> {
    // Use SumatraPDF or Adobe Reader command line for Windows printing
    const command = `powershell -Command "Start-Process -FilePath '${pdfPath}' -Verb Print -ArgumentList '/d:${printer.deviceId}' -WindowStyle Hidden"`;
    await execAsync(command);
    logger.info(`Printed via Windows to ${printer.deviceId}`);
  }

  /**
   * Print via PrintNode cloud API
   */
  private static async printViaPrintNode(printer: any, pdfPath: string): Promise<void> {
    const fs = await import('fs');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${printer.apiKey  }:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerId: printer.deviceId,
        title: 'EventKnit Badge',
        contentType: 'pdf_base64',
        content: pdfBase64,
        source: 'EventKnit',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PrintNode API error: ${error}`);
    }

    logger.info(`Printed via PrintNode to printer ${printer.deviceId}`);
  }

  /**
   * Create a print job
   */
  static async createPrintJob(jobData: PrintJobData) {
    try {
      // Verify printer, template, and registration exist
      const [printer, template, registration] = await Promise.all([
        prisma.printer.findUnique({ where: { id: jobData.printerId } }),
        prisma.badgeTemplate.findUnique({ where: { id: jobData.templateId } }),
        prisma.eventRegistration.findUnique({
          where: { id: jobData.registrationId },
          include: {
            attendee: true,
            event: true,
          },
        }),
      ]);

      if (!printer) throw new NotFoundError('Printer not found');
      if (!printer.isActive) throw new ValidationError('Printer is not active');
      if (!template) throw new NotFoundError('Badge template not found');
      if (!registration) throw new NotFoundError('Registration not found');

      // Create print job
      const printJob = await prisma.printJob.create({
        data: {
          printerId: jobData.printerId,
          templateId: jobData.templateId,
          registrationId: jobData.registrationId,
          status: 'queued',
          priority: jobData.priority || 0,
          copies: jobData.copies || 1,
          createdBy: jobData.createdBy,
        },
      });

      logger.info(`Print job created: ${printJob.id}`);

      // Process job immediately (in production, this would be handled by a queue worker)
      this.processPrintJob(printJob.id).catch(error => {
        logger.error(`Failed to process print job ${printJob.id}:`, error);
      });

      return printJob;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Failed to create print job:', error);
      throw new ValidationError('Failed to create print job');
    }
  }

  /**
   * Process a print job (generate PDF and send to printer)
   */
  static async processPrintJob(jobId: string): Promise<void> {
    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
      include: {
        printer: true,
        template: true,
        registration: {
          include: {
            attendee: true,
            event: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Print job not found');
    }

    try {
      // Update status to printing
      await prisma.printJob.update({
        where: { id: jobId },
        data: { status: 'printing', sentToPrinter: new Date() },
      });

      // Generate PDF
      const pdfPath = await this.generateBadgePDF(job.template, job.registration);

      // Upload PDF to Cloudinary (optional, for record keeping)
      const pdfBuffer = await readFile(pdfPath);
      const uploadResult = await uploadImageToCloudinary(pdfBuffer, 'badges');

      // Send to printer
      for (let i = 0; i < job.copies; i++) {
        await this.sendToPrinter(job.printer, pdfPath);
      }

      // Mark as completed
      await prisma.printJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          printedAt: new Date(),
          pdfUrl: uploadResult.secureUrl,
        },
      });

      logger.info(`Print job completed: ${jobId}`);
    } catch (error: any) {
      logger.error(`Print job failed: ${jobId}`, error);

      // Update retry count
      const updatedJob = await prisma.printJob.update({
        where: { id: jobId },
        data: {
          retryCount: { increment: 1 },
          errorMessage: error.message,
        },
      });

      // Retry if under max retries
      if (updatedJob.retryCount < updatedJob.maxRetries) {
        logger.info(`Retrying print job ${jobId} (attempt ${updatedJob.retryCount + 1})`);
        setTimeout(() => this.processPrintJob(jobId), 5000); // Retry after 5 seconds
      } else {
        // Mark as failed
        await prisma.printJob.update({
          where: { id: jobId },
          data: { status: 'failed' },
        });
      }
    }
  }

  /**
   * Generate badge PDF from template and registration data
   */
  private static async generateBadgePDF(template: any, registration: any): Promise<string> {
    const pdfPath = join(tmpdir(), `badge-${randomBytes(8).toString('hex')}.pdf`);

    // Convert mm to points (1mm = 2.83465 points)
    const mmToPoints = (mm: number) => mm * 2.83465;
    const width = mmToPoints(template.width);
    const height = mmToPoints(template.height);

    const doc = new PDFDocument({
      size: [width, height],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const stream = createWriteStream(pdfPath);
    doc.pipe(stream);

    // Background
    doc.rect(0, 0, width, height).fill(template.backgroundColor);

    // Render elements
    const elements = Array.isArray(template.elements) ? template.elements : JSON.parse(template.elements);

    for (const element of elements) {
      if (!element.isVisible) continue;

      const x = mmToPoints(element.x);
      const y = mmToPoints(element.y);
      const w = mmToPoints(element.width);
      const h = mmToPoints(element.height);

      // Replace variables in content
      let content = element.content;
      content = content.replace(/{{eventTitle}}/g, registration.event.title);
      content = content.replace(/{{fullName}}/g, `${registration.attendee.firstName} ${registration.attendee.lastName}`);
      content = content.replace(/{{firstName}}/g, registration.attendee.firstName);
      content = content.replace(/{{lastName}}/g, registration.attendee.lastName);
      content = content.replace(/{{email}}/g, registration.attendee.email);
      content = content.replace(/{{ticketType}}/g, registration.ticketType || 'General');

      if (element.type === 'text') {
        doc
          .fillColor(element.color || '#000000')
          .font(element.fontFamily || 'Helvetica')
          .fontSize(element.fontSize || 12)
          .text(content, x, y, {
            width: w,
            align: element.textAlign || 'left',
          });
      } else if (element.type === 'shape') {
        doc
          .rect(x, y, w, h)
          .fill(element.backgroundColor || '#cccccc');
      }
    }

    doc.end();

    await new Promise<void>((resolve) => stream.on('finish', () => resolve()));

    logger.info(`Badge PDF generated: ${pdfPath}`);
    return pdfPath;
  }

  /**
   * Get print jobs with filters
   */
  static async getPrintJobs(filters?: {
    printerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.printerId) where.printerId = filters.printerId;
    if (filters?.status) where.status = filters.status;

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        include: {
          printer: {
            select: {
              id: true,
              name: true,
              driver: true,
            },
          },
          registration: {
            include: {
              attendee: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.printJob.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }

  /**
   * Cancel a print job
   */
  static async cancelPrintJob(jobId: string) {
    const job = await prisma.printJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Print job not found');
    }

    if (job.status === 'completed') {
      throw new ValidationError('Cannot cancel completed job');
    }

    await prisma.printJob.update({
      where: { id: jobId },
      data: { status: 'cancelled' },
    });

    logger.info(`Print job cancelled: ${jobId}`);
    return { message: 'Print job cancelled successfully' };
  }
}
