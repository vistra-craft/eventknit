import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FormService } from '../src/services/form.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';
import {
  FormPurpose,
  FormStatus,
  FormResponseStatus,
  ParticipantType,
  ParticipantStatus,
  Prisma,
} from '@prisma/client';

vi.mock('../src/config/database', () => ({
  prisma: {
    eventForm: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    formResponse: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
    },
    eventParticipant: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../src/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const db = prisma as unknown as {
  eventForm: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  formResponse: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  event: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  eventParticipant: {
    create: ReturnType<typeof vi.fn>;
  };
};

const CREATOR_ID = 'user-1';
const SHARE_TOKEN = 'abc-token-123';

const makeForm = (overrides = {}) => ({
  id: 'form-1',
  eventId: 'event-1',
  event: { id: 'event-1', title: 'Tech Summit', slug: 'tech-summit' },
  createdById: CREATOR_ID,
  createdBy: { id: CREATOR_ID, firstName: 'Org', lastName: 'Admin', email: 'org@test.com' },
  title: 'Speaker Application',
  description: 'Apply to speak at our event',
  purpose: FormPurpose.SPEAKER_APPLICATION,
  customPurpose: null,
  targetParticipantType: ParticipantType.SPEAKER,
  status: FormStatus.DRAFT,
  questions: [],
  shareToken: SHARE_TOKEN,
  isPublic: false,
  allowMultipleResponses: false,
  maxResponses: null,
  closesAt: null,
  notifyOnSubmission: true,
  notificationEmail: null,
  _count: { responses: 0 },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

const makeResponse = (overrides = {}) => ({
  id: 'resp-1',
  formId: 'form-1',
  form: { id: 'form-1', title: 'Speaker Application', purpose: FormPurpose.SPEAKER_APPLICATION },
  respondentId: null,
  respondent: null,
  respondentEmail: 'speaker@example.com',
  respondentName: 'Alice Speaker',
  status: FormResponseStatus.SUBMITTED,
  answers: { q1: 'My bio' },
  reviewedById: null,
  reviewedBy: null,
  reviewedAt: null,
  reviewNotes: null,
  participant: null,
  submittedAt: new Date('2025-01-02'),
  updatedAt: new Date('2025-01-02'),
  ...overrides,
});

describe('FormService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // listForms
  // ─────────────────────────────────────────────────────────
  describe('listForms', () => {
    it('should return paginated forms', async () => {
      const mockForms = [makeForm(), makeForm({ id: 'form-2', title: 'Sponsor Form' })];
      db.eventForm.findMany.mockResolvedValue(mockForms);
      db.eventForm.count.mockResolvedValue(2);

      const result = await FormService.listForms({ page: 1, limit: 20 });

      expect(db.eventForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
      );
      expect(result).toEqual({ forms: mockForms, total: 2, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter by status', async () => {
      db.eventForm.findMany.mockResolvedValue([]);
      db.eventForm.count.mockResolvedValue(0);

      await FormService.listForms({ status: FormStatus.ACTIVE });

      expect(db.eventForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: FormStatus.ACTIVE }) }),
      );
    });

    it('should filter by purpose', async () => {
      db.eventForm.findMany.mockResolvedValue([]);
      db.eventForm.count.mockResolvedValue(0);

      await FormService.listForms({ purpose: FormPurpose.SPONSOR_APPLICATION });

      expect(db.eventForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ purpose: FormPurpose.SPONSOR_APPLICATION }) }),
      );
    });

    it('should filter by eventId', async () => {
      db.eventForm.findMany.mockResolvedValue([]);
      db.eventForm.count.mockResolvedValue(0);

      await FormService.listForms({ eventId: 'event-1' });

      expect(db.eventForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ eventId: 'event-1' }) }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      db.eventForm.findMany.mockResolvedValue([]);
      db.eventForm.count.mockResolvedValue(55);

      const result = await FormService.listForms({ page: 1, limit: 20 });

      expect(result.totalPages).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getFormById
  // ─────────────────────────────────────────────────────────
  describe('getFormById', () => {
    it('should return a form by ID', async () => {
      const mock = makeForm();
      db.eventForm.findUnique.mockResolvedValue(mock);

      const result = await FormService.getFormById('form-1');

      expect(db.eventForm.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'form-1' } }),
      );
      expect(result).toEqual(mock);
    });

    it('should throw NotFoundError when form does not exist', async () => {
      db.eventForm.findUnique.mockResolvedValue(null);

      await expect(FormService.getFormById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getFormByShareToken
  // ─────────────────────────────────────────────────────────
  describe('getFormByShareToken', () => {
    it('should return an active form by share token', async () => {
      const mock = makeForm({ status: FormStatus.ACTIVE, isPublic: true });
      db.eventForm.findUnique.mockResolvedValue(mock);

      const result = await FormService.getFormByShareToken(SHARE_TOKEN);

      expect(db.eventForm.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shareToken: SHARE_TOKEN } }),
      );
      expect(result).toEqual(mock);
    });

    it('should throw NotFoundError when token does not match any form', async () => {
      db.eventForm.findUnique.mockResolvedValue(null);

      await expect(FormService.getFormByShareToken('bad-token')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when form is not ACTIVE', async () => {
      db.eventForm.findUnique.mockResolvedValue(makeForm({ status: FormStatus.DRAFT }));

      await expect(FormService.getFormByShareToken(SHARE_TOKEN)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when form has closed', async () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      db.eventForm.findUnique.mockResolvedValue(
        makeForm({ status: FormStatus.ACTIVE, closesAt: past }),
      );

      await expect(FormService.getFormByShareToken(SHARE_TOKEN)).rejects.toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // createForm
  // ─────────────────────────────────────────────────────────
  describe('createForm', () => {
    it('should create a speaker application form linked to an event', async () => {
      db.event.findFirst.mockResolvedValue({ id: 'event-1' });
      const mock = makeForm();
      db.eventForm.create.mockResolvedValue(mock);

      const result = await FormService.createForm(
        {
          title: 'Speaker Application',
          eventId: 'event-1',
          purpose: FormPurpose.SPEAKER_APPLICATION,
          targetParticipantType: ParticipantType.SPEAKER,
        },
        CREATOR_ID,
      );

      expect(db.eventForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Speaker Application',
          eventId: 'event-1',
          purpose: FormPurpose.SPEAKER_APPLICATION,
          createdById: CREATOR_ID,
          status: FormStatus.DRAFT,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mock);
    });

    it('should create a standalone form (no event)', async () => {
      const mock = makeForm({ eventId: null, event: null });
      db.eventForm.create.mockResolvedValue(mock);

      await FormService.createForm({ title: 'General Inquiry', purpose: FormPurpose.GENERAL_INQUIRY }, CREATOR_ID);

      expect(db.event.findFirst).not.toHaveBeenCalled();
      expect(db.eventForm.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventId: undefined }) }),
      );
    });

    it('should throw ValidationError when CUSTOM purpose has no customPurpose', async () => {
      await expect(
        FormService.createForm({ title: 'X', purpose: FormPurpose.CUSTOM }, CREATOR_ID),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when linked event does not exist', async () => {
      db.event.findFirst.mockResolvedValue(null);

      await expect(
        FormService.createForm({ title: 'X', eventId: 'bad-event' }, CREATOR_ID),
      ).rejects.toThrow(NotFoundError);
    });

    it('should store theme when provided', async () => {
      const mock = makeForm({ theme: { accentColor: '#6366f1' } });
      db.eventForm.create.mockResolvedValue(mock);

      await FormService.createForm(
        { title: 'Branded Form', purpose: FormPurpose.GENERAL_INQUIRY, theme: { accentColor: '#6366f1' } },
        CREATOR_ID,
      );

      expect(db.eventForm.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ theme: { accentColor: '#6366f1' } }),
        }),
      );
    });

    it('should omit theme from create when not provided', async () => {
      const mock = makeForm();
      db.eventForm.create.mockResolvedValue(mock);

      await FormService.createForm({ title: 'Plain Form', purpose: FormPurpose.GENERAL_INQUIRY }, CREATOR_ID);

      const callData = db.eventForm.create.mock.calls[0][0].data as Record<string, unknown>;
      expect(callData.theme).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────
  // updateForm
  // ─────────────────────────────────────────────────────────
  describe('updateForm', () => {
    it('should update form title and status', async () => {
      const existing = makeForm();
      const updated = { ...existing, title: 'Updated Title', status: FormStatus.ACTIVE };
      db.eventForm.findUnique.mockResolvedValue(existing);
      db.eventForm.update.mockResolvedValue(updated);

      const result = await FormService.updateForm('form-1', { title: 'Updated Title', status: FormStatus.ACTIVE });

      expect(db.eventForm.update).toHaveBeenCalledWith({
        where: { id: 'form-1' },
        data: expect.objectContaining({ title: 'Updated Title', status: FormStatus.ACTIVE, updatedAt: expect.any(Date) }),
        include: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when form does not exist', async () => {
      db.eventForm.findUnique.mockResolvedValue(null);

      await expect(FormService.updateForm('nonexistent', { title: 'X' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when editing an archived form', async () => {
      db.eventForm.findUnique.mockResolvedValue(makeForm({ status: FormStatus.ARCHIVED }));

      await expect(FormService.updateForm('form-1', { title: 'X' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when CUSTOM purpose has empty customPurpose', async () => {
      db.eventForm.findUnique.mockResolvedValue(makeForm());

      await expect(
        FormService.updateForm('form-1', { purpose: FormPurpose.CUSTOM, customPurpose: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should persist a theme accentColor', async () => {
      const existing = makeForm();
      const updated = { ...existing, theme: { accentColor: '#1d4ed8' } };
      db.eventForm.findUnique.mockResolvedValue(existing);
      db.eventForm.update.mockResolvedValue(updated);

      const result = await FormService.updateForm('form-1', { theme: { accentColor: '#1d4ed8' } });

      expect(db.eventForm.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ theme: { accentColor: '#1d4ed8' } }),
        }),
      );
      expect(result).toEqual(updated);
    });

    it('should clear theme when null is passed', async () => {
      const existing = makeForm({ theme: { accentColor: '#1d4ed8' } });
      const updated = { ...existing, theme: null };
      db.eventForm.findUnique.mockResolvedValue(existing);
      db.eventForm.update.mockResolvedValue(updated);

      await FormService.updateForm('form-1', { theme: null });

      expect(db.eventForm.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ theme: Prisma.JsonNull }),
        }),
      );
    });

    it('should leave theme unchanged when theme is not in the update payload', async () => {
      const existing = makeForm({ theme: { accentColor: '#10b981' } });
      db.eventForm.findUnique.mockResolvedValue(existing);
      db.eventForm.update.mockResolvedValue({ ...existing, title: 'New Title' });

      await FormService.updateForm('form-1', { title: 'New Title' });

      const callData = db.eventForm.update.mock.calls[0][0].data as Record<string, unknown>;
      expect(callData.theme).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────
  // deleteForm
  // ─────────────────────────────────────────────────────────
  describe('deleteForm', () => {
    it('should delete a form', async () => {
      db.eventForm.findUnique.mockResolvedValue(makeForm());
      db.eventForm.delete.mockResolvedValue(undefined);

      await FormService.deleteForm('form-1');

      expect(db.eventForm.delete).toHaveBeenCalledWith({ where: { id: 'form-1' } });
    });

    it('should throw NotFoundError when form does not exist', async () => {
      db.eventForm.findUnique.mockResolvedValue(null);

      await expect(FormService.deleteForm('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─────────────────────────────────────────────────────────
  // listResponses
  // ─────────────────────────────────────────────────────────
  describe('listResponses', () => {
    it('should return paginated responses for a form', async () => {
      const mockResponses = [makeResponse(), makeResponse({ id: 'resp-2', respondentEmail: 'bob@example.com' })];
      db.formResponse.findMany.mockResolvedValue(mockResponses);
      db.formResponse.count.mockResolvedValue(2);

      const result = await FormService.listResponses('form-1', { page: 1, limit: 20 });

      expect(db.formResponse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { formId: 'form-1' }, skip: 0, take: 20 }),
      );
      expect(result).toEqual({ responses: mockResponses, total: 2, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter responses by status', async () => {
      db.formResponse.findMany.mockResolvedValue([]);
      db.formResponse.count.mockResolvedValue(0);

      await FormService.listResponses('form-1', { status: FormResponseStatus.APPROVED });

      expect(db.formResponse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: FormResponseStatus.APPROVED }) }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // submitResponse
  // ─────────────────────────────────────────────────────────
  describe('submitResponse', () => {
    it('should submit a response to an active form', async () => {
      db.eventForm.findUnique.mockResolvedValue(makeForm({ status: FormStatus.ACTIVE }));
      db.formResponse.count.mockResolvedValue(0);
      db.formResponse.findFirst.mockResolvedValue(null);
      const mock = makeResponse();
      db.formResponse.create.mockResolvedValue(mock);

      const result = await FormService.submitResponse(SHARE_TOKEN, {
        respondentEmail: 'speaker@example.com',
        respondentName: 'Alice Speaker',
        answers: { q1: 'My bio' },
      });

      expect(db.formResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formId: 'form-1',
          respondentEmail: 'speaker@example.com',
          respondentName: 'Alice Speaker',
          status: FormResponseStatus.SUBMITTED,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mock);
    });

    it('should throw ValidationError on duplicate email when allowMultipleResponses is false', async () => {
      db.eventForm.findUnique.mockResolvedValue(makeForm({ status: FormStatus.ACTIVE, allowMultipleResponses: false }));
      db.formResponse.count.mockResolvedValue(0);
      db.formResponse.findFirst.mockResolvedValue(makeResponse());

      await expect(
        FormService.submitResponse(SHARE_TOKEN, {
          respondentEmail: 'speaker@example.com',
          answers: {},
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when form has reached max responses', async () => {
      db.eventForm.findUnique.mockResolvedValue(
        makeForm({ status: FormStatus.ACTIVE, maxResponses: 5 }),
      );
      db.formResponse.count.mockResolvedValue(5);

      await expect(
        FormService.submitResponse(SHARE_TOKEN, { respondentEmail: 'new@example.com', answers: {} }),
      ).rejects.toThrow(ValidationError);
    });

    it('should allow duplicate email when allowMultipleResponses is true', async () => {
      db.eventForm.findUnique.mockResolvedValue(
        makeForm({ status: FormStatus.ACTIVE, allowMultipleResponses: true }),
      );
      db.formResponse.count.mockResolvedValue(0);
      const mock = makeResponse({ id: 'resp-2' });
      db.formResponse.create.mockResolvedValue(mock);

      const result = await FormService.submitResponse(SHARE_TOKEN, {
        respondentEmail: 'speaker@example.com',
        answers: {},
      });

      // Should NOT check for existing response
      expect(db.formResponse.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual(mock);
    });
  });

  // ─────────────────────────────────────────────────────────
  // reviewResponse
  // ─────────────────────────────────────────────────────────
  describe('reviewResponse', () => {
    it('should approve a response', async () => {
      const existing = makeResponse({ form: { ...makeForm(), targetParticipantType: null } });
      db.formResponse.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, status: FormResponseStatus.APPROVED, reviewedById: 'admin-1' };
      db.formResponse.update.mockResolvedValue(updated);

      const result = await FormService.reviewResponse('resp-1', FormResponseStatus.APPROVED, 'admin-1');

      expect(db.formResponse.update).toHaveBeenCalledWith({
        where: { id: 'resp-1' },
        data: expect.objectContaining({
          status: FormResponseStatus.APPROVED,
          reviewedById: 'admin-1',
          reviewedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });

    it('should reject a response with notes', async () => {
      db.formResponse.findUnique.mockResolvedValue(makeResponse({ form: makeForm() }));
      db.formResponse.update.mockResolvedValue(makeResponse({ status: FormResponseStatus.REJECTED }));

      await FormService.reviewResponse('resp-1', FormResponseStatus.REJECTED, 'admin-1', 'Does not meet requirements');

      expect(db.formResponse.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: FormResponseStatus.REJECTED,
            reviewNotes: 'Does not meet requirements',
          }),
        }),
      );
    });

    it('should auto-create participant when approving with createParticipant=true and targetParticipantType set', async () => {
      const existingResp = makeResponse({
        form: {
          ...makeForm(),
          targetParticipantType: ParticipantType.SPEAKER,
          eventId: 'event-1',
        },
        participant: null,
      });
      db.formResponse.findUnique.mockResolvedValue(existingResp);
      db.formResponse.update.mockResolvedValue({
        ...existingResp,
        status: FormResponseStatus.APPROVED,
      });
      db.eventParticipant.create.mockResolvedValue({});

      await FormService.reviewResponse('resp-1', FormResponseStatus.APPROVED, 'admin-1', undefined, true);

      expect(db.eventParticipant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'event-1',
          type: ParticipantType.SPEAKER,
          status: ParticipantStatus.APPROVED,
          email: 'speaker@example.com',
          formResponseId: 'resp-1',
          reviewedById: 'admin-1',
        }),
      });
    });

    it('should NOT create participant when createParticipant is false', async () => {
      db.formResponse.findUnique.mockResolvedValue(
        makeResponse({ form: { ...makeForm(), targetParticipantType: ParticipantType.SPEAKER, eventId: 'event-1' }, participant: null }),
      );
      db.formResponse.update.mockResolvedValue(makeResponse({ status: FormResponseStatus.APPROVED }));

      await FormService.reviewResponse('resp-1', FormResponseStatus.APPROVED, 'admin-1', undefined, false);

      expect(db.eventParticipant.create).not.toHaveBeenCalled();
    });

    it('should NOT create participant when participant already exists', async () => {
      db.formResponse.findUnique.mockResolvedValue(
        makeResponse({
          form: { ...makeForm(), targetParticipantType: ParticipantType.SPEAKER, eventId: 'event-1' },
          participant: { id: 'existing-p', type: ParticipantType.SPEAKER, status: ParticipantStatus.APPROVED },
        }),
      );
      db.formResponse.update.mockResolvedValue(makeResponse({ status: FormResponseStatus.APPROVED }));

      await FormService.reviewResponse('resp-1', FormResponseStatus.APPROVED, 'admin-1', undefined, true);

      expect(db.eventParticipant.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when response does not exist', async () => {
      db.formResponse.findUnique.mockResolvedValue(null);

      await expect(
        FormService.reviewResponse('nonexistent', FormResponseStatus.APPROVED, 'admin-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid review status (SUBMITTED)', async () => {
      db.formResponse.findUnique.mockResolvedValue(makeResponse({ form: makeForm() }));

      await expect(
        FormService.reviewResponse('resp-1', FormResponseStatus.SUBMITTED, 'admin-1'),
      ).rejects.toThrow(ValidationError);
    });
  });
});
