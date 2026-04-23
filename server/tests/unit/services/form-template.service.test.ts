import { PrismaClient, FormPurpose } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import FormTemplateService from '../../../src/services/form-template.service.js';
import { ValidationError, NotFoundError } from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';
import type { FormQuestion } from '../../../src/types/form-question.types.js';

vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('FormTemplateService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = databaseModule.prisma as unknown as DeepMockProxy<PrismaClient>;
    mockReset(prisma);
    vi.clearAllMocks();
  });

  const CREATOR_ID = 'user-abc';

  const makeCustomTemplate = (overrides = {}) => ({
    id: 'tmpl-1',
    name: 'My Speaker Form',
    description: 'Custom speaker application',
    purpose: FormPurpose.SPEAKER_APPLICATION,
    questions: [{ id: 'q1', order: 1, type: 'short_text', label: 'Bio', required: true }],
    isBuiltIn: false,
    createdById: CREATOR_ID,
    createdBy: { id: CREATOR_ID, firstName: 'Alice', lastName: 'Admin' },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  });

  const ONE_QUESTION: FormQuestion[] = [{ id: 'q1', order: 1, type: 'short_text', label: 'Bio', required: true }];

  // =========================================================================
  // getBuiltInTemplates
  // =========================================================================

  describe('getBuiltInTemplates', () => {
    it('returns all built-in templates when no purpose is given', () => {
      const results = FormTemplateService.getBuiltInTemplates();
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.questions.length > 0)).toBe(true);
    });

    it('filters built-in templates by purpose', () => {
      const results = FormTemplateService.getBuiltInTemplates(FormPurpose.REGISTRATION);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.purpose === FormPurpose.REGISTRATION)).toBe(true);
    });

    it('returns empty array for a purpose with no built-in templates', () => {
      const results = FormTemplateService.getBuiltInTemplates(FormPurpose.GENERAL_INQUIRY);
      expect(results).toEqual([]);
    });

    it.each([
      FormPurpose.PERFORMER_APPLICATION,
      FormPurpose.VENDOR_APPLICATION,
      FormPurpose.JUDGE_APPLICATION,
      FormPurpose.MEDIA_APPLICATION,
    ] as const)('has at least one built-in template for %s', (purpose) => {
      const results = FormTemplateService.getBuiltInTemplates(purpose);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].questions.length).toBeGreaterThan(0);
    });

    it('does not include SPONSORSHIP_APPLICATION (removed duplicate)', () => {
      const allPurposes = FormTemplateService.getBuiltInTemplates().map(t => t.purpose);
      expect(allPurposes).not.toContain('SPONSORSHIP_APPLICATION');
    });

    it('each built-in template has a non-empty name and description', () => {
      const results = FormTemplateService.getBuiltInTemplates();
      for (const t of results) {
        expect(t.name.trim().length).toBeGreaterThan(0);
        expect(t.description.trim().length).toBeGreaterThan(0);
      }
    });

    it('each built-in template question has a unique id within its template', () => {
      const results = FormTemplateService.getBuiltInTemplates();
      for (const t of results) {
        const ids = t.questions.map(q => q.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
      }
    });

    it('PERFORMER_APPLICATION template asks for performance category and technical requirements', () => {
      const [template] = FormTemplateService.getBuiltInTemplates(FormPurpose.PERFORMER_APPLICATION);
      const labels = template.questions.map(q => q.label.toLowerCase());
      expect(labels.some(l => l.includes('performance category') || l.includes('category'))).toBe(true);
      expect(labels.some(l => l.includes('technical') || l.includes('requirement'))).toBe(true);
    });

    it('VENDOR_APPLICATION template asks for vendor category and stall size', () => {
      const [template] = FormTemplateService.getBuiltInTemplates(FormPurpose.VENDOR_APPLICATION);
      const labels = template.questions.map(q => q.label.toLowerCase());
      expect(labels.some(l => l.includes('vendor category') || l.includes('category'))).toBe(true);
      expect(labels.some(l => l.includes('stall size') || l.includes('size'))).toBe(true);
    });

    it('JUDGE_APPLICATION template includes conflict-of-interest question', () => {
      const [template] = FormTemplateService.getBuiltInTemplates(FormPurpose.JUDGE_APPLICATION);
      const labels = template.questions.map(q => q.label.toLowerCase());
      expect(labels.some(l => l.includes('conflict'))).toBe(true);
    });

    it('MEDIA_APPLICATION template asks for media type and intended coverage', () => {
      const [template] = FormTemplateService.getBuiltInTemplates(FormPurpose.MEDIA_APPLICATION);
      const labels = template.questions.map(q => q.label.toLowerCase());
      expect(labels.some(l => l.includes('media type') || l.includes('type'))).toBe(true);
      expect(labels.some(l => l.includes('coverage') || l.includes('intended'))).toBe(true);
    });

    it('SPONSOR_APPLICATION template asks for sponsorship tier and branding benefits', () => {
      const [template] = FormTemplateService.getBuiltInTemplates(FormPurpose.SPONSOR_APPLICATION);
      const labels = template.questions.map(q => q.label.toLowerCase());
      expect(labels.some(l => l.includes('tier') || l.includes('sponsorship tier'))).toBe(true);
      expect(labels.some(l => l.includes('benefit') || l.includes('branding'))).toBe(true);
    });

    it('SPEAKER_APPLICATION and EXHIBITOR_APPLICATION templates include a profile photo / logo upload field', () => {
      for (const purpose of [FormPurpose.SPEAKER_APPLICATION, FormPurpose.EXHIBITOR_APPLICATION]) {
        const [template] = FormTemplateService.getBuiltInTemplates(purpose);
        const hasUpload = template.questions.some(q => q.type === 'file_upload');
        expect(hasUpload).toBe(true);
      }
    });

    it('all application templates require name and email', () => {
      const newPurposes = [
        FormPurpose.SPONSOR_APPLICATION,
        FormPurpose.PERFORMER_APPLICATION,
        FormPurpose.VENDOR_APPLICATION,
        FormPurpose.JUDGE_APPLICATION,
        FormPurpose.MEDIA_APPLICATION,
      ];
      for (const purpose of newPurposes) {
        const [template] = FormTemplateService.getBuiltInTemplates(purpose);
        const requiredLabels = template.questions
          .filter(q => q.required)
          .map(q => q.label.toLowerCase());
        expect(requiredLabels.some(l => l.includes('name'))).toBe(true);
        expect(requiredLabels.some(l => l.includes('email'))).toBe(true);
      }
    });
  });

  // =========================================================================
  // listCustomTemplates
  // =========================================================================

  describe('listCustomTemplates', () => {
    it('returns all custom templates', async () => {
      const mocks = [makeCustomTemplate(), makeCustomTemplate({ id: 'tmpl-2', name: 'Other Form' })];
      prisma.formTemplate.findMany.mockResolvedValue(mocks as never);

      const results = await FormTemplateService.listCustomTemplates();

      expect(prisma.formTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isBuiltIn: false } }),
      );
      expect(results).toEqual(mocks);
    });

    it('filters by purpose when provided', async () => {
      prisma.formTemplate.findMany.mockResolvedValue([]);

      await FormTemplateService.listCustomTemplates({ purpose: FormPurpose.FEEDBACK });

      expect(prisma.formTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isBuiltIn: false, purpose: FormPurpose.FEEDBACK },
        }),
      );
    });
  });

  // =========================================================================
  // getTemplateById
  // =========================================================================

  describe('getTemplateById', () => {
    it('returns a template by ID', async () => {
      const mock = makeCustomTemplate();
      prisma.formTemplate.findUnique.mockResolvedValue(mock as never);

      const result = await FormTemplateService.getTemplateById('tmpl-1');

      expect(prisma.formTemplate.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tmpl-1' } }),
      );
      expect(result).toEqual(mock);
    });

    it('throws NotFoundError when template does not exist', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(null);

      await expect(FormTemplateService.getTemplateById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // =========================================================================
  // createTemplate
  // =========================================================================

  describe('createTemplate', () => {
    it('creates a template with valid data', async () => {
      const mock = makeCustomTemplate();
      prisma.formTemplate.create.mockResolvedValue(mock as never);

      const result = await FormTemplateService.createTemplate(
        { name: 'My Speaker Form', purpose: FormPurpose.SPEAKER_APPLICATION, questions: ONE_QUESTION },
        CREATOR_ID,
      );

      expect(prisma.formTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'My Speaker Form',
            purpose: FormPurpose.SPEAKER_APPLICATION,
            isBuiltIn: false,
            createdById: CREATOR_ID,
          }),
        }),
      );
      expect(result).toEqual(mock);
    });

    it('trims whitespace from name', async () => {
      prisma.formTemplate.create.mockResolvedValue(makeCustomTemplate() as never);

      await FormTemplateService.createTemplate(
        { name: '  Padded Name  ', purpose: FormPurpose.FEEDBACK, questions: ONE_QUESTION },
        CREATOR_ID,
      );

      expect(prisma.formTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Padded Name' }),
        }),
      );
    });

    it('throws ValidationError when name is empty', async () => {
      await expect(
        FormTemplateService.createTemplate(
          { name: '', purpose: FormPurpose.FEEDBACK, questions: ONE_QUESTION },
          CREATOR_ID,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when name is whitespace only', async () => {
      await expect(
        FormTemplateService.createTemplate(
          { name: '   ', purpose: FormPurpose.FEEDBACK, questions: ONE_QUESTION },
          CREATOR_ID,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when questions array is empty', async () => {
      await expect(
        FormTemplateService.createTemplate(
          { name: 'Valid Name', purpose: FormPurpose.FEEDBACK, questions: [] },
          CREATOR_ID,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('stores optional description', async () => {
      prisma.formTemplate.create.mockResolvedValue(makeCustomTemplate({ description: 'Desc' }) as never);

      await FormTemplateService.createTemplate(
        { name: 'Form', purpose: FormPurpose.GENERAL_INQUIRY, questions: ONE_QUESTION, description: 'Desc' },
        CREATOR_ID,
      );

      expect(prisma.formTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: 'Desc' }),
        }),
      );
    });
  });

  // =========================================================================
  // updateTemplate
  // =========================================================================

  describe('updateTemplate', () => {
    it('updates template name', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(makeCustomTemplate() as never);
      const updated = makeCustomTemplate({ name: 'Renamed' });
      prisma.formTemplate.update.mockResolvedValue(updated as never);

      const result = await FormTemplateService.updateTemplate('tmpl-1', { name: 'Renamed' });

      expect(prisma.formTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tmpl-1' },
          data: expect.objectContaining({ name: 'Renamed' }),
        }),
      );
      expect(result).toEqual(updated);
    });

    it('updates questions', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(makeCustomTemplate() as never);
      prisma.formTemplate.update.mockResolvedValue(makeCustomTemplate() as never);

      await FormTemplateService.updateTemplate('tmpl-1', { questions: ONE_QUESTION });

      expect(prisma.formTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ questions: ONE_QUESTION }),
        }),
      );
    });

    it('throws NotFoundError when template does not exist', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(null);

      await expect(FormTemplateService.updateTemplate('nonexistent', { name: 'X' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('does not include undefined fields in the update', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(makeCustomTemplate() as never);
      prisma.formTemplate.update.mockResolvedValue(makeCustomTemplate() as never);

      await FormTemplateService.updateTemplate('tmpl-1', { name: 'New Name' });

      const callData = prisma.formTemplate.update.mock.calls[0][0].data as Record<string, unknown>;
      expect('purpose' in callData).toBe(false);
      expect('questions' in callData).toBe(false);
    });
  });

  // =========================================================================
  // deleteTemplate
  // =========================================================================

  describe('deleteTemplate', () => {
    it('deletes a custom template', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(makeCustomTemplate() as never);
      prisma.formTemplate.delete.mockResolvedValue(makeCustomTemplate() as never);

      await FormTemplateService.deleteTemplate('tmpl-1');

      expect(prisma.formTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tmpl-1' } });
    });

    it('throws NotFoundError when template does not exist', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(null);

      await expect(FormTemplateService.deleteTemplate('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when attempting to delete a built-in template', async () => {
      prisma.formTemplate.findUnique.mockResolvedValue(makeCustomTemplate({ isBuiltIn: true }) as never);

      await expect(FormTemplateService.deleteTemplate('tmpl-1')).rejects.toThrow(ValidationError);
      expect(prisma.formTemplate.delete).not.toHaveBeenCalled();
    });
  });
});
