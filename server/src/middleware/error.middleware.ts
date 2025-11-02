import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If response already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(config.env === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    message: config.env === 'production' ? 'Internal server error' : err.message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

