import { AdvancedTicketTypesService } from '../src/services/advanced-ticket-types.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    event: { findFirst: jest.fn() },
    ticketPackage: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: jest.Mock };
  ticketPackage: {
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
};

describe('AdvancedTicketTypesService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const ticketData = {
    eventId: 'evt-1',
    name: 'VIP',
    basePrice: 100,
    maxPerOrder: 2,
    rules: { dynamic: true },
  };

  it('throws when event not found', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    await expect(AdvancedTicketTypesService.createTicketType('org-1', ticketData as any)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates advanced ticket type', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
    prismaMock.ticketPackage.create.mockResolvedValue({ id: 'adv-1' });

    const t = await AdvancedTicketTypesService.createTicketType('org-1', ticketData as any);

    expect(prismaMock.ticketPackage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'evt-1',
          name: 'VIP',
          price: 100,
          maxPerOrder: 2,
        }),
      }),
    );
    expect(t).toEqual({ id: 'adv-1' });
  });
});

