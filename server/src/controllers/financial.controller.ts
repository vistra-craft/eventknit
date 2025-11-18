import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { paymentService } from '../services/payment.service.js';
import { PlatformFeeService } from '../services/platform-fee.service.js';
import { DisbursementService } from '../services/disbursement.service.js';
import { RefundService } from '../services/refund.service.js';
import { ReconciliationService } from '../services/reconciliation.service.js';
import { prisma } from '../config/database.js';
import { UserRole } from '@prisma/client';
import { AuthorizationError } from '../utils/errors.js';

export class FinancialController {
  /**
   * Sync payments from Paystack
   * @route POST /api/v1/admin/finance/payments/sync
   */
  static async syncPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can sync payments
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const { startDate, endDate, eventId } = req.body;

      const result = await paymentService.syncPaymentsFromPaystack(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        eventId,
      );

      res.status(200).json({
        success: true,
        message: 'Payment sync completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment transactions
   * @route GET /api/v1/admin/finance/payments
   */
  static async getPaymentTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId, registrationId, status, startDate, endDate, page, limit } = req.query;

      const where: {
        eventId?: string;
        registrationId?: string;
        paymentStatus?: string;
        paymentDate?: { gte?: Date; lte?: Date };
      } = {};

      if (eventId) {
        where.eventId = eventId as string;
      }
      if (registrationId) {
        where.registrationId = registrationId as string;
      }
      if (status) {
        where.paymentStatus = status as string;
      }
      if (startDate || endDate) {
        where.paymentDate = {};
        if (startDate) {
          where.paymentDate.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.paymentDate.lte = new Date(endDate as string);
        }
      }

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const pageSize = limit ? parseInt(limit as string, 10) : 20;
      const skip = (pageNum - 1) * pageSize;

      const [transactions, total] = await Promise.all([
        prisma.eventPaymentTransaction.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                organizer: {
                  select: {
                    id: true,
                    organizationName: true,
                  },
                },
              },
            },
            registration: {
              select: {
                id: true,
                attendee: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            platformFee: {
              select: {
                id: true,
                feeAmount: true,
                organizerAmount: true,
                status: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.eventPaymentTransaction.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment transaction by ID
   * @route GET /api/v1/admin/finance/payments/:id
   */
  static async getPaymentTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const transaction = await prisma.eventPaymentTransaction.findUnique({
        where: { id: req.params.id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              organizer: {
                select: {
                  id: true,
                  organizationName: true,
                },
              },
            },
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
          platformFee: true,
          refund: true,
        },
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Payment transaction not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform fees for an event
   * @route GET /api/v1/admin/finance/platform-fees
   */
  static async getPlatformFees(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId, status, includeDisbursed } = req.query;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Event ID is required',
        });
        return;
      }

      const fees = await PlatformFeeService.getEventPlatformFees(eventId as string, {
        status: status as string | undefined,
        includeDisbursed: includeDisbursed === 'true',
      });

      res.status(200).json({
        success: true,
        data: fees,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform fee summary for an event
   * @route GET /api/v1/admin/finance/platform-fees/summary
   */
  static async getPlatformFeeSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId } = req.query;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Event ID is required',
        });
        return;
      }

      const summary = await PlatformFeeService.getEventPlatformFeeSummary(eventId as string);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create disbursement
   * @route POST /api/v1/admin/finance/disbursements
   */
  static async createDisbursement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const disbursement = await DisbursementService.createDisbursement(
        req.body,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Disbursement created successfully',
        data: disbursement,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get disbursements
   * @route GET /api/v1/admin/finance/disbursements
   */
  static async getDisbursements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { organizerId, eventId, status, startDate, endDate } = req.query;

      let disbursements;

      if (organizerId && req.user.role === UserRole.ORGANIZER && req.user.id !== organizerId) {
        // Organizers can only see their own disbursements
        throw new AuthorizationError('Access denied');
      }

      if (organizerId) {
        disbursements = await DisbursementService.getOrganizerDisbursements(organizerId as string, {
          eventId: eventId as string | undefined,
          status: status as string | undefined,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
        });
      } else if (eventId) {
        disbursements = await DisbursementService.getEventDisbursements(
          eventId as string,
          req.user.role === UserRole.ORGANIZER ? req.user.id : undefined,
        );
      } else {
        res.status(400).json({
          success: false,
          message: 'Either organizerId or eventId is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: disbursements,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get disbursement by ID
   * @route GET /api/v1/admin/finance/disbursements/:id
   */
  static async getDisbursement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const organizerId = req.user.role === UserRole.ORGANIZER ? req.user.id : undefined;
      const disbursement = await DisbursementService.getDisbursement(req.params.id, organizerId);

      res.status(200).json({
        success: true,
        data: disbursement,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process disbursement
   * @route POST /api/v1/admin/finance/disbursements/:id/process
   */
  static async processDisbursement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can process disbursements
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const disbursement = await DisbursementService.processDisbursement(
        req.params.id,
        req.body,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Disbursement processing started',
        data: disbursement,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete disbursement
   * @route POST /api/v1/admin/finance/disbursements/:id/complete
   */
  static async completeDisbursement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can complete disbursements
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const { paymentReference } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'Payment reference is required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const disbursement = await DisbursementService.completeDisbursement(
        req.params.id,
        paymentReference,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Disbursement completed',
        data: disbursement,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer disbursement summary
   * @route GET /api/v1/admin/finance/disbursements/summary
   */
  static async getDisbursementSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { organizerId } = req.query;

      if (!organizerId) {
        res.status(400).json({
          success: false,
          message: 'Organizer ID is required',
        });
        return;
      }

      // Organizers can only see their own summary
      if (req.user.role === UserRole.ORGANIZER && req.user.id !== organizerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const summary = await DisbursementService.getOrganizerDisbursementSummary(organizerId as string);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create refund
   * @route POST /api/v1/admin/finance/refunds
   */
  static async createRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const refund = await RefundService.createRefund(
        req.body,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Refund requested successfully',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get refunds
   * @route GET /api/v1/admin/finance/refunds
   */
  static async getRefunds(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId, status } = req.query;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Event ID is required',
        });
        return;
      }

      const refunds = await RefundService.getEventRefunds(eventId as string, {
        status: status as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get refund by ID
   * @route GET /api/v1/admin/finance/refunds/:id
   */
  static async getRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const refund = await RefundService.getRefund(req.params.id, req.user.id);

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process refund
   * @route POST /api/v1/admin/finance/refunds/:id/process
   */
  static async processRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can process refunds
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const refund = await RefundService.processRefund(
        req.params.id,
        req.body,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Refund processing started',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete refund
   * @route POST /api/v1/admin/finance/refunds/:id/complete
   */
  static async completeRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can complete refunds
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const { refundReference } = req.body;

      if (!refundReference) {
        res.status(400).json({
          success: false,
          message: 'Refund reference is required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const refund = await RefundService.completeRefund(
        req.params.id,
        refundReference,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Refund completed',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get refund summary for an event
   * @route GET /api/v1/admin/finance/refunds/summary
   */
  static async getRefundSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId } = req.query;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: 'Event ID is required',
        });
        return;
      }

      const summary = await RefundService.getEventRefundSummary(eventId as string);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create payment reconciliation
   * @route POST /api/v1/admin/finance/reconciliations
   */
  static async createReconciliation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can create reconciliations
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const { startDate, endDate, eventId } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await ReconciliationService.reconcilePayments(
        new Date(startDate),
        new Date(endDate),
        eventId,
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Reconciliation completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reconciliations
   * @route GET /api/v1/admin/finance/reconciliations
   */
  static async getReconciliations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can view reconciliations
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const { eventId, status, startDate, endDate } = req.query;

      const reconciliations = await ReconciliationService.getReconciliations({
        eventId: eventId as string | undefined,
        status: status as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: reconciliations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reconciliation by ID
   * @route GET /api/v1/admin/finance/reconciliations/:id
   */
  static async getReconciliation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can view reconciliations
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const reconciliation = await ReconciliationService.getReconciliation(req.params.id);

      res.status(200).json({
        success: true,
        data: reconciliation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Auto-fix reconciliation discrepancies
   * @route POST /api/v1/admin/finance/reconciliations/:id/auto-fix
   */
  static async autoFixReconciliation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Only admin can auto-fix reconciliations
      if (req.user.role !== UserRole.SUPERADMIN && req.user.role !== UserRole.ADMIN_STAFF) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
        return;
      }

      const reconciliation = await ReconciliationService.autoFixDiscrepancies(
        req.params.id,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: 'Reconciliation discrepancies auto-fixed',
        data: reconciliation,
      });
    } catch (error) {
      next(error);
    }
  }
}

