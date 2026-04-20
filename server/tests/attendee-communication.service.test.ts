import { AttendeeCommunicationService } from '../src/services/attendee-communication.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    attendeeSegment: { findFirst: vi.fn() },
    bulkMessage: { create: vi.fn(), findMany: vi.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  attendeeSegment: { findFirst: vi.Mock };
  bulkMessage: { create: vi.Mock; findMany: vi.Mock };
};

describe('AttendeeCommunicationService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws when audience segment missing', async () => {
    prismaMock.attendeeSegment.findFirst.mockResolvedValue(null);
    await expect(
      AttendeeCommunicationService.scheduleMessage('org-1', { audienceId: 'seg-x', subject: 'Hello', content: 'Hi' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('schedules message when segment exists', async () => {
    prismaMock.attendeeSegment.findFirst.mockResolvedValue({ id: 'seg-1', organizerId: 'org-1' });
    prismaMock.bulkMessage.create.mockResolvedValue({ id: 'msg-1' });

    const msg = await AttendeeCommunicationService.scheduleMessage('org-1', {
      audienceId: 'seg-1',
      subject: 'Hello',
      content: 'Hi',
    });

    expect(prismaMock.bulkMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: 'org-1',
          eventId: 'seg-1',
          title: 'Hello',
        }),
      }),
    );
    expect(msg).toEqual({ id: 'msg-1' });
  });
});

