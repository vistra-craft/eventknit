import { WhiteLabelService } from '../src/services/white-label.service';
import { ValidationError } from '../src/utils/errors';

const prismaMock = {
  whiteLabelBranding: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('WhiteLabelService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates branding', async () => {
    prismaMock.whiteLabelBranding.create.mockResolvedValue({ id: 'brand-1' });
    const branding = await WhiteLabelService.createBranding('org-1', {
      domain: 'events.example.com',
      theme: { primary: '#000' },
    });

    expect(prismaMock.whiteLabelBranding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizerId: 'org-1',
          brandName: 'events.example.com',
          metadata: { domain: 'events.example.com', theme: { primary: '#000' } },
        }),
      }),
    );
    expect(branding).toEqual({ id: 'brand-1' });
  });

  it('updates branding for organizer', async () => {
    prismaMock.whiteLabelBranding.findFirst.mockResolvedValue({ id: 'brand-1', organizerId: 'org-1', metadata: {} });
    prismaMock.whiteLabelBranding.update.mockResolvedValue({ id: 'brand-1', brandName: 'new.example.com' });

    const updated = await WhiteLabelService.updateBranding('org-1', 'brand-1', { domain: 'new.example.com' });
    expect(updated).toEqual({ id: 'brand-1', brandName: 'new.example.com' });
  });

  it('throws on cross-organizer update', async () => {
    prismaMock.whiteLabelBranding.findFirst.mockResolvedValue({ id: 'brand-1', organizerId: 'other' });
    await expect(
      WhiteLabelService.updateBranding('org-1', 'brand-1', { domain: 'x.com' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

