/**
 * Printer Controller
 * Handles HTTP requests for printer management and print job operations
 */

import { Response, NextFunction } from 'express';
import { PrinterService } from '../services/printer.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class PrinterController {
  /**
   * Discover available printers
   */
  static async discoverPrinters(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { driver } = req.query;

      if (!driver || (driver !== 'cups' && driver !== 'windows')) {
        res.status(400).json({
          success: false,
          message: 'Valid driver parameter required (cups or windows)',
        });
        return;
      }

      const printers = await PrinterService.discoverPrinters(driver as 'cups' | 'windows');

      res.status(200).json({
        success: true,
        data: { printers },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new printer
   */
  static async registerPrinter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const config = req.body;
      const printer = await PrinterService.registerPrinter(config, req.user!.id);

      res.status(201).json({
        success: true,
        data: { printer },
        message: 'Printer registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all printers
   */
  static async getPrinters(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { eventId, includeInactive } = req.query;

      const printers = await PrinterService.getPrinters(
        eventId as string,
        includeInactive === 'true',
      );

      res.status(200).json({
        success: true,
        data: { printers },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get printer by ID
   */
  static async getPrinterById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const printerId = req.params.printerId as string;
      const printer = await PrinterService.getPrinterById(printerId);

      res.status(200).json({
        success: true,
        data: { printer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update printer configuration
   */
  static async updatePrinter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const printerId = req.params.printerId as string;
      const updates = req.body;

      const printer = await PrinterService.updatePrinter(printerId, updates);

      res.status(200).json({
        success: true,
        data: { printer },
        message: 'Printer updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a printer
   */
  static async deletePrinter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const printerId = req.params.printerId as string;
      const result = await PrinterService.deletePrinter(printerId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check printer status
   */
  static async checkPrinterStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const printerId = req.params.printerId as string;
      const status = await PrinterService.checkPrinterStatus(printerId);

      res.status(200).json({
        success: true,
        data: { status },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test printer with a sample page
   */
  static async testPrinter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const printerId = req.params.printerId as string;
      const result = await PrinterService.testPrinter(printerId, req.user!.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a print job
   */
  static async createPrintJob(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { printerId, templateId, registrationId, copies, priority } = req.body;

      const printJob = await PrinterService.createPrintJob({
        printerId,
        templateId,
        registrationId,
        copies,
        priority,
        createdBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: { printJob },
        message: 'Print job created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get print jobs with filters
   */
  static async getPrintJobs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { printerId, status, page, limit } = req.query;

      const result = await PrinterService.getPrintJobs({
        printerId: printerId as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          jobs: result.jobs,
          total: result.total,
          page: result.page,
          limit: result.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a print job
   */
  static async cancelPrintJob(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const jobId = req.params.jobId as string;
      const result = await PrinterService.cancelPrintJob(jobId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create print jobs for multiple attendees
   */
  static async bulkCreatePrintJobs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { printerId, templateId, registrationIds, copies, priority } = req.body;

      if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'registrationIds must be a non-empty array',
        });
        return;
      }

      const jobs = [];
      const errors = [];

      for (const registrationId of registrationIds) {
        try {
          const job = await PrinterService.createPrintJob({
            printerId,
            templateId,
            registrationId,
            copies,
            priority,
            createdBy: req.user!.id,
          });
          jobs.push(job);
        } catch (error: any) {
          errors.push({
            registrationId,
            error: error.message,
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          successCount: jobs.length,
          failureCount: errors.length,
          total: registrationIds.length,
          jobs,
          errors,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
