import { Prisma, FormPurpose } from '@prisma/client';
import { prisma } from '../config/database.js';
import { BUILT_IN_TEMPLATES, type BuiltInTemplate } from '../config/form-templates.config.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { FormQuestion } from '../types/form-question.types.js';

// Single typed boundary helper -- FormQuestion[] is a serialisable array stored as JSON.
function toJson(value: object[]): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  purpose: FormPurpose;
  questions: FormQuestion[];
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  purpose?: FormPurpose;
  questions?: FormQuestion[];
}

export interface ListTemplatesOptions {
  purpose?: FormPurpose;
  includeBuiltIn?: boolean;
}

const FormTemplateService = {
  // ── Built-in templates (no DB) ────────────────────────────────

  getBuiltInTemplates(purpose?: FormPurpose): BuiltInTemplate[] {
    if (purpose) {
      return BUILT_IN_TEMPLATES.filter((t) => t.purpose === purpose);
    }
    return BUILT_IN_TEMPLATES;
  },

  // ── Custom (admin-saved) templates ────────────────────────────

  async listCustomTemplates(options: ListTemplatesOptions = {}) {
    const where: Record<string, unknown> = { isBuiltIn: false };
    if (options.purpose) where.purpose = options.purpose;

    const templates = await prisma.formTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    return templates;
  },

  async getTemplateById(id: string) {
    const template = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (!template) throw new NotFoundError('Form template not found');
    return template;
  },

  async createTemplate(data: CreateTemplateData, createdById: string) {
    if (!data.name?.trim()) throw new ValidationError('Template name is required');
    if (!data.questions || data.questions.length === 0) {
      throw new ValidationError('A template must have at least one question');
    }

    return prisma.formTemplate.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() ?? null,
        purpose: data.purpose,
        questions: toJson(data.questions),
        isBuiltIn: false,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  },

  async updateTemplate(id: string, data: UpdateTemplateData) {
    await FormTemplateService.getTemplateById(id);
    return prisma.formTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.purpose !== undefined && { purpose: data.purpose }),
        ...(data.questions !== undefined && { questions: toJson(data.questions) }),
      },
    });
  },

  async deleteTemplate(id: string) {
    const template = await prisma.formTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundError('Form template not found');
    if (template.isBuiltIn) throw new ValidationError('Built-in templates cannot be deleted');
    await prisma.formTemplate.delete({ where: { id } });
  },
};

export default FormTemplateService;
