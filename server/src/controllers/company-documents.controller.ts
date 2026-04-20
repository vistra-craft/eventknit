import { Response, NextFunction } from 'express';
import { CompanyDocCategory, CompanyDocType } from '@prisma/client';
import { CompanyDocumentsService } from '../services/company-documents.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';

const LINK_TYPES = new Set<CompanyDocType>([
  CompanyDocType.GOOGLE_DOC,
  CompanyDocType.GOOGLE_SHEET,
  CompanyDocType.GOOGLE_SLIDES,
  CompanyDocType.EXTERNAL_LINK,
]);

export class CompanyDocumentsController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } });
        return;
      }

      const { category, type, search, page, limit } = req.query as Record<string, string>;

      const result = await CompanyDocumentsService.list({
        category: category as CompanyDocCategory | undefined,
        type: type as CompanyDocType | undefined,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } });
        return;
      }

      const id = req.params.id as string;
      if (!id) throw new ValidationError('Document ID is required');

      const document = await CompanyDocumentsService.getById(id);
      res.status(200).json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  static async createLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } });
        return;
      }

      const { name, description, category, type, externalUrl } = req.body as Record<string, string>;

      if (!name?.trim()) throw new ValidationError('name is required');
      if (!category || !Object.values(CompanyDocCategory).includes(category as CompanyDocCategory)) {
        throw new ValidationError(`category must be one of: ${Object.values(CompanyDocCategory).join(', ')}`);
      }
      if (!type || !LINK_TYPES.has(type as CompanyDocType)) {
        throw new ValidationError(`type must be one of: ${[...LINK_TYPES].join(', ')}`);
      }
      if (!externalUrl?.trim()) throw new ValidationError('externalUrl is required');

      const document = await CompanyDocumentsService.createLink(
        {
          name: name.trim(),
          description: description?.trim(),
          category: category as CompanyDocCategory,
          type: type as Exclude<CompanyDocType, 'FILE'>,
          externalUrl: externalUrl.trim(),
        },
        req.user.id,
      );

      res.status(201).json({ success: true, message: 'Document link saved', data: { document } });
    } catch (error) {
      next(error);
    }
  }

  static async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } });
        return;
      }

      if (!req.file) throw new ValidationError('A file is required');

      const { name, description, category } = req.body as Record<string, string>;

      if (!name?.trim()) throw new ValidationError('name is required');
      if (!category || !Object.values(CompanyDocCategory).includes(category as CompanyDocCategory)) {
        throw new ValidationError(`category must be one of: ${Object.values(CompanyDocCategory).join(', ')}`);
      }

      const document = await CompanyDocumentsService.uploadFile(
        {
          name: name.trim(),
          description: description?.trim(),
          category: category as CompanyDocCategory,
        },
        req.file,
        req.user.id,
      );

      res.status(201).json({ success: true, message: 'Document uploaded', data: { document } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } });
        return;
      }

      const id = req.params.id as string;
      if (!id) throw new ValidationError('Document ID is required');

      const { name, description, category, externalUrl } = req.body as Record<string, string>;

      if (category && !Object.values(CompanyDocCategory).includes(category as CompanyDocCategory)) {
        throw new ValidationError(`category must be one of: ${Object.values(CompanyDocCategory).join(', ')}`);
      }

      const document = await CompanyDocumentsService.update(id, {
        name: name?.trim(),
        description: description?.trim(),
        category: category as CompanyDocCategory | undefined,
        externalUrl: externalUrl?.trim(),
      });

      res.status(200).json({ success: true, message: 'Document updated', data: { document } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' } });
        return;
      }

      const id = req.params.id as string;
      if (!id) throw new ValidationError('Document ID is required');

      await CompanyDocumentsService.delete(id);
      res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (error) {
      next(error);
    }
  }
}
