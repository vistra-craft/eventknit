import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface SMSOptions {
  to: string;
  message: string;
  retries?: number;
  isCritical?: boolean;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  attempts: number;
  error?: Error;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly CRITICAL_MAX_RETRIES = 5;
  private readonly INITIAL_RETRY_DELAY_MS = 1000; // 1 second
  private readonly MAX_RETRY_DELAY_MS = 30000; // 30 seconds
  private readonly MAX_SMS_LENGTH = 1600; // Twilio supports up to 1600 chars, but we'll use 160 for single SMS
  private readonly SINGLE_SMS_LENGTH = 160;

  constructor() {
    // Initialize Twilio client if credentials are provided
    if (config.sms.accountSid && config.sms.authToken) {
      try {
        this.client = twilio(config.sms.accountSid, config.sms.authToken);
        logger.info('SMS service initialized with Twilio');
      } catch (error) {
        logger.error('Failed to initialize Twilio client:', error);
      }
    } else {
      logger.warn('SMS service not configured - Twilio credentials missing');
    }
  }

  /**
   * Check if SMS service is enabled and configured
   */
  isEnabled(): boolean {
    return this.client !== null && config.sms.enabled === true;
  }

  /**
   * Format phone number to E.164 format (required by Twilio)
   * Example: +1234567890
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If number doesn't start with country code, assume default country code
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      // Default to US country code if not specified
      cleaned = `1${cleaned}`;
    }

    // Add + prefix
    return `+${cleaned}`;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;

    const cleaned = phoneNumber.replace(/\D/g, '');
    // Phone number should be between 10-15 digits (E.164 allows up to 15)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Truncate message to fit SMS length limits
   * If message is too long, it will be split into multiple parts
   */
  truncateMessage(message: string, maxLength: number = this.SINGLE_SMS_LENGTH): string {
    if (message.length <= maxLength) {
      return message;
    }

    // Truncate and add ellipsis
    return `${message.substring(0, maxLength - 3)  }...`;
  }

  /**
   * Calculate exponential backoff delay
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
   * Send SMS with retry logic and exponential backoff
   */
  async sendSMS(options: SMSOptions): Promise<SMSResult> {
    if (!this.isEnabled()) {
      logger.warn('SMS service is not enabled or configured');
      return {
        success: false,
        attempts: 0,
        error: new Error('SMS service is not enabled'),
      };
    }

    if (!this.validatePhoneNumber(options.to)) {
      return {
        success: false,
        attempts: 0,
        error: new Error('Invalid phone number format'),
      };
    }

    const maxRetries = options.retries ?? (options.isCritical ? this.CRITICAL_MAX_RETRIES : this.DEFAULT_MAX_RETRIES);
    const formattedPhone = this.formatPhoneNumber(options.to);
    const truncatedMessage = this.truncateMessage(options.message);
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      attempts++;
      try {
        if (!this.client) {
          throw new Error('Twilio client not initialized');
        }

        const message = await this.client.messages.create({
          body: truncatedMessage,
          from: config.sms.fromNumber,
          to: formattedPhone,
        });

        // Success - log if it was a retry
        if (attempt > 0) {
          logger.info(`SMS sent successfully after ${attempts} attempts to: ${formattedPhone}`);
        } else {
          logger.info(`SMS sent successfully to: ${formattedPhone}, SID: ${message.sid}`);
        }

        return {
          success: true,
          messageId: message.sid,
          attempts,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`SMS send attempt ${attempts} failed: ${lastError.message}`);

        // Don't retry on certain errors (invalid number, etc.)
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('invalid') ||
            errorMessage.includes('unsubscribed') ||
            errorMessage.includes('blacklisted')
          ) {
            logger.error(`SMS failed with non-retryable error: ${errorMessage}`);
            break;
          }
        }

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries - 1) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    logger.error(`Failed to send SMS after ${attempts} attempts to: ${formattedPhone}`);
    return {
      success: false,
      attempts,
      error: lastError,
    };
  }

  /**
   * Send verification code via SMS
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<SMSResult> {
    const message = `Your EventKnit verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
    return this.sendSMS({
      to: phoneNumber,
      message,
      isCritical: true,
    });
  }

  /**
   * Send password reset code via SMS
   */
  async sendPasswordResetCode(phoneNumber: string, code: string): Promise<SMSResult> {
    const message = `Your EventKnit password reset code is: ${code}. Valid for 10 minutes. If you didn't request this, ignore this message.`;
    return this.sendSMS({
      to: phoneNumber,
      message,
      isCritical: true,
    });
  }

  /**
   * Send event reminder via SMS
   */
  async sendEventReminder(
    phoneNumber: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    venue?: string,
  ): Promise<SMSResult> {
    let message = `EventKnit Reminder: ${eventTitle} on ${eventDate} at ${eventTime}`;
    if (venue) {
      message += `. Venue: ${venue}`;
    }
    message += '. See you there!';

    return this.sendSMS({
      to: phoneNumber,
      message: this.truncateMessage(message),
    });
  }

  /**
   * Send payment notification via SMS
   */
  async sendPaymentNotification(
    phoneNumber: string,
    amount: number,
    currency: string,
    status: 'success' | 'failed' | 'pending',
    eventTitle?: string,
  ): Promise<SMSResult> {
    let message = '';
    if (status === 'success') {
      message = `Payment confirmed: ${currency} ${amount.toFixed(2)}`;
      if (eventTitle) {
        message += ` for ${eventTitle}`;
      }
      message += '. Your ticket has been confirmed!';
    } else if (status === 'failed') {
      message = `Payment failed for ${currency} ${amount.toFixed(2)}`;
      if (eventTitle) {
        message += ` (${eventTitle})`;
      }
      message += '. Please try again or contact support.';
    } else {
      message = `Payment pending: ${currency} ${amount.toFixed(2)}`;
      if (eventTitle) {
        message += ` for ${eventTitle}`;
      }
      message += '. We\'ll notify you once confirmed.';
    }

    return this.sendSMS({
      to: phoneNumber,
      message: this.truncateMessage(message),
      isCritical: status === 'failed',
    });
  }

  /**
   * Send urgent event update via SMS
   */
  async sendUrgentEventUpdate(
    phoneNumber: string,
    eventTitle: string,
    updateType: 'cancelled' | 'postponed' | 'venue_changed' | 'time_changed',
    details?: string,
  ): Promise<SMSResult> {
    let message = `URGENT: ${eventTitle} has been `;
    switch (updateType) {
    case 'cancelled':
      message += 'CANCELLED';
      break;
    case 'postponed':
      message += 'POSTPONED';
      break;
    case 'venue_changed':
      message += 'VENUE CHANGED';
      break;
    case 'time_changed':
      message += 'TIME CHANGED';
      break;
    }
    if (details) {
      message += `. ${details}`;
    }
    message += '. Check your email for full details.';

    return this.sendSMS({
      to: phoneNumber,
      message: this.truncateMessage(message),
      isCritical: true,
    });
  }

  /**
   * Send waitlist notification via SMS
   */
  async sendWaitlistNotification(
    phoneNumber: string,
    eventTitle: string,
    deadlineHours: number = 24,
  ): Promise<SMSResult> {
    const message = `Good news! A spot opened for "${eventTitle}". You have ${deadlineHours} hours to register. Visit EventKnit to claim your spot!`;

    return this.sendSMS({
      to: phoneNumber,
      message: this.truncateMessage(message),
      isCritical: true,
    });
  }

  /**
   * Send security alert via SMS
   */
  async sendSecurityAlert(
    phoneNumber: string,
    alertType: string,
    details?: string,
  ): Promise<SMSResult> {
    let message = `Security Alert: ${alertType}`;
    if (details) {
      message += `. ${details}`;
    }
    message += '. If this wasn\'t you, secure your account immediately.';

    return this.sendSMS({
      to: phoneNumber,
      message: this.truncateMessage(message),
      isCritical: true,
    });
  }

  /**
   * Send backup code for on-premise registration
   */
  async sendBackupCode(
    phoneNumber: string,
    backupCode: string,
    eventTitle: string,
  ): Promise<SMSResult> {
    const message = `Your EventKnit entry code for "${eventTitle}" is: ${backupCode}. Show this code at the venue for check-in.`;

    return this.sendSMS({
      to: phoneNumber,
      message: this.truncateMessage(message),
      isCritical: true,
    });
  }
}

// Export singleton instance
export const smsService = new SMSService();

