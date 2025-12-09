import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PaymentPlanService } from '../services/payment-plan.service.js';

export class PaymentPlanController {
  /**
   * Create payment plan
   */
  static async createPaymentPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationId, planName, installmentCount, frequency, startDate, autoPaymentEnabled, paymentMethod } = req.body;

      const plan = await PaymentPlanService.createPaymentPlan(registrationId, {
        planName,
        installmentCount,
        frequency,
        startDate: new Date(startDate),
        autoPaymentEnabled,
        paymentMethod,
      });

      res.status(201).json({
        success: true,
        message: 'Payment plan created successfully',
        data: { plan },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment plan by registration
   */
  static async getPaymentPlanByRegistration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationId } = req.params;
      const plan = await PaymentPlanService.getPaymentPlanByRegistration(registrationId);

      res.status(200).json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's payment plans
   */
  static async getUserPaymentPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status, eventId } = req.query;
      const plans = await PaymentPlanService.getUserPaymentPlans(userId, {
        status: status as string,
        eventId: eventId as string,
      });

      res.status(200).json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process installment payment
   */
  static async processInstallmentPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { installmentId } = req.params;
      const { amount, transactionId, gateway, gatewayReference } = req.body;

      const installment = await PaymentPlanService.processInstallmentPayment(installmentId, {
        amount,
        transactionId,
        gateway,
        gatewayReference,
      });

      res.status(200).json({
        success: true,
        message: 'Installment payment processed successfully',
        data: { installment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get overdue installments
   */
  static async getOverdueInstallments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const installments = await PaymentPlanService.getOverdueInstallments(userId || undefined);

      res.status(200).json({
        success: true,
        data: { installments },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel payment plan
   */
  static async cancelPaymentPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { planId } = req.params;
      await PaymentPlanService.cancelPaymentPlan(planId, userId);

      res.status(200).json({
        success: true,
        message: 'Payment plan cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
