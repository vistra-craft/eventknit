import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ApiKeyService } from '../services/api-key.service.js';

export class ApiKeyController {
  /**
   * Create API key
   */
  static async createApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { name, description, permissions, rateLimit, rateLimitWindow, expiresAt } = req.body;

      const apiKey = await ApiKeyService.createApiKey({
        name,
        description,
        permissions,
        rateLimit,
        rateLimitWindow,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: {
          apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            key: apiKey.key, // Only returned on creation
            keyPrefix: apiKey.keyPrefix,
            description: apiKey.description,
            permissions: apiKey.permissions,
            rateLimit: apiKey.rateLimit,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all API keys
   */
  static async getApiKeys(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { isActive } = req.query;

      const apiKeys = await ApiKeyService.getApiKeys({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        createdBy: userId,
      });

      res.status(200).json({
        success: true,
        data: { apiKeys },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API key by ID
   */
  static async getApiKeyById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiKeyId = (req.params.apiKeyId as string) as string;
      const apiKey = await ApiKeyService.getApiKeyById(apiKeyId);

      res.status(200).json({
        success: true,
        data: { apiKey },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update API key
   */
  static async updateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiKeyId = (req.params.apiKeyId as string) as string;
      const { name, description, permissions, rateLimit, rateLimitWindow, expiresAt, isActive } = req.body;

      const apiKey = await ApiKeyService.updateApiKey(apiKeyId, {
        name,
        description,
        permissions,
        rateLimit,
        rateLimitWindow,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        isActive,
      });

      res.status(200).json({
        success: true,
        message: 'API key updated successfully',
        data: { apiKey },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete API key
   */
  static async deleteApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiKeyId = (req.params.apiKeyId as string) as string;
      await ApiKeyService.deleteApiKey(apiKeyId);

      res.status(200).json({
        success: true,
        message: 'API key deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API usage statistics
   */
  static async getApiUsageStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiKeyId = (req.params.apiKeyId as string) as string;
      const { startDate, endDate } = req.query;

      const stats = await ApiKeyService.getApiUsageStats(apiKeyId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
