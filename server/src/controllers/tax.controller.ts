import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { TaxService } from '../services/tax.service.js';

export class TaxController {
  /**
   * Calculate tax for an amount
   */
  static async calculateTax(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, country, state, city } = req.body;

      const result = await TaxService.calculateTax(amount, {
        country,
        state,
        city,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tax rate for a location
   */
  static async getTaxRate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { country, state, city } = req.query;

      const taxRate = await TaxService.getTaxRate({
        country: country as string,
        state: state as string | undefined,
        city: city as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: { taxRate },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update tax rate
   */
  static async upsertTaxRate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { country, state, city, rate, taxType, isActive } = req.body;

      const taxRate = await TaxService.upsertTaxRate({
        country,
        state,
        city,
        rate,
        taxType,
        isActive,
      });

      res.status(200).json({
        success: true,
        message: 'Tax rate saved successfully',
        data: { taxRate },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tax rates
   */
  static async getTaxRates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { country, state, isActive } = req.query;

      const taxRates = await TaxService.getTaxRates({
        country: country as string,
        state: state as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      res.status(200).json({
        success: true,
        data: { taxRates },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tax rate by ID
   */
  static async getTaxRateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taxRateId } = req.params;
      const taxRate = await TaxService.getTaxRateById(taxRateId);

      res.status(200).json({
        success: true,
        data: { taxRate },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tax rate
   */
  static async deleteTaxRate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taxRateId } = req.params;
      await TaxService.deleteTaxRate(taxRateId);

      res.status(200).json({
        success: true,
        message: 'Tax rate deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tax report
   */
  static async getTaxReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, country, eventId } = req.query;

      const report = await TaxService.getTaxReport({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        country: country as string,
        eventId: eventId as string,
      });

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
