import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { generateReconciliationNumber } from '../utils/transaction-helpers.js';
import { paymentService } from './payment.service.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import Paystack from 'paystack';
import { config } from '../config/index.js';

export interface ReconciliationResult {
  id: string;
  reconciliationNumber: string;
  totalPaystackTransactions: number;
  totalSystemTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalPaystackAmount: number;
  totalSystemAmount: number;
  discrepancyAmount: number;
  status: string;
  discrepancies: Array<{
    type: string;
    reference?: string;
    description: string;
    paystackAmount?: number;
    systemAmount?: number;
  }>;
}

export class ReconciliationService {
  private static paystack: Paystack | null = null;

  private static getPaystack(): Paystack {
    if (!this.paystack) {
      if (!config.paystack.secretKey) {
        throw new ValidationError('Paystack secret key not configured');
      }
      this.paystack = new Paystack(config.paystack.secretKey);
    }
    return this.paystack;
  }

  /**
   * Reconcile payments between Paystack and our system
   * This compares Paystack transactions with our EventPaymentTransaction records
   */
  static async reconcilePayments(
    startDate: Date,
    endDate: Date,
    eventId: string | undefined,
    reconciledBy: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ReconciliationResult> {
    const paystack = this.getPaystack();

    // Generate reconciliation number
    let reconciliationNumber = generateReconciliationNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.paymentReconciliation.findUnique({
        where: { reconciliationNumber },
      });
      if (!existing) break;
      reconciliationNumber = generateReconciliationNumber();
      attempts++;
    }

    // Create reconciliation record
    const reconciliation = await prisma.paymentReconciliation.create({
      data: {
        reconciliationNumber,
        startDate,
        endDate,
        status: 'in_progress',
        totalPaystackTransactions: 0,
        totalSystemTransactions: 0,
        matchedTransactions: 0,
        unmatchedTransactions: 0,
        totalPaystackAmount: new Decimal(0),
        totalSystemAmount: new Decimal(0),
        discrepancyAmount: new Decimal(0),
        eventId: eventId || null,
        reconciledBy,
      },
    });

    try {
      // Fetch transactions from Paystack
      const paystackTransactions: Array<{
        reference: string;
        amount: number;
        status: string;
        paid_at?: string;
        created_at: string;
        metadata?: Record<string, unknown>;
      }> = [];

      let page = 1;
      let hasMore = true;
      const perPage = 50;

      while (hasMore) {
        const params: Record<string, unknown> = {
          perPage,
          page,
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        const response = await paystack.transaction.list(params);
        const transactions = response.data as Array<{
          reference: string;
          amount: number;
          status: string;
          paid_at?: string;
          created_at: string;
          metadata?: Record<string, unknown>;
        }>;

        if (!transactions || transactions.length === 0) {
          hasMore = false;
          break;
        }

        // Filter for successful transactions only
        const successful = transactions.filter((tx) => tx.status === 'success');
        paystackTransactions.push(...successful);

        if (transactions.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Filter by event if specified
      let filteredPaystackTransactions = paystackTransactions;
      if (eventId) {
        // Filter by eventId in metadata
        filteredPaystackTransactions = paystackTransactions.filter((tx) => {
          const metadata = tx.metadata || {};
          return metadata.eventId === eventId;
        });
      }

      // Get system transactions
      const systemWhere: {
        paymentStatus: string;
        paymentDate?: { gte: Date; lte: Date };
        eventId?: string;
      } = {
        paymentStatus: 'success',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (eventId) {
        systemWhere.eventId = eventId;
      }

      const systemTransactions = await prisma.eventPaymentTransaction.findMany({
        where: systemWhere,
        select: {
          id: true,
          paystackReference: true,
          amount: true,
          paymentDate: true,
          eventId: true,
        },
      });

      // Create maps for comparison
      const paystackMap = new Map(
        filteredPaystackTransactions.map((tx) => [
          tx.reference,
          {
            amount: tx.amount / 100, // Convert from kobo
            paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date(tx.created_at),
          },
        ]),
      );

      const systemMap = new Map(
        systemTransactions.map((tx) => [
          tx.paystackReference,
          {
            amount: Number(tx.amount),
            paymentDate: tx.paymentDate,
          },
        ]),
      );

      // Find matches and discrepancies
      const matched: string[] = [];
      const discrepancies: Array<{
        type: string;
        reference?: string;
        description: string;
        paystackAmount?: number;
        systemAmount?: number;
      }> = [];

      // Check Paystack transactions
      for (const [reference, paystackData] of paystackMap.entries()) {
        const systemData = systemMap.get(reference);

        if (systemData) {
          // Match found - check for amount discrepancies
          const amountDiff = Math.abs(paystackData.amount - systemData.amount);
          if (amountDiff > 0.01) {
            // Amount mismatch
            discrepancies.push({
              type: 'amount_mismatch',
              reference,
              description: `Amount mismatch for ${reference}`,
              paystackAmount: paystackData.amount,
              systemAmount: systemData.amount,
            });
          } else {
            matched.push(reference);
          }
        } else {
          // Transaction in Paystack but not in system
          discrepancies.push({
            type: 'missing_in_system',
            reference,
            description: `Transaction ${reference} exists in Paystack but not in system`,
            paystackAmount: paystackData.amount,
          });
        }
      }

      // Check system transactions
      for (const [reference, systemData] of systemMap.entries()) {
        if (!paystackMap.has(reference)) {
          // Transaction in system but not in Paystack
          discrepancies.push({
            type: 'missing_in_paystack',
            reference,
            description: `Transaction ${reference} exists in system but not in Paystack`,
            systemAmount: systemData.amount,
          });
        }
      }

      // Calculate totals
      const totalPaystackAmount = Array.from(paystackMap.values()).reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
      const totalSystemAmount = Array.from(systemMap.values()).reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
      const discrepancyAmount = Math.abs(totalPaystackAmount - totalSystemAmount);

      // Update reconciliation record
      const updated = await prisma.paymentReconciliation.update({
        where: { id: reconciliation.id },
        data: {
          totalPaystackTransactions: filteredPaystackTransactions.length,
          totalSystemTransactions: systemTransactions.length,
          matchedTransactions: matched.length,
          unmatchedTransactions: discrepancies.length,
          totalPaystackAmount: new Decimal(totalPaystackAmount),
          totalSystemAmount: new Decimal(totalSystemAmount),
          discrepancyAmount: new Decimal(discrepancyAmount),
          status: discrepancies.length > 0 ? 'discrepancies_found' : 'completed',
          discrepancies: discrepancies ? (discrepancies as Prisma.InputJsonValue) : undefined,
          paystackData: {
            transactions: filteredPaystackTransactions.map((tx) => ({
              reference: tx.reference,
              amount: tx.amount / 100,
            })),
          } as Prisma.InputJsonValue,
        },
      });

      // Audit log
      await createAuditLog({
        userId: reconciledBy,
        action: AuditActions.PAYMENT_RECONCILIATION,
        entity: 'PaymentReconciliation',
        entityId: reconciliation.id,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          eventId: eventId || 'all',
          totalPaystackTransactions: filteredPaystackTransactions.length,
          totalSystemTransactions: systemTransactions.length,
          matchedTransactions: matched.length,
          discrepancies: discrepancies.length,
          discrepancyAmount: discrepancyAmount.toString(),
        },
        ipAddress,
        userAgent,
      });

      logger.info(
        `Reconciliation completed: ${reconciliation.id}. Matched: ${matched.length}, Discrepancies: ${discrepancies.length}`,
      );

      return {
        id: updated.id,
        reconciliationNumber: updated.reconciliationNumber,
        totalPaystackTransactions: updated.totalPaystackTransactions,
        totalSystemTransactions: updated.totalSystemTransactions,
        matchedTransactions: updated.matchedTransactions,
        unmatchedTransactions: updated.unmatchedTransactions,
        totalPaystackAmount: Number(updated.totalPaystackAmount),
        totalSystemAmount: Number(updated.totalSystemAmount),
        discrepancyAmount: Number(updated.discrepancyAmount),
        status: updated.status,
        discrepancies: discrepancies,
      };
    } catch (error) {
      // Update status to failed
      await prisma.paymentReconciliation.update({
        where: { id: reconciliation.id },
        data: {
          status: 'failed',
        },
      });

      logger.error(`Reconciliation failed: ${reconciliation.id}`, error);
      throw new ValidationError('Failed to reconcile payments');
    }
  }

  /**
   * Get reconciliation by ID
   */
  static async getReconciliation(reconciliationId: string) {
    const reconciliation = await prisma.paymentReconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        reconciler: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!reconciliation) {
      throw new NotFoundError('Reconciliation not found');
    }

    return reconciliation;
  }

  /**
   * Get all reconciliations
   */
  static async getReconciliations(filters?: {
    eventId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: {
      eventId?: string;
      status?: string;
      startDate?: { gte?: Date };
      endDate?: { lte?: Date };
    } = {};

    if (filters?.eventId) {
      where.eventId = filters.eventId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate) {
      where.startDate = { gte: filters.startDate };
    }

    if (filters?.endDate) {
      where.endDate = { lte: filters.endDate };
    }

    return prisma.paymentReconciliation.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        reconciler: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        reconciliationDate: 'desc',
      },
    });
  }

