import { ScheduledPostsService } from '../../src/services/social-media/scheduled-posts.service';
import { SocialMediaService } from '../../src/services/social-media.service';

const prismaMock = {
  socialMediaPost: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  prisma: prismaMock,
}));

jest.mock('../../src/services/social-media.service', () => ({
  SocialMediaService: {
    publishPost: jest.fn(),
  },
}));

describe('ScheduledPostsService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('processes scheduled posts', async () => {
    prismaMock.socialMediaPost.findMany.mockResolvedValue([
      { id: 'post-1', organizerId: 'org-1' },
      { id: 'post-2', organizerId: 'org-1' },
    ]);
    (SocialMediaService.publishPost as jest.Mock).mockResolvedValue({});

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

