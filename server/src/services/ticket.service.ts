import QRCode from 'qrcode';
import { prisma } from '../config/database';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

interface TicketEmailData {
  registration: {
    id: string;
    ticketType: string | null;
    quantity: number;
    totalAmount: Decimal;
    createdAt: Date;
    backupCode?: string | null;
    registrationData?: Record<string, unknown> | null;
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
   */
  static generateTicketData(registrationId: string, eventId: string, attendeeEmail: string): string {
    // Format: registrationId|eventId|email|timestamp
    const timestamp = Date.now();
    return `${registrationId}|${eventId}|${attendeeEmail}|${timestamp}`;
  }

  /**
   * Generate backup ticket code for manual entry (if QR code fails)
   * Format: Short, random alphanumeric code (e.g., A7K9M2)
   * Hard to guess, easy to read and type
   */
  static generateBackupTicketCode(): string {
    // Generate 6-character alphanumeric code (uppercase letters + numbers)
    // Excludes similar-looking characters: 0, O, I, 1, L
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
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

      // Generate QR code
      const ticketData = this.generateTicketData(registration.id, event.id, attendee.email);
      const qrCodeDataUrl = await this.generateQRCode(ticketData);

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
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Your Ticket is Ready!</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">EventKnit</p>
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
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🎫 Ticket Type</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${registration.ticketType || 'General Admission'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; font-size: 14px;">🔢 Quantity</td>
                            <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${registration.quantity}</td>
                          </tr>
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
                            <p style="margin: 8px 0 0 0; color: #999; font-size: 11px; text-align: center;">Use this code if QR scanning fails</p>
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

      // Send email with calendar invite as attachment
      // Ticket emails are critical - users need them for event entry
      const emailResult = await emailService.sendEmail({
        to: attendee.email,
        subject: `Your Ticket for ${event.title} - EventKnit`,
        html,
        isCritical: true,
        attachments: [
          {
            filename: 'event.ics',
            content: Buffer.from(icsContent),
            contentType: 'text/calendar',
          },
        ],
      });

      if (emailResult.success) {
        if (emailResult.attempts > 1) {
          logger.info(`Ticket email sent to ${attendee.email} for event: ${event.id} after ${emailResult.attempts} attempts`);
        } else {
          logger.info(`Ticket email sent to ${attendee.email} for event: ${event.id}`);
        }
      } else {
        logger.error(`Failed to send ticket email to ${attendee.email} after ${emailResult.attempts} attempts:`, emailResult.error);
        throw new Error(`Failed to send ticket email after ${emailResult.attempts} attempts: ${emailResult.error?.message}`);
      }
    } catch (error) {
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

    // Generate QR code
    const ticketData = this.generateTicketData(registration.id, registration.eventId, registration.attendee.email);
    const qrCodeDataUrl = await this.generateQRCode(ticketData);

    return {
      registration,
      qrCode: qrCodeDataUrl,
      ticketData,
    };
  }
}


