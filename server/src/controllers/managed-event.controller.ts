import { Response, NextFunction } from 'express';
import { ManagedEventService } from '../services/managed-event.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class ManagedEventController {
  static async getManagedEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, clientType, search, page = '1', limit = '20' } = req.query;
      const result = await ManagedEventService.getManagedEvents({
        status: status as string,
        clientType: clientType as string,
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getManagedEventById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const event = await ManagedEventService.getManagedEventById(eventId);
      res.json({ success: true, data: { event } });
    } catch (error) {
      next(error);
    }
  }

  static async createManagedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const event = await ManagedEventService.createManagedEvent(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Managed event created successfully', data: { event } });
    } catch (error) {
      next(error);
    }
  }

  static async updateManagedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const eventId = req.params.eventId as string;
      const event = await ManagedEventService.updateManagedEvent(eventId, req.body, req.user.id);
      res.json({ success: true, message: 'Managed event updated successfully', data: { event } });
    } catch (error) {
      next(error);
    }
  }

  static async cancelManagedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const eventId = req.params.eventId as string;
      const event = await ManagedEventService.cancelManagedEvent(eventId, req.user.id, req.body.reason);
      res.json({ success: true, message: 'Managed event cancelled', data: { event } });
    } catch (error) {
      next(error);
    }
  }

  static async getManagedEventStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ManagedEventService.getManagedEventStats();
      res.json({ success: true, data: { stats } });
    } catch (error) {
      next(error);
    }
  }
}
