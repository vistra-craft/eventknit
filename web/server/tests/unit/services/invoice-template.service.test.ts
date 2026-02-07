import { InvoiceTemplateService } from '../../../src/services/invoice-template.service.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { NotFoundError } from '../../../src/utils/errors.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    invoiceTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock('../../../src/utils/logger.js');

describe('InvoiceTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      // Arrange
      const data = {
        name: 'Modern Template',
        description: 'A modern invoice template',
        type: 'PREMIUM',
        htmlContent: '<html>Invoice</html>',
        cssContent: 'body { margin: 0; }',
        variables: { companyName: 'EventKnit' },
        isDefault: false,
        createdBy: 'user-1',
      };

      const mockTemplate = {
        id: 'template-1',
        ...data,
        isActive: true,
      };

      (prisma.invoiceTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

      // Act
      const result = await InvoiceTemplateService.createTemplate(data);

      // Assert
      expect(prisma.invoiceTemplate.create).toHaveBeenCalledWith({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          htmlContent: data.htmlContent,
          cssContent: data.cssContent,
          variables: data.variables,
          isDefault: false,
          isActive: true,
          createdBy: data.createdBy,
        },
      });
      expect(result).toEqual(mockTemplate);
      expect(logger.info).toHaveBeenCalledWith('Invoice template created: template-1');
    });

    it('should unset other defaults when creating default template', async () => {
      // Arrange
      const data = {
        name: 'New Default',
        htmlContent: '<html>Invoice</html>',
        isDefault: true,
      };

      (prisma.invoiceTemplate.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.invoiceTemplate.create as jest.Mock).mockResolvedValue({ id: 'template-1', ...data });

      // Act
      await InvoiceTemplateService.createTemplate(data);

      // Assert
      expect(prisma.invoiceTemplate.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should use default values when not provided', async () => {
      // Arrange
      const data = {
        name: 'Simple Template',
        htmlContent: '<html>Invoice</html>',
      };

      (prisma.invoiceTemplate.create as jest.Mock).mockResolvedValue({ id: 'template-1' });

      // Act
      await InvoiceTemplateService.createTemplate(data);

      // Assert
      expect(prisma.invoiceTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'STANDARD',
          isDefault: false,
          isActive: true,
          variables: {},
        }),
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoiceTemplate.create as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceTemplateService.createTemplate({
        name: 'Test',
        htmlContent: '<html></html>',
      })).rejects.toThrow('Failed to create template: Database error');
    });
  });

  describe('getTemplates', () => {
    it('should return all active templates by default', async () => {
      // Arrange
      const mockTemplates = [
        { id: 'template-1', isActive: true, isDefault: true },
        { id: 'template-2', isActive: true, isDefault: false },
      ];

      (prisma.invoiceTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);

      // Act
      const result = await InvoiceTemplateService.getTemplates();

      // Assert
      expect(prisma.invoiceTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });
      expect(result).toEqual(mockTemplates);
    });

    it('should filter by type', async () => {
      // Arrange
      (prisma.invoiceTemplate.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await InvoiceTemplateService.getTemplates({ type: 'PREMIUM' });

      // Assert
      expect(prisma.invoiceTemplate.findMany).toHaveBeenCalledWith({
        where: { type: 'PREMIUM', isActive: true },
        orderBy: expect.any(Array),
      });
    });

    it('should filter by isActive', async () => {
      // Arrange
      (prisma.invoiceTemplate.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await InvoiceTemplateService.getTemplates({ isActive: false });

      // Assert
      expect(prisma.invoiceTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: false },
        orderBy: expect.any(Array),
      });
    });

    it('should include inactive when includeInactive is true', async () => {
      // Arrange
      (prisma.invoiceTemplate.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await InvoiceTemplateService.getTemplates({ includeInactive: true });

      // Assert
      expect(prisma.invoiceTemplate.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: expect.any(Array),
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoiceTemplate.findMany as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceTemplateService.getTemplates()).rejects.toThrow(
        'Failed to fetch templates: Database error',
      );
    });
  });

  describe('getTemplateById', () => {
    it('should return template by ID', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
      };

      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);

      // Act
      const result = await InvoiceTemplateService.getTemplateById('template-1');

      // Assert
      expect(prisma.invoiceTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundError if template does not exist', async () => {
      // Arrange
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceTemplateService.getTemplateById('nonexistent')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceTemplateService.getTemplateById('template-1')).rejects.toThrow(
        'Failed to fetch template: Database error',
      );
    });
  });

  describe('getDefaultTemplate', () => {
    it('should return default active template', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-1',
        isDefault: true,
        isActive: true,
      };

      (prisma.invoiceTemplate.findFirst as jest.Mock).mockResolvedValue(mockTemplate);

      // Act
      const result = await InvoiceTemplateService.getDefaultTemplate();

      // Assert
      expect(prisma.invoiceTemplate.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundError if no default template exists', async () => {
      // Arrange
      (prisma.invoiceTemplate.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceTemplateService.getDefaultTemplate()).rejects.toThrow(
        'No default invoice template found',
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoiceTemplate.findFirst as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceTemplateService.getDefaultTemplate()).rejects.toThrow(
        'Failed to fetch default template: Database error',
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Template',
        htmlContent: '<html>Updated</html>',
        isActive: false,
      };

      const existingTemplate = { id: 'template-1', name: 'Old Name' };
      const updatedTemplate = { ...existingTemplate, ...updateData };

      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue(existingTemplate);
      (prisma.invoiceTemplate.update as jest.Mock).mockResolvedValue(updatedTemplate);

      // Act
      const result = await InvoiceTemplateService.updateTemplate('template-1', updateData);

      // Assert
      expect(prisma.invoiceTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: {
          name: 'Updated Template',
          htmlContent: '<html>Updated</html>',
          isActive: false,
        },
      });
      expect(result).toEqual(updatedTemplate);
      expect(logger.info).toHaveBeenCalledWith('Invoice template updated: template-1');
    });

    it('should unset other defaults when setting as default', async () => {
      // Arrange
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue({ id: 'template-1' });
      (prisma.invoiceTemplate.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.invoiceTemplate.update as jest.Mock).mockResolvedValue({ id: 'template-1', isDefault: true });

      // Act
      await InvoiceTemplateService.updateTemplate('template-1', { isDefault: true });

      // Assert
      expect(prisma.invoiceTemplate.updateMany).toHaveBeenCalledWith({
        where: {
          isDefault: true,
          id: { not: 'template-1' },
        },
        data: { isDefault: false },
      });
    });

    it('should throw NotFoundError if template does not exist', async () => {
      // Arrange
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceTemplateService.updateTemplate('nonexistent', {
        name: 'Test',
      })).rejects.toThrow(NotFoundError);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue({ id: 'template-1' });
      (prisma.invoiceTemplate.update as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceTemplateService.updateTemplate('template-1', {
        name: 'Test',
      })).rejects.toThrow('Failed to update template: Database error');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-1',
        isDefault: false,
      };

      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.invoiceTemplate.delete as jest.Mock).mockResolvedValue(mockTemplate);

      // Act
      const result = await InvoiceTemplateService.deleteTemplate('template-1');

      // Assert
      expect(prisma.invoiceTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
      expect(result).toEqual({ success: true });
      expect(logger.info).toHaveBeenCalledWith('Invoice template deleted: template-1');
    });

    it('should throw ValidationError when trying to delete default template', async () => {
      // Arrange
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue({
        id: 'template-1',
        isDefault: true,
      });

      // Act & Assert
      await expect(InvoiceTemplateService.deleteTemplate('template-1')).rejects.toThrow(
        'Cannot delete default template. Set another template as default first.',
      );
      expect(prisma.invoiceTemplate.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if template does not exist', async () => {
      // Arrange
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceTemplateService.deleteTemplate('nonexistent')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoiceTemplate.findUnique as jest.Mock).mockResolvedValue({ id: 'template-1', isDefault: false });
      (prisma.invoiceTemplate.delete as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceTemplateService.deleteTemplate('template-1')).rejects.toThrow(
        'Failed to delete template: Database error',
      );
    });
  });
});
