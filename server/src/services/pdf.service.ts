/**
 * PDF Service
 * Server-side PDF generation for email tickets
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export interface TicketPDFData {
  registrationId: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketType: string;
  ticketNumber: string;
  qrCodeData: string;
  organizerName?: string;
  eventBannerUrl?: string;
}

export interface BadgePDFData {
  templateId: string;
  registrationId: string;
  attendeeName: string;
  company?: string;
  ticketType: string;
  qrCodeData: string;
  eventTitle: string;
}

export class PDFService {
  /**
   * Generate a ticket PDF for email
   */
  static async generateTicketPDF(registrationId: string): Promise<Buffer> {
    try {
      // Fetch registration with all related data
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          attendee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              startDate: true,
              endDate: true,
              location: true,
              bannerImage: true,
              organizer: {
                select: {
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                },
              },
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      const ticketData: TicketPDFData = {
        registrationId: registration.id,
        attendeeName: `${registration.attendee?.firstName || ''} ${registration.attendee?.lastName || ''}`.trim(),
        attendeeEmail: registration.attendee?.email || '',
        eventTitle: registration.event?.title || '',
        eventDate: this.formatDate(registration.event?.startDate || new Date()),
        eventTime: this.formatTime(registration.event?.startDate || new Date()),
        eventLocation: registration.event?.location || 'TBD',
        ticketType: registration.ticketType || 'General',
        ticketNumber: registration.ticketNumber || registration.id.slice(-8).toUpperCase(),
        qrCodeData: registration.qrCode || registration.id,
        organizerName: registration.event?.organizer?.organizationName ||
          `${registration.event?.organizer?.firstName || ''} ${registration.event?.organizer?.lastName || ''}`.trim(),
        eventBannerUrl: registration.event?.bannerImage || undefined,
      };

      return this.createTicketDocument(ticketData);
    } catch (error: unknown) {
      logger.error('Failed to generate ticket PDF:', error);
      throw error;
    }
  }

  /**
   * Generate ticket PDF from provided data (for bulk generation)
   */
  static async generateTicketPDFFromData(data: TicketPDFData): Promise<Buffer> {
    return this.createTicketDocument(data);
  }

  /**
   * Create the actual PDF document for a ticket
   */
  private static async createTicketDocument(data: TicketPDFData): Promise<Buffer> {
    // Generate QR code as data URL (do this before the Promise)
    const qrCodeDataUrl = await QRCode.toDataURL(data.qrCodeData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });

    // Convert data URL to buffer for PDFKit
    const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      try {
        // Create PDF document (A4 portrait)
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header background
        doc.rect(0, 0, doc.page.width, 120).fill('#1a1a2e');

        // Event title
        doc.fillColor('#ffffff')
          .fontSize(24)
          .font('Helvetica-Bold')
          .text(data.eventTitle, 50, 40, {
            width: doc.page.width - 100,
            align: 'center',
          });

        // Organizer name
        if (data.organizerName) {
          doc.fillColor('#e94560')
            .fontSize(12)
            .font('Helvetica')
            .text(`Presented by ${data.organizerName}`, 50, 80, {
              width: doc.page.width - 100,
              align: 'center',
            });
        }

        // Ticket type badge
        const ticketTypeWidth = doc.widthOfString(data.ticketType) + 30;
        const ticketTypeX = (doc.page.width - ticketTypeWidth) / 2;
        doc.rect(ticketTypeX, 140, ticketTypeWidth, 30)
          .fill('#e94560');
        doc.fillColor('#ffffff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.ticketType.toUpperCase(), ticketTypeX, 148, {
            width: ticketTypeWidth,
            align: 'center',
          });

        // Attendee section
        doc.fillColor('#333333')
          .fontSize(14)
          .font('Helvetica')
          .text('ATTENDEE', 50, 200);
        doc.fillColor('#1a1a2e')
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(data.attendeeName, 50, 220);
        doc.fillColor('#666666')
          .fontSize(12)
          .font('Helvetica')
          .text(data.attendeeEmail, 50, 248);

        // Event details section
        doc.fillColor('#333333')
          .fontSize(14)
          .font('Helvetica')
          .text('EVENT DETAILS', 50, 300);

        // Date & Time
        doc.fillColor('#e94560')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('DATE', 50, 325);
        doc.fillColor('#1a1a2e')
          .fontSize(14)
          .font('Helvetica')
          .text(data.eventDate, 50, 342);

        doc.fillColor('#e94560')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('TIME', 200, 325);
        doc.fillColor('#1a1a2e')
          .fontSize(14)
          .font('Helvetica')
          .text(data.eventTime, 200, 342);

        // Location
        doc.fillColor('#e94560')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('LOCATION', 50, 380);
        doc.fillColor('#1a1a2e')
          .fontSize(14)
          .font('Helvetica')
          .text(data.eventLocation, 50, 397, {
            width: 300,
          });

        // QR Code section (right side)
        const qrX = doc.page.width - 200 - 50;
        const qrY = 200;

        // QR code background
        doc.rect(qrX - 10, qrY - 10, 220, 260)
          .fillAndStroke('#f5f5f5', '#e0e0e0');

        // QR code
        doc.image(qrImageBuffer, qrX, qrY, { width: 200, height: 200 });

        // Ticket number
        doc.fillColor('#666666')
          .fontSize(10)
          .font('Helvetica')
          .text('TICKET #', qrX, qrY + 210, {
            width: 200,
            align: 'center',
          });
        doc.fillColor('#1a1a2e')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(data.ticketNumber, qrX, qrY + 225, {
            width: 200,
            align: 'center',
          });

        // Divider line
        doc.moveTo(50, 480)
          .lineTo(doc.page.width - 50, 480)
          .strokeColor('#e0e0e0')
          .stroke();

        // Instructions section
        doc.fillColor('#333333')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('IMPORTANT INFORMATION', 50, 500);

        const instructions = [
          'Present this ticket (printed or on your phone) at the entrance',
          'QR code will be scanned for entry - keep it visible',
          'This ticket is valid for one person only',
          'Arrive at least 15 minutes before the event starts',
          'For any queries, contact the event organizer',
        ];

        doc.fillColor('#666666')
          .fontSize(11)
          .font('Helvetica');

        let instructionY = 525;
        instructions.forEach((instruction) => {
          doc.circle(55, instructionY + 5, 2).fill('#e94560');
          doc.fillColor('#666666')
            .text(instruction, 65, instructionY, { width: doc.page.width - 130 });
          instructionY += 20;
        });

        // Footer
        doc.fillColor('#999999')
          .fontSize(10)
          .font('Helvetica')
          .text(
            'This is an official ticket generated by EventKnit. Do not share your QR code with others.',
            50,
            doc.page.height - 80,
            { width: doc.page.width - 100, align: 'center' },
          );

        // Registration ID (small print)
        doc.fillColor('#cccccc')
          .fontSize(8)
          .text(`Registration ID: ${data.registrationId}`, 50, doc.page.height - 50, {
            width: doc.page.width - 100,
            align: 'center',
          });

        doc.end();
      } catch (error: unknown) {
        reject(error);
      }
    });
  }

  /**
   * Generate multiple ticket PDFs as a single merged document
   */
  static async generateBulkTicketPDF(registrationIds: string[]): Promise<Buffer> {
    // Pre-fetch all registrations and generate QR codes before creating PDF
    const ticketDataList: Array<{
      registration: {
        attendee: { firstName: string | null; lastName: string | null; email: string };
        event: { title: string; startDate: Date; location: string | null };
        ticketType: string | null;
      };
      qrImageBuffer: Buffer;
    }> = [];

    for (const registrationId of registrationIds) {
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          attendee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: {
            select: {
              title: true,
              startDate: true,
              location: true,
              organizer: {
                select: {
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                },
              },
            },
          },
        },
      });

      if (!registration) continue;

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(registration.qrCode || registration.id, {
        width: 150,
        margin: 1,
      });
      const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      ticketDataList.push({
        registration: {
          attendee: registration.attendee,
          event: registration.event,
          ticketType: registration.ticketType,
        },
        qrImageBuffer,
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        for (let i = 0; i < ticketDataList.length; i++) {
          if (i > 0) {
            doc.addPage();
          }

          const { registration, qrImageBuffer } = ticketDataList[i];

          // Simplified ticket for bulk printing
          doc.rect(0, 0, doc.page.width, 80).fill('#1a1a2e');
          doc.fillColor('#ffffff')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(registration.event.title, 50, 30, {
              width: doc.page.width - 100,
              align: 'center',
            });

          doc.fillColor('#1a1a2e')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text(
              `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim(),
              50,
              120,
            );

          doc.fillColor('#666666')
            .fontSize(12)
            .font('Helvetica')
            .text(registration.attendee.email, 50, 145);

          doc.text(`Date: ${this.formatDate(registration.event.startDate)}`, 50, 180);
          doc.text(`Location: ${registration.event.location || 'TBD'}`, 50, 200);
          doc.text(`Ticket Type: ${registration.ticketType || 'General'}`, 50, 220);

          doc.image(qrImageBuffer, doc.page.width - 200, 100, { width: 150 });
        }

        doc.end();
      } catch (error: unknown) {
        reject(error);
      }
    });
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format time for display
   */
  private static formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
