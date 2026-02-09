import { AttendeeSegmentationService } from '../src/services/attendee-segmentation.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    attendeeSegment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  attendeeSegment: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('AttendeeSegmentationService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const criteria = [{ field: 'city', operator: 'eq', value: 'NYC' }];

  it('creates segment with organizer scope', async () => {
    prismaMock.attendeeSegment.create.mockResolvedValue({ id: 'seg-1' });
    const segment = await AttendeeSegmentationService.createSegment('org-1', {
      name: 'NYC',
      description: 'NYC attendees',
      criteria,
    });
    expect(prismaMock.attendeeSegment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizerId: 'org-1', name: 'NYC', criteria }),
      }),
    );
    expect(segment).toEqual({ id: 'seg-1' });
  });

  it('updates only within organizer scope', async () => {
    prismaMock.attendeeSegment.findFirst.mockResolvedValue({ id: 'seg-1', organizerId: 'org-1' });
    prismaMock.attendeeSegment.update.mockResolvedValue({ id: 'seg-1', name: 'Updated' });

    const updated = await AttendeeSegmentationService.updateSegment('seg-1', 'org-1', { name: 'Updated' });
    expect(prismaMock.attendeeSegment.update).toHaveBeenCalled();
    expect(updated).toEqual({ id: 'seg-1', name: 'Updated' });
  });

  it('throws on cross-organizer update', async () => {
    // Service queries with organizerId in where clause, so cross-organizer returns null
    prismaMock.attendeeSegment.findFirst.mockResolvedValue(null);
    await expect(
      AttendeeSegmentationService.updateSegment('seg-1', 'org-1', { name: 'Bad' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

