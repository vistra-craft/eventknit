import { AffiliateProgramService } from '../src/services/affiliate-program.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    event: { findFirst: jest.fn() },
    affiliateProgram: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    affiliate: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    affiliateConversion: {
      create: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: jest.Mock };
  affiliateProgram: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
  affiliate: {
    findUnique: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  affiliateConversion: {
    create: jest.Mock;
  };
};

describe('AffiliateProgramService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createProgram', () => {
    it('throws when event not found for organizer', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);
      await expect(
        AffiliateProgramService.createProgram('org-1', {
          eventId: 'evt-1',
          name: 'Aff',
          commissionType: 'PERCENTAGE',
          commissionValue: 10,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('creates program', async () => {
      prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1' });
      prismaMock.affiliateProgram.create.mockResolvedValue({ id: 'prog-1' });

      const program = await AffiliateProgramService.createProgram('org-1', {
        eventId: 'evt-1',
        name: 'Aff',
        commissionType: 'PERCENTAGE',
        commissionValue: 10,
      });

      expect(prismaMock.affiliateProgram.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: 'org-1',
            eventId: 'evt-1',
            name: 'Aff',
            commissionType: 'PERCENTAGE',
            commissionValue: 10,
          }),
        }),
      );
      expect(program).toEqual({ id: 'prog-1' });
    });
  });

  describe('applyAsAffiliate', () => {
    it('throws when program missing', async () => {
      prismaMock.affiliateProgram.findFirst.mockResolvedValue(null);
      await expect(AffiliateProgramService.applyAsAffiliate('prog-x', 'user-1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws when already affiliate', async () => {
      prismaMock.affiliateProgram.findFirst.mockResolvedValue({ id: 'prog-1', isActive: true });
      prismaMock.affiliate.findUnique.mockResolvedValue({ id: 'aff-1' });

      await expect(AffiliateProgramService.applyAsAffiliate('prog-1', 'user-1')).rejects.toBeInstanceOf(ValidationError);
    });

    it('creates affiliate record', async () => {
      prismaMock.affiliateProgram.findFirst.mockResolvedValue({ id: 'prog-1', isActive: true });
      prismaMock.affiliate.findUnique.mockResolvedValue(null);
      prismaMock.affiliate.create.mockResolvedValue({ id: 'aff-1', affiliateCode: 'CODE' });

      const aff = await AffiliateProgramService.applyAsAffiliate('prog-1', 'user-1');
      expect(prismaMock.affiliate.create).toHaveBeenCalled();
      expect(aff).toEqual({ id: 'aff-1', affiliateCode: 'CODE' });
    });
  });
});

