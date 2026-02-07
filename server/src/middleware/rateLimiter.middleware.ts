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
 * General rate limiter
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit, // Skip rate limiting in test environment
});

/**
 * Stricter rate limiter for authentication routes
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: skipRateLimit, // Skip rate limiting in test environment
});

/**
 * IP-based rate limiter for auth endpoints.
 * Limits total failed auth requests from a single IP across all accounts.
 * Prevents credential stuffing attacks that spread attempts across many users.
 */
export const ipAuthRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: 20, // 20 failed requests per window across all accounts
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipRateLimit,
});

/**
 * Rate limiter for guest event registration
 * Limits: 5 registrations per hour per IP (configurable)
 */
export const guestRegistrationRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GUEST_REGISTRATION_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.GUEST_REGISTRATION_MAX || '5', 10), // 5 registrations per hour
  message: 'Too many registration attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests (successful or not)
  skip: skipRateLimit, // Skip rate limiting in test environment
});

/**
 * Rate limiter for guest payment initialization
 * Limits: 10 payment initializations per hour per IP (configurable)
 */
export const guestPaymentRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GUEST_PAYMENT_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.GUEST_PAYMENT_MAX || '10', 10), // 10 payment attempts per hour
  message: 'Too many payment attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests (successful or not)
  skip: skipRateLimit, // Skip rate limiting in test environment
});



