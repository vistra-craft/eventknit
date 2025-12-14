import QRCode from 'qrcode';
import { prisma } from '../config/database.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { Decimal } from '@prisma/client/runtime/library';
import { TicketSecurityService } from './ticket-security.service.js';
import { config } from '../config/index.js';

interface TicketEmailData {
  registration: {
    id: string;
    ticketType: string | null; // Deprecated: Use ticketLineItems
    quantity: number; // Deprecated: Use ticketLineItems
    totalAmount: Decimal;
    createdAt: Date;
    backupCode?: string | null;
    registrationData?: Record<string, unknown> | null;
    ticketLineItems?: Array<{
      ticketType: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    event: {
      id: string;
      title: string;
      description: string | null;
      startDate: Date;
      endDate: Date | null;
      startTime: string | null;
      endTime: string | null;
      venue: string | null;
      location: string;
      address: string | null;
      isOnline: boolean;
      onlineLink: string | null;
      image: string | null;
      organizer: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        organizationName: string | null;
        email: string;
      };
    };
    attendee: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      companyAffiliation?: string | null;
    };
  };
}

export class TicketService {
  /**
   * Generate QR code for a ticket
   */
  static async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate ticket data string for QR code
   * Format: registrationId|eventId|email|timestamp|signature
   */
  static generateTicketData(registrationId: string, eventId: string, attendeeEmail: string): string {
    // Format: registrationId|eventId|email|timestamp
    const timestamp = Date.now();
    const payload = `${registrationId}|${eventId}|${attendeeEmail}|${timestamp}`;
    
    // Generate signature using TicketSecurityService
    const signature = TicketSecurityService.generateSignature(payload);
    
    // Return signed ticket data
    return `${payload}|${signature}`;
  }

  /**
   * Generate backup ticket code for manual entry (if QR code fails)
   * Format: 10-character alphanumeric code (e.g., ABCDEFGHJK)
   * Hard to guess, easy to read and type
   * Excludes similar-looking characters: 0, O, I, 1, L
   */
  static generateBackupTicketCode(): string {
    // Generate 10-character alphanumeric code (uppercase letters + numbers)
    // Excludes similar-looking characters: 0, O, I, 1, L
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Format date for display
   */
  static formatEventDate(startDate: Date, endDate: Date | null, startTime: string | null, endTime: string | null): string {
    const start = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    let dateString = start.toLocaleDateString('en-US', options);

    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const time12 = new Date(start.getFullYear(), start.getMonth(), start.getDate(), parseInt(hours, 10), parseInt(minutes, 10))
        .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      dateString += ` at ${time12}`;
    }

    if (endDate && new Date(endDate).getTime() !== start.getTime()) {
      const end = new Date(endDate);
      dateString += ` - ${end.toLocaleDateString('en-US', options)}`;
      if (endTime) {
        const [hours, minutes] = endTime.split(':');
        const time12 = new Date(end.getFullYear(), end.getMonth(), end.getDate(), parseInt(hours, 10), parseInt(minutes, 10))
          .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        dateString += ` at ${time12}`;
      }
    } else if (endTime && endTime !== startTime) {
      const [hours, minutes] = endTime.split(':');
      const time12 = new Date(start.getFullYear(), start.getMonth(), start.getDate(), parseInt(hours, 10), parseInt(minutes, 10))
        .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      dateString += ` - ${time12}`;
    }

    return dateString;
  }

