import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

/**
 * General rate limiter
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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
});



