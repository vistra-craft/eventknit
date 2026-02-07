import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface TaxRate {
  country: string;
  state?: string;
  city?: string;
  rate: number; // Percentage (e.g., 7.5 for 7.5%)
  taxType: string; // VAT, GST, SALES_TAX, etc.
  isActive: boolean;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  taxType: string;
  location: {
    country: string;
    state?: string;
    city?: string;
  };
}

export class TaxService {
  /**
   * Calculate tax for an amount based on location
   */
  static async calculateTax(
    amount: number,
    location: {
      country: string;
      state?: string;
      city?: string;
    },
  ): Promise<TaxCalculationResult> {
    try {
      // Find applicable tax rate
      const taxRate = await this.getTaxRate(location);

      if (!taxRate) {
        // No tax applicable
        return {
          subtotal: amount,
          taxRate: 0,
          taxAmount: 0,
          total: amount,
          taxType: 'NONE',
          location,
        };
      }

      const taxAmount = new Decimal(amount).times(new Decimal(taxRate.rate / 100));
      const total = new Decimal(amount).plus(taxAmount);

      return {
        subtotal: amount,
        taxRate: taxRate.rate,
        taxAmount: Number(taxAmount),
        total: Number(total),
        taxType: taxRate.taxType,
        location: {
          country: taxRate.country,
          state: taxRate.state || undefined,
          city: taxRate.city || undefined,
        },
      };
    } catch (error: any) {
      logger.error('Error calculating tax:', error);
      throw new ValidationError(`Failed to calculate tax: ${error.message}`);
    }
  }

  /**
   * Get tax rate for a location
   */
  static async getTaxRate(location: {
    country: string;
    state?: string;
    city?: string;
  }): Promise<TaxRate | null> {
    try {
      // Try to find most specific tax rate (city > state > country)
      let taxRate = null;

      if (location.city && location.state) {
        taxRate = await prisma.taxRate.findFirst({
          where: {
            country: location.country,
            state: location.state,
            city: location.city,
            isActive: true,
          },
        });
      }

      if (!taxRate && location.state) {
        taxRate = await prisma.taxRate.findFirst({
          where: {
            country: location.country,
            state: location.state,
            city: null,
            isActive: true,
          },
        });
      }

      if (!taxRate) {
        taxRate = await prisma.taxRate.findFirst({
          where: {
            country: location.country,
            state: null,
            city: null,
            isActive: true,
          },
        });
      }

      return taxRate as any;
    } catch (error: any) {
      logger.error('Error fetching tax rate:', error);
      return null;
    }
  }

  /**
   * Create or update tax rate
   */
  static async upsertTaxRate(data: {
    country: string;
    state?: string;
    city?: string;
    rate: number;
    taxType: string;
    isActive?: boolean;
  }) {
    try {
      const where: any = {
        country: data.country,
        state: data.state || null,
        city: data.city || null,
      };

      const taxRate = await prisma.taxRate.upsert({
        where: {
          country_state_city: where,
        },
        create: {
          country: data.country,
          state: data.state || null,
          city: data.city || null,
          rate: new Decimal(data.rate),
          taxType: data.taxType,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        update: {
          rate: new Decimal(data.rate),
          taxType: data.taxType,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      logger.info(`Tax rate ${taxRate.isActive ? 'created' : 'updated'}: ${taxRate.id}`);
      return taxRate;
    } catch (error: any) {
      logger.error('Error upserting tax rate:', error);
      throw new ValidationError(`Failed to save tax rate: ${error.message}`);
    }
  }

  /**
   * Get all tax rates
   */
  static async getTaxRates(filters?: {
    country?: string;
    state?: string;
    isActive?: boolean;
  }) {
    try {
      const where: any = {};

      if (filters?.country) {
        where.country = filters.country;
      }

      if (filters?.state) {
        where.state = filters.state;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const taxRates = await prisma.taxRate.findMany({
        where,
        orderBy: [
          { country: 'asc' },
          { state: 'asc' },
          { city: 'asc' },
        ],
      });

      return taxRates;
    } catch (error: any) {
      logger.error('Error fetching tax rates:', error);
      throw new ValidationError(`Failed to fetch tax rates: ${error.message}`);
    }
  }

  /**
   * Get tax rate by ID
   */
  static async getTaxRateById(taxRateId: string) {
    try {
      const taxRate = await prisma.taxRate.findUnique({
        where: { id: taxRateId },
      });

      if (!taxRate) {
        throw new NotFoundError('Tax rate not found');
      }

      return taxRate;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching tax rate:', error);
      throw new ValidationError(`Failed to fetch tax rate: ${error.message}`);
    }
  }

  /**
   * Delete tax rate
   */
  static async deleteTaxRate(taxRateId: string) {
    try {
      const taxRate = await prisma.taxRate.findUnique({
        where: { id: taxRateId },
      });

      if (!taxRate) {
        throw new NotFoundError('Tax rate not found');
      }

      await prisma.taxRate.delete({
        where: { id: taxRateId },
      });

      logger.info(`Tax rate deleted: ${taxRateId}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting tax rate:', error);
      throw new ValidationError(`Failed to delete tax rate: ${error.message}`);
    }
  }

  /**
   * Get tax report
   */
  static async getTaxReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    country?: string;
    eventId?: string;
  }) {
    try {
      const where: any = {
        status: 'PAID',
        taxAmount: { not: null },
      };

      if (filters?.startDate || filters?.endDate) {
        where.issueDate = {};
        if (filters.startDate) {
          where.issueDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.issueDate.lte = filters.endDate;
        }
      }

      if (filters?.country) {
        where.billToCountry = filters.country;
      }

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Calculate totals
      const totalTax = invoices.reduce(
        (sum, invoice) => sum.plus(invoice.taxAmount || new Decimal(0)),
        new Decimal(0),
      );

      const totalRevenue = invoices.reduce(
        (sum, invoice) => sum.plus(invoice.totalAmount),
        new Decimal(0),
      );

      // Group by country
      const byCountry = invoices.reduce((acc, invoice) => {
        const country = invoice.billToCountry || 'Unknown';
        if (!acc[country]) {
          acc[country] = {
            country,
            count: 0,
            totalTax: new Decimal(0),
            totalRevenue: new Decimal(0),
          };
        }
        acc[country].count++;
        acc[country].totalTax = acc[country].totalTax.plus(invoice.taxAmount || new Decimal(0));
        acc[country].totalRevenue = acc[country].totalRevenue.plus(invoice.totalAmount);
        return acc;
      }, {} as Record<string, any>);

      return {
        summary: {
          totalInvoices: invoices.length,
          totalTax: Number(totalTax),
          totalRevenue: Number(totalRevenue),
        },
        byCountry: Object.values(byCountry).map((item: any) => ({
          country: item.country,
          invoiceCount: item.count,
          totalTax: Number(item.totalTax),
          totalRevenue: Number(item.totalRevenue),
        })),
        invoices: invoices.map((invoice) => ({
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          country: invoice.billToCountry,
          taxAmount: Number(invoice.taxAmount || 0),
          totalAmount: Number(invoice.totalAmount),
          event: invoice.event,
        })),
      };
    } catch (error: any) {
      logger.error('Error generating tax report:', error);
      throw new ValidationError(`Failed to generate tax report: ${error.message}`);
    }
  }
}
