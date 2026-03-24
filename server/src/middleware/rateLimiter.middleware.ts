import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Skip rate limiting in test and development environments
const skipRateLimit = (req: Request, _res: Response): boolean => {
  const shouldSkip = config.env === 'test' ||
                     config.env === 'development' ||
                     process.env.NODE_ENV === 'test' ||
                     process.env.NODE_ENV === 'development';

  // Log for debugging
  if (!shouldSkip) {
    logger.debug('[RateLimiter] NOT skipping - Environment:', {
      configEnv: config.env,
      nodeEnv: process.env.NODE_ENV,
      path: req.path,
    });
  }

  return shouldSkip;
};

/**
 * Build a structured JSON rate limit response.
 * Includes retryAfter (seconds) so the client can show a meaningful countdown.
 */
const buildRateLimitResponse = (userMessage: string, windowMs: number) => {
  return (_req: Request, res: Response) => {
    const retryAfterSeconds = Math.ceil(windowMs / 1000);
    // RateLimit-Reset header is set automatically by standardHeaders: true
    res.status(429).json({
      success: false,
      message: userMessage,
      retryAfter: retryAfterSeconds,
    });
  };
};

/**
 * General rate limiter
 * 200 requests per 15-minute window — generous enough for SPA page loads
 * that fire multiple concurrent API calls.
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  handler: buildRateLimitResponse(
    'You\'re sending requests a bit too fast. Please wait a moment and try again.',
    config.rateLimit.windowMs,
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

/**
 * Stricter rate limiter for authentication routes
 * 10 failed attempts per 15-minute window per account.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  handler: buildRateLimitResponse(
    'Too many login attempts. Please wait a few minutes before trying again.',
    config.rateLimit.authWindowMs,
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipRateLimit,
});

/**
 * IP-based rate limiter for auth endpoints.
 * Limits total failed auth requests from a single IP across all accounts.
 * Prevents credential stuffing attacks that spread attempts across many users.
 * 30 failed requests per window across all accounts.
 */
export const ipAuthRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: 30,
  handler: buildRateLimitResponse(
    'Too many login attempts. Please wait a few minutes before trying again.',
    config.rateLimit.authWindowMs,
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipRateLimit,
});

/**
 * Rate limiter for guest event registration
 * Limits: 10 registrations per hour per IP (configurable)
 */
export const guestRegistrationRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GUEST_REGISTRATION_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.GUEST_REGISTRATION_MAX || '10', 10),
  handler: buildRateLimitResponse(
    'You\'ve reached the registration limit. Please try again in about an hour.',
    parseInt(process.env.GUEST_REGISTRATION_WINDOW_MS || '3600000', 10),
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: skipRateLimit,
});

/**
 * Rate limiter for guest payment initialization
 * Limits: 15 payment initializations per hour per IP (configurable)
 */
export const guestPaymentRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GUEST_PAYMENT_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.GUEST_PAYMENT_MAX || '15', 10),
  handler: buildRateLimitResponse(
    'You\'ve reached the payment attempt limit. Please try again in about an hour.',
    parseInt(process.env.GUEST_PAYMENT_WINDOW_MS || '3600000', 10),
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: skipRateLimit,
});

/**
 * Rate limiter for sensitive staff management operations
 * Limits: 30 requests per 15 minutes per IP
 */
export const staffManagementRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  handler: buildRateLimitResponse(
    'Too many staff management requests. Please wait a few minutes before trying again.',
    15 * 60 * 1000,
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});
