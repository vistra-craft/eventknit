import { Request, Response, NextFunction } from 'express';
import { paymentService, InitializePaymentData } from '../services/payment.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

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

      const { registrationId } = req.body;

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

      const paymentData: InitializePaymentData = {
        registrationId,
        email: registration.attendee.email,
        amount: Number(registration.totalAmount),
        currency: 'NGN', // Can be made configurable
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
  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-paystack-signature'] as string;

      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing signature',
        });
        return;
      }

      // Verify webhook signature
      const payload = JSON.stringify(req.body);
      const isValid = paymentService.verifyWebhookSignature(payload, signature);

      if (!isValid) {
        logger.warn('Invalid webhook signature');
        res.status(401).json({
          success: false,
          message: 'Invalid signature',
        });
        return;
      }

      const event = req.body.event;
      const data = req.body.data;

      // Handle webhook
      await paymentService.handleWebhook(event, data);

      // Always return 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    } catch (error) {
      logger.error('Webhook error:', error);
      // Still return 200 to prevent Paystack from retrying
      res.status(200).json({
        success: false,
        message: 'Webhook processed with errors',
      });
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

      const { registrationId } = req.params;

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