  /**
   * Generate calendar invite (.ics) content
   */
  static generateCalendarInvite(data: TicketEmailData): string {
    const { registration } = data;
    const { event, attendee } = registration;

    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date: Date): string => {
      return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventKnit//Event Ticket//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${registration.id}@eventknit.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || 'Event ticket from EventKnit'}`,
      event.venue ? `LOCATION:${event.venue}, ${event.location}` : `LOCATION:${event.location}`,
      `ORGANIZER;CN=${event.organizer.organizationName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`}:MAILTO:${event.organizer.email}`,
      `ATTENDEE;CN=${attendee.firstName || ''} ${attendee.lastName || ''};RSVP=TRUE:MAILTO:${attendee.email}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Send ticket email to attendee
   */
  static async sendTicketEmail(registration: TicketEmailData['registration']): Promise<void> {
    try {
      const { event, attendee } = registration;

      // Use stored QR code if available (generated at registration time, like Eventbrite/vf-ticket)
      // Otherwise generate on-the-fly (backward compatibility for existing registrations)
      let qrCodeDataUrl: string;
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
        select: { qrCodeDataUrl: true, qrCodeGeneratedAt: true },
      });

      if (registrationWithQR?.qrCodeDataUrl) {
        // Use stored QR code (faster, like Eventbrite/vf-ticket)
        qrCodeDataUrl = registrationWithQR.qrCodeDataUrl;
        logger.debug(`Using stored QR code for registration ${registration.id} (generated at: ${registrationWithQR.qrCodeGeneratedAt})`);
      } else {
        // Generate QR code on-the-fly (backward compatibility for old registrations)
        logger.debug(`Generating QR code on-the-fly for registration ${registration.id} (no stored QR code found)`);
        const ticketData = this.generateTicketData(registration.id, event.id, attendee.email);
        qrCodeDataUrl = await this.generateQRCode(ticketData);
        
        // Store generated QR code for future use
        try {
          await prisma.eventRegistration.update({
            where: { id: registration.id },
            data: {
              qrCodeDataUrl,
              qrCodeGeneratedAt: new Date(),
            },
          });
          logger.debug(`Stored generated QR code for registration ${registration.id}`);
        } catch (storeError) {
          // Log but don't fail - QR code is still available for email
          logger.warn(`Failed to store QR code for registration ${registration.id}:`, storeError);
        }
      }

      // Generate calendar invite
      const icsContent = this.generateCalendarInvite({ registration });

      // Format event date
      const eventDate = this.formatEventDate(event.startDate, event.endDate, event.startTime, event.endTime);

