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
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
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
    // eslint-disable-next-line no-undef
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
}

export const emailService = new EmailService();

