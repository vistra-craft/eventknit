import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service.js';
import { AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    name: string;
    permissions: string[];
    rateLimit: number;
  };
}

/**
 * Middleware to authenticate API requests using API key
 */
export async function authenticateApiKey(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from header
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
      res.status(401).json({
        success: false,
        message: 'API key required',
      });
      return;
    }

    // Verify API key
    const verification = await ApiKeyService.verifyApiKey(apiKeyHeader);

    if (!verification.valid || !verification.apiKeyRecord) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
      return;
    }

    // Check rate limit
    const rateLimitCheck = await ApiKeyService.checkRateLimit(verification.apiKeyRecord.id);

    if (!rateLimitCheck.allowed) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 1000),
      });
      return;
    }

    // Attach API key info to request
    req.apiKey = {
      id: verification.apiKeyRecord.id,
      name: verification.apiKeyRecord.name,
      permissions: verification.apiKeyRecord.permissions,
      rateLimit: verification.apiKeyRecord.rateLimit,
    };

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', verification.apiKeyRecord.rateLimit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitCheck.resetAt.getTime() / 1000).toString());

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
}

/**
 * Middleware to check API key permissions
 */
export function requireApiPermission(permission: string) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key required',
      });
      return;
    }

    if (!req.apiKey.permissions.includes(permission) && !req.apiKey.permissions.includes('*')) {
      res.status(403).json({
        success: false,
        message: `Permission required: ${permission}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to log API request
 */
export async function logApiRequest(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log API request asynchronously (don't block response)
    if (req.apiKey) {
      ApiKeyService.logApiRequest({
        apiKeyId: req.apiKey.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestBody: req.method !== 'GET' ? (req.body || {}) : undefined,
      }).catch((error) => {
        logger.error('Error logging API request:', error);
      });
    }

    return originalJson(body);
  };

  next();
}
