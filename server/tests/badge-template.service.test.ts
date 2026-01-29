import { BadgeTemplateService } from '../src/services/badge-template.service';
import { ValidationError, NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';
import * as cloudinaryService from '../src/services/cloudinary.service';

// Mock database
jest.mock('../src/config/database', () => ({
  prisma: {
    badgeTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock cloudinary service
jest.mock('../src/services/cloudinary.service', () => ({
  uploadImageToCloudinary: jest.fn(),
  deleteImageFromCloudinary: jest.fn(),
  extractPublicIdFromUrl: jest.fn(),
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  badgeTemplate: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

const cloudinaryMock = cloudinaryService as jest.Mocked<typeof cloudinaryService>;

describe('BadgeTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a badge template successfully', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        name: 'Test Template',
        description: 'Test Description',
        width: 101.6,
        height: 76.2,
        sizePreset: '4x3',
        orientation: 'landscape',
        backgroundColor: '#ffffff',
        backgroundImage: null,
        elements: [],
        isDefault: false,
        isActive: true,
        organizerId: 'org-1',
        eventId: null,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.badgeTemplate.create.mockResolvedValue(mockTemplate);

      const result = await BadgeTemplateService.createTemplate(
        {
          name: 'Test Template',
          description: 'Test Description',
          organizerId: 'org-1',
        },
        'user-1',
      );

      expect(prismaMock.badgeTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Template',
          description: 'Test Description',
          width: 101.6,
          height: 76.2,
          organizerId: 'org-1',
          createdBy: 'user-1',
        }),
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should unset other default templates when creating a default template', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        name: 'Default Template',
        isDefault: true,
        organizerId: 'org-1',
        eventId: null,
      };

      prismaMock.badgeTemplate.updateMany.mockResolvedValue({ count: 2 });
      prismaMock.badgeTemplate.create.mockResolvedValue(mockTemplate as any);

      await BadgeTemplateService.createTemplate(
        {
          name: 'Default Template',
          isDefault: true,
          organizerId: 'org-1',
        },
        'user-1',
      );

      expect(prismaMock.badgeTemplate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, organizerId: 'org-1' },
        data: { isDefault: false },
      });
    });

    it('should throw ValidationError on failure', async () => {
      prismaMock.badgeTemplate.create.mockRejectedValue(new Error('Database error'));

      await expect(
        BadgeTemplateService.createTemplate({ name: 'Test' }, 'user-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getTemplateById', () => {
    it('should get a template by ID', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        name: 'Test Template',
        organizer: {
          id: 'org-1',
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        event: null,
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      const result = await BadgeTemplateService.getTemplateById('tmpl-1');

      expect(prismaMock.badgeTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundError if template does not exist', async () => {
      prismaMock.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(BadgeTemplateService.getTemplateById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTemplates', () => {
    it('should get templates with pagination', async () => {
      const mockTemplates = [
        { id: 'tmpl-1', name: 'Template 1' },
        { id: 'tmpl-2', name: 'Template 2' },
      ];

      prismaMock.badgeTemplate.findMany.mockResolvedValue(mockTemplates as any);
      prismaMock.badgeTemplate.count.mockResolvedValue(2);

      const result = await BadgeTemplateService.getTemplates({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        templates: mockTemplates,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by organizerId', async () => {
      prismaMock.badgeTemplate.findMany.mockResolvedValue([]);
      prismaMock.badgeTemplate.count.mockResolvedValue(0);

      await BadgeTemplateService.getTemplates({
        organizerId: 'org-1',
      });

      expect(prismaMock.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ organizerId: 'org-1' }, { organizerId: null }],
          }),
        }),
      );
    });

    it('should search by name or description', async () => {
      prismaMock.badgeTemplate.findMany.mockResolvedValue([]);
      prismaMock.badgeTemplate.count.mockResolvedValue(0);

      await BadgeTemplateService.getTemplates({
        search: 'vip',
      });

      expect(prismaMock.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                OR: [
                  { name: { contains: 'vip', mode: 'insensitive' } },
                  { description: { contains: 'vip', mode: 'insensitive' } },
                ],
              },
            ],
          }),
        }),
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update a template successfully', async () => {
      const existingTemplate = {
        id: 'tmpl-1',
        name: 'Old Name',
        organizerId: 'org-1',
        eventId: null,
      };

      const updatedTemplate = {
        ...existingTemplate,
        name: 'New Name',
        description: 'Updated Description',
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(existingTemplate as any);
      prismaMock.badgeTemplate.update.mockResolvedValue(updatedTemplate as any);

      const result = await BadgeTemplateService.updateTemplate('tmpl-1', {
        name: 'New Name',
        description: 'Updated Description',
      });

      expect(prismaMock.badgeTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: expect.objectContaining({
          name: 'New Name',
          description: 'Updated Description',
          updatedAt: expect.any(Date),
        }),
      });
      expect(result).toEqual(updatedTemplate);
    });

    it('should throw NotFoundError if template does not exist', async () => {
      prismaMock.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(
        BadgeTemplateService.updateTemplate('nonexistent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should unset other defaults when setting as default', async () => {
      const existingTemplate = {
        id: 'tmpl-1',
        organizerId: 'org-1',
        eventId: null,
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(existingTemplate as any);
      prismaMock.badgeTemplate.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.badgeTemplate.update.mockResolvedValue({} as any);

      await BadgeTemplateService.updateTemplate('tmpl-1', { isDefault: true });

      expect(prismaMock.badgeTemplate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, organizerId: 'org-1' },
        data: { isDefault: false },
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should soft delete a template', async () => {
      const mockTemplate = { id: 'tmpl-1', isActive: false };

      prismaMock.badgeTemplate.update.mockResolvedValue(mockTemplate as any);

      const result = await BadgeTemplateService.deleteTemplate('tmpl-1');

      expect(prismaMock.badgeTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('permanentlyDeleteTemplate', () => {
    it('should permanently delete a template', async () => {
      prismaMock.badgeTemplate.delete.mockResolvedValue({} as any);

      const result = await BadgeTemplateService.permanentlyDeleteTemplate('tmpl-1');

      expect(prismaMock.badgeTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate a template', async () => {
      const originalTemplate = {
        id: 'tmpl-1',
        name: 'Original Template',
        description: 'Original Description',
        width: 101.6,
        height: 76.2,
        sizePreset: '4x3',
        orientation: 'landscape',
        backgroundColor: '#ffffff',
        elements: [],
        organizerId: 'org-1',
        eventId: null,
      };

      const duplicatedTemplate = {
        ...originalTemplate,
        id: 'tmpl-2',
        name: 'Original Template (Copy)',
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(originalTemplate as any);
      prismaMock.badgeTemplate.create.mockResolvedValue(duplicatedTemplate as any);

      const result = await BadgeTemplateService.duplicateTemplate('tmpl-1', undefined, 'user-1');

      expect(prismaMock.badgeTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Original Template (Copy)',
          description: originalTemplate.description,
          width: originalTemplate.width,
          height: originalTemplate.height,
          isDefault: false,
          createdBy: 'user-1',
        }),
      });
      expect(result.name).toBe('Original Template (Copy)');
    });

    it('should use custom name for duplicate', async () => {
      const originalTemplate = {
        id: 'tmpl-1',
        name: 'Original',
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(originalTemplate as any);
      prismaMock.badgeTemplate.create.mockResolvedValue({ name: 'Custom Copy' } as any);

      await BadgeTemplateService.duplicateTemplate('tmpl-1', 'Custom Copy', 'user-1');

      expect(prismaMock.badgeTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Custom Copy',
        }),
      });
    });
  });

  describe('setDefaultTemplate', () => {
    it('should set a template as default', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        organizerId: 'org-1',
        eventId: null,
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prismaMock.badgeTemplate.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.badgeTemplate.update.mockResolvedValue({ ...mockTemplate, isDefault: true } as any);

      await BadgeTemplateService.setDefaultTemplate('tmpl-1');

      expect(prismaMock.badgeTemplate.updateMany).toHaveBeenCalled();
      expect(prismaMock.badgeTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: { isDefault: true },
      });
    });
  });

  describe('getDefaultTemplate', () => {
    it('should get event-specific default first', async () => {
      const mockTemplate = { id: 'tmpl-1', eventId: 'evt-1', isDefault: true };

      prismaMock.badgeTemplate.findFirst.mockResolvedValue(mockTemplate as any);

      const result = await BadgeTemplateService.getDefaultTemplate('org-1', 'evt-1');

      expect(prismaMock.badgeTemplate.findFirst).toHaveBeenCalledWith({
        where: {
          eventId: 'evt-1',
          isDefault: true,
          isActive: true,
        },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should fallback to organizer default', async () => {
      const organizerTemplate = { id: 'tmpl-2', organizerId: 'org-1', isDefault: true };

      prismaMock.badgeTemplate.findFirst
        .mockResolvedValueOnce(null) // No event default
        .mockResolvedValueOnce(organizerTemplate as any); // Organizer default

      const result = await BadgeTemplateService.getDefaultTemplate('org-1', 'evt-1');

      expect(result).toEqual(organizerTemplate);
    });

    it('should fallback to platform default', async () => {
      const platformTemplate = { id: 'tmpl-3', organizerId: null, isDefault: true };

      prismaMock.badgeTemplate.findFirst
        .mockResolvedValueOnce(null) // No event default
        .mockResolvedValueOnce(null) // No organizer default
        .mockResolvedValueOnce(platformTemplate as any); // Platform default

      const result = await BadgeTemplateService.getDefaultTemplate('org-1', 'evt-1');

      expect(result).toEqual(platformTemplate);
    });
  });

  describe('uploadBackgroundImage', () => {
    it('should upload background image successfully', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        backgroundImage: null,
      };

      const uploadResult = {
        url: 'http://cloudinary.com/image.png',
        publicId: 'badge-bg/image',
        secureUrl: 'https://cloudinary.com/image.png',
      };

      const updatedTemplate = {
        ...mockTemplate,
        backgroundImage: uploadResult.secureUrl,
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      cloudinaryMock.uploadImageToCloudinary.mockResolvedValue(uploadResult);
      prismaMock.badgeTemplate.update.mockResolvedValue(updatedTemplate as any);

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await BadgeTemplateService.uploadBackgroundImage('tmpl-1', imageBuffer);

      expect(cloudinaryMock.uploadImageToCloudinary).toHaveBeenCalledWith(
        imageBuffer,
        'eventknit/badge-backgrounds',
        {
          width: 2000,
          height: 2000,
          quality: 90,
          format: 'png',
        },
      );
      expect(prismaMock.badgeTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: {
          backgroundImage: uploadResult.secureUrl,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updatedTemplate);
    });

    it('should delete old background image before uploading new one', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        backgroundImage: 'https://cloudinary.com/old-image.png',
      };

      const uploadResult = {
        url: 'http://cloudinary.com/new-image.png',
        publicId: 'badge-bg/new-image',
        secureUrl: 'https://cloudinary.com/new-image.png',
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      cloudinaryMock.extractPublicIdFromUrl.mockReturnValue('badge-bg/old-image');
      cloudinaryMock.deleteImageFromCloudinary.mockResolvedValue();
      cloudinaryMock.uploadImageToCloudinary.mockResolvedValue(uploadResult);
      prismaMock.badgeTemplate.update.mockResolvedValue({} as any);

      const imageBuffer = Buffer.from('fake-image-data');
      await BadgeTemplateService.uploadBackgroundImage('tmpl-1', imageBuffer);

      expect(cloudinaryMock.extractPublicIdFromUrl).toHaveBeenCalledWith(mockTemplate.backgroundImage);
      expect(cloudinaryMock.deleteImageFromCloudinary).toHaveBeenCalledWith('badge-bg/old-image');
    });

    it('should throw NotFoundError if template does not exist', async () => {
      prismaMock.badgeTemplate.findUnique.mockResolvedValue(null);

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(
        BadgeTemplateService.uploadBackgroundImage('nonexistent', imageBuffer),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError on upload failure', async () => {
      const mockTemplate = { id: 'tmpl-1', backgroundImage: null };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      cloudinaryMock.uploadImageToCloudinary.mockRejectedValue(new Error('Upload failed'));

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(
        BadgeTemplateService.uploadBackgroundImage('tmpl-1', imageBuffer),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('removeBackgroundImage', () => {
    it('should remove background image successfully', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        backgroundImage: 'https://cloudinary.com/image.png',
      };

      const updatedTemplate = {
        ...mockTemplate,
        backgroundImage: null,
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      cloudinaryMock.extractPublicIdFromUrl.mockReturnValue('badge-bg/image');
      cloudinaryMock.deleteImageFromCloudinary.mockResolvedValue();
      prismaMock.badgeTemplate.update.mockResolvedValue(updatedTemplate as any);

      const result = await BadgeTemplateService.removeBackgroundImage('tmpl-1');

      expect(cloudinaryMock.extractPublicIdFromUrl).toHaveBeenCalledWith(mockTemplate.backgroundImage);
      expect(cloudinaryMock.deleteImageFromCloudinary).toHaveBeenCalledWith('badge-bg/image');
      expect(prismaMock.badgeTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: {
          backgroundImage: null,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.backgroundImage).toBeNull();
    });

    it('should handle template with no background image', async () => {
      const mockTemplate = {
        id: 'tmpl-1',
        backgroundImage: null,
      };

      prismaMock.badgeTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prismaMock.badgeTemplate.update.mockResolvedValue(mockTemplate as any);

      const result = await BadgeTemplateService.removeBackgroundImage('tmpl-1');

      expect(cloudinaryMock.deleteImageFromCloudinary).not.toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundError if template does not exist', async () => {
      prismaMock.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(
        BadgeTemplateService.removeBackgroundImage('nonexistent'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('ensureDefaultTemplates', () => {
    it('should create default templates if none exist', async () => {
      prismaMock.badgeTemplate.findFirst.mockResolvedValue(null);
      prismaMock.badgeTemplate.create.mockResolvedValue({} as any);

      await BadgeTemplateService.ensureDefaultTemplates();

      expect(prismaMock.badgeTemplate.create).toHaveBeenCalledTimes(2); // Standard and VIP
    });

    it('should skip creation if templates already exist', async () => {
      prismaMock.badgeTemplate.findFirst.mockResolvedValue({ id: 'existing' } as any);

      await BadgeTemplateService.ensureDefaultTemplates();

      expect(prismaMock.badgeTemplate.create).not.toHaveBeenCalled();
    });
  });
});
