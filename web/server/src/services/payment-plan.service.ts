import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class PaymentPlanService {
  /**
   * Create a payment plan for a registration
   */
  static async createPaymentPlan(
    registrationId: string,
    data: {
      planName: string;
      installmentCount: number;
      frequency: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'CUSTOM';
      startDate: Date;
      autoPaymentEnabled?: boolean;
      paymentMethod?: string;
    },
  ) {
    try {
      // Get registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            select: {
              id: true,
              currency: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      // Check if payment plan already exists
      const existing = await prisma.paymentPlan.findUnique({
        where: { registrationId },
      });

      if (existing) {
        throw new ValidationError('Payment plan already exists for this registration');
      }

      // Calculate installment amount
      const totalAmount = Number(registration.totalAmount || 0);
      const installmentAmount = new Decimal(totalAmount / data.installmentCount);

      // Calculate end date based on frequency
      const endDate = this.calculateEndDate(data.startDate, data.installmentCount, data.frequency);

      // Create payment plan
      const plan = await prisma.paymentPlan.create({
        data: {
          registrationId,
          eventId: registration.eventId,
          planName: data.planName,
          totalAmount: new Decimal(totalAmount),
          currency: registration.event.currency || 'NGN',
          installmentCount: data.installmentCount,
          installmentAmount,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate,
          autoPaymentEnabled: data.autoPaymentEnabled ?? true,
          paymentMethod: data.paymentMethod,
          status: 'ACTIVE',
        },
      });

      // Create installments
      await this.createInstallments(plan.id, {
        installmentCount: data.installmentCount,
        installmentAmount: Number(installmentAmount),
        frequency: data.frequency,
        startDate: data.startDate,
        currency: plan.currency,
      });

      logger.info(`Payment plan created: ${plan.id} for registration: ${registrationId}`);
      return plan;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating payment plan:', error);
      throw new ValidationError(`Failed to create payment plan: ${error.message}`);
    }
  }

  /**
   * Create installments for a payment plan
   */
  private static async createInstallments(
    planId: string,
    config: {
      installmentCount: number;
      installmentAmount: number;
      frequency: string;
      startDate: Date;
      currency: string;
    },
  ) {
    const installments = [];
    let currentDate = new Date(config.startDate);

    for (let i = 1; i <= config.installmentCount; i++) {
      installments.push({
        planId,
        installmentNumber: i,
        amount: new Decimal(config.installmentAmount),
        currency: config.currency,
        dueDate: new Date(currentDate),
        status: 'PENDING',
      });

      // Calculate next due date
      currentDate = this.calculateNextDueDate(currentDate, config.frequency);
    }

    await prisma.paymentInstallment.createMany({
      data: installments,
    });
  }

  /**
   * Calculate end date based on frequency
   */
  private static calculateEndDate(startDate: Date, installmentCount: number, frequency: string): Date {
    const endDate = new Date(startDate);
    const monthsToAdd = frequency === 'MONTHLY' ? installmentCount - 1 :
      frequency === 'BIWEEKLY' ? Math.floor((installmentCount - 1) / 2) :
        frequency === 'WEEKLY' ? Math.floor((installmentCount - 1) / 4) : 0;

    endDate.setMonth(endDate.getMonth() + monthsToAdd);
    return endDate;
  }

  /**
   * Calculate next due date
   */
  private static calculateNextDueDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }

  /**
   * Get payment plan by registration ID
   */
  static async getPaymentPlanByRegistration(registrationId: string) {
    try {
      const plan = await prisma.paymentPlan.findUnique({
        where: { registrationId },
        include: {
          installments: {
            orderBy: { installmentNumber: 'asc' },
          },
          registration: {
            include: {
              attendee: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!plan) {
        throw new NotFoundError('Payment plan not found');
      }

      return plan;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching payment plan:', error);
      throw new ValidationError(`Failed to fetch payment plan: ${error.message}`);
    }
  }

  /**
   * Get user's payment plans
   */
  static async getUserPaymentPlans(userId: string, filters?: {
    status?: string;
    eventId?: string;
  }) {
    try {
      const where: any = {
        registration: {
          attendeeId: userId,
        },
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      const plans = await prisma.paymentPlan.findMany({
        where,
        include: {
          installments: {
            orderBy: { installmentNumber: 'asc' },
          },
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return plans;
    } catch (error: any) {
      logger.error('Error fetching user payment plans:', error);
      throw new ValidationError(`Failed to fetch payment plans: ${error.message}`);
    }
  }

  /**
   * Process installment payment
   */
  static async processInstallmentPayment(
    installmentId: string,
    paymentData: {
      amount: number;
      transactionId?: string;
      gateway?: string;
      gatewayReference?: string;
    },
  ) {
    try {
      const installment = await prisma.paymentInstallment.findUnique({
        where: { id: installmentId },
        include: {
          plan: {
            include: {
              registration: true,
            },
          },
        },
      });

      if (!installment) {
        throw new NotFoundError('Installment not found');
      }

      if (installment.status === 'PAID') {
        throw new ValidationError('Installment already paid');
      }

      // Update installment
      const updated = await prisma.paymentInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: new Decimal(paymentData.amount),
          paidAt: new Date(),
          status: 'PAID',
          paymentTransactionId: paymentData.transactionId,
        },
      });

      // Check if all installments are paid
      const remainingInstallments = await prisma.paymentInstallment.count({
        where: {
          planId: installment.planId,
          status: { not: 'PAID' },
        },
      });

      if (remainingInstallments === 0) {
        // Mark plan as completed
        await prisma.paymentPlan.update({
          where: { id: installment.planId },
          data: {
            status: 'COMPLETED',
          },
        });

        // Update registration payment status
        await prisma.eventRegistration.update({
          where: { id: installment.plan.registrationId },
          data: {
            paymentStatus: 'COMPLETED',
          },
        });
      }

      logger.info(`Installment paid: ${installmentId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error processing installment payment:', error);
      throw new ValidationError(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Get overdue installments
   */
  static async getOverdueInstallments(userId?: string) {
    try {
      const where: any = {
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      };

      if (userId) {
        where.plan = {
          registration: {
            attendeeId: userId,
          },
        };
      }

      const overdue = await prisma.paymentInstallment.findMany({
        where,
        include: {
          plan: {
            include: {
              registration: {
                include: {
                  attendee: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      // Update status to OVERDUE
      await prisma.paymentInstallment.updateMany({
        where: {
          id: { in: overdue.map((i) => i.id) },
        },
        data: {
          status: 'OVERDUE',
        },
      });

      return overdue;
    } catch (error: any) {
      logger.error('Error fetching overdue installments:', error);
      throw new ValidationError(`Failed to fetch overdue installments: ${error.message}`);
    }
  }

  /**
   * Cancel payment plan
   */
  static async cancelPaymentPlan(planId: string, userId: string) {
    try {
      const plan = await prisma.paymentPlan.findUnique({
        where: { id: planId },
        include: {
          registration: true,
        },
      });

      if (!plan) {
        throw new NotFoundError('Payment plan not found');
      }

      if (plan.registration.attendeeId !== userId) {
        throw new ValidationError('You can only cancel your own payment plans');
      }

      if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
        throw new ValidationError('Payment plan cannot be cancelled');
      }

      // Cancel plan and pending installments
      await prisma.$transaction([
        prisma.paymentPlan.update({
          where: { id: planId },
          data: { status: 'CANCELLED' },
        }),
        prisma.paymentInstallment.updateMany({
          where: {
            planId,
            status: 'PENDING',
          },
          data: {
            status: 'CANCELLED',
          },
        }),
      ]);

      logger.info(`Payment plan cancelled: ${planId}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error cancelling payment plan:', error);
      throw new ValidationError(`Failed to cancel payment plan: ${error.message}`);
    }
  }
}
