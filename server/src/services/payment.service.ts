import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { RegistrationStatus, Prisma, SeatStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { TicketService } from './ticket.service.js';
import { EventService } from './event.service.js';
import { generatePaymentTransactionNumber } from '../utils/transaction-helpers.js';
import { PlatformFeeService } from './platform-fee.service.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { getPaymentGatewayManager, GatewayType } from './payment-gateway-manager.js';
import type { PaymentGateway } from './payment-gateway.interface.js';
import { DigitalWalletService } from './digital-wallet.service.js';

export interface InitializePaymentData {
  registrationId: string;
  email: string;
  amount: number; // Amount in main currency unit (e.g., USD, NGN)
  currency?: string;
  gateway?: GatewayType; // Optional: specify gateway, defaults to default gateway
  metadata?: Record<string, unknown>;
  idempotencyKey?: string; // Optional: unique key to prevent duplicate payments
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
  private gatewayManager = getPaymentGatewayManager();

  constructor() {
    // Gateway manager initializes gateways automatically
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
      throw new ValidationError('The email address doesn\'t match this registration. Please use the same email you registered with.');
    }

    // Check if already paid
    if (registration.paymentStatus === 'COMPLETED') {
      throw new ValidationError('Payment has already been completed for this registration.');
    }
  }

  /**
   * Initialize payment with selected gateway (Paystack, Stripe, etc.)
   * Supports idempotency keys to prevent duplicate payments
   */
  async initializePayment(data: InitializePaymentData) {
    // Deterministic idempotency key — same registration + amount always produces the same key.
    // This prevents double-charges when users click "Pay" twice rapidly.
    // Client-provided keys take priority for explicit dedup control.
    const idempotencyKey = data.idempotencyKey ||
      `${data.registrationId}-${data.amount}`;

    // Atomic check: verify idempotency + registration status inside a transaction
    // to prevent TOCTOU races between concurrent payment requests.
    const { registration, existingTransaction } = await prisma.$transaction(async (tx) => {
      const existing = await tx.eventPaymentTransaction.findUnique({
        where: { idempotencyKey },
      });

      const reg = await tx.eventRegistration.findUnique({
        where: { id: data.registrationId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              currency: true,
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

      return { registration: reg, existingTransaction: existing };
    });

    // Handle idempotent duplicate requests
    if (existingTransaction) {
      if (existingTransaction.paymentStatus === 'success') {
        logger.info(`Idempotent payment request: returning existing successful payment for key ${idempotencyKey}`);
        return {
          authorizationUrl: null,
          accessCode: null,
          reference: existingTransaction.gatewayReference,
          gateway: existingTransaction.gateway,
          status: 'ALREADY_PAID',
          message: 'Payment has already been completed for this registration.',
        };
      }

      if (existingTransaction.paymentStatus === 'pending') {
        logger.info(`Idempotent payment request: returning existing pending payment for key ${idempotencyKey}`);
        return {
          authorizationUrl: null,
          accessCode: null,
          reference: existingTransaction.gatewayReference,
          gateway: existingTransaction.gateway,
          status: 'PENDING',
          message: 'Payment is already pending. Please complete or verify your payment.',
        };
      }

      // If payment failed, allow retry
      logger.info(`Idempotent payment retry: previous payment failed for key ${idempotencyKey}`);
    }

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.paymentStatus === 'COMPLETED') {
      throw new ValidationError('Payment has already been completed for this registration.');
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new ValidationError('This registration is no longer pending. Please start a new registration.');
    }

    // Select gateway (use specified or default)
    const gatewayType = data.gateway || this.gatewayManager.getDefaultGateway().getName() as GatewayType;
    const gatewayInstance = this.gatewayManager.getGateway(gatewayType);

    // Generate unique reference
    const reference = `EVT-${registration.id}-${Date.now()}`;

    try {
      const response = await gatewayInstance.initializePayment({
        amount: data.amount,
        currency: data.currency || registration.event?.currency || 'KES',
        email: data.email,
        reference,
        metadata: {
          registrationId: data.registrationId,
          eventId: registration.eventId,
          eventTitle: registration.event.title,
          idempotencyKey, // Include idempotency key for tracking
          ...data.metadata,
        },
        callbackUrl: `${config.frontend.url}/payment/callback?reference=${reference}&gateway=${gatewayType}`,
        returnUrl: `${config.frontend.url}/payment/success?reference=${reference}`,
      });

      // Update registration with payment reference
      await prisma.eventRegistration.update({
        where: { id: data.registrationId },
        data: {
          paymentTransactionId: reference,
        },
      });

      logger.info(`Payment initialized with ${gatewayType}: ${reference} for registration: ${data.registrationId}`);

      return {
        authorizationUrl: response.authorizationUrl,
        accessCode: response.accessCode,
        reference: response.reference,
        gateway: gatewayType,
        metadata: response.metadata,
      };
    } catch (error: unknown) {
      const errObj = error as Record<string, unknown> | null;
      const errorCode = (typeof errObj?.code === 'string' ? errObj.code : 'UNKNOWN_ERROR');
      const isTransient = (errObj?.isTransient === true);
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('Failed to initialize payment:', {
        errorCode,
        isTransient,
        message: errorMessage,
        registrationId: data.registrationId,
        gateway: gatewayType,
      });

      // Only rollback on permanent errors (not transient)
      // Transient errors: timeout, network, rate limit, service unavailable → allow retry
      // Permanent errors: auth failure, config issues → rollback
      if (!isTransient) {
        try {
          await this.rollbackRegistration(data.registrationId);
          logger.info(`Rolled back registration ${data.registrationId} due to permanent payment error: ${errorCode}`);
        } catch (rollbackError) {
          logger.error(`Failed to rollback registration ${data.registrationId}:`, rollbackError);
          // Continue to throw original error even if rollback fails
        }
      } else {
        logger.info(`Transient payment error for registration ${data.registrationId}. Registration preserved for retry.`);
      }

      // Provide user-friendly but informative error message
      let userMessage = 'Failed to initialize payment. Please try again.';
      if (isTransient) {
        userMessage = 'Payment service is temporarily unavailable. Please try again in a moment.';
      } else if (errorCode === 'PAYSTACK_AUTH_ERROR') {
        userMessage = 'Payment gateway configuration error. Please contact support.';
      } else if (errorCode === 'INVALID_REQUEST') {
        userMessage = 'Invalid payment request. Please check your information and try again.';
      }

      throw new ValidationError(userMessage, `PAYMENT_INIT_FAILED_${errorCode}`);
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
   * Verify payment with gateway
   */
  async verifyPayment(reference: string, gatewayType?: GatewayType): Promise<PaymentVerificationResult> {
    try {
      // Determine gateway - try to find from transaction if not specified
      let gateway: PaymentGateway;
      if (gatewayType) {
        gateway = this.gatewayManager.getGateway(gatewayType);
      } else {
        // Try to find existing transaction to determine gateway
        const existingTransaction = await prisma.eventPaymentTransaction.findFirst({
          where: {
            OR: [
              { gatewayReference: reference },
              { transactionNumber: reference },
            ],
          },
        });

        if (existingTransaction) {
          gateway = this.gatewayManager.getGateway(existingTransaction.gateway as GatewayType);
        } else {
          // Default to default gateway
          gateway = this.gatewayManager.getDefaultGateway();
        }
      }

      const response = await gateway.verifyPayment({ reference });

      return {
        success: response.success,
        reference: response.reference,
        amount: response.amount,
        status: response.status,
        customer: {
          email: response.customer.email,
        },
        metadata: response.metadata,
      };
    } catch (error: unknown) {
      logger.error('Failed to verify payment:', error);
      throw new ValidationError('We couldn\'t verify your payment. If you were charged, please contact support.');
    }
  }

  /**
   * Handle payment webhook from payment gateway
   * Implements idempotency by tracking processed webhook events
   */
  async handleWebhook(event: string, data: Record<string, unknown>, gatewayType?: GatewayType): Promise<{ status: string; message?: string } | void> {
    // Extract webhook event ID for idempotency (defined outside try for catch block access)
    // Paystack: data.id, Stripe: id at top level or data.object.id
    const webhookEventId = (data.id as string) || (data.data as Record<string, unknown>)?.id as string;

    try {

      if (!webhookEventId) {
        logger.warn('[PaymentService.handleWebhook] No webhook event ID found in payload - proceeding without idempotency check');
      }

      // Determine gateway type
      let gateway: PaymentGateway;
      let detectedGatewayType: GatewayType;

      if (gatewayType) {
        detectedGatewayType = gatewayType;
        gateway = this.gatewayManager.getGateway(gatewayType);
      } else {
        // Auto-detect gateway from webhook payload
        // Paystack uses 'charge.success', Stripe uses 'checkout.session.completed' or 'payment_intent.succeeded'
        if (event === 'charge.success' || data.reference) {
          detectedGatewayType = 'PAYSTACK';
        } else if (event.includes('checkout.session') || event.includes('payment_intent')) {
          detectedGatewayType = 'STRIPE';
        } else {
          // Default to Paystack for backward compatibility
          detectedGatewayType = 'PAYSTACK';
        }
        gateway = this.gatewayManager.getGateway(detectedGatewayType);
      }

      // IDEMPOTENCY CHECK: Prevent duplicate webhook processing
      // Payment providers may send the same webhook multiple times (retry logic)
      if (webhookEventId) {
        const existingEvent = await prisma.paymentWebhookEvent.findUnique({
          where: { gatewayEventId: webhookEventId },
        });

        if (existingEvent) {
          logger.info(`[PaymentService.handleWebhook] Duplicate webhook event detected, skipping: ${webhookEventId}`);
          return { status: 'DUPLICATE', message: 'Webhook already processed' };
        }

        // Record webhook event BEFORE processing (optimistic locking)
        // If another process is processing the same event, this will fail with unique constraint
        try {
          await prisma.paymentWebhookEvent.create({
            data: {
              gatewayEventId: webhookEventId,
              gateway: detectedGatewayType,
              eventType: event,
              payload: { event, data } as Prisma.InputJsonValue,
              status: 'PROCESSING',
            },
          });
        } catch (createError) {
          // Unique constraint violation means another process is handling this event
          if (createError instanceof Prisma.PrismaClientKnownRequestError && createError.code === 'P2002') {
            logger.info(`[PaymentService.handleWebhook] Race condition: webhook event being processed by another instance: ${webhookEventId}`);
            return { status: 'DUPLICATE', message: 'Webhook being processed by another instance' };
          }
          throw createError;
        }
      }

      // Process webhook through gateway
      // For Paystack (and similar gateways), the handler expects the raw webhook payload
      // including both the event name and data. Our tests call PaymentService.handleWebhook
      // with (event, data), so we reconstruct the original payload shape here.
      const webhookPayload = { event, data };
      const webhookResult = await gateway.handleWebhook(webhookPayload, event);
      const reference = webhookResult.reference;

      if (!reference) {
        logger.error('Webhook missing reference');
        return;
      }

      // Verify payment
      const verification = await this.verifyPayment(reference, detectedGatewayType);

      if (verification.success) {
        // Route subscription payments (SUB- prefix) to SubscriptionService
        if (reference.startsWith('SUB-')) {
          const { SubscriptionService } = await import('./subscription.service.js');
          await SubscriptionService.handleSubscriptionPaymentSuccess(
            reference,
            verification.reference,
          );
          logger.info(`Subscription payment webhook processed: ${reference}`);
          return { status: 'SUCCESS', message: 'Subscription payment processed' };
        }

        // Find registration by reference
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            paymentTransactionId: reference,
          },
          include: {
            ticketLineItems: true, // Include ticket line items for multiple ticket types
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

          // FIX: Silent payment failure - notify user and admin about the mismatch
          // Update registration to indicate payment issue
          await prisma.eventRegistration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: 'AMOUNT_MISMATCH',
            },
          });

          // Notify the attendee about the payment issue
          try {
            await NotificationService.sendNotification({
              userId: registration.attendeeId,
              type: NotificationType.PAYMENT_FAILED,
              title: `Payment Issue: ${registration.event.title}`,
              message: `There was an issue with your payment for "${registration.event.title}". The amount paid (${paidAmount}) does not match the expected amount (${expectedAmount}). Please contact support for assistance. Reference: ${reference}`,
              priority: NotificationPriority.HIGH,
              eventId: registration.eventId,
              registrationId: registration.id,
              data: {
                expectedAmount,
                paidAmount,
                difference: amountDifference,
                reference,
                issueType: 'AMOUNT_MISMATCH',
              },
            });
          } catch (notifyError) {
            logger.error('Failed to send payment mismatch notification to attendee:', notifyError);
          }

          // Notify the organizer about the payment mismatch
          try {
            await NotificationService.sendNotification({
              userId: registration.event.organizerId,
              type: NotificationType.PAYMENT_FAILED,
              title: `Payment Mismatch Alert: ${registration.event.title}`,
              message: `A payment amount mismatch was detected for "${registration.event.title}". Expected: ${expectedAmount}, Paid: ${paidAmount}. Attendee: ${registration.attendee.email}. Reference: ${reference}. Please review and take appropriate action.`,
              priority: NotificationPriority.HIGH,
              eventId: registration.eventId,
              registrationId: registration.id,
              relatedUserId: registration.attendeeId,
              data: {
                expectedAmount,
                paidAmount,
                difference: amountDifference,
                reference,
                attendeeEmail: registration.attendee.email,
                issueType: 'AMOUNT_MISMATCH',
              },
            });
          } catch (notifyError) {
            logger.error('Failed to send payment mismatch notification to organizer:', notifyError);
          }

          logger.warn(`CRITICAL: Payment amount mismatch detected. Reference: ${reference}, Expected: ${expectedAmount}, Paid: ${paidAmount}. Notifications sent to user and organizer.`);

          // Update webhook event status if available
          if (webhookEventId) {
            await prisma.paymentWebhookEvent.update({
              where: { gatewayEventId: webhookEventId },
              data: {
                status: 'PROCESSED',
                reference,
                registrationId: registration.id,
              },
            });
          }

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

          // Get gateway transaction ID from verification
          const gatewayVerification = await gateway.verifyPayment({ reference });

          // Extract idempotency key from metadata (passed through during payment initialization)
          const paymentMetadata = verification.metadata || data.metadata || data;
          const idempotencyKey = (paymentMetadata as Record<string, unknown>)?.idempotencyKey as string | undefined;

          // Create payment transaction record
          const paymentTransaction = await tx.eventPaymentTransaction.create({
            data: {
              transactionNumber,
              gateway: detectedGatewayType,
              gatewayReference: reference,
              gatewayAmount: verification.amount * 100, // Store in smallest unit (kobo/cents)
              gatewayTransactionId: gatewayVerification.gatewayTransactionId || null,
              currency: gatewayVerification.currency || 'NGN',
              amount: verification.amount,
              paymentMethod: detectedGatewayType,
              paymentStatus: 'success',
              paymentDate: new Date(),
              eventId: registration.eventId,
              registrationId: registration.id,
              attendeeEmail: registration.attendee.email || verification.customer.email || '',
              attendeeName: registration.attendee.firstName && registration.attendee.lastName
                ? `${registration.attendee.firstName} ${registration.attendee.lastName}`
                : null,
              gatewayMetadata: data as Prisma.InputJsonValue,
              idempotencyKey: idempotencyKey || null, // Store idempotency key for tracking
            },
          });

          // Update registration status
          await tx.eventRegistration.update({
            where: { id: registration.id },
            data: {
              status: syncedStatus.status,
              paymentStatus: syncedStatus.paymentStatus,
              paymentMethod: detectedGatewayType,
            },
          });

          logger.info(`Payment transaction created: ${paymentTransaction.id} for registration: ${registration.id}`);

          // Confirm seat reservation if one exists for this registration
          try {
            const { SeatSelectionService } = await import('./seat-selection.service.js');
            await SeatSelectionService.confirmSeatReservation(registration.id);
            logger.info(`Seat reservation confirmed for registration: ${registration.id}`);
          } catch (seatError: unknown) {
            // Only log if it's a real error — missing reservations are expected for non-seated events
            if (!(seatError instanceof Error && seatError.message === 'Seat reservation not found')) {
              logger.error(`Failed to confirm seat reservation for registration ${registration.id}:`, seatError);
            }
          }

          // Automatically calculate and create platform fee
          try {
            await PlatformFeeService.createPlatformFee(paymentTransaction.id);
            logger.info(`Platform fee calculated for transaction: ${paymentTransaction.id}`);
          } catch (feeError) {
            // Log error but don't fail the payment - fee can be calculated later
            logger.error(`Failed to calculate platform fee for transaction ${paymentTransaction.id}:`, feeError);
          }

          // Automatically generate invoice
          try {
            const { InvoiceService } = await import('./invoice.service.js');
            await InvoiceService.createInvoice(paymentTransaction.id);
            logger.info(`Invoice generated for transaction: ${paymentTransaction.id}`);
          } catch (invoiceError) {
            // Log error but don't fail the payment - invoice can be generated later
            logger.error(`Failed to generate invoice for transaction ${paymentTransaction.id}:`, invoiceError);
          }

          // Trigger webhook for payment success
          try {
            const { WebhookService } = await import('./webhook.service.js');
            await WebhookService.triggerWebhook(
              'payment.success',
              {
                transactionId: paymentTransaction.id,
                registrationId: registration.id,
                eventId: registration.eventId,
                amount: Number(verification.amount),
                currency: gatewayVerification.currency,
                gateway: detectedGatewayType,
              },
              paymentTransaction.id,
            );
          } catch (webhookError) {
            // Log error but don't fail the payment - webhook failures shouldn't break the flow
            logger.error(`Failed to trigger webhook for transaction ${paymentTransaction.id}:`, webhookError);
          }
        });

        // Send ticket email
        logger.debug(`[PaymentService.handleWebhook] Starting ticket email sending for registration ${registration.id}`);
        try {
          // Ensure organizer has a name (either personal name or organization name)
          const hasOrganizerName = (registration.event.organizer.firstName && registration.event.organizer.lastName) || registration.event.organizer.organizationName;
          if (hasOrganizerName) {
            logger.debug('[PaymentService.handleWebhook] Organizer info present, preparing ticket email data');

            // Transform registration data to match TicketEmailData interface
            // Convert Decimal types to numbers for ticketLineItems
            // Type assertion needed because Prisma types may not fully include ticketLineItems relation
            // The query includes ticketLineItems, but TypeScript may not infer it correctly
            const registrationWithLineItems = registration as typeof registration & {
              ticketLineItems?: Array<{
                ticketType: string;
                quantity: number;
                unitPrice: Prisma.Decimal | number;
                totalPrice: Prisma.Decimal | number;
              }>;
            };

            // Safely extract ticketLineItems if they exist
            let ticketLineItems: Array<{
              ticketType: string;
              quantity: number;
              unitPrice: number;
              totalPrice: number;
            }> | undefined;

            try {
              logger.debug('[PaymentService.handleWebhook] Extracting ticketLineItems from registration');
              // Safely access ticketLineItems - it may not exist if Prisma query didn't include it
              const lineItems = registrationWithLineItems.ticketLineItems;
              logger.debug('[PaymentService.handleWebhook] ticketLineItems raw value:', lineItems ? `${Array.isArray(lineItems) ? lineItems.length : 'not array'} items` : 'undefined/null');

              if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
                ticketLineItems = lineItems.map((item: {
                  ticketType: string;
                  quantity: number;
                  unitPrice: Prisma.Decimal | number;
                  totalPrice: Prisma.Decimal | number;
                }) => ({
                  ticketType: item.ticketType,
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice),
                  totalPrice: Number(item.totalPrice),
                }));
                logger.debug(`[PaymentService.handleWebhook] Successfully extracted ${ticketLineItems.length} ticket line items`);
              } else {
                logger.debug('[PaymentService.handleWebhook] No ticket line items to extract');
              }
            } catch (lineItemsError) {
              // If ticketLineItems extraction fails, just log and continue without them
              logger.warn(`[PaymentService.handleWebhook] Failed to extract ticketLineItems for registration ${registration.id}:`, {
                error: lineItemsError instanceof Error ? lineItemsError.message : String(lineItemsError),
                stack: lineItemsError instanceof Error ? lineItemsError.stack : undefined,
              });
              ticketLineItems = undefined;
            }
            // Fetch account invitation token if available (for guest users set account up)
            let accountInvitationToken: string | null | undefined;
            try {
              const emailVerification = await prisma.emailVerification.findFirst({
                where: {
                  userId: registration.attendee.id,
                  verified: false,
                  expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' },
              });
              accountInvitationToken = emailVerification?.token;
              if (accountInvitationToken) {
                logger.debug(`[PaymentService.handleWebhook] Found account invitation token for user ${registration.attendee.id}`);
              }
            } catch (tokenError) {
              logger.warn(`[PaymentService.handleWebhook] Failed to fetch account invitation token: ${tokenError}`);
            }

            // Send email asynchronously (non-blocking) - webhook response is immediate
            logger.debug(`[PaymentService.handleWebhook] Calling TicketService.sendTicketEmail for registration ${registration.id}`);
            TicketService.sendTicketEmail({
              id: registration.id,
              ticketType: registration.ticketType,
              quantity: registration.quantity,
              totalAmount: registration.totalAmount,
              createdAt: registration.createdAt,
              backupCode: registration.backupCode,
              registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
              ticketLineItems,
              accountInvitationToken, // Consolidated: Send setup link in ticket email
              event: registration.event,
              attendee: registration.attendee,
            }).catch((emailError) => {
              // Log email error but don't fail payment - email can be resent later
              logger.error(`[PaymentService.handleWebhook] Failed to send ticket email (async) for registration ${registration.id}:`, {
                error: emailError instanceof Error ? emailError.message : String(emailError),
                stack: emailError instanceof Error ? emailError.stack : undefined,
                registrationId: registration.id,
              });
              // Payment still succeeds even if email fails - status already tracked in database
            });
            // Email status will be updated in database by sendTicketEmail
            logger.debug(`[PaymentService.handleWebhook] Ticket email sending started (async) for registration ${registration.id}`);

            // Automatically add to digital wallet if enabled
            const wallet = await prisma.digitalWallet.findUnique({
              where: { userId: registration.attendeeId },
            });

            if (wallet?.autoAddTickets !== false) {
              DigitalWalletService.addTicketToWallet(registration.attendeeId, registration.id).catch((walletError) => {
                logger.warn(`Failed to auto-add ticket to wallet for registration ${registration.id}:`, walletError);
              });
            }
          } else {
            logger.warn(`Cannot send ticket email: organizer name (firstName/lastName or organizationName) missing for registration: ${registration.id}`);
          }
        } catch (error) {
          logger.error('Failed to send ticket email:', error);
          // Don't fail the webhook if email fails
        }

        // Send payment success notifications
        try {
          // Notify attendee - Registration Confirmed
          await NotificationService.sendNotification({
            userId: registration.attendeeId,
            type: NotificationType.REGISTRATION_CONFIRMED,
            title: `Registration Confirmed: ${registration.event.title}`,
            message: `Your registration for "${registration.event.title}" has been confirmed! Your payment of ₦${verification.amount.toLocaleString()} was successful. Your ticket has been sent to your email.`,
            priority: NotificationPriority.HIGH,
            eventId: registration.eventId,
            registrationId: registration.id,
            data: {
              amount: verification.amount,
              currency: 'NGN',
              transactionReference: reference,
              eventDate: registration.event.startDate,
              eventTime: registration.event.startTime,
            },
          });

          // Notify attendee - Payment Success (separate notification)
          await NotificationService.sendNotification({
            userId: registration.attendeeId,
            type: NotificationType.PAYMENT_SUCCESS,
            title: `Payment Successful: ${registration.event.title}`,
            message: `Your payment of ₦${verification.amount.toLocaleString()} for "${registration.event.title}" has been confirmed. Your ticket has been sent to your email.`,
            priority: NotificationPriority.HIGH,
            eventId: registration.eventId,
            registrationId: registration.id,
            data: {
              amount: verification.amount,
              currency: 'NGN',
              transactionReference: reference,
            },
          });

          // Notify organizer
          await NotificationService.sendNotification({
            userId: registration.event.organizerId,
            type: NotificationType.PAYMENT_RECEIVED,
            title: `Payment Received: ${registration.event.title}`,
            message: `A payment of ₦${verification.amount.toLocaleString()} has been received for "${registration.event.title}" from ${registration.attendee.firstName || registration.attendee.email}.`,
            priority: NotificationPriority.MEDIUM,
            eventId: registration.eventId,
            registrationId: registration.id,
            relatedUserId: registration.attendeeId,
            data: {
              amount: verification.amount,
              currency: 'NGN',
              attendeeName: registration.attendee.firstName && registration.attendee.lastName
                ? `${registration.attendee.firstName} ${registration.attendee.lastName}`
                : registration.attendee.email,
            },
          });
        } catch (error) {
          logger.error('Failed to send payment success notifications:', error);
        }

        logger.info(`Payment completed: ${reference} for registration: ${registration.id}`);

        // Update webhook event status to PROCESSED
        if (webhookEventId) {
          await prisma.paymentWebhookEvent.update({
            where: { gatewayEventId: webhookEventId },
            data: {
              status: 'PROCESSED',
              reference,
              registrationId: registration.id,
            },
          });
        }
      }

      // Handle payment failure events
      if (event === 'charge.failed') {
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
              quantity: true,
              eventId: true,
            },
          });

          if (registration) {
            // Get full registration details for notification and capacity restoration
            const fullRegistration = await prisma.eventRegistration.findUnique({
              where: { id: registration.id },
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    capacity: true,
                    availableSlots: true,
                  },
                },
                attendee: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            });

            // Use status validation to ensure consistency
            const syncedStatus = EventService.validateAndSyncStatus(
              registration.status,
              'PENDING', // Current payment status before failure
              'FAILED',
              RegistrationStatus.CANCELLED,
            );

            // Cancel registration and restore capacity atomically
            await prisma.$transaction(async (tx) => {
              // Cancel the registration
              await tx.eventRegistration.update({
                where: { id: registration.id },
                data: {
                  status: syncedStatus.status,
                  paymentStatus: syncedStatus.paymentStatus,
                  cancelledAt: new Date(),
                },
              });

              // Restore event capacity
              if (fullRegistration?.event.capacity !== null && fullRegistration?.event.capacity !== undefined) {
                const newAvailableSlots = (fullRegistration.event.availableSlots || fullRegistration.event.capacity) + registration.quantity;
                await tx.event.update({
                  where: { id: registration.eventId },
                  data: {
                    availableSlots: Math.min(fullRegistration.event.capacity, newAvailableSlots),
                  },
                });
                logger.info(`Restored ${registration.quantity} capacity slot(s) for event ${registration.eventId} after payment failure`);
              }

              // Release any seat reservations
              const seatReservations = await tx.seatReservation.findMany({
                where: {
                  registrationId: registration.id,
                  status: { in: ['reserved'] },
                },
                select: { id: true, seatId: true },
              });

              if (seatReservations.length > 0) {
                await tx.seatReservation.updateMany({
                  where: { id: { in: seatReservations.map(r => r.id) } },
                  data: { status: 'cancelled' },
                });
                await tx.seat.updateMany({
                  where: { id: { in: seatReservations.map(r => r.seatId) } },
                  data: { status: SeatStatus.AVAILABLE },
                });
                logger.info(`Released ${seatReservations.length} seat(s) for registration ${registration.id} after payment failure`);
              }
            });

            // Send payment failed notification
            if (fullRegistration) {
              try {
                await NotificationService.sendNotification({
                  userId: fullRegistration.attendeeId,
                  type: NotificationType.PAYMENT_FAILED,
                  title: `Payment Failed: ${fullRegistration.event.title}`,
                  message: `Your payment for "${fullRegistration.event.title}" has failed. Your registration has been cancelled and the tickets have been released. Please try again or contact support if the issue persists.`,
                  priority: NotificationPriority.HIGH,
                  eventId: fullRegistration.eventId,
                  registrationId: registration.id,
                  data: {
                    transactionReference: reference,
                  },
                });
              } catch (error) {
                logger.error('Failed to send payment failed notification:', error);
              }
            }

            logger.info(`Payment failed: ${reference} for registration: ${registration.id} — registration cancelled, capacity restored`);

            // Update webhook event status to PROCESSED for payment failure
            if (webhookEventId) {
              await prisma.paymentWebhookEvent.update({
                where: { gatewayEventId: webhookEventId },
                data: {
                  status: 'PROCESSED',
                  reference,
                  registrationId: registration.id,
                },
              });
            }
          } else {
            logger.warn(`Payment failed webhook: Registration not found for reference: ${reference}`);
          }
        }
      }

      // Mark any unprocessed webhook events as ignored (for events we don't handle)
      if (webhookEventId) {
        const webhookEvent = await prisma.paymentWebhookEvent.findUnique({
          where: { gatewayEventId: webhookEventId },
        });
        if (webhookEvent && webhookEvent.status === 'PROCESSING') {
          await prisma.paymentWebhookEvent.update({
            where: { gatewayEventId: webhookEventId },
            data: { status: 'IGNORED' },
          });
        }
      }
    } catch (error) {
      // Update webhook event status to FAILED on error
      if (webhookEventId) {
        try {
          await prisma.paymentWebhookEvent.update({
            where: { gatewayEventId: webhookEventId },
            data: {
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : String(error),
            },
          });
        } catch (updateError) {
          logger.error('Failed to update webhook event status:', updateError);
        }
      }
      logger.error('Failed to handle payment webhook:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature for payment gateways
   */
  verifyWebhookSignature(payload: string, signature: string, gatewayType: GatewayType = 'PAYSTACK'): boolean {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');

    // Paystack webhook verification using HMAC-SHA512
    if (gatewayType === 'PAYSTACK') {
      if (!config.paystack?.secretKey) {
        logger.error('Paystack secret key not configured');
        return false;
      }
      const hash = crypto
        .createHmac('sha512', config.paystack.secretKey)
        .update(payload)
        .digest('hex');
      return hash === signature;
    }

    // Stripe webhook verification using their SDK
    // Note: Stripe uses a different signature format (t=timestamp,v1=signature)
    if (gatewayType === 'STRIPE') {
      if (!config.stripe?.webhookSecret) {
        logger.error('Stripe webhook secret not configured');
        return false;
      }
      try {
        // Stripe signature header format: t=timestamp,v1=signature
        // Extract the timestamp and signature from the header
        const elements = signature.split(',');
        const signatureElements: Record<string, string> = {};

        for (const element of elements) {
          const [key, value] = element.split('=');
          if (key && value) {
            signatureElements[key] = value;
          }
        }

        const timestamp = signatureElements['t'];
        const v1Signature = signatureElements['v1'];

        if (!timestamp || !v1Signature) {
          logger.error('Stripe webhook: Invalid signature format');
          return false;
        }

        // Verify timestamp is within tolerance (5 minutes)
        const timestampNum = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const tolerance = 300; // 5 minutes

        if (Math.abs(currentTime - timestampNum) > tolerance) {
          logger.error('Stripe webhook: Timestamp outside tolerance window');
          return false;
        }

        // Compute expected signature
        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = crypto
          .createHmac('sha256', config.stripe.webhookSecret)
          .update(signedPayload)
          .digest('hex');

        // Compare signatures using timing-safe comparison
        return crypto.timingSafeEqual(
          Buffer.from(v1Signature, 'hex'),
          Buffer.from(expectedSignature, 'hex'),
        );
      } catch (error) {
        logger.error('Stripe webhook signature verification error:', error);
        return false;
      }
    }

    // PayPal webhook verification (for future implementation)
    if (gatewayType === 'PAYPAL') {
      logger.warn('PayPal webhook verification not yet implemented');
      return false; // Reject unverifiable webhooks
    }

    logger.error(`Unknown gateway type for webhook verification: ${gatewayType}`);
    return false;
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
    // Use gateway manager instead of direct config access
    const _paystackGateway = this.gatewayManager.getGateway('PAYSTACK');

    if (!config.paystack?.secretKey) {
      throw new ValidationError('Paystack payment service is not configured');
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

        // Use Paystack SDK directly for transaction listing
        // Note: This is a sync operation that requires direct API access
        // The gateway interface doesn't include listTransactions, so we use the SDK directly
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Paystack = require('paystack');
        if (!config.paystack?.secretKey) {
          throw new ValidationError('Paystack secret key is required for syncing transactions');
        }

        const paystackInstance = Paystack(config.paystack.secretKey);
        const response = await paystackInstance.transaction.list(params);

        // Type-safe response handling
        if (!response || !response.data || !Array.isArray(response.data)) {
          hasMore = false;
          break;
        }

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
              where: { gatewayReference: paystackTx.reference },
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
                gateway: 'PAYSTACK',
                gatewayReference: paystackTx.reference,
                gatewayAmount: paystackTx.amount,
                gatewayTransactionId: paystackTx.id?.toString() || null,
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
                gatewayMetadata: (paystackTx.metadata || {}) as Prisma.InputJsonValue,
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


