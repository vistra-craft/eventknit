import express, { RequestHandler } from 'express';
import request from 'supertest';
import { authenticateApiKey, requireApiPermission } from '../src/middleware/api-key.middleware';
import { ApiKeyService } from '../src/services/api-key.service';

jest.mock('../src/services/api-key.service');

const mockedApiKeyService = ApiKeyService as jest.Mocked<typeof ApiKeyService>;

const buildApp = (handler: RequestHandler) => {
  const app = express();
  app.use(express.json());
  app.get('/protected', authenticateApiKey, handler);
  app.get('/permissioned', authenticateApiKey, requireApiPermission('reports:view'), handler);
  return app;
};

describe('API key middleware', () => {
  const handler: RequestHandler = (_req, res) => res.json({ ok: true });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 when API key is missing', async () => {
    const app = buildApp(handler);
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/API key required/i);
  });

  it('returns 401 when API key is invalid', async () => {
    mockedApiKeyService.verifyApiKey.mockResolvedValue({ valid: false });
    const app = buildApp(handler);
    const res = await request(app).get('/protected').set('x-api-key', 'bad-key');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid API key/i);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockedApiKeyService.verifyApiKey.mockResolvedValue({
      valid: true,
      apiKeyRecord: { id: 'key-1', name: 'test', permissions: ['*'], rateLimit: 2 },
    } as any);
    mockedApiKeyService.checkRateLimit = jest.fn().mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 5000),
    });

    const app = buildApp(handler);
    const res = await request(app).get('/protected').set('x-api-key', 'good-key');
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Rate limit exceeded/i);
    expect(res.headers['x-ratelimit-limit']).toBe('2');
    expect(res.headers['x-ratelimit-remaining']).toBe('0');
  });

  it('passes through and sets rate limit headers when valid', async () => {
    mockedApiKeyService.verifyApiKey.mockResolvedValue({
      valid: true,
      apiKeyRecord: { id: 'key-1', name: 'test', permissions: ['*'], rateLimit: 10 },
    } as any);
    mockedApiKeyService.checkRateLimit = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: new Date(Date.now() + 10000),
    });

    const app = buildApp(handler);
    const res = await request(app).get('/protected').set('x-api-key', 'good-key');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers['x-ratelimit-limit']).toBe('10');
    expect(res.headers['x-ratelimit-remaining']).toBe('9');
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('enforces permission checks', async () => {
    mockedApiKeyService.verifyApiKey.mockResolvedValue({
      valid: true,
      apiKeyRecord: { id: 'key-2', name: 'test', permissions: ['basic'], rateLimit: 5 },
    } as any);
    mockedApiKeyService.checkRateLimit = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: new Date(Date.now() + 10000),
    });

    const app = buildApp(handler);
    const res = await request(app).get('/permissioned').set('x-api-key', 'limited-key');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Permission required/i);
  });
});

