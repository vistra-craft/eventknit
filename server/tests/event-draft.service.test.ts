import { EventDraftService } from '../src/services/event-draft.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    eventDraft: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  eventDraft: {
    create: vi.Mock;
    findMany: vi.Mock;
    findFirst: vi.Mock;
    update: vi.Mock;
    delete: vi.Mock;
  };
};

describe('EventDraftService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates draft', async () => {
    prismaMock.eventDraft.create.mockResolvedValue({ id: 'draft-1' });

    const draft = await EventDraftService.createDraft('org-1', { draftData: { title: 'Draft' } });

    expect(prismaMock.eventDraft.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizerId: 'org-1',
          draftData: { title: 'Draft' },
        }),
      }),
    );
    expect(draft).toEqual({ id: 'draft-1' });
  });

  it('publishes draft when found', async () => {
    prismaMock.eventDraft.findFirst.mockResolvedValue({ id: 'draft-1', draftData: { title: 'Draft' } });
    prismaMock.eventDraft.update.mockResolvedValue({});

    const result = await EventDraftService.publishDraft('draft-1', 'org-1');

    expect(prismaMock.eventDraft.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'draft-1' } }),
    );
    expect(result).toEqual({ draftData: { title: 'Draft' }, draftId: 'draft-1' });
  });

  it('throws when publishing missing draft', async () => {
    prismaMock.eventDraft.findFirst.mockResolvedValue(null);
    await expect(EventDraftService.publishDraft('missing', 'org-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});

