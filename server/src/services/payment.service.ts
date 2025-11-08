import Paystack from 'paystack';
import { config } from '../config';
import { prisma } from '../config/database';
import { RegistrationStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { emailService } from './email.service';
import { TicketService } from './ticket.service';

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

      return {
        authorizationUrl: response.data.authorization_url,
        accessCode: response.data.access_code,
        reference: response.data.reference,
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

      return {
        success: response.data.status === 'success',
        reference: response.data.reference,
        amount: response.data.amount / 100, // Convert from kobo to main unit
        status: response.data.status,
        customer: {
          email: response.data.customer?.email || '',
        },
        metadata: response.data.metadata as Record<string, unknown> | undefined,
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
              },
            },
          },
        });

        if (registration && registration.paymentStatus !== 'COMPLETED') {
          // Update registration status
          await prisma.eventRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CONFIRMED,
              paymentStatus: 'COMPLETED',
              paymentMethod: 'PAYSTACK',
            },
          });

          // Send ticket email
          try {
            await TicketService.sendTicketEmail(registration);
            logger.info(`Ticket email sent for registration: ${registration.id}`);
          } catch (error) {
            logger.error('Failed to send ticket email:', error);
            // Don't fail the webhook if email fails
          }

          logger.info(`Payment completed: ${reference} for registration: ${registration.id}`);
        }
      }
    } else if (event === 'charge.failed') {
      const reference = data.reference as string;
      if (reference) {
        await prisma.eventRegistration.updateMany({
          where: {
            paymentTransactionId: reference,
            paymentStatus: 'PENDING',
          },
          data: {
            paymentStatus: 'FAILED',
          },
        });
        logger.info(`Payment failed: ${reference}`);
      }
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', config.paystack.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }
}

export const paymentService = new PaymentService();


