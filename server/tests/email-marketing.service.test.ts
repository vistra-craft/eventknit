import { EmailMarketingService } from '../src/services/email-marketing.service';
import { ValidationError } from '../src/utils/errors';

const prismaMock = {
  event: { findFirst: jest.fn() },
  emailCampaign: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  eventRegistration: { findMany: jest.fn() },
};

const attendeeCommMock = {
  getSegmentRecipients: jest.fn(),
  getTaggedUsersRecipients: jest.fn(),
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

jest.mock('../src/services/attendee-communication.service', () => ({
  AttendeeCommunicationService: attendeeCommMock,
}));

describe('EmailMarketingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('validates segment/tag requirements', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1' });
    await expect(
      EmailMarketingService.createCampaign('org-1', {
        eventId: 'evt-1',
        name: 'C1',
        subject: 'Hello',
        content: 'Hi',
        recipientType: 'segment',
      } as any),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      EmailMarketingService.createCampaign('org-1', {
        eventId: 'evt-1',
        name: 'C1',
        subject: 'Hello',
        content: 'Hi',
        recipientType: 'tag',
      } as any),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('creates campaign with valid data', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
    prismaMock.emailCampaign.create.mockResolvedValue({ id: 'camp-1' });

    const camp = await EmailMarketingService.createCampaign('org-1', {
      eventId: 'evt-1',
      name: 'C1',
      subject: 'Hello',
      content: 'Hi',
      recipientType: 'all',
    });

    expect(prismaMock.emailCampaign.create).toHaveBeenCalled();
    expect(camp).toEqual({ id: 'camp-1' });
  });

  it('sends campaign to all registrations', async () => {
    prismaMock.emailCampaign.findFirst.mockResolvedValue({
      id: 'camp-1',
      organizerId: 'org-1',
      recipientType: 'all',
      status: 'draft',
      event: { id: 'evt-1', title: 'T' },
    });
    prismaMock.eventRegistration.findMany.mockResolvedValue([
      { attendee: { email: 'a@test.com', firstName: 'A', lastName: 'B' } },
    ]);
    prismaMock.emailCampaign.update.mockResolvedValue({});
    await EmailMarketingService.sendCampaign('camp-1', 'org-1');

    expect(prismaMock.eventRegistration.findMany).toHaveBeenCalled();
  });

  it('uses segment recipients', async () => {
    prismaMock.emailCampaign.findFirst.mockResolvedValue({
      id: 'camp-2',
      organizerId: 'org-1',
      recipientType: 'segment',
      segmentId: 'seg-1',
      status: 'draft',
      event: { id: 'evt-1', title: 'T' },
    });
    attendeeCommMock.getSegmentRecipients.mockResolvedValue([{ email: 'x@test.com' }]);
    prismaMock.emailCampaign.update.mockResolvedValue({});
    await EmailMarketingService.sendCampaign('camp-2', 'org-1');
    expect(attendeeCommMock.getSegmentRecipients).toHaveBeenCalled();
  });
});

