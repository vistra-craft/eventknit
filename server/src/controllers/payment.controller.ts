import { Request, Response, NextFunction } from 'express';
import { paymentService, InitializePaymentData } from '../services/payment.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class PaymentController {
  /**
   * Initialize payment for a registration
   */
  static async initializePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { registrationId, gateway } = req.body;

      if (!registrationId) {
        res.status(400).json({
          success: false,
          message: 'Registration ID is required',
        });
        return;
      }

      // Get registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              isFree: true,
            },
          },
          attendee: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!registration) {
        res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
        return;
      }

      // Verify user owns the registration
      if (registration.attendeeId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to pay for this registration',
        });
        return;
      }

      // Check if already paid
      if (registration.paymentStatus === 'COMPLETED') {
        res.status(400).json({
          success: false,
          message: 'Payment already completed',
        });
        return;
      }

      // Check if free event
      if (registration.event.isFree) {
        res.status(400).json({
          success: false,
          message: 'This is a free event, no payment required',
        });
        return;
      }

      // Get event currency for payment
      const eventWithCurrency = await prisma.event.findUnique({
        where: { id: registration.eventId },
        select: { currency: true },
      });

      const paymentData: InitializePaymentData = {
        registrationId,
        email: registration.attendee.email,
        amount: Number(registration.totalAmount),
        currency: eventWithCurrency?.currency || 'KES',
        gateway,
        metadata: {
          userId: req.user.id,
          eventId: registration.eventId,
        },
      };

      const result = await paymentService.initializePayment(paymentData);

      res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify payment
   */
  static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reference } = req.query;

      if (!reference || typeof reference !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Payment reference is required',
        });
        return;
      }

      const verification = await paymentService.verifyPayment(reference);

      res.status(200).json({
        success: verification.success,
        message: verification.success ? 'Payment verified successfully' : 'Payment verification failed',
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Paystack webhook
   */
  static async handleWebhook(req: Request & { rawBody?: string }, res: Response, _next: NextFunction): Promise<void> {
    try {
      const paystackSig = req.headers['x-paystack-signature'] as string | undefined;
      const stripeSig = req.headers['stripe-signature'] as string | undefined;

      // Detect which gateway sent this webhook from its signature header
      const isStripe = !!stripeSig;
      const isPaystack = !!paystackSig;

      if (!isStripe && !isPaystack) {
        res.status(400).json({ success: false, message: 'Missing webhook signature' });
        return;
      }

      const payload = req.rawBody ?? JSON.stringify(req.body);

      if (isStripe) {
        const isValid = paymentService.verifyWebhookSignature(payload, stripeSig!, 'STRIPE');
        if (!isValid) {
          logger.warn('Invalid Stripe webhook signature');
          res.status(401).json({ success: false, message: 'Invalid signature' });
          return;
        }

        // Stripe event structure: { id, type, data: { object: {...} } }
        const stripeBody = req.body as {
          id: string;
          type: string;
          data: { object: Record<string, unknown> };
        };
        const stripeData = { ...stripeBody.data.object, id: stripeBody.id };
        await paymentService.handleWebhook(stripeBody.type, stripeData, 'STRIPE', stripeSig!);
      } else {
        // Paystack: delegate signature verification to gateway inside handleWebhook
        await paymentService.handleWebhook(req.body.event, req.body.data, 'PAYSTACK', paystackSig!, payload);
      }

      // Always return 200 so the payment provider stops retrying
      res.status(200).json({ success: true, message: 'Webhook received' });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(200).json({ success: false, message: 'Webhook processed with errors' });
    }
  }

  /**
   * Initialize payment for guest users (no authentication required)
   */
  static async initializeGuestPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationId, email, gateway } = req.body;

      if (!registrationId) {
        res.status(400).json({
          success: false,
          message: 'Registration ID is required',
        });
        return;
      }

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      // Validate guest payment (email + registration ID)
      await paymentService.validateGuestPayment(registrationId, email);

      // Get registration details
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              isFree: true,
            },
          },
          attendee: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!registration) {
        res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
        return;
      }

      // Check if free event
      if (registration.event.isFree) {
        res.status(400).json({
          success: false,
          message: 'This is a free event, no payment required',
        });
        return;
      }

      // Get event currency for payment
      const eventWithCurrency = await prisma.event.findUnique({
        where: { id: registration.eventId },
        select: { currency: true },
      });

      const paymentData: InitializePaymentData = {
        registrationId,
        email: registration.attendee.email || email,
        amount: Number(registration.totalAmount),
        currency: eventWithCurrency?.currency || 'KES',
        gateway,
        metadata: {
          eventId: registration.eventId,
          isGuest: true,
        },
      };

      const result = await paymentService.initializePayment(paymentData);

      res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment status for a registration
   */
  static async getPaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const registrationId = (req.params.registrationId as string) as string;

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          id: true,
          paymentStatus: true,
          paymentMethod: true,
          paymentTransactionId: true,
          totalAmount: true,
          attendeeId: true,
        },
      });

      if (!registration) {
        res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
        return;
      }

      // Verify user owns the registration
      if (registration.attendeeId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to view this payment status',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          paymentStatus: registration.paymentStatus,
          paymentMethod: registration.paymentMethod,
          paymentTransactionId: registration.paymentTransactionId,
          totalAmount: Number(registration.totalAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}


