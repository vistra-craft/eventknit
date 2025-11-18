import Paystack from 'paystack';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { RegistrationStatus, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { TicketService } from './ticket.service.js';
import { EventService } from './event.service.js';
import { generatePaymentTransactionNumber } from '../utils/transaction-helpers.js';
import { PlatformFeeService } from './platform-fee.service.js';

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
      
      // Rollback: Cancel registration and restore capacity if payment initialization fails
      // This prevents orphaned registrations when payment fails
      try {
        await this.rollbackRegistration(data.registrationId);
        logger.info(`Rolled back registration ${data.registrationId} due to payment initialization failure`);
      } catch (rollbackError) {
        logger.error(`Failed to rollback registration ${data.registrationId}:`, rollbackError);
        // Continue to throw original error even if rollback fails
      }
      
      throw new ValidationError('Failed to initialize payment. Please try again.');
    }
  }

  /**
   * Rollback registration when payment initialization fails
   * Cancels the registration and restores event capacity
   */
  private async rollbackRegistration(registrationId: string): Promise<void> {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            capacity: true,
            availableSlots: true,
          },
        },
      },
    });

    if (!registration) {
      logger.warn(`Registration ${registrationId} not found for rollback`);
      return;
    }

    // Only rollback if registration is still PENDING (not already cancelled or confirmed)
    if (registration.status !== RegistrationStatus.PENDING || registration.paymentStatus !== 'PENDING') {
      logger.info(`Registration ${registrationId} is not in PENDING state, skipping rollback`);
      return;
    }

    // Use transaction to ensure atomic rollback
    await prisma.$transaction(async (tx) => {
      // Use status validation to ensure consistency
      const syncedStatus = EventService.validateAndSyncStatus(
        registration.status,
        registration.paymentStatus || 'PENDING',
        'FAILED',
        RegistrationStatus.CANCELLED,
      );

      // Cancel registration
      await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: syncedStatus.status,
          paymentStatus: syncedStatus.paymentStatus,
          cancelledAt: new Date(),
          cancelledBy: null, // System cancellation
        },
      });

      // Restore event capacity if capacity exists
      if (registration.event.capacity !== null) {
        const newAvailableSlots = (registration.event.availableSlots || registration.event.capacity) + registration.quantity;
        await tx.event.update({
          where: { id: registration.event.id },
          data: {
            availableSlots: Math.min(registration.event.capacity, newAvailableSlots),
          },
        });
      }
    });

    logger.info(`Successfully rolled back registration ${registrationId} and restored capacity`);
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

        // All validations passed - create payment transaction and update registration
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          // Use status validation to ensure consistency
          const syncedStatus = EventService.validateAndSyncStatus(
            registration.status,
            registration.paymentStatus || 'PENDING',
            'COMPLETED',
            RegistrationStatus.CONFIRMED,
          );

          // Generate transaction number
          let transactionNumber = generatePaymentTransactionNumber();
          // Ensure uniqueness (retry if collision)
          let attempts = 0;
          while (attempts < 10) {
            const existing = await tx.eventPaymentTransaction.findUnique({
              where: { transactionNumber },
            });
            if (!existing) break;
            transactionNumber = generatePaymentTransactionNumber();
            attempts++;
          }

          // Create payment transaction record
          const paymentTransaction = await tx.eventPaymentTransaction.create({
            data: {
              transactionNumber,
              paystackReference: reference,
              paystackAmount: verification.amount * 100, // Store in kobo/cents
              currency: 'NGN',
              amount: verification.amount,
              paymentMethod: 'PAYSTACK',
              paymentStatus: 'success',
              paymentDate: new Date(),
              eventId: registration.eventId,
              registrationId: registration.id,
              attendeeEmail: registration.attendee.email || verification.customer.email || '',
              attendeeName: registration.attendee.firstName && registration.attendee.lastName
                ? `${registration.attendee.firstName} ${registration.attendee.lastName}`
                : null,
              paystackMetadata: data as Prisma.InputJsonValue,
            },
          });

          // Update registration status
          await tx.eventRegistration.update({
            where: { id: registration.id },
            data: {
              status: syncedStatus.status,
              paymentStatus: syncedStatus.paymentStatus,
              paymentMethod: 'PAYSTACK',
            },
          });

          logger.info(`Payment transaction created: ${paymentTransaction.id} for registration: ${registration.id}`);

          // Automatically calculate and create platform fee
          try {
            await PlatformFeeService.createPlatformFee(paymentTransaction.id);
            logger.info(`Platform fee calculated for transaction: ${paymentTransaction.id}`);
          } catch (feeError) {
            // Log error but don't fail the payment - fee can be calculated later
            logger.error(`Failed to calculate platform fee for transaction ${paymentTransaction.id}:`, feeError);
          }
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

  /**
   * Sync payment transactions from Paystack
   * This fetches transactions from Paystack API and creates records for any missing ones
   * Use this for:
   * - Historical data migration (payments before this system)
   * - Reconciliation (catch missed webhooks)
   * - Manual sync by admin
   * 
   * @param startDate - Start date for fetching transactions (optional)
   * @param endDate - End date for fetching transactions (optional)
   * @param eventId - Optional: Only sync payments for a specific event
   * @returns Summary of sync operation
   */
  async syncPaymentsFromPaystack(
    startDate?: Date,
    endDate?: Date,
    eventId?: string,
  ): Promise<{
    totalFetched: number;
    created: number;
    skipped: number;
    errors: number;
    details: Array<{ reference: string; action: string; reason?: string }>;
  }> {
    if (!config.paystack.secretKey) {
      throw new ValidationError('Payment service is not configured');
    }

    const result = {
      totalFetched: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ reference: string; action: string; reason?: string }>,
    };

    try {
      // Fetch transactions from Paystack
      // Note: Paystack API pagination - fetch in batches
      let page = 1;
      let hasMore = true;
      const perPage = 50; // Paystack max per page

      while (hasMore) {
        const params: Record<string, unknown> = {
          perPage,
          page,
        };

        if (startDate) {
          params.from = startDate.toISOString();
        }
        if (endDate) {
          params.to = endDate.toISOString();
        }

        const response = await this.paystack.transaction.list(params);
        const transactions = response.data as Array<{
          id: number;
          reference: string;
          amount: number;
          status: string;
          customer?: { email?: string };
          metadata?: Record<string, unknown>;
          paid_at?: string;
          created_at: string;
        }>;

        if (!transactions || transactions.length === 0) {
          hasMore = false;
          break;
        }

        result.totalFetched += transactions.length;

        // Process each transaction
        for (const paystackTx of transactions) {
          try {
            // Skip if not successful
            if (paystackTx.status !== 'success') {
              result.skipped++;
              result.details.push({
                reference: paystackTx.reference,
                action: 'skipped',
                reason: `Status: ${paystackTx.status}`,
              });
              continue;
            }

            // Check if we already have this transaction
            const existing = await prisma.eventPaymentTransaction.findUnique({
              where: { paystackReference: paystackTx.reference },
            });

            if (existing) {
              result.skipped++;
              result.details.push({
                reference: paystackTx.reference,
                action: 'skipped',
                reason: 'Already exists',
              });
              continue;
            }

            // Try to find registration by reference
            const registration = await prisma.eventRegistration.findFirst({
              where: {
                paymentTransactionId: paystackTx.reference,
              },
              include: {
                event: {
                  select: {
                    id: true,
                    organizerId: true,
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

            // Skip if no registration found (might be non-event payment)
            if (!registration) {
              result.skipped++;
              result.details.push({
                reference: paystackTx.reference,
                action: 'skipped',
                reason: 'No matching registration found',
              });
              continue;
            }

            // Filter by eventId if specified
            if (eventId && registration.eventId !== eventId) {
              result.skipped++;
              result.details.push({
                reference: paystackTx.reference,
                action: 'skipped',
                reason: 'Event ID mismatch',
              });
              continue;
            }

            // Create payment transaction record
            const amount = paystackTx.amount / 100; // Convert from kobo to main unit

            let transactionNumber = generatePaymentTransactionNumber();
            let attempts = 0;
            while (attempts < 10) {
              const existingNumber = await prisma.eventPaymentTransaction.findUnique({
                where: { transactionNumber },
              });
              if (!existingNumber) break;
              transactionNumber = generatePaymentTransactionNumber();
              attempts++;
            }

            const paymentTransaction = await prisma.eventPaymentTransaction.create({
              data: {
                transactionNumber,
                paystackReference: paystackTx.reference,
                paystackAmount: paystackTx.amount,
                currency: 'NGN',
                amount,
                paymentMethod: 'PAYSTACK',
                paymentStatus: 'success',
                paymentDate: paystackTx.paid_at ? new Date(paystackTx.paid_at) : new Date(paystackTx.created_at),
                eventId: registration.eventId,
                registrationId: registration.id,
                attendeeEmail: registration.attendee.email || paystackTx.customer?.email || '',
                attendeeName:
                  registration.attendee.firstName && registration.attendee.lastName
                    ? `${registration.attendee.firstName} ${registration.attendee.lastName}`
                    : null,
                paystackMetadata: (paystackTx.metadata || {}) as Prisma.InputJsonValue,
              },
            });

            result.created++;
            result.details.push({
              reference: paystackTx.reference,
              action: 'created',
            });

            logger.info(`Synced payment transaction: ${paymentTransaction.id} for registration: ${registration.id}`);

            // Automatically calculate platform fee for synced payment
            try {
              await PlatformFeeService.createPlatformFee(paymentTransaction.id);
              logger.info(`Platform fee calculated for synced transaction: ${paystackTx.reference}`);
            } catch (feeError) {
              logger.error(`Failed to calculate platform fee for synced transaction ${paystackTx.reference}:`, feeError);
            }
          } catch (error) {
            result.errors++;
            result.details.push({
              reference: paystackTx.reference,
              action: 'error',
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
            logger.error(`Error syncing payment ${paystackTx.reference}:`, error);
          }
        }

        // Check if there are more pages
        if (transactions.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      logger.info(`Payment sync completed: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`);
      return result;
    } catch (error) {
      logger.error('Failed to sync payments from Paystack:', error);
      throw new ValidationError('Failed to sync payments from Paystack');
    }
  }
}

export const paymentService = new PaymentService();


