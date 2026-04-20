import { WebhookService } from '../src/services/webhook.service.js';
import { NotFoundError } from '../src/utils/errors.js';
import { prisma } from '../src/config/database.js';

vi.mock('../src/config/database', () => ({
  prisma: {
    webhookEndpoint: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  webhookEndpoint: {
    create: vi.Mock;
    findMany: vi.Mock;
    findUnique: vi.Mock;
    update: vi.Mock;
    delete: vi.Mock;
  };
};

describe('WebhookService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates webhook config', async () => {
    prismaMock.webhookEndpoint.create.mockResolvedValue({ id: 'wh-1' });
    const cfg = await WebhookService.createWebhook({
      name: 'Events',
      url: 'https://example.com/webhook',
      secret: 'secret',
      events: ['ticket.created'],
      isActive: true,
    });
    expect(prismaMock.webhookEndpoint.create).toHaveBeenCalled();
    expect(cfg).toEqual({ id: 'wh-1' });
  });

  it('verifies secret when signing payload', async () => {
    prismaMock.webhookEndpoint.findUnique.mockResolvedValue({ id: 'wh-1', secret: 'abc', isActive: true });
    const signature = await WebhookService.signPayload('wh-1', { hello: 'world' });
    expect(signature).toMatch(/^[a-f0-9]+$/i);
  });

  it('throws when signing with missing config', async () => {
    prismaMock.webhookEndpoint.findUnique.mockResolvedValue(null);
    await expect(WebhookService.signPayload('missing', {})).rejects.toBeInstanceOf(NotFoundError);
  });

  it('validates signature', async () => {
    prismaMock.webhookEndpoint.findUnique.mockResolvedValue({ id: 'wh-1', secret: 'abc', isActive: true });
    const payload = { a: 1 };
    const sig = await WebhookService.signPayload('wh-1', payload);
    const valid = await WebhookService.verifySignature('wh-1', payload, sig);
    expect(valid).toBe(true);
  });

  it('fails verification with wrong secret', async () => {
    prismaMock.webhookEndpoint.findUnique.mockResolvedValue({ id: 'wh-1', secret: 'wrong', isActive: true });
    const valid = await WebhookService.verifySignature('wh-1', { a: 1 }, 'deadbeef');
    expect(valid).toBe(false);
  });
});

