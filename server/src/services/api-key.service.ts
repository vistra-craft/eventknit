import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma, type ApiKey } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class ApiKeyService {
  /**
   * Generate API key
   */
  private static generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    return `ek_${randomBytes.toString('base64url')}`;
  }

  /**
   * Hash API key for storage
   */
  private static async hashApiKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, 12);
  }

  /**
   * Verify API key
   */
  static async verifyApiKey(apiKey: string): Promise<{ valid: boolean; apiKeyRecord?: ApiKey }> {
    try {
      // Extract key prefix
      const keyPrefix = apiKey.substring(0, 10);

      // Find all active API keys with matching prefix
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          isActive: true,
          keyPrefix,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      // Verify against each key
      for (const keyRecord of apiKeys) {
        const isValid = await bcrypt.compare(apiKey, keyRecord.keyHash);
        if (isValid) {
          // Update last used
          await prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: {
              lastUsedAt: new Date(),
              requestCount: { increment: 1 },
            },
          });

          return { valid: true, apiKeyRecord: keyRecord };
        }
      }

      return { valid: false };
    } catch (error: unknown) {
      logger.error('Error verifying API key:', error);
      return { valid: false };
    }
  }

  /**
   * Create API key
   */
  static async createApiKey(data: {
    name: string;
    description?: string;
    permissions: string[];
    rateLimit?: number;
    rateLimitWindow?: number;
    expiresAt?: Date;
    createdBy?: string;
  }) {
    try {
      // Generate API key
      const apiKey = this.generateApiKey();
      const keyPrefix = apiKey.substring(0, 10);
      const keyHash = await this.hashApiKey(apiKey);

      const apiKeyRecord = await prisma.apiKey.create({
        data: {
          name: data.name,
          keyPrefix,
          keyHash,
          description: data.description,
          permissions: data.permissions,
          rateLimit: data.rateLimit || 100,
          rateLimitWindow: data.rateLimitWindow || 3600,
          expiresAt: data.expiresAt,
          createdBy: data.createdBy,
        },
      });

      logger.info(`API key created: ${apiKeyRecord.id}`);

      // Return the plain key only once (for display to user)
      return {
        ...apiKeyRecord,
        key: apiKey, // Only returned on creation
      };
    } catch (error: unknown) {
      logger.error('Error creating API key:', error);
      throw new ValidationError(`Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all API keys
   */
  static async getApiKeys(filters?: {
    isActive?: boolean;
    createdBy?: string;
  }) {
    try {
      const where: Prisma.ApiKeyWhereInput = {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.createdBy && { createdBy: filters.createdBy }),
      };

      const apiKeys = await prisma.apiKey.findMany({
        where,
        include: {
          _count: {
            select: {
              apiRequests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Remove keyHash from response for security
      return apiKeys.map((key) => {
        const { keyHash: _keyHash, ...rest } = key;
        return rest;
      });
    } catch (error: unknown) {
      logger.error('Error fetching API keys:', error);
      throw new ValidationError(`Failed to fetch API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get API key by ID
   */
  static async getApiKeyById(apiKeyId: string) {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
        include: {
          apiRequests: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      // Remove keyHash from response
      const { keyHash: _keyHash, ...rest } = apiKey;
      return rest;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching API key:', error);
      throw new ValidationError(`Failed to fetch API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update API key
   */
  static async updateApiKey(
    apiKeyId: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
      rateLimit?: number;
      rateLimitWindow?: number;
      expiresAt?: Date | null;
      isActive?: boolean;
    },
  ) {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      const updated = await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.permissions && { permissions: data.permissions }),
          ...(data.rateLimit !== undefined && { rateLimit: data.rateLimit }),
          ...(data.rateLimitWindow !== undefined && { rateLimitWindow: data.rateLimitWindow }),
          ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      logger.info(`API key updated: ${apiKeyId}`);

      // Remove keyHash from response
      const { keyHash: _keyHash, ...rest } = updated;
      return rest;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating API key:', error);
      throw new ValidationError(`Failed to update API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete API key
   */
  static async deleteApiKey(apiKeyId: string) {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      await prisma.apiKey.delete({
        where: { id: apiKeyId },
      });

      logger.info(`API key deleted: ${apiKeyId}`);
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting API key:', error);
      throw new ValidationError(`Failed to delete API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Log API request
   */
  static async logApiRequest(data: {
    apiKeyId: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime?: number;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: Record<string, unknown>;
    errorMessage?: string;
  }) {
    try {
      await prisma.apiRequest.create({
        data: {
          apiKeyId: data.apiKeyId,
          method: data.method,
          path: data.path,
          statusCode: data.statusCode,
          responseTime: data.responseTime,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestBody: data.requestBody ? (data.requestBody as Prisma.InputJsonValue) : undefined,
          errorMessage: data.errorMessage,
        },
      });

      // Update API key last request time
      await prisma.apiKey.update({
        where: { id: data.apiKeyId },
        data: {
          lastRequestAt: new Date(),
        },
      });
    } catch (error: unknown) {
      // Don't throw - logging failures shouldn't break API requests
      logger.error('Error logging API request:', error);
    }
  }

  /**
   * Get API usage statistics
   */
  static async getApiUsageStats(apiKeyId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: Prisma.ApiRequestWhereInput = { 
        apiKeyId,
        ...(filters?.startDate || filters?.endDate ? {
          createdAt: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        } : {}),
      };

      const [totalRequests, successfulRequests, failedRequests, avgResponseTime] = await Promise.all([
        prisma.apiRequest.count({ where }),
        prisma.apiRequest.count({
          where: {
            ...where,
            statusCode: { gte: 200, lt: 300 },
          },
        }),
        prisma.apiRequest.count({
          where: {
            ...where,
            statusCode: { gte: 400 },
          },
        }),
        prisma.apiRequest.aggregate({
          where: {
            ...where,
            responseTime: { not: null },
          },
          _avg: {
            responseTime: true,
          },
        }),
      ]);

      // Get requests by status code
      const byStatusCode = await prisma.apiRequest.groupBy({
        by: ['statusCode'],
        where,
        _count: {
          id: true,
        },
      });

      // Get requests by method
      const byMethod = await prisma.apiRequest.groupBy({
        by: ['method'],
        where,
        _count: {
          id: true,
        },
      });

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        avgResponseTime: avgResponseTime._avg.responseTime || 0,
        byStatusCode: byStatusCode.map((item) => ({
          statusCode: item.statusCode,
          count: item._count.id,
        })),
        byMethod: byMethod.map((item) => ({
          method: item.method,
          count: item._count.id,
        })),
      };
    } catch (error: unknown) {
      logger.error('Error fetching API usage stats:', error);
      throw new ValidationError(`Failed to fetch usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check rate limit for API key
   */
  static async checkRateLimit(apiKeyId: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      if (!apiKey || !apiKey.isActive) {
        return { allowed: false, remaining: 0, resetAt: new Date() };
      }

      // Check if expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { allowed: false, remaining: 0, resetAt: new Date() };
      }

      // Calculate time window
      const windowStart = new Date(Date.now() - apiKey.rateLimitWindow * 1000);

      // Count requests in the window
      const requestCount = await prisma.apiRequest.count({
        where: {
          apiKeyId,
          createdAt: {
            gte: windowStart,
          },
        },
      });

      const remaining = Math.max(0, apiKey.rateLimit - requestCount);
      const allowed = remaining > 0;
      const resetAt = new Date(Date.now() + apiKey.rateLimitWindow * 1000);

      return { allowed, remaining, resetAt };
    } catch (error: unknown) {
      logger.error('Error checking rate limit:', error);
      // On error, allow the request but log it
      return { allowed: true, remaining: 0, resetAt: new Date() };
    }
  }
}