      // Generate Google Calendar link
      // eslint-disable-next-line no-undef
      const googleCalendarParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${event.endDate ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] : new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        details: event.description || '',
        location: event.venue ? `${event.venue}, ${event.location}` : event.location,
      });
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?${googleCalendarParams.toString()}`;

      // Generate Outlook Calendar link
      // eslint-disable-next-line no-undef
      const outlookCalendarParams = new URLSearchParams({
        subject: event.title,
        startdt: new Date(event.startDate).toISOString(),
        enddt: (event.endDate ? new Date(event.endDate) : new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000)).toISOString(),
        body: event.description || '',
        location: event.venue ? `${event.venue}, ${event.location}` : event.location,
      });
      const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookCalendarParams.toString()}`;

      // Beautiful ticket email template
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Ticket - ${event.title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Registration Confirmed!</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your ticket is ready - EventKnit</p>
                    </td>
                  </tr>
                  
                  <!-- Registration Confirmation Message -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; background-color: #f0f9ff; border-bottom: 1px solid #e0e7ff;">
                      <div style="text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">✅ Your registration has been confirmed!</p>
                        <p style="margin: 0; color: #1e40af; font-size: 14px;">We're excited to have you join us. Your ticket details are below.</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Event Image -->
                  ${event.image ? `
                  <tr>
                    <td style="padding: 0;">
                      <img src="${event.image}" alt="${event.title}" style="width: 100%; height: 200px; object-fit: cover; display: block;">
                    </td>
                  </tr>
                  ` : ''}

                  <!-- Event Details -->
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">${event.title}</h2>
                      
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px; width: 120px;">📅 Date & Time</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${eventDate}</td>
                          </tr>
                          ${event.venue ? `
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Venue</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${event.venue}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Location</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${event.location}</td>
                          </tr>
                          ${event.isOnline && event.onlineLink ? `
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🔗 Online Link</td>
                            <td style="padding: 8px 0;">
                              <a href="${event.onlineLink}" style="color: #667eea; text-decoration: none; font-weight: 600;">${event.onlineLink}</a>
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">👤 Attendee</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${attendee.firstName || ''} ${attendee.lastName || ''}</td>
                          </tr>
                          ${attendee.companyAffiliation ? `
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🏢 Company</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${attendee.companyAffiliation}</td>
                          </tr>
                          ` : ''}
                          ${registration.ticketLineItems && registration.ticketLineItems.length > 0 ? `
                          <tr>
                            <td colspan="2" style="padding: 8px 0;">
                              <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; margin-top: 8px;">
                                <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; font-weight: 600;">🎫 Tickets</p>
                                ${registration.ticketLineItems.map((item, index) => `
                                  <div style="padding: 6px 0; ${index < registration.ticketLineItems!.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">
                                    <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">${item.ticketType}</span>
                                    <span style="color: #666; font-size: 14px; margin-left: 8px;">x${item.quantity}</span>
                                    <span style="color: #1a1a1a; font-size: 14px; font-weight: 600; float: right;">$${item.totalPrice.toFixed(2)}</span>
                                  </div>
                                `).join('')}
                              </div>
                            </td>
                          </tr>
                          ` : `
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🎫 Ticket Type</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${registration.ticketType || 'General Admission'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🔢 Quantity</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${registration.quantity}</td>
                          </tr>
                          `}
                          ${Number(registration.totalAmount) > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">💰 Amount Paid</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">$${Number(registration.totalAmount).toFixed(2)}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>

                      ${event.description ? `
                      <div style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">About This Event</h3>
                        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${event.description}</p>
                      </div>
                      ` : ''}
                    </td>
                  </tr>

                  <!-- Ticket Badge Section -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 30px; border: 2px dashed #667eea;">
                        <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">Your Event Ticket</h3>
                        
                        <!-- Professional Ticket Badge -->
                        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 20px auto; max-width: 400px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border: 2px solid #667eea;">
                          <!-- Attendee Name -->
                          <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 22px; font-weight: 700; text-align: center;">${attendee.firstName || ''} ${attendee.lastName || ''}</h2>
                          
                          <!-- Company/Affiliation -->
                          ${attendee.companyAffiliation ? `
                          <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; text-align: center;">${attendee.companyAffiliation}</p>
                          ` : ''}
                          
                          <!-- Event Name -->
                          <div style="border-top: 2px solid #e9ecef; border-bottom: 2px solid #e9ecef; padding: 15px 0; margin: 15px 0;">
                            <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 600; text-align: center;">${event.title}</p>
                          </div>
                          
                          <!-- Venue -->
                          <p style="margin: 10px 0; color: #666; font-size: 14px; text-align: center;">
                            ${event.venue ? event.venue : ''}${event.venue && event.location ? ', ' : ''}${event.location}
                          </p>
                          
                          <!-- QR Code -->
                          <div style="margin: 20px 0; text-align: center;">
                            <img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto; border: 2px solid #e9ecef; border-radius: 8px; padding: 10px; background-color: #ffffff;">
                          </div>
                          
                          <!-- Backup Code -->
                          ${registration.backupCode ? `
                          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-top: 15px; border: 1px solid #e9ecef;">
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; text-align: center; font-weight: 600;">BACKUP ENTRY CODE</p>
                            <p style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: 4px; font-family: 'Courier New', monospace;">${registration.backupCode}</p>
                            <p style="margin: 8px 0 0 0; color: #999; font-size: 11px; text-align: center;">Use this code if QR scanning fails. Keep this code secure.</p>
                          </div>
                          ` : ''}
                        </div>
                        
                        <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">Present this ticket (QR code or backup code) at the event entrance</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Calendar Links -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">Add to Calendar</h3>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                          <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #4285f4; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 5px;">📅 Google Calendar</a>
                          <a href="${outlookCalendarUrl}" style="display: inline-block; background-color: #0078d4; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 5px;">📅 Outlook</a>
                          <a href="data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}" download="event.ics" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 5px;">📥 Download .ics</a>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Organizer Info -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; border-top: 1px solid #e9ecef;">
                      <div style="margin-top: 20px;">
                        <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Organized By</h3>
                        <p style="margin: 0; color: #666; font-size: 14px;">
                          ${event.organizer.organizationName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`}
                        </p>
                        <p style="margin: 5px 0 0 0;">
                          <a href="mailto:${event.organizer.email}" style="color: #667eea; text-decoration: none; font-size: 14px;">Contact Organizer</a>
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- View Ticket Link -->
                  <tr>
                    <td style="padding: 0 30px 20px 30px; text-align: center;">
                      <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; border: 1px solid #bae6fd;">
                        <p style="margin: 0 0 15px 0; color: #1e40af; font-size: 14px; font-weight: 600;">View Your Ticket Online</p>
                        <a href="${config.frontend.url}/user/tickets/${registration.id}?email=${encodeURIComponent(attendee.email)}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                          View Ticket
                        </a>
                        <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 12px;">You can view, download, or share your ticket anytime</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        Need help? Contact us at <a href="mailto:support@eventknit.com" style="color: #667eea; text-decoration: none;">support@eventknit.com</a>
                      </p>
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                        © ${new Date().getFullYear()} EventKnit. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Prepare attachments: calendar invite, PDF ticket, and QR code PNG
      const attachments: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
        encoding?: string;
      }> = [
        {
          filename: 'event.ics',
          content: Buffer.from(icsContent),
          contentType: 'text/calendar',
        },
        // QR code PNG attachment (always available)
        {
          filename: `${event.title.replace(/[^a-z0-9]/gi, '-')}-qr-code.png`,
          content: qrCodeDataUrl.split(';base64,')[1] || qrCodeDataUrl,
          encoding: 'base64',
          contentType: 'image/png',
        },
      ];

      // Try to generate PDF ticket (always attempt, fallback to HTML if puppeteer unavailable)
      try {
        const pdfBuffer = await this.generateTicketPDF(registration.id);
        // Check if it's PDF (Buffer with PDF header) or HTML (fallback)
        const isPDF = pdfBuffer.length > 4 && pdfBuffer[0] === 0x25 && pdfBuffer[1] === 0x50 && pdfBuffer[2] === 0x44 && pdfBuffer[3] === 0x46; // %PDF
        
        if (isPDF) {
          attachments.push({
            filename: `${event.title.replace(/[^a-z0-9]/gi, '-')}-ticket.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
        } else {
          // HTML fallback - attach as HTML file
          attachments.push({
            filename: `${event.title.replace(/[^a-z0-9]/gi, '-')}-ticket.html`,
            content: pdfBuffer,
            contentType: 'text/html',
          });
        }
      } catch (pdfError) {
        // PDF generation failed - log but continue with email
        logger.warn(`Failed to generate PDF ticket for registration ${registration.id}:`, pdfError);
        // Email will still be sent with QR code PNG and calendar invite
      }

      // Send email with attachments
      // Ticket emails are critical - users need them for event entry
      const emailResult = await emailService.sendEmail({
        to: attendee.email,
        subject: `Your Ticket for ${event.title} - EventKnit`,
        html,
        isCritical: true,
        attachments,
      });

      // Update email status in database
      if (emailResult.success) {
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            ticketEmailSentAt: new Date(),
            ticketEmailStatus: 'SUCCESS',
            ticketEmailError: null,
          },
        });
        
        if (emailResult.attempts > 1) {
          logger.info(`Ticket email sent to ${attendee.email} for event: ${event.id} after ${emailResult.attempts} attempts`);
        } else {
          logger.info(`Ticket email sent to ${attendee.email} for event: ${event.id}`);
        }
      } else {
        const errorMessage = emailResult.error?.message || 'Unknown error';
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            ticketEmailStatus: 'FAILED',
            ticketEmailError: errorMessage.substring(0, 500), // Limit error message length
          },
        });
        
        logger.error(`Failed to send ticket email to ${attendee.email} after ${emailResult.attempts} attempts:`, emailResult.error);
        throw new Error(`Failed to send ticket email after ${emailResult.attempts} attempts: ${errorMessage}`);
      }
    } catch (error) {
      // Update status even if exception occurs
      try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            ticketEmailStatus: 'FAILED',
            ticketEmailError: errorMessage.substring(0, 500),
          },
        });
      } catch (updateError) {
        logger.error('Failed to update email status in database:', updateError);
      }
      
      logger.error('Failed to send ticket email:', error);
      throw error;
    }
  }

  /**
   * Send payment pending email for paid events
   * This email is sent when registration is created but payment is still pending
   */
  static async sendPaymentPendingEmail(registration: TicketEmailData['registration'], paymentUrl?: string): Promise<void> {
    try {
      const { event, attendee } = registration;

      // Format event date
      const eventDate = this.formatEventDate(event.startDate, event.endDate, event.startTime, event.endTime);

      // Payment pending email template
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Pending - ${event.title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⏳ Payment Pending</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Complete your registration</p>
                    </td>
                  </tr>

                  <!-- Event Image -->
                  ${event.image ? `
                  <tr>
                    <td style="padding: 0;">
                      <img src="${event.image}" alt="${event.title}" style="width: 100%; height: 200px; object-fit: cover; display: block;">
                    </td>
                  </tr>
                  ` : ''}

                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">${event.title}</h2>
                      
                      <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                        Thank you for registering for <strong>${event.title}</strong>! Your registration has been received, but we're waiting for your payment to be confirmed.
                      </p>

                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600;">⚠️ Your ticket will be sent once payment is confirmed</p>
                      </div>
                      
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px; width: 120px;">📅 Date & Time</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${eventDate}</td>
                          </tr>
                          ${event.venue ? `
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Venue</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${event.venue}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Location</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${event.location}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">👤 Attendee</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${attendee.firstName || ''} ${attendee.lastName || ''}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🎫 Ticket Type</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${registration.ticketType || 'General Admission'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🔢 Quantity</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${registration.quantity}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">💰 Amount Due</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">$${Number(registration.totalAmount).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>

                      ${paymentUrl ? `
                      <!-- Payment Button -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${paymentUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          Complete Payment
                        </a>
                      </div>
                      ` : ''}

                      <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                        If you've already completed payment, please allow a few minutes for processing. You'll receive your ticket via email once payment is confirmed.
                      </p>

                      ${event.description ? `
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                        <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">About This Event</h3>
                        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">${event.description}</p>
                      </div>
                      ` : ''}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-align: center;">
                        Need help? Contact us at <a href="mailto:support@eventknit.com" style="color: #667eea; text-decoration: none;">support@eventknit.com</a>
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #bbb; text-align: center;">
                        This is an automated message. Please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Payment pending emails are important but not as critical as ticket emails
      const emailResult = await emailService.sendEmail({
        to: attendee.email,
        subject: `Payment Pending - ${event.title}`,
        html,
        isCritical: false, // Important but not critical - ticket email will be sent after payment
      });

      if (emailResult.success) {
        if (emailResult.attempts > 1) {
          logger.info(`Payment pending email sent to: ${attendee.email} for event: ${event.id} after ${emailResult.attempts} attempts`);
        } else {
          logger.info(`Payment pending email sent to: ${attendee.email} for event: ${event.id}`);
        }
      } else {
        logger.warn(`Failed to send payment pending email to ${attendee.email} after ${emailResult.attempts} attempts:`, emailResult.error);
        // Don't throw - payment pending email failure is not critical
        // User can still complete payment and receive ticket email
      }
    } catch (error) {
      logger.error('Failed to send payment pending email:', error);
      // Don't throw - payment pending email failure is not critical
    }
  }

  /**
   * Get ticket by registration ID
   */
  static async getTicketByRegistrationId(registrationId: string) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
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
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    // Use stored QR code if available (generated at registration time, like Eventbrite/vf-ticket)
    // Otherwise generate on-the-fly (backward compatibility for existing registrations)
    let qrCodeDataUrl: string;
    if (registration.qrCodeDataUrl) {
      // Use stored QR code (faster, like Eventbrite/vf-ticket)
      qrCodeDataUrl = registration.qrCodeDataUrl;
      logger.debug(`Using stored QR code for registration ${registrationId} (generated at: ${registration.qrCodeGeneratedAt})`);
    } else {
      // Generate QR code on-the-fly (backward compatibility for old registrations)
      logger.debug(`Generating QR code on-the-fly for registration ${registrationId} (no stored QR code found)`);
      const ticketData = this.generateTicketData(registration.id, registration.eventId, registration.attendee.email);
      qrCodeDataUrl = await this.generateQRCode(ticketData);
      
      // Store generated QR code for future use
      try {
        await prisma.eventRegistration.update({
          where: { id: registrationId },
          data: {
            qrCodeDataUrl,
            qrCodeGeneratedAt: new Date(),
          },
        });
        logger.debug(`Stored generated QR code for registration ${registrationId}`);
      } catch (storeError) {
        // Log but don't fail - QR code is still available
        logger.warn(`Failed to store QR code for registration ${registrationId}:`, storeError);
      }
    }

    return {
      id: registration.id,
      registrationId: registration.id,
      eventId: registration.eventId,
      eventTitle: registration.event.title || '',
      attendeeName: `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim() || registration.attendee.email || '',
      attendeeEmail: registration.attendee.email || '',
      ticketType: registration.ticketType || undefined,
      qrCode: qrCodeDataUrl,
      backupCode: registration.backupCode || undefined,
      createdAt: registration.createdAt.toISOString(),
      registration,
      ticketData,
    };
  }

  /**
   * Generate ticket PDF
   * Creates a professional PDF ticket that can be downloaded and printed
   * Uses puppeteer for HTML to PDF conversion (Eventbrite-style)
   */
  static async generateTicketPDF(registrationId: string): Promise<Buffer> {
    try {
      // Get ticket data
      const ticketData = await this.getTicketByRegistrationId(registrationId);
      const { registration, qrCode } = ticketData;
      const { event, attendee } = registration;

      // Format event date
      const eventDate = this.formatEventDate(event.startDate, event.endDate, event.startTime, event.endTime);

      // Generate HTML content for PDF
      // Note: For production, install puppeteer for server-side PDF generation:
      // npm install puppeteer
      // Otherwise, return HTML that frontend can convert to PDF
      const registrationForHTML: TicketEmailData['registration'] = {
        ...registration,
        registrationData: registration.registrationData && typeof registration.registrationData === 'object' && !Array.isArray(registration.registrationData)
          ? registration.registrationData as Record<string, unknown>
          : null,
      };
      const htmlContent = this.generateTicketHTML(registrationForHTML, event, attendee, eventDate, qrCode);
      
      // Try to use puppeteer for PDF generation (if available)
      // Check if puppeteer module exists using dynamic import
      try {
        // Use dynamic import to avoid TypeScript checking the import
        // @ts-expect-error - puppeteer is optional dependency
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default || puppeteerModule;
        
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px',
          },
        });
        
        await browser.close();
        return Buffer.from(pdfBuffer);
      } catch {
        // If puppeteer is not available, return HTML
        // Frontend can use browser's print-to-PDF or a client-side library
        logger.warn('Puppeteer not available, returning HTML for client-side PDF conversion');
        const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
        return htmlBuffer;
      }
    } catch (error) {
      logger.error('Failed to generate ticket PDF:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for ticket (used for PDF generation)
   */
  private static generateTicketHTML(
    registration: TicketEmailData['registration'],
    event: TicketEmailData['registration']['event'],
    attendee: TicketEmailData['registration']['attendee'],
    eventDate: string,
    qrCode: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #1a1a1a;
          }
          .ticket {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
          }
          .header h1 {
            color: #667eea;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 16px;
          }
          .event-title {
            font-size: 24px;
            font-weight: 700;
            margin: 20px 0;
            color: #1a1a1a;
            text-align: center;
          }
          .ticket-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #666;
            font-size: 14px;
            flex: 1;
          }
          .info-value {
            color: #1a1a1a;
            font-weight: 600;
            font-size: 14px;
            flex: 2;
            text-align: right;
          }
          .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .qr-section h3 {
            margin: 0 0 15px 0;
            color: #1a1a1a;
            font-size: 18px;
            font-weight: 600;
          }
          .qr-code {
            max-width: 200px;
            width: 200px;
            height: 200px;
            margin: 0 auto;
            display: block;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 10px;
            background: white;
          }
          .backup-code {
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border-radius: 8px;
            text-align: center;
          }
          .backup-code-label {
            font-size: 12px;
            color: #856404;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .backup-code-value {
            font-size: 24px;
            font-weight: 700;
            color: #856404;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          .backup-code-note {
            font-size: 11px;
            color: #856404;
            margin-top: 5px;
          }
          .event-description {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .event-description h3 {
            margin: 0 0 10px 0;
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 600;
          }
          .event-description p {
            margin: 0;
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .ticket {
              box-shadow: none;
              border: 1px solid #e9ecef;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>EventKnit</h1>
            <p>Your Event Ticket</p>
          </div>
          
          <div class="event-title">${event.title}</div>
          
          <div class="ticket-info">
            <div class="info-row">
              <span class="info-label">📅 Date & Time</span>
              <span class="info-value">${eventDate}</span>
            </div>
            ${event.venue ? `
            <div class="info-row">
              <span class="info-label">📍 Venue</span>
              <span class="info-value">${event.venue}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">📍 Location</span>
              <span class="info-value">${event.location}</span>
            </div>
            ${event.isOnline && event.onlineLink ? `
            <div class="info-row">
              <span class="info-label">🔗 Online Link</span>
              <span class="info-value">${event.onlineLink}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">👤 Attendee</span>
              <span class="info-value">${attendee.firstName || ''} ${attendee.lastName || ''}</span>
            </div>
            ${attendee.companyAffiliation ? `
            <div class="info-row">
              <span class="info-label">🏢 Company</span>
              <span class="info-value">${attendee.companyAffiliation}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">🎫 Ticket Type</span>
              <span class="info-value">${registration.ticketType || 'General Admission'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🔢 Quantity</span>
              <span class="info-value">${registration.quantity}</span>
            </div>
            ${Number(registration.totalAmount) > 0 ? `
            <div class="info-row">
              <span class="info-label">💰 Amount Paid</span>
              <span class="info-value">$${Number(registration.totalAmount).toFixed(2)}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="qr-section">
            <h3>Scan QR Code for Entry</h3>
            <img src="${qrCode}" alt="Ticket QR Code" class="qr-code" />
            ${registration.backupCode ? `
            <div class="backup-code">
              <div class="backup-code-label">BACKUP ENTRY CODE</div>
              <div class="backup-code-value">${registration.backupCode}</div>
              <div class="backup-code-note">Use this code if QR scanning fails. Keep this code secure.</div>
            </div>
            ` : ''}
          </div>
          
          ${event.description ? `
          <div class="event-description">
            <h3>About This Event</h3>
            <p>${event.description}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Organized by:</strong> ${event.organizer.organizationName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`}</p>
            <p><strong>Contact:</strong> ${event.organizer.email}</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} EventKnit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}


