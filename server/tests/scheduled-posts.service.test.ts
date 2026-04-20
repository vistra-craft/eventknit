import { ScheduledPostsService } from '../src/services/social-media/scheduled-posts.service';
import { SocialMediaService } from '../src/services/social-media.service';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    socialMediaPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  socialMediaPost: {
    findMany: vi.Mock;
    findFirst: vi.Mock;
    update: vi.Mock;
  };
};

vi.mock('../src/services/social-media.service', () => ({
  SocialMediaService: {
    publishPost: vi.fn(),
  },
}));

describe('ScheduledPostsService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('processes scheduled posts', async () => {
    prismaMock.socialMediaPost.findMany.mockResolvedValue([
      { id: 'post-1', organizerId: 'org-1' },
      { id: 'post-2', organizerId: 'org-1' },
    ]);
    (SocialMediaService.publishPost as vi.Mock).mockResolvedValue({});

    const result = await ScheduledPostsService.processScheduledPosts();

    expect(SocialMediaService.publishPost).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(2);
  });

  it('schedules post in future', async () => {
    prismaMock.socialMediaPost.findFirst.mockResolvedValue({ id: 'post-1', organizerId: 'org-1' });
    prismaMock.socialMediaPost.update.mockResolvedValue({ id: 'post-1', status: 'scheduled' });

    const scheduled = await ScheduledPostsService.schedulePost('post-1', new Date(Date.now() + 3600_000), 'org-1');
    expect(scheduled.status).toBe('scheduled');
  });

  it('throws when scheduling in the past', async () => {
    prismaMock.socialMediaPost.findFirst.mockResolvedValue({ id: 'post-1', organizerId: 'org-1' });
    await expect(
      ScheduledPostsService.schedulePost('post-1', new Date(Date.now() - 1000), 'org-1'),
    ).rejects.toThrow('Scheduled time must be in the future');
  });
});

