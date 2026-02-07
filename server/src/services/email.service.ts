import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  retries?: number; // Optional: number of retry attempts (default: 3)
  isCritical?: boolean; // Optional: mark as critical email (affects retry behavior)
}

export interface EmailResult {
  success: boolean;
  attempts: number;
  error?: Error;
}

class EmailService {
  private transporter;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly CRITICAL_MAX_RETRIES = 5;
  private readonly INITIAL_RETRY_DELAY_MS = 1000; // 1 second
  private readonly MAX_RETRY_DELAY_MS = 30000; // 30 seconds

  constructor() {
    // Validate email configuration
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured: SMTP_USER and SMTP_PASSWORD are required');
      logger.warn('Ticket emails will fail. Please configure SMTP credentials in environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });

    // Verify connection on startup (non-blocking)
    this.transporter.verify().then(() => {
      logger.info('Email service configured and verified successfully');
    }).catch((error) => {
      logger.error('Email service configuration error:', error);
      logger.error('Please check SMTP credentials. Emails will fail until configured.');
    });
  }

  /**
   * Calculate exponential backoff delay
   * Formula: min(initialDelay * 2^attempt, maxDelay)
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
    return Math.min(delay, this.MAX_RETRY_DELAY_MS);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
     
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send email with retry logic and exponential backoff
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const maxRetries = options.retries ?? (options.isCritical ? this.CRITICAL_MAX_RETRIES : this.DEFAULT_MAX_RETRIES);
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      attempts++;
      try {
        const mailOptions: nodemailer.SendMailOptions = {
          from: config.email.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        };

        // Add attachments if provided
        if (options.attachments && options.attachments.length > 0) {
          mailOptions.attachments = options.attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          }));
        }

        await this.transporter.sendMail(mailOptions);
        
        // Success - log if it was a retry
        if (attempt > 0) {
          logger.info(`Email sent successfully after ${attempts} attempts to: ${options.to}`);
        } else {
          logger.info(`Email sent successfully to: ${options.to}`);
        }

        return { success: true, attempts };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          // Final attempt failed - log persistent failure
          logger.error(`Failed to send email after ${attempts} attempts to: ${options.to}`, {
            error: lastError.message,
            subject: options.subject,
            isCritical: options.isCritical || false,
            attempts,
          });

          // Log persistent failure for admin review
          if (options.isCritical) {
            logger.warn(`CRITICAL EMAIL FAILURE: ${options.subject} to ${options.to} failed after ${attempts} attempts`);
          }
        } else {
          // Calculate delay for next retry
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(`Email send attempt ${attempts} failed, retrying in ${delay}ms...`, {
            to: options.to,
            subject: options.subject,
            error: lastError.message,
          });

          // Wait before retrying
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      attempts,
      error: lastError,
    };
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.frontend.url}/auth/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a6cf7;">Welcome to EventKnit!</h1>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4a6cf7;">${verificationUrl}</p>
            <p><strong>This verification link expires in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: 'Verify Your EventKnit Email',
      html,
      isCritical: true, // Email verification is critical
    });

    if (!result.success) {
      throw new Error(`Failed to send verification email after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a6cf7;">Welcome to EventKnit!</h1>
            <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f5f5f5; border: 2px dashed #4a6cf7; border-radius: 8px; padding: 20px; display: inline-block;">
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4a6cf7; margin: 0;">${code}</p>
              </div>
            </div>
            <p style="text-align: center;"><strong>This verification code expires in 10 minutes.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: 'Your EventKnit Verification Code',
      html,
      isCritical: true, // Verification code is critical
    });

    if (!result.success) {
      throw new Error(`Failed to send verification code after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.frontend.url}/auth/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a6cf7;">Reset Your Password</h1>
            <p>We received a request to reset the password for your EventKnit account.</p>
            <p>To reset your password, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4a6cf7;">${resetUrl}</p>
            <p><strong>This password reset link expires in 1 hour and can only be used once.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: 'Reset Your EventKnit Password',
      html,
      isCritical: true, // Password reset is critical
    });

    if (!result.success) {
      throw new Error(`Failed to send password reset email after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }

  async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const magicLinkUrl = `${config.frontend.url}/auth/magic-link/verify?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Login to EventKnit</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a6cf7;">Login to EventKnit</h1>
            <p>Click the button below to securely log in to your EventKnit account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLinkUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Login to EventKnit</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4a6cf7;">${magicLinkUrl}</p>
            <p><strong>This login link expires in 15 minutes and can only be used once.</strong></p>
            <p>If you didn't request this login link, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: 'Login to EventKnit',
      html,
      isCritical: true, // Magic link login is critical
    });

    if (!result.success) {
      throw new Error(`Failed to send magic link email after ${result.attempts} attempts: ${result.error?.message}`);
    }
  }

  /**
   * Send email notification when admin creates an account
   * Option A: Includes temporary password with instructions to change on first login
   */
  async sendAdminCreatedAccountEmail(
    email: string,
    firstName: string,
    password: string,
    role: string,
    organizationName?: string,
  ): Promise<void> {
    const loginUrl = `${config.frontend.url}/auth/login`;
    const supportEmail = config.email.from || 'support@eventknit.com';

    const roleDisplayName = role === 'ORGANIZER' ? 'Organizer' : role;
    const organizationSection = organizationName
      ? `
            <p><strong>Organization:</strong> ${organizationName}</p>
          `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to EventKnit</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a6cf7;">Welcome to EventKnit, ${firstName}!</h1>
            <p>An administrator has created an account for you on EventKnit. Your account details are below:</p>
            
            <div style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${roleDisplayName}</p>
              ${organizationSection}
              <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
            </div>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Security Notice:</strong> Please change your password immediately after your first login for security purposes.</p>
            </div>

            <h2 style="color: #4a6cf7; margin-top: 30px;">Getting Started</h2>
            <ol>
              <li>Click the button below to log in to your account</li>
              <li>Use your email and the temporary password provided above</li>
              <li>You will be prompted to change your password on first login</li>
              <li>Start creating and managing your events!</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Login to EventKnit</a>
            </div>

            <p>Or visit: <a href="${loginUrl}" style="color: #4a6cf7;">${loginUrl}</a></p>

            <h2 style="color: #4a6cf7; margin-top: 30px;">Security Best Practices</h2>
            <ul>
              <li>Change your password immediately after first login</li>
              <li>Use a strong, unique password</li>
              <li>Never share your password with anyone</li>
              <li>Enable two-factor authentication if available</li>
              <li>Log out when using shared devices</li>
            </ul>

            <h2 style="color: #4a6cf7; margin-top: 30px;">Need Help?</h2>
            <p>If you have any questions or need assistance, please contact our support team:</p>
            <p><strong>Support Email:</strong> <a href="mailto:${supportEmail}" style="color: #4a6cf7;">${supportEmail}</a></p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message from EventKnit. Please do not reply to this email.</p>
            <p style="font-size: 12px; color: #666;">If you did not expect this email, please contact support immediately.</p>
          </div>
        </body>
      </html>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: 'Welcome to EventKnit - Your Account Has Been Created',
      html,
      isCritical: true, // Account creation notification is critical
    });

