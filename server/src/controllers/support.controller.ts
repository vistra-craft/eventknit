import { Response, NextFunction } from 'express';
import { SupportService, SupportChannel } from '../services/support.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import {
  SupportQueryStatus,
  SupportPriority,
  SocialPlatform,
} from '@prisma/client';

type IdParam = { id: string };

export class SupportController {
  /**
   * Get unified support inbox
   * GET /api/v1/admin/support/inbox
   */
  static async getInbox(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        channel,
        platform,
        status,
        priority,
        assignedTo,
        category,
        campaignId,
        startDate,
        endDate,
      } = req.query;

      const filters: {
        channel?: SupportChannel;
        platform?: SocialPlatform;
        status?: SupportQueryStatus;
        priority?: SupportPriority;
        assignedTo?: string;
        category?: string;
        campaignId?: string;
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (channel && Object.values(SupportChannel).includes(channel as SupportChannel)) {
        filters.channel = channel as SupportChannel;
      }
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }
      if (status && Object.values(SupportQueryStatus).includes(status as SupportQueryStatus)) {
        filters.status = status as SupportQueryStatus;
      }
      if (priority && Object.values(SupportPriority).includes(priority as SupportPriority)) {
        filters.priority = priority as SupportPriority;
      }
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (category) filters.category = category as string;
      if (campaignId) filters.campaignId = campaignId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const queries = await SupportService.getSupportInbox(filters);

      res.status(200).json({
        success: true,
        data: { queries },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get support query by ID
   * GET /api/v1/admin/support/queries/:id
   */
  static async getQueryById(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const id = req.params.id;
      const { channel } = req.query;

      const query = await SupportService.getQueryById(
        id,
        channel ? (channel as SupportChannel) : undefined,
      );

      res.status(200).json({
        success: true,
        data: { query },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign query to agent
   * POST /api/v1/admin/support/queries/:id/assign
   */
  static async assignQuery(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const id = req.params.id;
      const { agentId, channel } = req.body;

      if (!agentId || typeof agentId !== 'string') {
        throw new ValidationError('Agent ID is required');
      }

      const result = await SupportService.assignQuery(
        id,
        agentId,
        channel ? (channel as SupportChannel) : undefined,
      );

      res.status(200).json({
        success: true,
        message: 'Query assigned successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update query status
   * PATCH /api/v1/admin/support/queries/:id/status
   */
  static async updateQueryStatus(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const id = req.params.id;
      const { status, channel } = req.body;

      if (!status || !Object.values(SupportQueryStatus).includes(status)) {
        throw new ValidationError(
          `Invalid status. Must be one of: ${Object.values(SupportQueryStatus).join(', ')}`,
        );
      }

      const result = await SupportService.updateQueryStatus(
        id,
        status,
        channel ? (channel as SupportChannel) : undefined,
      );

      res.status(200).json({
        success: true,
        message: 'Query status updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add response to query
   * POST /api/v1/admin/support/queries/:id/responses
   */
  static async addResponse(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const id = req.params.id;
      const { response, isInternal, channel } = req.body;

      if (!response || typeof response !== 'string') {
        throw new ValidationError('Response text is required');
      }

      const supportResponse = await SupportService.addResponse(
        id,
        response,
        req.user.id,
        isInternal ?? false,
        channel ? (channel as SupportChannel) : undefined,
      );

      res.status(201).json({
        success: true,
        message: 'Response added successfully',
        data: { response: supportResponse },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get support statistics
   * GET /api/v1/admin/support/statistics
   */
  static async getStatistics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { startDate, endDate, platform } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }

      const statistics = await SupportService.getSupportStatistics(filters);

      res.status(200).json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get agent performance
   * GET /api/v1/admin/support/agents/:id/performance
   */
  static async getAgentPerformance(
    req: AuthenticatedRequest<IdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const id = req.params.id;
      const { startDate, endDate } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const performance = await SupportService.getAgentPerformance(id, filters);

      res.status(200).json({
        success: true,
        data: { performance },
      });
    } catch (error) {
      next(error);
    }
  }
}




