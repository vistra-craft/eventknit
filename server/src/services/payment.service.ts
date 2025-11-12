import Paystack from 'paystack';
import { config } from '../config';
import { prisma } from '../config/database';
import { RegistrationStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { TicketService } from './ticket.service';
import { EventService } from './event.service';

export interface InitializePaymentData {
  registrationId: string;
  email: string;
  amount: number; // Amount in main currency unit (e.g., USD, NGN)
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerificationResult {
  success: boolean;
  reference: string;
  amount: number;
  status: string;
  customer: {
    email: string;
  };
  metadata?: Record<string, unknown>;
}

export class PaymentService {
  private paystack: Paystack;

  constructor() {
    if (!config.paystack.secretKey) {
      logger.warn('Paystack secret key not configured. Payment features will not work.');
    }
    this.paystack = new Paystack(config.paystack.secretKey);
  }

  /**
   * Validate guest payment request (email + registration ID)
   */
  async validateGuestPayment(registrationId: string, email: string): Promise<void> {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        attendee: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    // Validate email matches registration
    const normalizedEmail = email.toLowerCase().trim();
    const registrationEmail = registration.attendee.email?.toLowerCase().trim();

    if (registrationEmail !== normalizedEmail) {
      throw new ValidationError('Email does not match the registration');
    }

    // Check if already paid
    if (registration.paymentStatus === 'COMPLETED') {
      throw new ValidationError('Payment already completed');
    }
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(data: InitializePaymentData) {
    if (!config.paystack.secretKey) {
      throw new ValidationError('Payment service is not configured');
    }

    // Get registration to verify it exists and is pending
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizer: {
              select: {
                organizationName: true,
              },
            },
          },
        },
        attendee: {
          select: {
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

    if (registration.paymentStatus === 'COMPLETED') {
      throw new ValidationError('Payment already completed');
    }

    // Generate unique reference
    const reference = `EVT-${registration.id}-${Date.now()}`;

    // Convert amount to smallest currency unit (kobo for NGN, cents for USD)
    // For now, assuming NGN (multiply by 100)
    const amountInKobo = Math.round(data.amount * 100);

    try {
      const response = await this.paystack.transaction.initialize({
        email: data.email,
        amount: amountInKobo,
        reference,
        currency: data.currency || 'NGN',
        metadata: {
          registrationId: data.registrationId,
          eventId: registration.eventId,
          eventTitle: registration.event.title,
          ...data.metadata,
        },
        callback_url: `${config.frontend.url}/payment/callback?reference=${reference}`,
      });

      // Update registration with payment reference
      await prisma.eventRegistration.update({
        where: { id: data.registrationId },
        data: {
          paymentTransactionId: reference,
        },
      });

      logger.info(`Payment initialized: ${reference} for registration: ${data.registrationId}`);

      const responseData = response.data as {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
      return {
        authorizationUrl: responseData.authorization_url,
        accessCode: responseData.access_code,
        reference: responseData.reference,
      };
    } catch (error: unknown) {
      logger.error('Failed to initialize payment:', error);
      throw new ValidationError('Failed to initialize payment. Please try again.');
    }
  }

  /**
   * Verify payment with Paystack
   */
  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    if (!config.paystack.secretKey) {
      throw new ValidationError('Payment service is not configured');
    }

    try {
      const response = await this.paystack.transaction.verify(reference);

      if (!response.data) {
        throw new ValidationError('Invalid payment reference');
      }

      const responseData = response.data as {
        status: string;
        reference: string;
        amount: number;
        customer?: { email?: string };
        metadata?: Record<string, unknown>;
      };

      return {
        success: responseData.status === 'success',
        reference: responseData.reference,
        amount: responseData.amount / 100, // Convert from kobo to main unit
        status: responseData.status,
        customer: {
          email: responseData.customer?.email || '',
        },
        metadata: responseData.metadata,
      };
    } catch (error: unknown) {
      logger.error('Failed to verify payment:', error);
      throw new ValidationError('Failed to verify payment');
    }
  }

  /**
   * Handle payment webhook from Paystack
   */
  async handleWebhook(event: string, data: Record<string, unknown>) {
    if (event === 'charge.success') {
      const reference = data.reference as string;
      if (!reference) {
        logger.error('Webhook missing reference');
        return;
      }

      // Verify payment
      const verification = await this.verifyPayment(reference);

      if (verification.success) {
        // Find registration by reference
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            paymentTransactionId: reference,
          },
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
                companyAffiliation: true,
              },
            },
          },
        });

        if (!registration) {
          logger.error(`Payment webhook: Registration not found for reference: ${reference}`);
          return;
        }

        // Validate payment hasn't already been processed
        if (registration.paymentStatus === 'COMPLETED') {
          logger.warn(`Payment webhook: Duplicate payment attempt for reference: ${reference}, registration: ${registration.id}`);
          return;
        }

        // Validate payment amount matches registration totalAmount
        const expectedAmount = Number(registration.totalAmount);
        const paidAmount = verification.amount;
        const amountDifference = Math.abs(expectedAmount - paidAmount);
        const tolerance = 0.01; // Allow 1 cent/kobo difference for rounding

        if (amountDifference > tolerance) {
          logger.error(`Payment webhook: Amount mismatch for reference: ${reference}`, {
            registrationId: registration.id,
            expectedAmount,
            paidAmount,
            difference: amountDifference,
            eventId: registration.eventId,
            attendeeEmail: registration.attendee.email,
          });
          // Alert admin - log as critical error
          logger.warn(`CRITICAL: Payment amount mismatch detected. Reference: ${reference}, Expected: ${expectedAmount}, Paid: ${paidAmount}`);
          return;
        }

        // Validate payment email matches attendee email
        const paymentEmail = verification.customer.email?.toLowerCase().trim() || '';
        const attendeeEmail = registration.attendee.email?.toLowerCase().trim() || '';

        if (paymentEmail && attendeeEmail && paymentEmail !== attendeeEmail) {
          logger.warn(`Payment webhook: Email mismatch for reference: ${reference}`, {
            registrationId: registration.id,
            paymentEmail,
            attendeeEmail,
            eventId: registration.eventId,
          });
          // Log warning but don't block payment - email might be different (e.g., company email)
          // Admin can review if needed
        }

        // All validations passed - update registration status
        // Use status validation to ensure consistency
        const syncedStatus = EventService.validateAndSyncStatus(
          registration.status,
          registration.paymentStatus || 'PENDING',
          'COMPLETED',
          RegistrationStatus.CONFIRMED,
        );

        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            status: syncedStatus.status,
            paymentStatus: syncedStatus.paymentStatus,
            paymentMethod: 'PAYSTACK',
          },
        });

        // Send ticket email
        try {
          // Ensure required fields are present before sending email
          if (registration.event.organizer.firstName && registration.event.organizer.lastName) {
            await TicketService.sendTicketEmail(registration as Parameters<typeof TicketService.sendTicketEmail>[0]);
            logger.info(`Ticket email sent for registration: ${registration.id}`);
          } else {
            logger.warn(`Cannot send ticket email: organizer name missing for registration: ${registration.id}`);
          }
        } catch (error) {
          logger.error('Failed to send ticket email:', error);
          // Don't fail the webhook if email fails
        }

        logger.info(`Payment completed: ${reference} for registration: ${registration.id}`);
      }
    } else if (event === 'charge.failed') {
      const reference = data.reference as string;
      if (reference) {
        // Find registration and update both payment status and registration status
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            paymentTransactionId: reference,
            paymentStatus: 'PENDING',
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (registration) {
          // Use status validation to ensure consistency
          const syncedStatus = EventService.validateAndSyncStatus(
            registration.status,
            'PENDING', // Current payment status before failure
            'FAILED',
          );

          await prisma.eventRegistration.update({
            where: { id: registration.id },
            data: {
              status: syncedStatus.status,
              paymentStatus: syncedStatus.paymentStatus,
            },
          });
          logger.info(`Payment failed: ${reference} for registration: ${registration.id}`);
        } else {
          logger.warn(`Payment failed webhook: Registration not found for reference: ${reference}`);
        }
      }
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', config.paystack.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }
}

export const paymentService = new PaymentService();


