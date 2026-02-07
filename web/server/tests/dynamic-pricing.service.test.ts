import { DynamicPricingService } from '../src/services/dynamic-pricing.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    event: { findFirst: jest.fn() },
    dynamicPricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: jest.Mock };
  dynamicPricingRule: {
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
};

describe('DynamicPricingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const ruleData = {
    eventId: 'evt-1',
    name: 'Early surge',
    metric: 'tickets_sold',
    threshold: 50,
    priceChangeType: 'PERCENTAGE',
    priceChangeValue: 10,
  };

  it('throws when event not found', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    await expect(DynamicPricingService.createRule('org-1', ruleData as any)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates dynamic pricing rule', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
    prismaMock.dynamicPricingRule.create.mockResolvedValue({ id: 'rule-1' });

    const rule = await DynamicPricingService.createRule('org-1', ruleData as any);

    expect(prismaMock.dynamicPricingRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'evt-1',
          name: 'Early surge',
          priceChangeType: 'PERCENTAGE',
          priceChangeValue: 10,
        }),
      }),
    );
    expect(rule).toEqual({ id: 'rule-1' });
  });
});

