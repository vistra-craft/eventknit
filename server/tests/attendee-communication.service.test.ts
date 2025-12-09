import { AttendeeCommunicationService } from '../src/services/attendee-communication.service';
import { NotFoundError } from '../src/utils/errors';

const prismaMock = {
  attendeeSegment: { findFirst: jest.fn() },
  attendeeCommunication: { create: jest.fn(), findMany: jest.fn() },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('AttendeeCommunicationService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws when audience segment missing', async () => {
    prismaMock.attendeeSegment.findFirst.mockResolvedValue(null);
    await expect(
      AttendeeCommunicationService.scheduleMessage('org-1', { audienceId: 'seg-x', subject: 'Hello', content: 'Hi' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('schedules message when segment exists', async () => {
    prismaMock.attendeeSegment.findFirst.mockResolvedValue({ id: 'seg-1', organizerId: 'org-1' });
    prismaMock.attendeeCommunication.create.mockResolvedValue({ id: 'msg-1' });

    const msg = await AttendeeCommunicationService.scheduleMessage('org-1', {
      audienceId: 'seg-1',
      subject: 'Hello',
      content: 'Hi',
    });

    expect(prismaMock.attendeeCommunication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizerId: 'org-1',
          audienceId: 'seg-1',
          subject: 'Hello',
        }),
      }),
    );
    expect(msg).toEqual({ id: 'msg-1' });
  });
});

