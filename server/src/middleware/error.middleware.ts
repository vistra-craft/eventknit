import { Request, Response, NextFunction } from 'express';
import { AppError, DatabaseError, ServiceUnavailableError } from '../utils/errors.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Check if error is a Prisma database connection error
 */
const isPrismaConnectionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();
  const errorName = error.constructor.name;

  // Known Prisma request errors (P2025, P2002, etc.) are NOT connection errors
  if (errorName === 'PrismaClientKnownRequestError') return false;

  return (
    errorName === 'PrismaClientInitializationError' ||
    errorName === 'PrismaClientRustPanicError' ||
    errorMessage.includes('denied access') ||
    errorMessage.includes('connect econnrefused') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('connection timed out') ||
    errorMessage.includes('can\'t reach database server')
  );
};

/**
 * Convert Prisma errors to user-friendly messages
 */
const handlePrismaError = (error: unknown): AppError => {
  if (!(error instanceof Error)) {
    return new AppError('An unexpected error occurred', 500);
  }

  const errorMessage = error.message.toLowerCase();
  const errorName = error.constructor.name;

  // Database connection errors
  if (isPrismaConnectionError(error)) {
    if (errorMessage.includes('denied access') || errorMessage.includes('connection')) {
      return new ServiceUnavailableError(
        'Database connection failed. Please ensure PostgreSQL is running and configured correctly.',
      );
    }
    if (errorMessage.includes('findunique') || errorMessage.includes('prisma.user')) {
      return new ServiceUnavailableError(
        'Database connection error. Please ensure PostgreSQL is running.',
      );
    }
    return new DatabaseError('Database connection error. Please contact support if this persists.');
  }

  // Handle known Prisma error codes if available
  if (errorName.includes('Prisma') && 'code' in error) {
    const prismaError = error as Error & { code?: string };
    // Unique constraint violations
    if (prismaError.code === 'P2002') {
      return new AppError('This record already exists', 409, 'DUPLICATE_RECORD');
    }
    // Record not found
    if (prismaError.code === 'P2025') {
      return new AppError('Record not found', 404, 'NOT_FOUND');
    }
    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return new AppError('Related record not found', 400, 'FK_CONSTRAINT_VIOLATION');
    }
  }

  // Generic Prisma error
  if (errorName.includes('Prisma')) {
    return new DatabaseError('Database error occurred. Please try again later.');
  }

  // Not a Prisma error, return as generic error
  return error instanceof AppError 
    ? error 
    : new AppError('An unexpected error occurred', 500);
};

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

  // Convert Prisma errors to user-friendly errors
  const appError = handlePrismaError(err);

  // Log error (log original error for debugging)
  logger.error('Error Handler:', {
    originalError: err.message,
    originalErrorType: err.constructor?.name || typeof err,
    convertedError: appError.message,
    convertedErrorType: appError.constructor?.name,
    statusCode: appError.statusCode,
    code: appError.code,
    stack: config.env === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userMessage: appError.message,
  });

  // Send user-friendly error response
  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    code: appError.code,
    ...(config.env === 'development' && { 
      originalError: err.message,
      stack: err.stack, 
    }),
  });
};

