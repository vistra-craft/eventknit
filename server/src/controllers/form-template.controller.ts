import type { Request, Response, NextFunction } from 'express';
import { FormPurpose } from '@prisma/client';
import FormTemplateService from '../services/form-template.service.js';
import type { FormQuestion } from '../types/form-question.types.js';

interface CreateTemplateBody {
  name: string;
  description?: string;
  purpose: FormPurpose;
  questions: FormQuestion[];
}

interface UpdateTemplateBody {
  name?: string;
  description?: string;
  purpose?: FormPurpose;
  questions?: FormQuestion[];
}

export const FormTemplateController = {
  // ── Built-in templates ────────────────────────────────────────

  listBuiltIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { purpose } = req.query;
      const templates = FormTemplateService.getBuiltInTemplates(purpose as FormPurpose | undefined);
      res.json({ success: true, templates });
    } catch (err) {
      next(err);
    }
  },

  // ── All templates (built-in + custom) ────────────────────────

  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { purpose } = req.query;
      const builtIn = FormTemplateService.getBuiltInTemplates(purpose as FormPurpose | undefined)
        .map((t) => ({ ...t, id: null, isBuiltIn: true }));

      const custom = await FormTemplateService.listCustomTemplates({
        purpose: purpose as FormPurpose | undefined,
      });

      res.json({ success: true, builtIn, custom });
    } catch (err) {
      next(err);
    }
  },

  // ── Custom templates CRUD ─────────────────────────────────────

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await FormTemplateService.getTemplateById(req.params.id as string);
      res.json({ success: true, template });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = req.user!.id;
      const { name, description, purpose, questions } = req.body as CreateTemplateBody;
      const template = await FormTemplateService.createTemplate(
        { name, description, purpose, questions },
        createdById,
      );
      res.status(201).json({ success: true, template });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, purpose, questions } = req.body as UpdateTemplateBody;
      const template = await FormTemplateService.updateTemplate(req.params.id as string, {
        name,
        description,
        purpose,
        questions,
      });
      res.json({ success: true, template });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await FormTemplateService.deleteTemplate(req.params.id as string);
      res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  },
};
