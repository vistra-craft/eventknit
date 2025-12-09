import { AdvancedTicketTypesService } from '../src/services/advanced-ticket-types.service';
import { NotFoundError } from '../src/utils/errors';

const prismaMock = {
  event: { findFirst: jest.fn() },
  advancedTicketType: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

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
    prismaMock.advancedTicketType.create.mockResolvedValue({ id: 'adv-1' });

    const t = await AdvancedTicketTypesService.createTicketType('org-1', ticketData as any);

    expect(prismaMock.advancedTicketType.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'evt-1',
          name: 'VIP',
          basePrice: 100,
          maxPerOrder: 2,
        }),
      }),
    );
    expect(t).toEqual({ id: 'adv-1' });
  });
});

