import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { InvoiceService } from '../services/invoice.service.js';
import { InvoiceTemplateService } from '../services/invoice-template.service.js';

export class InvoiceController {
  /**
   * Create invoice for a transaction
   */
  static async createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transactionId, templateId, includeTax, taxRate, dueDate, notes, terms } = req.body;

      const invoice = await InvoiceService.createInvoice(transactionId, templateId, {
        includeTax,
        taxRate,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        terms,
      });

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const invoice = await InvoiceService.getInvoiceById(invoiceId);

      res.status(200).json({
        success: true,
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice by invoice number
   */
  static async getInvoiceByNumber(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceNumber } = req.params;
      const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);

      res.status(200).json({
        success: true,
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's invoices
   */
  static async getUserInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status, eventId, page, limit } = req.query;
      const result = await InvoiceService.getUserInvoices(userId, {
        status: status as string,
        eventId: eventId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
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
   * Get event invoices (organizer view)
   */
  static async getEventInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const { status, page, limit } = req.query;

      const result = await InvoiceService.getEventInvoices(eventId, {
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
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
   * Generate invoice HTML
   */
  static async generateInvoiceHTML(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const html = await InvoiceService.generateInvoiceHTML(invoiceId);

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download invoice PDF (returns HTML for now, can be converted to PDF on frontend)
   */
  static async downloadInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const html = await InvoiceService.generateInvoiceHTML(invoiceId);

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.html"`);
      res.status(200).send(html);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark invoice as sent
   */
  static async markInvoiceAsSent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const { sentTo } = req.body;

      const invoice = await InvoiceService.markInvoiceAsSent(invoiceId, sentTo);

      res.status(200).json({
        success: true,
        message: 'Invoice marked as sent',
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;

      const invoice = await InvoiceService.updateInvoiceStatus(invoiceId, status);

      res.status(200).json({
        success: true,
        message: 'Invoice status updated',
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Invoice Template Management ==========

  /**
   * Create invoice template
   */
  static async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, description, type, htmlContent, cssContent, variables, isDefault } = req.body;

      const template = await InvoiceTemplateService.createTemplate({
        name,
        description,
        type,
        htmlContent,
        cssContent,
        variables,
        isDefault,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Invoice template created successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all templates
   */
  static async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, isActive, includeInactive } = req.query;

      const templates = await InvoiceTemplateService.getTemplates({
        type: type as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        includeInactive: includeInactive === 'true',
      });

      res.status(200).json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId } = req.params;
      const template = await InvoiceTemplateService.getTemplateById(templateId);

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get default template
   */
  static async getDefaultTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await InvoiceTemplateService.getDefaultTemplate();

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId } = req.params;
      const { name, description, type, htmlContent, cssContent, variables, isDefault, isActive } = req.body;

      const template = await InvoiceTemplateService.updateTemplate(templateId, {
        name,
        description,
        type,
        htmlContent,
        cssContent,
        variables,
        isDefault,
        isActive,
      });

      res.status(200).json({
        success: true,
        message: 'Invoice template updated successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId } = req.params;
      await InvoiceTemplateService.deleteTemplate(templateId);

      res.status(200).json({
        success: true,
        message: 'Invoice template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
