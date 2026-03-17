import { EventTemplateService } from '../src/services/event-template.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    eventTemplate: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  eventTemplate: {
    create: vi.Mock;
    findFirst: vi.Mock;
    findMany: vi.Mock;
    update: vi.Mock;
  };
};

describe('EventTemplateService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates template', async () => {
    prismaMock.eventTemplate.create.mockResolvedValue({ id: 'tmpl-1' });

    const template = await EventTemplateService.createTemplate('org-1', {
      name: 'My Template',
      templateData: { steps: [] },
      isPublic: false,
    });

    expect(prismaMock.eventTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizerId: 'org-1',
          name: 'My Template',
          templateData: { steps: [] },
        }),
      }),
    );
    expect(template).toEqual({ id: 'tmpl-1' });
  });

  it('uses template when accessible', async () => {
    prismaMock.eventTemplate.findFirst.mockResolvedValue({
      id: 'tmpl-1',
      organizerId: 'org-1',
      templateData: { steps: [1] },
      name: 'Test',
      isPublic: true,
    });
    prismaMock.eventTemplate.update.mockResolvedValue({});

    const result = await EventTemplateService.useTemplate('tmpl-1', 'org-2');

    expect(result).toEqual({
      templateData: { steps: [1] },
      templateName: 'Test',
    });
    expect(prismaMock.eventTemplate.update).toHaveBeenCalled();
  });

  it('throws when template not found', async () => {
    prismaMock.eventTemplate.findFirst.mockResolvedValue(null);
    await expect(EventTemplateService.useTemplate('missing', 'org-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});

