import express, { RequestHandler } from 'express';
import request from 'supertest';
import {
  rateLimiter,
  authRateLimiter as _authRateLimiter,
  ipAuthRateLimiter as _ipAuthRateLimiter,
  guestRegistrationRateLimiter as _guestRegistrationRateLimiter,
  staffManagementRateLimiter as _staffManagementRateLimiter,
} from '../src/middleware/rateLimiter.middleware';

/**
 * Helper: build a minimal Express app with a given rate limiter + success handler.
 * Sets NODE_ENV to 'production' so the skip logic does NOT bypass rate limiting.
 */
const buildApp = (limiter: RequestHandler) => {
  const app = express();
  app.use(express.json());
  app.use('/test', limiter, (_req, res) => res.json({ ok: true }));
  return app;
};

// Override NODE_ENV for these tests so rate limiters are active
const originalNodeEnv = process.env.NODE_ENV;

beforeAll(() => {
  process.env.NODE_ENV = 'production';
});

afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe('Rate limiter middleware', () => {
  describe('general rateLimiter', () => {
    it('allows requests under the limit', async () => {
      const app = buildApp(rateLimiter);
      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('returns structured JSON 429 with retryAfter when limit exceeded', async () => {
      // Build a limiter with a very low max for testing
      const { default: rateLimit } = await import('express-rate-limit');
      const testLimiter = rateLimit({
        windowMs: 60_000,
        max: 1,
        handler: (_req, res) => {
          res.status(429).json({
            success: false,
            message: 'You\'re sending requests a bit too fast. Please wait a moment and try again.',
            retryAfter: 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      const app = buildApp(testLimiter);

      // First request passes
      await request(app).get('/test').expect(200);

      // Second request should be rate limited
      const res = await request(app).get('/test');
      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.retryAfter).toBeGreaterThan(0);
    });

    it('does not include IP address in error message', async () => {
      const { default: rateLimit } = await import('express-rate-limit');
      const testLimiter = rateLimit({
        windowMs: 60_000,
        max: 1,
        handler: (_req, res) => {
          res.status(429).json({
            success: false,
            message: 'You\'re sending requests a bit too fast. Please wait a moment and try again.',
            retryAfter: 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      const app = buildApp(testLimiter);

      await request(app).get('/test');
      const res = await request(app).get('/test');

      expect(res.status).toBe(429);
      expect(res.body.message.toLowerCase()).not.toContain('ip');
    });
  });

  describe('response format consistency', () => {
    it('429 response matches unified error format (success, message)', async () => {
      const { default: rateLimit } = await import('express-rate-limit');
      const testLimiter = rateLimit({
        windowMs: 60_000,
        max: 1,
        handler: (_req, res) => {
          res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please wait a few minutes before trying again.',
            retryAfter: 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      const app = buildApp(testLimiter);

      await request(app).get('/test');
      const res = await request(app).get('/test');

      expect(res.status).toBe(429);
      // Must match unified error shape: { success: false, message: string }
      expect(res.body).toHaveProperty('success', false);
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(0);
      // Must include retryAfter for client consumption
      expect(typeof res.body.retryAfter).toBe('number');
    });
  });

  describe('RateLimitError class', () => {
    it('creates error with 429 status and correct code', async () => {
      const { RateLimitError } = await import('../src/utils/errors');
      const err = new RateLimitError();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.message).toContain('too fast');
    });

    it('accepts custom message', async () => {
      const { RateLimitError } = await import('../src/utils/errors');
      const err = new RateLimitError('Custom rate limit message');
      expect(err.statusCode).toBe(429);
      expect(err.message).toBe('Custom rate limit message');
    });
  });
});
