import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CompanyDocumentsService } from '../src/services/company-documents.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';
import * as cloudinaryService from '../src/services/cloudinary.service';
import { CompanyDocCategory, CompanyDocType } from '@prisma/client';

// Mock database
vi.mock('../src/config/database', () => ({
  prisma: {
    companyDocument: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock cloudinary service
vi.mock('../src/services/cloudinary.service', () => ({
  uploadBuffer: vi.fn(),
  deleteImageFromCloudinary: vi.fn(),
  extractPublicIdFromUrl: vi.fn(),
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  companyDocument: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

const cloudinaryMock = cloudinaryService as unknown as { [K in keyof typeof cloudinaryService]: ReturnType<typeof vi.fn> };

const UPLOADER = { id: 'user-1', firstName: 'Admin', lastName: 'User', email: 'admin@test.com' };

const makeDoc = (overrides = {}) => ({
  id: 'doc-1',
  name: 'Test Policy',
  description: 'A test policy document',
  category: CompanyDocCategory.POLICIES,
  type: CompanyDocType.FILE,
  fileUrl: 'https://res.cloudinary.com/test/raw/upload/v1/eventknit/company-documents/file.pdf',
  cloudinaryPublicId: 'eventknit/company-documents/file',
  externalUrl: null,
  fileName: 'policy.pdf',
  fileSize: 102400,
  mimeType: 'application/pdf',
  uploadedById: 'user-1',
  uploadedBy: UPLOADER,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

describe('CompanyDocumentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // list
  // ─────────────────────────────────────────────────────────
  describe('list', () => {
    it('should return paginated documents', async () => {
      const mockDocs = [makeDoc(), makeDoc({ id: 'doc-2', name: 'HR Guide' })];
      prismaMock.companyDocument.findMany.mockResolvedValue(mockDocs);
      prismaMock.companyDocument.count.mockResolvedValue(2);

      const result = await CompanyDocumentsService.list({ page: 1, limit: 20 });

      expect(prismaMock.companyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
      );
      expect(result).toEqual({
        documents: mockDocs,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by category', async () => {
      prismaMock.companyDocument.findMany.mockResolvedValue([]);
      prismaMock.companyDocument.count.mockResolvedValue(0);

      await CompanyDocumentsService.list({ category: CompanyDocCategory.LEGAL });

      expect(prismaMock.companyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: CompanyDocCategory.LEGAL }) }),
      );
    });

    it('should filter by type', async () => {
      prismaMock.companyDocument.findMany.mockResolvedValue([]);
      prismaMock.companyDocument.count.mockResolvedValue(0);

      await CompanyDocumentsService.list({ type: CompanyDocType.GOOGLE_DOC });

      expect(prismaMock.companyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: CompanyDocType.GOOGLE_DOC }) }),
      );
    });

    it('should search by name or description', async () => {
      prismaMock.companyDocument.findMany.mockResolvedValue([]);
      prismaMock.companyDocument.count.mockResolvedValue(0);

      await CompanyDocumentsService.list({ search: 'policy' });

      expect(prismaMock.companyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'policy', mode: 'insensitive' } },
              { description: { contains: 'policy', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prismaMock.companyDocument.findMany.mockResolvedValue([]);
      prismaMock.companyDocument.count.mockResolvedValue(45);

      const result = await CompanyDocumentsService.list({ page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getById
  // ─────────────────────────────────────────────────────────
  describe('getById', () => {
    it('should return a document by ID', async () => {
      const mockDoc = makeDoc();
      prismaMock.companyDocument.findUnique.mockResolvedValue(mockDoc);

      const result = await CompanyDocumentsService.getById('doc-1');

      expect(prismaMock.companyDocument.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'doc-1' } }),
      );
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundError when document does not exist', async () => {
      prismaMock.companyDocument.findUnique.mockResolvedValue(null);

      await expect(CompanyDocumentsService.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // createLink
  // ─────────────────────────────────────────────────────────
  describe('createLink', () => {
    it('should create a Google Doc link document', async () => {
      const mockDoc = makeDoc({
        type: CompanyDocType.GOOGLE_DOC,
        externalUrl: 'https://docs.google.com/document/d/abc',
        fileUrl: null,
        cloudinaryPublicId: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      });
      prismaMock.companyDocument.create.mockResolvedValue(mockDoc);

      const result = await CompanyDocumentsService.createLink(
        {
          name: 'Test Policy',
          description: 'A test policy document',
          category: CompanyDocCategory.POLICIES,
          type: CompanyDocType.GOOGLE_DOC,
          externalUrl: 'https://docs.google.com/document/d/abc',
        },
        'user-1',
      );

      expect(prismaMock.companyDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Policy',
          category: CompanyDocCategory.POLICIES,
          type: CompanyDocType.GOOGLE_DOC,
          externalUrl: 'https://docs.google.com/document/d/abc',
          uploadedById: 'user-1',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockDoc);
    });

    it('should create an external link document', async () => {
      const mockDoc = makeDoc({ type: CompanyDocType.EXTERNAL_LINK, externalUrl: 'https://example.com' });
      prismaMock.companyDocument.create.mockResolvedValue(mockDoc);

      await CompanyDocumentsService.createLink(
        {
          name: 'External Reference',
          category: CompanyDocCategory.OTHER,
          type: CompanyDocType.EXTERNAL_LINK,
          externalUrl: 'https://example.com',
        },
        'user-1',
      );

      expect(prismaMock.companyDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: CompanyDocType.EXTERNAL_LINK }) }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // uploadFile
  // ─────────────────────────────────────────────────────────
  describe('uploadFile', () => {
    const mockFile = {
      buffer: Buffer.from('pdf content'),
      originalname: 'policy.pdf',
      size: 102400,
      mimetype: 'application/pdf',
    };

    it('should upload a PDF and create a document record', async () => {
      const uploadResult = {
        url: 'http://res.cloudinary.com/test/raw/upload/v1/file.pdf',
        secureUrl: 'https://res.cloudinary.com/test/raw/upload/v1/file.pdf',
        publicId: 'eventknit/company-documents/file',
      };
      cloudinaryMock.uploadBuffer.mockResolvedValue(uploadResult);

      const mockDoc = makeDoc();
      prismaMock.companyDocument.create.mockResolvedValue(mockDoc);

      const result = await CompanyDocumentsService.uploadFile(
        { name: 'Test Policy', description: 'A test policy document', category: CompanyDocCategory.POLICIES },
        mockFile,
        'user-1',
      );

      expect(cloudinaryMock.uploadBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.objectContaining({ folder: 'eventknit/company-documents', resource_type: 'raw' }),
      );
      expect(prismaMock.companyDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: CompanyDocType.FILE,
          fileUrl: uploadResult.secureUrl,
          cloudinaryPublicId: uploadResult.publicId,
          fileName: 'policy.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          uploadedById: 'user-1',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockDoc);
    });

    it('should use image resource_type for image files', async () => {
      cloudinaryMock.uploadBuffer.mockResolvedValue({
        url: 'http://res.cloudinary.com/test/image.png',
        secureUrl: 'https://res.cloudinary.com/test/image.png',
        publicId: 'eventknit/company-documents/image',
      });
      prismaMock.companyDocument.create.mockResolvedValue(makeDoc({ mimeType: 'image/png' }));

      await CompanyDocumentsService.uploadFile(
        { name: 'Logo', category: CompanyDocCategory.MARKETING },
        { ...mockFile, mimetype: 'image/png', originalname: 'logo.png' },
        'user-1',
      );

      expect(cloudinaryMock.uploadBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ resource_type: 'image' }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update document metadata', async () => {
      const existing = makeDoc();
      const updated = { ...existing, name: 'Updated Name', category: CompanyDocCategory.LEGAL };

      prismaMock.companyDocument.findUnique.mockResolvedValue(existing);
      prismaMock.companyDocument.update.mockResolvedValue(updated);

      const result = await CompanyDocumentsService.update('doc-1', {
        name: 'Updated Name',
        category: CompanyDocCategory.LEGAL,
      });

      expect(prismaMock.companyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({ name: 'Updated Name', category: CompanyDocCategory.LEGAL, updatedAt: expect.any(Date) }),
        include: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when document does not exist', async () => {
      prismaMock.companyDocument.findUnique.mockResolvedValue(null);

      await expect(CompanyDocumentsService.update('nonexistent', { name: 'New Name' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when setting externalUrl on a FILE document', async () => {
      prismaMock.companyDocument.findUnique.mockResolvedValue(makeDoc({ type: CompanyDocType.FILE }));

      await expect(
        CompanyDocumentsService.update('doc-1', { externalUrl: 'https://example.com' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // delete
  // ─────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete a document and remove its Cloudinary asset', async () => {
      const existing = makeDoc();
      prismaMock.companyDocument.findUnique.mockResolvedValue(existing);
      cloudinaryMock.deleteImageFromCloudinary.mockResolvedValue(undefined);
      prismaMock.companyDocument.delete.mockResolvedValue(existing);

      await CompanyDocumentsService.delete('doc-1');

      expect(cloudinaryMock.deleteImageFromCloudinary).toHaveBeenCalledWith(existing.cloudinaryPublicId);
      expect(prismaMock.companyDocument.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    });

    it('should delete a link document without touching Cloudinary', async () => {
      const linkDoc = makeDoc({
        type: CompanyDocType.GOOGLE_DOC,
        fileUrl: null,
        cloudinaryPublicId: null,
        externalUrl: 'https://docs.google.com/document/d/abc',
      });
      prismaMock.companyDocument.findUnique.mockResolvedValue(linkDoc);
      prismaMock.companyDocument.delete.mockResolvedValue(linkDoc);

      await CompanyDocumentsService.delete('doc-1');

      expect(cloudinaryMock.deleteImageFromCloudinary).not.toHaveBeenCalled();
      expect(prismaMock.companyDocument.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    });

    it('should still delete DB record even when Cloudinary deletion fails', async () => {
      const existing = makeDoc();
      prismaMock.companyDocument.findUnique.mockResolvedValue(existing);
      cloudinaryMock.deleteImageFromCloudinary.mockRejectedValue(new Error('Cloudinary error'));
      prismaMock.companyDocument.delete.mockResolvedValue(existing);

      await CompanyDocumentsService.delete('doc-1');

      expect(prismaMock.companyDocument.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    });

    it('should throw NotFoundError when document does not exist', async () => {
      prismaMock.companyDocument.findUnique.mockResolvedValue(null);

      await expect(CompanyDocumentsService.delete('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
