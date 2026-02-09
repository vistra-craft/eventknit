import { WhiteLabelService } from '../src/services/white-label.service';
import { ValidationError, NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    whiteLabelBranding: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    customDomain: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  whiteLabelBranding: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
  };
  customDomain: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

describe('WhiteLabelService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ========== createBranding ==========
  describe('createBranding', () => {
    it('creates branding for organizer', async () => {
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
          }),
        }),
      );
      expect(branding).toEqual({ id: 'brand-1' });
    });
  });

  // ========== updateBranding ==========
  describe('updateBranding', () => {
    it('updates branding for organizer', async () => {
      prismaMock.whiteLabelBranding.findFirst.mockResolvedValue({
        id: 'brand-1',
        organizerId: 'org-1',
        metadata: {},
      });
      prismaMock.whiteLabelBranding.update.mockResolvedValue({
        id: 'brand-1',
        brandName: 'new.example.com',
      });

      const updated = await WhiteLabelService.updateBranding('org-1', 'brand-1', {
        domain: 'new.example.com',
      });
      expect(updated).toEqual({ id: 'brand-1', brandName: 'new.example.com' });
    });

    it('throws ValidationError on cross-organizer update', async () => {
      prismaMock.whiteLabelBranding.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'brand-1', organizerId: 'other' });

      await expect(
        WhiteLabelService.updateBranding('org-1', 'brand-1', { domain: 'x.com' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('throws NotFoundError when branding does not exist', async () => {
      prismaMock.whiteLabelBranding.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        WhiteLabelService.updateBranding('org-1', 'brand-1', { domain: 'x.com' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ========== getOrCreateBranding ==========
  describe('getOrCreateBranding', () => {
    it('returns existing branding if found', async () => {
      const existing = { id: 'brand-1', organizerId: 'org-1', status: 'ACTIVE' };
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue(existing);

      const result = await WhiteLabelService.getOrCreateBranding('org-1');
      expect(result).toEqual(existing);
      expect(prismaMock.whiteLabelBranding.create).not.toHaveBeenCalled();
    });

    it('creates new branding with PENDING_APPROVAL status if not found', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue(null);
      prismaMock.whiteLabelBranding.create.mockResolvedValue({
        id: 'brand-new',
        organizerId: 'org-1',
        status: 'PENDING_APPROVAL',
        isActive: false,
      });

      const result = await WhiteLabelService.getOrCreateBranding('org-1');
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(result.isActive).toBe(false);
      expect(prismaMock.whiteLabelBranding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: 'org-1',
            status: 'PENDING_APPROVAL',
            isActive: false,
          }),
        }),
      );
    });
  });

  // ========== upsertBranding ==========
  describe('upsertBranding', () => {
    it('creates branding with PENDING_APPROVAL status', async () => {
      prismaMock.whiteLabelBranding.upsert.mockResolvedValue({
        id: 'brand-1',
        status: 'PENDING_APPROVAL',
        isActive: false,
      });

      const result = await WhiteLabelService.upsertBranding('org-1', {
        brandName: 'Test Brand',
        primaryColor: '#FF5733',
      });

      expect(result.status).toBe('PENDING_APPROVAL');
      expect(prismaMock.whiteLabelBranding.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizerId: 'org-1' },
          create: expect.objectContaining({
            status: 'PENDING_APPROVAL',
            isActive: false,
          }),
          update: expect.objectContaining({
            status: 'PENDING_APPROVAL',
            isActive: false,
          }),
        }),
      );
    });

    it('rejects invalid color format', async () => {
      await expect(
        WhiteLabelService.upsertBranding('org-1', { primaryColor: 'not-a-color' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects invalid email format', async () => {
      await expect(
        WhiteLabelService.upsertBranding('org-1', { supportEmail: 'invalid-email' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects invalid URL format', async () => {
      await expect(
        WhiteLabelService.upsertBranding('org-1', { logoUrl: 'not-a-url' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('accepts valid hex colors', async () => {
      prismaMock.whiteLabelBranding.upsert.mockResolvedValue({ id: 'brand-1' });

      await WhiteLabelService.upsertBranding('org-1', {
        primaryColor: '#FF5733',
        secondaryColor: '#abc',
      });

      expect(prismaMock.whiteLabelBranding.upsert).toHaveBeenCalled();
    });
  });

  // ========== adminUpsertBranding ==========
  describe('adminUpsertBranding', () => {
    it('creates branding with ACTIVE status and admin as approver', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'org-1', role: 'ORGANIZER' });
      prismaMock.whiteLabelBranding.upsert.mockResolvedValue({
        id: 'brand-1',
        status: 'ACTIVE',
        isActive: true,
        approvedBy: 'admin-1',
      });

      const result = await WhiteLabelService.adminUpsertBranding(
        'org-1',
        { brandName: 'Admin Brand', primaryColor: '#123456' },
        'admin-1',
      );

      expect(result.status).toBe('ACTIVE');
      expect(result.isActive).toBe(true);
      expect(result.approvedBy).toBe('admin-1');
      expect(prismaMock.whiteLabelBranding.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            status: 'ACTIVE',
            isActive: true,
            approvedBy: 'admin-1',
          }),
          update: expect.objectContaining({
            status: 'ACTIVE',
            isActive: true,
            approvedBy: 'admin-1',
            rejectionReason: null,
          }),
        }),
      );
    });

    it('throws NotFoundError when organizer does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        WhiteLabelService.adminUpsertBranding('missing-org', { brandName: 'Test' }, 'admin-1'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('validates branding data', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'org-1' });

      await expect(
        WhiteLabelService.adminUpsertBranding(
          'org-1',
          { primaryColor: 'invalid' },
          'admin-1',
        ),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  // ========== updateBrandingStatus ==========
  describe('updateBrandingStatus', () => {
    it('activates branding with approver info', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue({ id: 'brand-1' });
      prismaMock.whiteLabelBranding.update.mockResolvedValue({
        id: 'brand-1',
        status: 'ACTIVE',
        isActive: true,
        approvedBy: 'admin-1',
      });

      const result = await WhiteLabelService.updateBrandingStatus(
        'brand-1',
        'ACTIVE' as any,
        'admin-1',
      );

      expect(result.status).toBe('ACTIVE');
      expect(prismaMock.whiteLabelBranding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
            isActive: true,
            approvedBy: 'admin-1',
          }),
        }),
      );
    });

    it('rejects branding with reason', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue({ id: 'brand-1' });
      prismaMock.whiteLabelBranding.update.mockResolvedValue({
        id: 'brand-1',
        status: 'INACTIVE',
        isActive: false,
        rejectionReason: 'Low quality logo',
      });

      const result = await WhiteLabelService.updateBrandingStatus(
        'brand-1',
        'INACTIVE' as any,
        'admin-1',
        'Low quality logo',
      );

      expect(result.status).toBe('INACTIVE');
      expect(prismaMock.whiteLabelBranding.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'INACTIVE',
            isActive: false,
            rejectionReason: 'Low quality logo',
          }),
        }),
      );
    });

    it('throws NotFoundError for non-existent branding', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue(null);

      await expect(
        WhiteLabelService.updateBrandingStatus('missing', 'ACTIVE' as any, 'admin-1'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ========== getAllBrandings ==========
  describe('getAllBrandings', () => {
    it('returns all brandings with organizer data', async () => {
      const brandings = [
        { id: 'b1', brandName: 'Brand 1', organizer: { id: 'o1', email: 'a@b.com' } },
        { id: 'b2', brandName: 'Brand 2', organizer: { id: 'o2', email: 'c@d.com' } },
      ];
      prismaMock.whiteLabelBranding.findMany.mockResolvedValue(brandings);

      const result = await WhiteLabelService.getAllBrandings({});
      expect(result).toHaveLength(2);
      expect(prismaMock.whiteLabelBranding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            organizer: expect.any(Object),
          }),
        }),
      );
    });

    it('filters by status', async () => {
      prismaMock.whiteLabelBranding.findMany.mockResolvedValue([]);

      await WhiteLabelService.getAllBrandings({ status: 'ACTIVE' as any });
      expect(prismaMock.whiteLabelBranding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('filters by search term', async () => {
      prismaMock.whiteLabelBranding.findMany.mockResolvedValue([]);

      await WhiteLabelService.getAllBrandings({ search: 'test' });
      expect(prismaMock.whiteLabelBranding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ brandName: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });
  });

  // ========== addCustomDomain ==========
  describe('addCustomDomain', () => {
    it('creates domain with PENDING status and verification code', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue(null);
      prismaMock.customDomain.create.mockResolvedValue({
        id: 'dom-1',
        domain: 'events.example.com',
        status: 'PENDING',
        verificationCode: expect.any(String),
      });

      const result = await WhiteLabelService.addCustomDomain('org-1', {
        domain: 'events.example.com',
      });

      expect(result.status).toBe('PENDING');
      expect(prismaMock.customDomain.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizerId: 'org-1',
            domain: 'events.example.com',
            status: 'PENDING',
            verificationCode: expect.any(String),
            verificationToken: expect.any(String),
          }),
        }),
      );
    });

    it('rejects invalid domain format', async () => {
      await expect(
        WhiteLabelService.addCustomDomain('org-1', { domain: 'not valid domain!' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects duplicate domain', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        WhiteLabelService.addCustomDomain('org-1', { domain: 'events.example.com' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('unsets other primary domains when isPrimary=true', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue(null);
      prismaMock.customDomain.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.customDomain.create.mockResolvedValue({
        id: 'dom-1',
        domain: 'events.example.com',
        isPrimary: true,
        status: 'PENDING',
      });

      await WhiteLabelService.addCustomDomain('org-1', {
        domain: 'events.example.com',
        isPrimary: true,
      });

      expect(prismaMock.customDomain.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizerId: 'org-1', isPrimary: true }),
          data: { isPrimary: false },
        }),
      );
    });
  });

  // ========== getAllCustomDomains ==========
  describe('getAllCustomDomains', () => {
    it('returns all domains with organizer data', async () => {
      const domains = [
        { id: 'd1', domain: 'a.com', organizer: { id: 'o1' } },
        { id: 'd2', domain: 'b.com', organizer: { id: 'o2' } },
      ];
      prismaMock.customDomain.findMany.mockResolvedValue(domains);

      const result = await WhiteLabelService.getAllCustomDomains({});
      expect(result).toHaveLength(2);
      expect(prismaMock.customDomain.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            organizer: expect.any(Object),
          }),
        }),
      );
    });

    it('filters by status and organizerId', async () => {
      prismaMock.customDomain.findMany.mockResolvedValue([]);

      await WhiteLabelService.getAllCustomDomains({
        status: 'PENDING' as any,
        organizerId: 'org-1',
      });

      expect(prismaMock.customDomain.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            organizerId: 'org-1',
          }),
        }),
      );
    });
  });

  // ========== verifyCustomDomain ==========
  describe('verifyCustomDomain', () => {
    it('verifies domain - sets isActive=true', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue({ id: 'dom-1' });
      prismaMock.customDomain.update.mockResolvedValue({
        id: 'dom-1',
        status: 'VERIFIED',
        isActive: true,
        verifiedBy: 'admin-1',
      });

      const result = await WhiteLabelService.verifyCustomDomain(
        'dom-1',
        'admin-1',
        'VERIFIED' as any,
      );

      expect(result.status).toBe('VERIFIED');
      expect(prismaMock.customDomain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'VERIFIED',
            isActive: true,
            verifiedBy: 'admin-1',
          }),
        }),
      );
    });

    it('fails domain with reason', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue({ id: 'dom-1' });
      prismaMock.customDomain.update.mockResolvedValue({
        id: 'dom-1',
        status: 'FAILED',
        isActive: false,
        failureReason: 'DNS not configured',
      });

      const result = await WhiteLabelService.verifyCustomDomain(
        'dom-1',
        'admin-1',
        'FAILED' as any,
        'DNS not configured',
      );

      expect(result.status).toBe('FAILED');
      expect(prismaMock.customDomain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'DNS not configured',
          }),
        }),
      );
    });

    it('throws NotFoundError for non-existent domain', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue(null);

      await expect(
        WhiteLabelService.verifyCustomDomain('missing', 'admin-1', 'VERIFIED' as any),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ========== deleteCustomDomain ==========
  describe('deleteCustomDomain', () => {
    it('deletes domain owned by organizer', async () => {
      prismaMock.customDomain.findFirst.mockResolvedValue({ id: 'dom-1', organizerId: 'org-1' });
      prismaMock.customDomain.delete.mockResolvedValue({});

      const result = await WhiteLabelService.deleteCustomDomain('dom-1', 'org-1');
      expect(result.success).toBe(true);
      expect(prismaMock.customDomain.delete).toHaveBeenCalledWith({
        where: { id: 'dom-1' },
      });
    });

    it('throws NotFoundError for non-existent domain', async () => {
      prismaMock.customDomain.findFirst.mockResolvedValue(null);

      await expect(
        WhiteLabelService.deleteCustomDomain('missing', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ========== adminDeleteCustomDomain ==========
  describe('adminDeleteCustomDomain', () => {
    it('deletes any domain regardless of ownership', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue({ id: 'dom-1', organizerId: 'org-other' });
      prismaMock.customDomain.delete.mockResolvedValue({});

      const result = await WhiteLabelService.adminDeleteCustomDomain('dom-1');
      expect(result.success).toBe(true);
    });

    it('throws NotFoundError for non-existent domain', async () => {
      prismaMock.customDomain.findUnique.mockResolvedValue(null);

      await expect(
        WhiteLabelService.adminDeleteCustomDomain('missing'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ========== getActiveBranding ==========
  describe('getActiveBranding', () => {
    it('returns active branding for organizer', async () => {
      const branding = { id: 'b1', status: 'ACTIVE', isActive: true };
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue(branding);

      const result = await WhiteLabelService.getActiveBranding('org-1');
      expect(result).toEqual(branding);
    });

    it('returns null when no active branding', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue(null);

      const result = await WhiteLabelService.getActiveBranding('org-1');
      expect(result).toBeNull();
    });
  });

  // ========== renderBrandedEmail ==========
  describe('renderBrandedEmail', () => {
    it('wraps HTML with branding template when active branding exists', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue({
        id: 'b1',
        primaryColor: '#FF5733',
        backgroundColor: '#f5f5f5',
        textColor: '#333333',
        logoUrl: 'https://example.com/logo.png',
        brandName: 'Test Brand',
        fontFamily: 'Inter',
        emailFooterText: 'Thanks for attending!',
        supportEmail: 'hello@test.com',
      });

      const result = await WhiteLabelService.renderBrandedEmail(
        'org-1',
        '<p>Hello!</p>',
        'Welcome',
      );

      expect(result.html).toContain('#FF5733');
      expect(result.html).toContain('<p>Hello!</p>');
      expect(result.html).toContain('logo.png');
      expect(result.html).toContain('Thanks for attending!');
      expect(result.subject).toBe('Welcome');
    });

    it('returns unmodified HTML when no active branding', async () => {
      prismaMock.whiteLabelBranding.findUnique.mockResolvedValue(null);

      const result = await WhiteLabelService.renderBrandedEmail(
        'org-1',
        '<p>Hello!</p>',
        'Test',
      );

      expect(result.html).toBe('<p>Hello!</p>');
      expect(result.subject).toBe('Test');
    });
  });
});