    if (!result.success) {
      throw new Error(
        `Failed to send admin-created account email after ${result.attempts} attempts: ${result.error?.message}`,
      );
    }
  }

  /**
   * Send notification email when a ticket transfer is offered
   */
  async sendTicketTransferOfferEmail(
    recipientEmail: string,
    data: {
      recipientName?: string;
      senderName: string;
      senderEmail: string;
      eventTitle: string;
      eventDate: string;
      eventLocation: string;
      ticketType?: string;
      quantity: number;
      transferToken: string;
      message?: string;
      expiresAt: Date;
    },
  ): Promise<EmailResult> {
    const acceptUrl = `${config.frontend.url}/tickets/transfer/accept?token=${data.transferToken}`;
    const expiresFormatted = data.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const greeting = data.recipientName ? `Hello ${data.recipientName}` : 'Hello';
    const ticketText = data.quantity > 1 ? `${data.quantity} tickets` : 'a ticket';
    const ticketTypeText = data.ticketType ? ` (${data.ticketType})` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Transfer Offer</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4a6cf7 0%, #7c3aed 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎫 Ticket Transfer Offer</h1>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px;">${greeting},</p>

              <p><strong>${data.senderName}</strong> (${data.senderEmail}) wants to transfer ${ticketText}${ticketTypeText} to you for:</p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #4a6cf7; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h2 style="margin: 0 0 10px 0; color: #4a6cf7; font-size: 20px;">${data.eventTitle}</h2>
                <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
                <p style="margin: 5px 0; color: #666;">📍 ${data.eventLocation}</p>
                ${data.ticketType ? `<p style="margin: 5px 0; color: #666;">🎟️ ${data.ticketType} × ${data.quantity}</p>` : ''}
              </div>

              ${data.message ? `
              <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">"${data.message}"</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">— Message from ${data.senderName}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="background-color: #4a6cf7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Accept Transfer</a>
              </div>

              <p style="text-align: center; color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4a6cf7; text-align: center; font-size: 12px;">${acceptUrl}</p>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">⏰ <strong>This offer expires on ${expiresFormatted}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">If you don't accept before then, the transfer will be automatically cancelled.</p>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                If you don't know ${data.senderName} or weren't expecting this transfer, you can safely ignore this email.
              </p>
            </div>

            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `🎫 ${data.senderName} wants to transfer a ticket to you for ${data.eventTitle}`,
      html,
      isCritical: true,
    });
  }

  /**
   * Send notification email when a ticket transfer is accepted
   */
  async sendTicketTransferAcceptedEmail(
    senderEmail: string,
    data: {
      senderName: string;
      recipientName: string;
      recipientEmail: string;
      eventTitle: string;
      eventDate: string;
      ticketType?: string;
      quantity: number;
    },
  ): Promise<EmailResult> {
    const ticketText = data.quantity > 1 ? `${data.quantity} tickets` : 'your ticket';
    const ticketTypeText = data.ticketType ? ` (${data.ticketType})` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Transfer Accepted</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Transfer Accepted!</h1>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px;">Hello ${data.senderName},</p>

              <p>Great news! <strong>${data.recipientName}</strong> (${data.recipientEmail}) has accepted ${ticketText}${ticketTypeText} for:</p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h2 style="margin: 0 0 10px 0; color: #059669; font-size: 20px;">${data.eventTitle}</h2>
                <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
                ${data.ticketType ? `<p style="margin: 5px 0; color: #666;">🎟️ ${data.ticketType} × ${data.quantity}</p>` : ''}
              </div>

              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  The ticket has been successfully transferred. Your original ticket is no longer valid.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                Thank you for using EventKnit for your event ticketing needs.
              </p>
            </div>

            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: senderEmail,
      subject: `✅ ${data.recipientName} accepted your ticket transfer for ${data.eventTitle}`,
      html,
    });
  }

  /**
   * Send notification email when a ticket transfer is cancelled
   */
  async sendTicketTransferCancelledEmail(
    recipientEmail: string,
    data: {
      recipientName?: string;
      cancelledByName: string;
      cancelledBySender: boolean;
      eventTitle: string;
      eventDate: string;
      ticketType?: string;
      quantity: number;
    },
  ): Promise<EmailResult> {
    const greeting = data.recipientName ? `Hello ${data.recipientName}` : 'Hello';
    const ticketInfo = data.quantity > 1
      ? `${data.quantity} tickets${data.ticketType ? ` (${data.ticketType})` : ''}`
      : `the ticket${data.ticketType ? ` (${data.ticketType})` : ''}`;
    const cancelMessage = data.cancelledBySender
      ? `${data.cancelledByName} has cancelled the transfer of ${ticketInfo}.`
      : 'The ticket transfer has been cancelled.';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Transfer Cancelled</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">❌ Transfer Cancelled</h1>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px;">${greeting},</p>

              <p>${cancelMessage}</p>

              <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h2 style="margin: 0 0 10px 0; color: #4b5563; font-size: 20px;">${data.eventTitle}</h2>
                <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
                ${data.ticketType ? `<p style="margin: 5px 0; color: #666;">🎟️ ${data.ticketType} × ${data.quantity}</p>` : ''}
              </div>

              <p style="color: #666; font-size: 14px;">
                ${data.cancelledBySender
    ? 'The original ticket holder has retained their ticket.'
    : 'Your ticket remains valid and can be used for the event.'}
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                If you have any questions, please contact the event organizer.
              </p>
            </div>

            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `❌ Ticket transfer cancelled for ${data.eventTitle}`,
      html,
    });
  }

  /**
   * Send event cancellation email to attendee
   */
  async sendEventCancellationEmail(
    recipientEmail: string,
    data: {
      attendeeName: string;
      eventTitle: string;
      eventDate: string;
      eventLocation?: string;
      cancellationReason?: string;
      refundAmount?: string;
      refundStatus?: 'processing' | 'completed' | 'pending' | 'not_applicable';
      organizerName?: string;
      supportEmail?: string;
    },
  ) {
    const refundSection = data.refundAmount && data.refundStatus !== 'not_applicable' ? `
              <div style="background: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2e7d32;">💰 Refund Information</h3>
                <p style="margin: 5px 0; color: #333;"><strong>Refund Amount:</strong> ${data.refundAmount}</p>
                <p style="margin: 5px 0; color: #666;">
                  ${data.refundStatus === 'processing'
    ? 'Your refund is being processed and will be credited to your account within 3-5 business days.'
    : data.refundStatus === 'completed'
      ? 'Your refund has been processed and credited to your account.'
      : 'Your refund request is pending and will be processed shortly.'}
                </p>
              </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Cancelled</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Event Cancelled</h1>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.attendeeName || 'there'},</p>

            <p style="color: #666;">
              We're sorry to inform you that the following event has been <strong>cancelled</strong>:
            </p>

            <div style="background: #f5f5f5; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: #333;">${data.eventTitle}</h2>
              <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
              ${data.eventLocation ? `<p style="margin: 5px 0; color: #666;">📍 ${data.eventLocation}</p>` : ''}
            </div>

            ${data.cancellationReason ? `
            <div style="background: #fff3e0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #e65100;">Reason for Cancellation</h3>
              <p style="margin: 0; color: #666;">${data.cancellationReason}</p>
            </div>
            ` : ''}

            ${refundSection}

            <p style="color: #666; font-size: 14px;">
              We apologize for any inconvenience this may cause. If you have any questions, please contact
              ${data.organizerName ? `${data.organizerName} or ` : ''}our support team${data.supportEmail ? ` at <a href="mailto:${data.supportEmail}" style="color: #4a6cf7;">${data.supportEmail}</a>` : ''}.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `⚠️ Event Cancelled: ${data.eventTitle}`,
      html,
      isCritical: true, // Cancellation emails are critical
    });
  }

  /**
   * Send event postponement email to attendee
   */
  async sendEventPostponementEmail(
    recipientEmail: string,
    data: {
      attendeeName: string;
      eventTitle: string;
      originalDate: string;
      newDate: string;
      originalLocation?: string;
      newLocation?: string;
      postponementReason?: string;
      organizerName?: string;
      supportEmail?: string;
      refundOption?: boolean; // Whether refund is offered for those who can't attend new date
    },
  ) {
    const locationChanged = data.originalLocation && data.newLocation && data.originalLocation !== data.newLocation;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Rescheduled</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Event Rescheduled</h1>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.attendeeName || 'there'},</p>

            <p style="color: #666;">
              The following event has been <strong>rescheduled</strong> to a new date:
            </p>

            <div style="background: #f5f5f5; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 15px 0; color: #333;">${data.eventTitle}</h2>

              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 0 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Original Date</p>
                  <p style="margin: 0; color: #666; text-decoration: line-through;">${data.originalDate}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 0 0 5px 0; color: #2e7d32; font-size: 12px; text-transform: uppercase;">New Date</p>
                  <p style="margin: 0; color: #2e7d32; font-weight: bold;">📅 ${data.newDate}</p>
                </div>
              </div>

              ${locationChanged ? `
              <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 0 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Original Location</p>
                  <p style="margin: 0; color: #666; text-decoration: line-through;">${data.originalLocation}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 0 0 5px 0; color: #2e7d32; font-size: 12px; text-transform: uppercase;">New Location</p>
                  <p style="margin: 0; color: #2e7d32; font-weight: bold;">📍 ${data.newLocation}</p>
                </div>
              </div>
              ` : data.newLocation ? `
              <p style="margin: 10px 0 0 0; color: #666;">📍 ${data.newLocation}</p>
              ` : ''}
            </div>

            ${data.postponementReason ? `
            <div style="background: #fff3e0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #e65100;">Reason for Rescheduling</h3>
              <p style="margin: 0; color: #666;">${data.postponementReason}</p>
            </div>
            ` : ''}

            <div style="background: #e3f2fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1565c0;">🎟️ Your Ticket</h3>
              <p style="margin: 0; color: #666;">
                Your existing ticket remains valid for the new date. No action is required on your part.
              </p>
              ${data.refundOption ? `
              <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">
                If you are unable to attend on the new date, you may request a refund by contacting the event organizer.
              </p>
              ` : ''}
            </div>

            <p style="color: #666; font-size: 14px;">
              We apologize for any inconvenience. If you have any questions, please contact
              ${data.organizerName ? `${data.organizerName} or ` : ''}our support team${data.supportEmail ? ` at <a href="mailto:${data.supportEmail}" style="color: #4a6cf7;">${data.supportEmail}</a>` : ''}.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `📅 Event Rescheduled: ${data.eventTitle}`,
      html,
      isCritical: true, // Postponement emails are critical
    });
  }

  /**
   * Send event update notification email to attendee
   */
  async sendEventUpdateEmail(
    recipientEmail: string,
    data: {
      attendeeName: string;
      eventTitle: string;
      eventDate: string;
      eventLocation?: string;
      updateType: 'location' | 'time' | 'details' | 'general';
      updateSummary: string;
      organizerName?: string;
      supportEmail?: string;
    },
  ) {
    const updateTypeLabels = {
      location: 'Venue Update',
      time: 'Time Update',
      details: 'Event Details Update',
      general: 'Event Update',
    };

    const updateTypeColors = {
      location: '#9c27b0',
      time: '#2196f3',
      details: '#009688',
      general: '#607d8b',
    };

    const color = updateTypeColors[data.updateType] || updateTypeColors.general;
    const label = updateTypeLabels[data.updateType] || updateTypeLabels.general;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${label}</h1>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.attendeeName || 'there'},</p>

            <p style="color: #666;">
              There's an update for the following event you're registered for:
            </p>

            <div style="background: #f5f5f5; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 10px 0; color: #333;">${data.eventTitle}</h2>
              <p style="margin: 5px 0; color: #666;">📅 ${data.eventDate}</p>
              ${data.eventLocation ? `<p style="margin: 5px 0; color: #666;">📍 ${data.eventLocation}</p>` : ''}
            </div>

            <div style="background: #f3e5f5; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: ${color};">What's Changed</h3>
              <p style="margin: 0; color: #666;">${data.updateSummary}</p>
            </div>

            <p style="color: #666; font-size: 14px;">
              Your ticket remains valid. If you have any questions, please contact
              ${data.organizerName ? `${data.organizerName} or ` : ''}our support team${data.supportEmail ? ` at <a href="mailto:${data.supportEmail}" style="color: #4a6cf7;">${data.supportEmail}</a>` : ''}.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `📢 ${label}: ${data.eventTitle}`,
      html,
    });
  }

  /**
   * Send post-event survey email to attendee
   */
  async sendPostEventSurveyEmail(
    recipientEmail: string,
    data: {
      attendeeName: string;
      eventTitle: string;
      eventDate: string;
      surveyUrl: string;
      organizerName?: string;
    },
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Share Your Feedback</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">How Was Your Experience?</h1>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.attendeeName || 'there'},</p>

            <p style="color: #666;">
              Thank you for attending <strong>${data.eventTitle}</strong> on ${data.eventDate}!
            </p>

            <p style="color: #666;">
              We'd love to hear about your experience. Your feedback helps us and the organizers create even better events in the future.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.surveyUrl}" style="display: inline-block; background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Share Your Feedback
              </a>
            </div>

            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Quick questions we'll ask:</p>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>How would you rate the overall experience?</li>
                <li>What did you enjoy most?</li>
                <li>What could be improved?</li>
                <li>Would you recommend this event to others?</li>
              </ul>
              <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">
                ⏱️ Takes less than 2 minutes to complete
              </p>
            </div>

            <p style="color: #666; font-size: 14px;">
              Your feedback is valuable and will be shared with ${data.organizerName || 'the event organizer'} to help them improve future events.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `📝 Share your feedback: ${data.eventTitle}`,
      html,
    });
  }

  /**
   * Send data export ready email
   */
  async sendDataExportReadyEmail(
    recipientEmail: string,
    data: {
      userName: string;
      downloadUrl: string;
      expiresAt: string;
    },
  ) {
    const expiryDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Data Export is Ready</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Your Data Export is Ready</h1>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.userName},</p>

            <p style="color: #666;">
              Your data export has been prepared and is ready for download. This export contains all personal data associated with your EventKnit account.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Download Your Data
              </a>
            </div>

            <div style="background: #fff3e0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #e65100; font-weight: bold;">
                ⚠️ This link expires on ${expiryDate}
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">
                Please download your data before this date. After expiry, you'll need to request a new export.
              </p>
            </div>

            <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">What's included in your export:</p>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Your profile information</li>
                <li>Event registrations and tickets</li>
                <li>Payment history</li>
                <li>Notification history</li>
                <li>Ticket transfers</li>
                <li>Your preferences and settings</li>
              </ul>
            </div>

            <p style="color: #666; font-size: 14px;">
              This data export is provided in compliance with GDPR Article 20 (Right to Data Portability).
              If you have any questions, please contact our support team.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center;">
              This is an automated message from EventKnit. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: '📦 Your EventKnit Data Export is Ready',
      html,
      isCritical: true,
    });
  }

  /**
   * Send account deletion confirmation email
   */
  async sendAccountDeletionConfirmationEmail(
    recipientEmail: string,
    data: {
      userName: string;
    },
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Deleted</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #607d8b 0%, #455a64 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Account Deleted</h1>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.userName},</p>

            <p style="color: #666;">
              Your EventKnit account has been successfully deleted as requested. We're sorry to see you go.
            </p>

            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 15px 0; color: #333; font-weight: bold;">What this means:</p>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Your personal information has been anonymized</li>
                <li>You will no longer receive emails from us</li>
                <li>Any pending registrations have been cancelled</li>
                <li>Your login credentials have been removed</li>
              </ul>
            </div>

            <div style="background: #e3f2fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1565c0; font-weight: bold;">
                Note: For legal and financial compliance
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">
                Transaction records have been retained in anonymized form as required by law. These records cannot be linked back to you personally.
              </p>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you ever want to use EventKnit again in the future, you're welcome to create a new account.
              Thank you for being part of our community.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 11px; color: #999; text-align: center;">
              This is the final automated message from EventKnit for this account.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: 'Your EventKnit Account Has Been Deleted',
      html,
      isCritical: true,
    });
  }

  /**
   * Send email digest
   */
  async sendDigestEmail(
    recipientEmail: string,
    data: {
      userName: string;
      digestType: string;
      periodLabel: string;
      itemCount: number;
      itemsHtml: string;
    },
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.digestType} Digest</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Your ${data.digestType} Update</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
              ${data.itemCount} notification${data.itemCount !== 1 ? 's' : ''} ${data.periodLabel}
            </p>
          </div>

          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi ${data.userName},</p>

            <p style="color: #666;">
              Here's a summary of what you might have missed ${data.periodLabel}:
            </p>

            ${data.itemsHtml}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://eventknit.com'}/dashboard"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                View All Updates
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 12px; color: #888; text-align: center;">
              You're receiving this because you've opted in to ${data.digestType.toLowerCase()} digests.
              <a href="${process.env.CLIENT_URL || 'https://eventknit.com'}/settings/notifications" style="color: #667eea;">
                Manage preferences
              </a>
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `Your ${data.digestType} EventKnit Digest - ${data.itemCount} Update${data.itemCount !== 1 ? 's' : ''}`,
      html,
    });
  }
}

export const emailService = new EmailService();

