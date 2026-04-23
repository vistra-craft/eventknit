import { Request, Response, NextFunction } from 'express';
import { ContactQueryService } from '../services/contact-query.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import { SupportQueryStatus, SupportPriority } from '@prisma/client';

type IdParam = { id: string };

export class ContactQueryController {
  /**
   * Submit a contact form query (public, no auth)
   * POST /api/v1/contact
   */
  static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, subject, message } = req.body as {
        name?: unknown;
        email?: unknown;
        subject?: unknown;
        message?: unknown;
      };

      if (!name || typeof name !== 'string' || !name.trim()) {
        throw new ValidationError('Name is required');
      }
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('A valid email address is required');
      }
      if (!subject || typeof subject !== 'string' || !subject.trim()) {
        throw new ValidationError('Subject is required');
      }
      if (!message || typeof message !== 'string' || !message.trim()) {
        throw new ValidationError('Message is required');
      }

      const query = await ContactQueryService.createQuery({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Your message has been received. We\'ll be in touch within one business day.',
        data: { id: query.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List contact queries (admin)
   * GET /api/v1/admin/support/contact-queries
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, priority, search, page, limit } = req.query;

      const filters: Parameters<typeof ContactQueryService.getQueries>[0] = {};

      if (
        typeof status === 'string' &&
        Object.values(SupportQueryStatus).includes(status as SupportQueryStatus)
      ) {
        filters.status = status as SupportQueryStatus;
      }
      if (
        typeof priority === 'string' &&
        Object.values(SupportPriority).includes(priority as SupportPriority)
      ) {
        filters.priority = priority as SupportPriority;
      }
      if (typeof search === 'string') filters.search = search;
      if (typeof page === 'string') filters.page = parseInt(page, 10);
      if (typeof limit === 'string') filters.limit = parseInt(limit, 10);

      const result = await ContactQueryService.getQueries(filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single contact query with full thread (admin)
   * GET /api/v1/admin/support/contact-queries/:id
   */
  static async getById(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = await ContactQueryService.getQueryById(req.params.id);
      res.status(200).json({ success: true, data: { query } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update status of a contact query (admin)
   * PATCH /api/v1/admin/support/contact-queries/:id/status
   */
  static async updateStatus(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status } = req.body as { status?: unknown };

      if (
        !status ||
        typeof status !== 'string' ||
        !Object.values(SupportQueryStatus).includes(status as SupportQueryStatus)
      ) {
        throw new ValidationError(
          `Invalid status. Must be one of: ${Object.values(SupportQueryStatus).join(', ')}`,
        );
      }

      const updated = await ContactQueryService.updateStatus(
        req.params.id,
        status as SupportQueryStatus,
      );
      res.status(200).json({ success: true, message: 'Status updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reply to a contact query via email (admin)
   * POST /api/v1/admin/support/contact-queries/:id/reply
   */
  static async reply(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { response } = req.body as { response?: unknown };
      if (!response || typeof response !== 'string' || !response.trim()) {
        throw new ValidationError('Reply message is required');
      }

      const saved = await ContactQueryService.replyToQuery(
        req.params.id,
        req.user.id,
        response.trim(),
      );

      res.status(201).json({
        success: true,
        message: 'Reply sent and email dispatched to sender',
        data: { response: saved },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add an internal note (not emailed to sender) (admin)
   * POST /api/v1/admin/support/contact-queries/:id/notes
   */
  static async addNote(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { note } = req.body as { note?: unknown };
      if (!note || typeof note !== 'string' || !note.trim()) {
        throw new ValidationError('Note text is required');
      }

      const saved = await ContactQueryService.addInternalNote(
        req.params.id,
        req.user.id,
        note.trim(),
      );

      res.status(201).json({ success: true, message: 'Note added', data: { response: saved } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get contact query statistics (admin)
   * GET /api/v1/admin/support/contact-queries/statistics
   */
  static async getStatistics(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await ContactQueryService.getStatistics();
      res.status(200).json({ success: true, data: { statistics: stats } });
    } catch (error) {
      next(error);
    }
  }
}
