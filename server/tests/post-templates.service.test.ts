import { PostTemplatesService } from '../src/services/social-media/post-templates.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    socialMediaPostTemplate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  socialMediaPostTemplate: {
    create: vi.Mock;
    findMany: vi.Mock;
    findFirst: vi.Mock;
  };
};

describe('PostTemplatesService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates template', async () => {
    prismaMock.socialMediaPostTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
    const tmpl = await PostTemplatesService.createTemplate('org-1', {
      name: 'Launch',
      platform: 'facebook',
      content: 'Hello {{eventTitle}}',
    });
    expect(prismaMock.socialMediaPostTemplate.create).toHaveBeenCalled();
    expect(tmpl).toEqual({ id: 'tmpl-1' });
  });

  it('gets public templates', async () => {
    prismaMock.socialMediaPostTemplate.findMany.mockResolvedValue([{ id: 'tmpl-1', isPublic: true }]);
    const tmpls = await PostTemplatesService.getPublicTemplates({ platform: 'facebook' });
    expect(tmpls).toHaveLength(1);
  });

  it('throws when template not found', async () => {
    prismaMock.socialMediaPostTemplate.findFirst.mockResolvedValue(null);
    await expect(PostTemplatesService.getTemplateById('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('renders template variables', () => {
    const rendered = PostTemplatesService.renderTemplate('Hello {{name}}', { name: 'World' });
    expect(rendered).toBe('Hello World');
  });
});