  /**
   * Auto-fix discrepancies by syncing missing transactions
   * This will attempt to create missing EventPaymentTransaction records
   */
  static async autoFixDiscrepancies(reconciliationId: string, fixedBy: string) {
    const reconciliation = await prisma.paymentReconciliation.findUnique({
      where: { id: reconciliationId },
    });

    if (!reconciliation) {
      throw new NotFoundError('Reconciliation not found');
    }

    if (reconciliation.status !== 'discrepancies_found') {
      throw new ValidationError('No discrepancies to fix');
    }

    const discrepancies = reconciliation.discrepancies as Array<{
      type: string;
      reference?: string;
    }>;

    const missingInSystem = discrepancies.filter((d) => d.type === 'missing_in_system');

    if (missingInSystem.length === 0) {
      throw new ValidationError('No missing transactions to sync');
    }

    // Sync missing transactions
    const syncResult = await paymentService.syncPaymentsFromPaystack(
      reconciliation.startDate,
      reconciliation.endDate,
      reconciliation.eventId || undefined,
    );

    logger.info(
      `Auto-fix reconciliation ${reconciliationId}: Synced ${syncResult.created} missing transactions`,
    );

    // Update reconciliation status
    return prisma.paymentReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: syncResult.created > 0 ? 'completed' : 'discrepancies_found',
        notes: `Auto-fixed: ${syncResult.created} transactions synced`,
      },
    });
  }
}

