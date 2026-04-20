import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { TicketIssuanceService } from '../../../src/services/ticket-issuance.service.js';
import { NotFoundError, ValidationError } from '../../../src/utils/errors.js';

// Mock Prisma and email service so we never hit a real DB or SMTP server
vi.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));
vi.mock('../../../src/services/email.service.js', () => ({
  emailService: { sendEmail: vi.fn().mockResolvedValue(undefined) },
}));

import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeIssuance = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'issuance-1',
  packageId: 'pkg-1',
  email: 'guest@example.com',
  quantity: 2,
  status: 'PENDING',
  claimToken: 'tok-abc',
  note: null,
  expiresAt: null,
  claimedAt: null,
  claimedByUserId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

const makePackage = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'pkg-1',
  organizerId: 'org-1',
  eventId: 'event-1',
  name: 'VIP Comp',
  type: 'complementary',
  price: 0,
  maxQuantity: null,
  description: null,
  availableFrom: null,
  availableUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// listAll
// ---------------------------------------------------------------------------

describe('TicketIssuanceService.listAll', () => {
  beforeEach(() => mockReset(prismaMock));

  it('returns paginated issuances with package+event includes', async () => {
    const issuances = [makeIssuance()];
    prismaMock.ticketIssuance.findMany.mockResolvedValue(issuances as any);
    prismaMock.ticketIssuance.count.mockResolvedValue(1);

    const result = await TicketIssuanceService.listAll({ page: 1, limit: 10 });

    expect(result.issuances).toEqual(issuances);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);

    expect(prismaMock.ticketIssuance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.objectContaining({
          package: expect.objectContaining({
            select: expect.objectContaining({
              event: expect.anything(),
            }),
          }),
        }),
      }),
    );
  });

  it('applies status filter to where clause', async () => {
    prismaMock.ticketIssuance.findMany.mockResolvedValue([]);
    prismaMock.ticketIssuance.count.mockResolvedValue(0);

    await TicketIssuanceService.listAll({ status: 'CLAIMED' });

    const calledWith = prismaMock.ticketIssuance.findMany.mock.calls[0][0] as any;
    expect(calledWith.where).toMatchObject({ status: 'CLAIMED' });
  });

  it('applies eventId filter to where clause', async () => {
    prismaMock.ticketIssuance.findMany.mockResolvedValue([]);
    prismaMock.ticketIssuance.count.mockResolvedValue(0);

    await TicketIssuanceService.listAll({ eventId: 'event-42' });

    const calledWith = prismaMock.ticketIssuance.findMany.mock.calls[0][0] as any;
    expect(calledWith.where).toMatchObject({ package: { event: { id: 'event-42' } } });
  });

  it('calculates correct skip offset for page 3 with limit 20', async () => {
    prismaMock.ticketIssuance.findMany.mockResolvedValue([]);
    prismaMock.ticketIssuance.count.mockResolvedValue(0);

    await TicketIssuanceService.listAll({ page: 3, limit: 20 });

    const calledWith = prismaMock.ticketIssuance.findMany.mock.calls[0][0] as any;
    expect(calledWith.skip).toBe(40); // (3-1) * 20
    expect(calledWith.take).toBe(20);
  });

  it('returns empty list when no issuances exist', async () => {
    prismaMock.ticketIssuance.findMany.mockResolvedValue([]);
    prismaMock.ticketIssuance.count.mockResolvedValue(0);

    const result = await TicketIssuanceService.listAll();

    expect(result.issuances).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// adminCancel
// ---------------------------------------------------------------------------

describe('TicketIssuanceService.adminCancel', () => {
  beforeEach(() => mockReset(prismaMock));

  it('cancels a PENDING issuance without checking organizerId', async () => {
    const pending = makeIssuance({ status: 'PENDING' });
    const cancelled = makeIssuance({ status: 'CANCELLED' });

    prismaMock.ticketIssuance.findUnique.mockResolvedValue(pending as any);
    prismaMock.ticketIssuance.update.mockResolvedValue(cancelled as any);

    const result = await TicketIssuanceService.adminCancel('issuance-1');

    expect(result.status).toBe('CANCELLED');
    expect(prismaMock.ticketIssuance.update).toHaveBeenCalledWith({
      where: { id: 'issuance-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('cancels an EXPIRED issuance (status !== CLAIMED)', async () => {
    const expired = makeIssuance({ status: 'EXPIRED' });
    const cancelled = makeIssuance({ status: 'CANCELLED' });

    prismaMock.ticketIssuance.findUnique.mockResolvedValue(expired as any);
    prismaMock.ticketIssuance.update.mockResolvedValue(cancelled as any);

    const result = await TicketIssuanceService.adminCancel('issuance-1');
    expect(result.status).toBe('CANCELLED');
  });

  it('throws NotFoundError when issuance does not exist', async () => {
    prismaMock.ticketIssuance.findUnique.mockResolvedValue(null);

    await expect(TicketIssuanceService.adminCancel('ghost-id')).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when trying to cancel a CLAIMED issuance', async () => {
    const claimed = makeIssuance({ status: 'CLAIMED' });
    prismaMock.ticketIssuance.findUnique.mockResolvedValue(claimed as any);

    await expect(TicketIssuanceService.adminCancel('issuance-1')).rejects.toThrow(ValidationError);
    expect(prismaMock.ticketIssuance.update).not.toHaveBeenCalled();
  });

  it('does not require matching organizerId — no ownership check', async () => {
    // Even if the package belongs to a different organizer, adminCancel should proceed
    const pending = makeIssuance({ status: 'PENDING' });
    prismaMock.ticketIssuance.findUnique.mockResolvedValue(pending as any);
    prismaMock.ticketIssuance.update.mockResolvedValue(makeIssuance({ status: 'CANCELLED' }) as any);

    // No organizerId argument — should not throw
    await expect(TicketIssuanceService.adminCancel('issuance-1')).resolves.not.toThrow();
    // findUnique should only query by id, not join to package
    expect(prismaMock.ticketIssuance.findUnique).toHaveBeenCalledWith({
      where: { id: 'issuance-1' },
    });
  });
});

// ---------------------------------------------------------------------------
// listAll vs organizer cancel — confirm ownership IS checked in organizer path
// ---------------------------------------------------------------------------

describe('TicketIssuanceService.cancel (organizer path)', () => {
  beforeEach(() => mockReset(prismaMock));

  it('throws ValidationError when organizer does not own the package', async () => {
    const issuance = {
      ...makeIssuance({ status: 'PENDING' }),
      package: { ...makePackage({ organizerId: 'other-org' }) },
    };
    prismaMock.ticketIssuance.findUnique.mockResolvedValue(issuance as any);

    await expect(
      TicketIssuanceService.cancel('issuance-1', 'org-1'),
    ).rejects.toThrow(ValidationError);
  });

  it('succeeds when organizer owns the package', async () => {
    const issuance = {
      ...makeIssuance({ status: 'PENDING' }),
      package: { ...makePackage({ organizerId: 'org-1' }) },
    };
    const cancelled = makeIssuance({ status: 'CANCELLED' });
    prismaMock.ticketIssuance.findUnique.mockResolvedValue(issuance as any);
    prismaMock.ticketIssuance.update.mockResolvedValue(cancelled as any);

    const result = await TicketIssuanceService.cancel('issuance-1', 'org-1');
    expect(result.status).toBe('CANCELLED');
  });
});
