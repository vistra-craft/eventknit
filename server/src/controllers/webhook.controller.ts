import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { WebhookService } from '../services/webhook.service.js';

export class WebhookController {
  /**
   * Create webhook endpoint
   */
  static async createEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, url, description, eventTypes, secret, headers, maxRetries, retryDelay } = req.body;

      const endpoint = await WebhookService.createEndpoint({
        name,
        url,
        description,
        eventTypes,
        secret,
        headers,
        maxRetries,
        retryDelay,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Webhook endpoint created successfully',
        data: { endpoint },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all webhook endpoints
   */
  static async getEndpoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive, eventType } = req.query;

      const endpoints = await WebhookService.getEndpoints({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        eventType: eventType as string,
      });

      res.status(200).json({
        success: true,
        data: { endpoints },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get webhook endpoint by ID
   */
  static async getEndpointById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const endpointId = (req.params.endpointId as string) as string;
      const endpoint = await WebhookService.getEndpointById(endpointId);

      res.status(200).json({
        success: true,
        data: { endpoint },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update webhook endpoint
   */
  static async updateEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const endpointId = (req.params.endpointId as string) as string;
      const { name, url, description, eventTypes, secret, headers, maxRetries, retryDelay, isActive } = req.body;

      const endpoint = await WebhookService.updateEndpoint(endpointId, {
        name,
        url,
        description,
        eventTypes,
        secret,
        headers,
        maxRetries,
        retryDelay,
        isActive,
      });

      res.status(200).json({
        success: true,
        message: 'Webhook endpoint updated successfully',
        data: { endpoint },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete webhook endpoint
   */
  static async deleteEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const endpointId = (req.params.endpointId as string) as string;
      await WebhookService.deleteEndpoint(endpointId);

      res.status(200).json({
        success: true,
        message: 'Webhook endpoint deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test webhook endpoint
   */
  static async testEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const endpointId = (req.params.endpointId as string) as string;
      const result = await WebhookService.testEndpoint(endpointId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get webhook delivery history
   */
  static async getDeliveryHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { endpointId, eventType, status, page, limit } = req.query;

      const result = await WebhookService.getDeliveryHistory({
        endpointId: endpointId as string,
        eventType: eventType as string,
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
   * Retry failed webhook deliveries
   */
  static async retryFailedDeliveries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WebhookService.retryFailedDeliveries();

      res.status(200).json({
        success: true,
        message: `Retried ${result.retried} webhook deliveries`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
