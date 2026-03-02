import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface PlatformAnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  currency?: string;
}

export interface GMVData {
  totalGMV: number;
  currency: string;
  transactionCount: number;
  avgTransactionValue: number;
  gmvByMonth: Array<{ month: string; gmv: number; count: number }>;
  gmvByEvent: Array<{ eventId: string; eventTitle: string; gmv: number; count: number }>;
}

export interface PlatformFeesData {
  totalFees: number;
  pendingFees: number;
  disbursedFees: number;
  refundedFees: number;
  currency: string;
  feesByMonth: Array<{ month: string; fees: number; count: number }>;
  feesByStatus: Array<{ status: string; amount: number; count: number }>;
  avgFeePercentage: number;
}

export interface PaymentGatewayHealth {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  successRate: number;
  avgProcessingTime: number;
  byGateway: Array<{
    gateway: string;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
  recentFailures: Array<{
    id: string;
    eventTitle: string;
    amount: number;
    gateway: string;
    failureReason: string | null;
    createdAt: Date;
  }>;
}

export interface RefundTrends {
  totalRefunds: number;
  totalRefundAmount: number;
  refundRate: number;
  avgRefundTime: number;
  byMonth: Array<{ month: string; count: number; amount: number }>;
  byReason: Array<{ reason: string; count: number; amount: number }>;
  byStatus: Array<{ status: string; count: number; amount: number }>;
}

export class AdminPlatformAnalyticsService {
  /**
   * Get platform GMV (Gross Merchandise Value) analytics
   */
  static async getGMVAnalytics(filters?: PlatformAnalyticsFilters): Promise<GMVData> {
    try {
      const where: {
        paymentStatus: string;
        paymentDate?: { gte?: Date; lte?: Date };
      } = {
        paymentStatus: 'success',
      };

      if (filters?.startDate || filters?.endDate) {
        where.paymentDate = {};
        if (filters.startDate) where.paymentDate.gte = filters.startDate;
        if (filters.endDate) where.paymentDate.lte = filters.endDate;
      }

      if (filters?.currency) {
        where.currency = filters.currency;
      }

      const transactions = await prisma.eventPaymentTransaction.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      });

      const totalGMV = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const transactionCount = transactions.length;
      const avgTransactionValue = transactionCount > 0 ? totalGMV / transactionCount : 0;

      // GMV by month
      const gmvByMonthMap = new Map<string, { gmv: number; count: number }>();
      for (const t of transactions) {
        const date = t.paymentDate || t.createdAt;
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = gmvByMonthMap.get(month) || { gmv: 0, count: 0 };
        current.gmv += Number(t.amount);
        current.count++;
        gmvByMonthMap.set(month, current);
      }

      const gmvByMonth = Array.from(gmvByMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // GMV by event (top 10)
      const gmvByEventMap = new Map<string, { eventTitle: string; gmv: number; count: number }>();
      for (const t of transactions) {
        const eventId = t.eventId;
        const current = gmvByEventMap.get(eventId) || { eventTitle: t.event.title, gmv: 0, count: 0 };
        current.gmv += Number(t.amount);
        current.count++;
        gmvByEventMap.set(eventId, current);
      }

      const gmvByEvent = Array.from(gmvByEventMap.entries())
        .map(([eventId, data]) => ({ eventId, ...data }))
        .sort((a, b) => b.gmv - a.gmv)
        .slice(0, 10);

      return {
        totalGMV: Math.round(totalGMV * 100) / 100,
        currency: filters?.currency || 'NGN',
        transactionCount,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
        gmvByMonth,
        gmvByEvent,
      };
    } catch (error) {
      logger.error('Error getting GMV analytics:', error);
      throw error;
    }
  }

