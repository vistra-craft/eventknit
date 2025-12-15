import { AdvancedTeamService } from '../src/services/advanced-team.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    teamRoleTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    teamActivityFeed: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  teamRoleTemplate: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  teamActivityFeed: {
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
  };
};

describe('AdvancedTeamService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates role template', async () => {
    prismaMock.teamRoleTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
    const template = await AdvancedTeamService.createRoleTemplate('org-1', { name: 'Editor', canEdit: true } as any);
    expect(prismaMock.teamRoleTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizerId: 'org-1', name: 'Editor', canEdit: true }),
      }),
    );
    expect(template).toEqual({ id: 'tmpl-1' });
  });

  it('applies role template when found', async () => {
    prismaMock.teamRoleTemplate.findFirst.mockResolvedValue({
      id: 'tmpl-1',
      organizerId: 'org-1',
      canEdit: true,
      canManageAttendees: false,
      canManageTickets: false,
      canViewAnalytics: true,
      canManageStaff: false,
      canPublish: false,
      canManageCollaborators: false,
    });
    prismaMock.teamRoleTemplate.update.mockResolvedValue({});

    const result = await AdvancedTeamService.applyRoleTemplate('tmpl-1', 'org-1');
    expect(result.permissions.canEdit).toBe(true);
    expect(prismaMock.teamRoleTemplate.update).toHaveBeenCalled();
  });

  it('throws when applying missing template', async () => {
    prismaMock.teamRoleTemplate.findFirst.mockResolvedValue(null);
    await expect(
      AdvancedTeamService.applyRoleTemplate('tmpl-x', 'org-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns team activity feed', async () => {
    prismaMock.teamActivityFeed.findMany.mockResolvedValue([{ id: 'act-1' }]);
    prismaMock.teamActivityFeed.count.mockResolvedValue(1);
    const feed = await AdvancedTeamService.getTeamActivityFeed('org-1', { page: 1, limit: 10 });
    expect(feed.activities).toHaveLength(1);
    expect(feed.total).toBe(1);
    expect(feed.totalPages).toBe(1);
  });

  it('logs activity', async () => {
    prismaMock.teamActivityFeed.create.mockResolvedValue({ id: 'act-1' });
    await AdvancedTeamService.logActivity('org-1', 'user-1', 'UPDATE', 'Changed settings');
    expect(prismaMock.teamActivityFeed.create).toHaveBeenCalled();
  });
});

