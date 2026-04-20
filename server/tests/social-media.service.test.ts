import { SocialMediaService } from '../src/services/social-media.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    event: { findFirst: vi.fn() },
    socialMediaPost: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: vi.Mock };
  socialMediaPost: {
    create: vi.Mock;
    findMany: vi.Mock;
    update: vi.Mock;
  };
};

describe('SocialMediaService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const baseData = {
    eventId: 'evt-1',
    platform: 'facebook',
    content: 'Hello',
    mediaUrls: [],
  };

  it('throws when event not found', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    await expect(
      SocialMediaService.createPost('org-1', baseData as any),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates post when event is valid', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
    prismaMock.socialMediaPost.create.mockResolvedValue({ id: 'post-1' });

    const post = await SocialMediaService.createPost('org-1', baseData as any);

    expect(prismaMock.socialMediaPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizerId: 'org-1',
          eventId: 'evt-1',
          platform: 'facebook',
          content: 'Hello',
        }),
      }),
    );
    expect(post).toEqual({ id: 'post-1' });
  });
});

