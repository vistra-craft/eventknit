import { prisma } from '../config/database.js';
import { CompanyDocCategory, CompanyDocType } from '@prisma/client';
import {
  uploadBuffer,
  deleteImageFromCloudinary,
  extractPublicIdFromUrl,
} from './cloudinary.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateLinkDocumentData {
  name: string;
  description?: string;
  category: CompanyDocCategory;
  type: Exclude<CompanyDocType, 'FILE'>;
  externalUrl: string;
}

export interface UpdateDocumentData {
  name?: string;
  description?: string;
  category?: CompanyDocCategory;
  externalUrl?: string;
}

export interface ListDocumentsFilters {
  category?: CompanyDocCategory;
  type?: CompanyDocType;
  search?: string;
  page?: number;
  limit?: number;
}

const DOCUMENT_INCLUDE = {
  uploadedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const;

export class CompanyDocumentsService {
  static async list(filters: ListDocumentsFilters) {
    const { category, type, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.companyDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: DOCUMENT_INCLUDE,
      }),
      prisma.companyDocument.count({ where }),
    ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    const doc = await prisma.companyDocument.findUnique({
      where: { id },
      include: DOCUMENT_INCLUDE,
    });

    if (!doc) throw new NotFoundError('Document not found');
    return doc;
  }

  static async createLink(data: CreateLinkDocumentData, uploadedById: string) {
    const doc = await prisma.companyDocument.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        externalUrl: data.externalUrl,
        uploadedById,
      },
      include: DOCUMENT_INCLUDE,
    });

    logger.info(`Company document (link) created: ${doc.id} by ${uploadedById}`);
    return doc;
  }

  static async uploadFile(
    meta: { name: string; description?: string; category: CompanyDocCategory },
    file: { buffer: Buffer; originalname: string; size: number; mimetype: string },
    uploadedById: string,
  ) {
    const isImage = file.mimetype.startsWith('image/');
    const resourceType = isImage ? ('image' as const) : ('raw' as const);

    const uploadResult = await uploadBuffer(file.buffer, {
      folder: 'eventknit/company-documents',
      resource_type: resourceType,
    });

    const doc = await prisma.companyDocument.create({
      data: {
        name: meta.name,
        description: meta.description,
        category: meta.category,
        type: CompanyDocType.FILE,
        fileUrl: uploadResult.secureUrl,
        cloudinaryPublicId: uploadResult.publicId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById,
      },
      include: DOCUMENT_INCLUDE,
    });

    logger.info(`Company document (file) uploaded: ${doc.id} by ${uploadedById}`);
    return doc;
  }

  static async update(id: string, data: UpdateDocumentData) {
    const existing = await prisma.companyDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Document not found');

    if (data.externalUrl !== undefined && existing.type === CompanyDocType.FILE) {
      throw new ValidationError('Cannot set an external URL on an uploaded file document');
    }

    const doc = await prisma.companyDocument.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.externalUrl !== undefined && { externalUrl: data.externalUrl }),
        updatedAt: new Date(),
      },
      include: DOCUMENT_INCLUDE,
    });

    logger.info(`Company document updated: ${id}`);
    return doc;
  }

  static async delete(id: string) {
    const existing = await prisma.companyDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Document not found');

    if (existing.cloudinaryPublicId) {
      try {
        await deleteImageFromCloudinary(existing.cloudinaryPublicId);
      } catch (err) {
        logger.warn(`Could not delete Cloudinary asset ${existing.cloudinaryPublicId}: ${err}`);
      }
    } else if (existing.fileUrl) {
      const publicId = extractPublicIdFromUrl(existing.fileUrl);
      if (publicId) {
        try {
          await deleteImageFromCloudinary(publicId);
        } catch (err) {
          logger.warn(`Could not delete Cloudinary asset from URL: ${err}`);
        }
      }
    }

    await prisma.companyDocument.delete({ where: { id } });
    logger.info(`Company document deleted: ${id}`);
  }
}