  /**
   * Get platform fees collected analytics
   */
  static async getPlatformFeesAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformFeesData> {
    try {
      const where: { createdAt?: { gte?: Date; lte?: Date } } = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const fees = await prisma.platformFee.findMany({
        where,
        include: {
          transaction: {
            select: {
              currency: true,
              amount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalFees = fees.reduce((sum, f) => sum + Number(f.feeAmount), 0);
      const pendingFees = fees
        .filter(f => f.status === 'pending')
        .reduce((sum, f) => sum + Number(f.feeAmount), 0);
      const disbursedFees = fees
        .filter(f => f.status === 'disbursed' || f.disbursementId)
        .reduce((sum, f) => sum + Number(f.feeAmount), 0);
      const refundedFees = fees
        .filter(f => f.status === 'refunded')
        .reduce((sum, f) => sum + Number(f.feeAmount), 0);

      // Calculate average fee percentage
      let avgFeePercentage = 0;
      if (fees.length > 0) {
        const totalPercentage = fees.reduce((sum, f) => {
          const transactionAmount = Number(f.transaction?.amount || 0);
          if (transactionAmount > 0) {
            return sum + (Number(f.feeAmount) / transactionAmount * 100);
          }
          return sum;
        }, 0);
        avgFeePercentage = totalPercentage / fees.length;
      }

      // Fees by month
      const feesByMonthMap = new Map<string, { fees: number; count: number }>();
      for (const f of fees) {
        const month = `${f.createdAt.getFullYear()}-${String(f.createdAt.getMonth() + 1).padStart(2, '0')}`;
        const current = feesByMonthMap.get(month) || { fees: 0, count: 0 };
        current.fees += Number(f.feeAmount);
        current.count++;
        feesByMonthMap.set(month, current);
      }

      const feesByMonth = Array.from(feesByMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Fees by status
      const feesByStatusMap = new Map<string, { amount: number; count: number }>();
      for (const f of fees) {
        const status = f.status || 'pending';
        const current = feesByStatusMap.get(status) || { amount: 0, count: 0 };
        current.amount += Number(f.feeAmount);
        current.count++;
        feesByStatusMap.set(status, current);
      }

      const feesByStatus = Array.from(feesByStatusMap.entries())
        .map(([status, data]) => ({ status, ...data }));

      return {
        totalFees: Math.round(totalFees * 100) / 100,
        pendingFees: Math.round(pendingFees * 100) / 100,
        disbursedFees: Math.round(disbursedFees * 100) / 100,
        refundedFees: Math.round(refundedFees * 100) / 100,
        currency: filters?.currency || 'NGN',
        feesByMonth,
        feesByStatus,
        avgFeePercentage: Math.round(avgFeePercentage * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting platform fees analytics:', error);
      throw error;
    }
  }

  /**
   * Get payment gateway health metrics
   */
  static async getPaymentGatewayHealth(filters?: PlatformAnalyticsFilters): Promise<PaymentGatewayHealth> {
    try {
      const where: { createdAt?: { gte?: Date; lte?: Date } } = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const transactions = await prisma.eventPaymentTransaction.findMany({
        where,
        include: {
          event: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalTransactions = transactions.length;
      const successfulTransactions = transactions.filter(t => t.paymentStatus === 'success').length;
      const failedTransactions = transactions.filter(t => t.paymentStatus === 'FAILED' || t.paymentStatus === 'failed').length;
      const pendingTransactions = transactions.filter(t => t.paymentStatus === 'PENDING' || t.paymentStatus === 'pending').length;
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

      // Calculate average processing time for successful transactions
      const successfulWithTime = transactions.filter(t =>
        t.paymentStatus === 'success' && t.paymentDate && t.createdAt,
      );
      const avgProcessingTime = successfulWithTime.length > 0
        ? successfulWithTime.reduce((sum, t) => {
          const diff = new Date(t.paymentDate!).getTime() - new Date(t.createdAt).getTime();
          return sum + diff;
        }, 0) / successfulWithTime.length / 1000 / 60 // Convert to minutes
        : 0;

      // By gateway
      const byGatewayMap = new Map<string, { total: number; successful: number; failed: number }>();
      for (const t of transactions) {
        const gateway = t.paymentMethod || 'unknown';
        const current = byGatewayMap.get(gateway) || { total: 0, successful: 0, failed: 0 };
        current.total++;
        if (t.paymentStatus === 'success') current.successful++;
        if (t.paymentStatus === 'FAILED' || t.paymentStatus === 'failed') current.failed++;
        byGatewayMap.set(gateway, current);
      }

      const byGateway = Array.from(byGatewayMap.entries())
        .map(([gateway, data]) => ({
          gateway,
          ...data,
          successRate: data.total > 0 ? Math.round((data.successful / data.total) * 10000) / 100 : 0,
        }));

      // Recent failures
      const recentFailures = transactions
        .filter(t => t.paymentStatus === 'FAILED' || t.paymentStatus === 'failed')
        .slice(0, 20)
        .map(t => ({
          id: t.id,
          eventTitle: t.event.title,
          amount: Number(t.amount),
          gateway: t.paymentMethod || 'unknown',
          failureReason: t.notes || null,
          createdAt: t.createdAt,
        }));

      return {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        successRate: Math.round(successRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        byGateway,
        recentFailures,
      };
    } catch (error) {
      logger.error('Error getting payment gateway health:', error);
      throw error;
    }
  }

  /**
   * Get refund trends analytics
   */
  static async getRefundTrends(filters?: PlatformAnalyticsFilters): Promise<RefundTrends> {
    try {
      const where: { requestedAt?: { gte?: Date; lte?: Date } } = {};

      if (filters?.startDate || filters?.endDate) {
        where.requestedAt = {};
        if (filters.startDate) where.requestedAt.gte = filters.startDate;
        if (filters.endDate) where.requestedAt.lte = filters.endDate;
      }

      const refunds = await prisma.refund.findMany({
        where,
        include: {
          transaction: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      const totalRefunds = refunds.length;
      const totalRefundAmount = refunds.reduce((sum, r) => sum + Number(r.refundAmount), 0);

      // Get total successful transactions for refund rate calculation
      const transactionWhere: {
        paymentStatus: string;
        paymentDate?: { gte?: Date; lte?: Date };
      } = { paymentStatus: 'success' };
      if (filters?.startDate || filters?.endDate) {
        transactionWhere.paymentDate = {};
        if (filters.startDate) transactionWhere.paymentDate.gte = filters.startDate;
        if (filters.endDate) transactionWhere.paymentDate.lte = filters.endDate;
      }
      const totalTransactions = await prisma.eventPaymentTransaction.count({ where: transactionWhere });
      const refundRate = totalTransactions > 0 ? (totalRefunds / totalTransactions) * 100 : 0;

      // Average refund processing time
      const completedRefunds = refunds.filter(r => r.status === 'completed' && r.completedAt && r.requestedAt);
      const avgRefundTime = completedRefunds.length > 0
        ? completedRefunds.reduce((sum, r) => {
          const diff = new Date(r.completedAt!).getTime() - new Date(r.requestedAt).getTime();
          return sum + diff;
        }, 0) / completedRefunds.length / 1000 / 60 / 60 // Convert to hours
        : 0;

      // By month
      const byMonthMap = new Map<string, { count: number; amount: number }>();
      for (const r of refunds) {
        const month = `${r.requestedAt.getFullYear()}-${String(r.requestedAt.getMonth() + 1).padStart(2, '0')}`;
        const current = byMonthMap.get(month) || { count: 0, amount: 0 };
        current.count++;
        current.amount += Number(r.refundAmount);
        byMonthMap.set(month, current);
      }

      const byMonth = Array.from(byMonthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // By reason (top reasons)
      const byReasonMap = new Map<string, { count: number; amount: number }>();
      for (const r of refunds) {
        const reason = r.refundReason?.substring(0, 50) || 'Unknown';
        const current = byReasonMap.get(reason) || { count: 0, amount: 0 };
        current.count++;
        current.amount += Number(r.refundAmount);
        byReasonMap.set(reason, current);
      }

      const byReason = Array.from(byReasonMap.entries())
        .map(([reason, data]) => ({ reason, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // By status
      const byStatusMap = new Map<string, { count: number; amount: number }>();
      for (const r of refunds) {
        const status = r.status || 'pending';
        const current = byStatusMap.get(status) || { count: 0, amount: 0 };
        current.count++;
        current.amount += Number(r.refundAmount);
        byStatusMap.set(status, current);
      }

      const byStatus = Array.from(byStatusMap.entries())
        .map(([status, data]) => ({ status, ...data }));

      return {
        totalRefunds,
        totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
        refundRate: Math.round(refundRate * 100) / 100,
        avgRefundTime: Math.round(avgRefundTime * 100) / 100,
        byMonth,
        byReason,
        byStatus,
      };
    } catch (error) {
      logger.error('Error getting refund trends:', error);
      throw error;
    }
  }

  /**
   * Get complete platform dashboard analytics
   */
  static async getDashboardAnalytics(filters?: PlatformAnalyticsFilters) {
    try {
      const [gmv, platformFees, gatewayHealth, refundTrends] = await Promise.all([
        this.getGMVAnalytics(filters),
        this.getPlatformFeesAnalytics(filters),
        this.getPaymentGatewayHealth(filters),
        this.getRefundTrends(filters),
      ]);

      // Additional summary metrics
      const netPlatformRevenue = platformFees.totalFees - platformFees.refundedFees;

      return {
        summary: {
          totalGMV: gmv.totalGMV,
          totalPlatformFees: platformFees.totalFees,
          netPlatformRevenue: Math.round(netPlatformRevenue * 100) / 100,
          transactionCount: gmv.transactionCount,
          paymentSuccessRate: gatewayHealth.successRate,
          refundRate: refundTrends.refundRate,
          currency: gmv.currency,
        },
        gmv,
        platformFees,
        gatewayHealth,
        refundTrends,
      };
    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }
}
