import {
  FormPurpose,
  FormStatus,
  FormResponseStatus,
  ParticipantStatus,
  ParticipantType,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { FormQuestion, FormAnswers } from '../types/form-question.types.js';

export interface ListFormsOptions {
  page?: number;
  limit?: number;
  status?: FormStatus;
  purpose?: FormPurpose;
  eventId?: string;
}

export interface CreateFormData {
  title: string;
  description?: string;
  eventId?: string;
  purpose?: FormPurpose;
  customPurpose?: string;
  targetParticipantType?: ParticipantType;
  questions?: FormQuestion[];
  isPublic?: boolean;
  allowMultipleResponses?: boolean;
  maxResponses?: number;
  closesAt?: Date;
  notifyOnSubmission?: boolean;
  notificationEmail?: string;
}

export interface UpdateFormData {
  title?: string;
  description?: string;
  purpose?: FormPurpose;
  customPurpose?: string;
  targetParticipantType?: ParticipantType;
  questions?: FormQuestion[];
  status?: FormStatus;
  isPublic?: boolean;
  allowMultipleResponses?: boolean;
  maxResponses?: number;
  closesAt?: Date | null;
  notifyOnSubmission?: boolean;
  notificationEmail?: string;
}

export interface SubmitFormData {
  respondentEmail: string;
  respondentName?: string;
  answers: FormAnswers;
  respondentId?: string;
}

const FORM_INCLUDE = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  event: {
    select: { id: true, title: true, slug: true },
  },
  _count: { select: { responses: true } },
} satisfies Prisma.EventFormInclude;

const RESPONSE_INCLUDE = {
  form: { select: { id: true, title: true, purpose: true } },
  respondent: { select: { id: true, firstName: true, lastName: true, email: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  participant: { select: { id: true, type: true, status: true } },
} satisfies Prisma.FormResponseInclude;

export const FormService = {
  // ─── Forms ───────────────────────────────────────────────────────────────

  async listForms(opts: ListFormsOptions = {}) {
    const { page = 1, limit = 20, status, purpose, eventId } = opts;
    const skip = (page - 1) * limit;

    const where: Prisma.EventFormWhereInput = {};
    if (status) where.status = status;
    if (purpose) where.purpose = purpose;
    if (eventId) where.eventId = eventId;

    const [forms, total] = await Promise.all([
      prisma.eventForm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: FORM_INCLUDE,
      }),
      prisma.eventForm.count({ where }),
    ]);

    return { forms, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getFormById(formId: string) {
    const form = await prisma.eventForm.findUnique({
      where: { id: formId },
      include: FORM_INCLUDE,
    });
    if (!form) throw new NotFoundError('Form not found');
    return form;
  },

  async getFormByShareToken(shareToken: string) {
    const form = await prisma.eventForm.findUnique({
      where: { shareToken },
      include: {
        event: { select: { id: true, title: true, slug: true, image: true } },
      },
    });
    if (!form) throw new NotFoundError('Form not found');
    if (form.status !== FormStatus.ACTIVE) {
      throw new ValidationError('This form is not currently accepting responses');
    }
    if (form.closesAt && form.closesAt < new Date()) {
      throw new ValidationError('This form has closed');
    }
    return form;
  },

  async createForm(data: CreateFormData, createdById: string) {
    if (data.eventId) {
      const event = await prisma.event.findFirst({ where: { id: data.eventId, deletedAt: null } });
      if (!event) throw new NotFoundError('Event not found');
    }

    if (data.purpose === FormPurpose.CUSTOM && !data.customPurpose) {
      throw new ValidationError('customPurpose is required when purpose is CUSTOM');
    }

    return prisma.eventForm.create({
      data: {
        title: data.title,
        description: data.description,
        eventId: data.eventId,
        purpose: data.purpose ?? FormPurpose.CUSTOM,
        customPurpose: data.customPurpose,
        targetParticipantType: data.targetParticipantType,
        questions: (data.questions ?? []) as unknown as Prisma.InputJsonValue,
        isPublic: data.isPublic ?? false,
        allowMultipleResponses: data.allowMultipleResponses ?? false,
        maxResponses: data.maxResponses,
        closesAt: data.closesAt,
        notifyOnSubmission: data.notifyOnSubmission ?? true,
        notificationEmail: data.notificationEmail,
        createdById,
        status: FormStatus.DRAFT,
      },
      include: FORM_INCLUDE,
    });
  },

  async updateForm(formId: string, data: UpdateFormData) {
    const existing = await prisma.eventForm.findUnique({ where: { id: formId } });
    if (!existing) throw new NotFoundError('Form not found');

    if (existing.status === FormStatus.ARCHIVED) {
      throw new ValidationError('Archived forms cannot be edited');
    }

    if (data.purpose === FormPurpose.CUSTOM && data.customPurpose === '') {
      throw new ValidationError('customPurpose cannot be empty when purpose is CUSTOM');
    }

    return prisma.eventForm.update({
      where: { id: formId },
      data: {
        ...data,
        questions: data.questions !== undefined
          ? (data.questions as unknown as Prisma.InputJsonValue)
          : undefined,
        updatedAt: new Date(),
      },
      include: FORM_INCLUDE,
    });
  },

  async deleteForm(formId: string) {
    const existing = await prisma.eventForm.findUnique({ where: { id: formId } });
    if (!existing) throw new NotFoundError('Form not found');
    await prisma.eventForm.delete({ where: { id: formId } });
  },

  // ─── Responses ───────────────────────────────────────────────────────────

  async listResponses(formId: string, opts: { page?: number; limit?: number; status?: FormResponseStatus } = {}) {
    const { page = 1, limit = 20, status } = opts;
    const skip = (page - 1) * limit;

    const where: Prisma.FormResponseWhereInput = { formId };
    if (status) where.status = status;

    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: RESPONSE_INCLUDE,
      }),
      prisma.formResponse.count({ where }),
    ]);

    return { responses, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getResponseById(responseId: string) {
    const response = await prisma.formResponse.findUnique({
      where: { id: responseId },
      include: RESPONSE_INCLUDE,
    });
    if (!response) throw new NotFoundError('Response not found');
    return response;
  },

  async submitResponse(shareToken: string, data: SubmitFormData) {
    const form = await this.getFormByShareToken(shareToken);

    // Check max responses cap
    if (form.maxResponses) {
      const count = await prisma.formResponse.count({ where: { formId: form.id } });
      if (count >= form.maxResponses) {
        throw new ValidationError('This form has reached its maximum number of responses');
      }
    }

    // Check duplicate submission
    if (!form.allowMultipleResponses) {
      const existing = await prisma.formResponse.findFirst({
        where: { formId: form.id, respondentEmail: data.respondentEmail },
      });
      if (existing) {
        throw new ValidationError('You have already submitted a response to this form');
      }
    }

    return prisma.formResponse.create({
      data: {
        formId: form.id,
        respondentEmail: data.respondentEmail,
        respondentName: data.respondentName,
        respondentId: data.respondentId,
        answers: data.answers as unknown as Prisma.InputJsonValue,
        status: FormResponseStatus.SUBMITTED,
      },
      include: RESPONSE_INCLUDE,
    });
  },

  async reviewResponse(
    responseId: string,
    status: FormResponseStatus,
    reviewedById: string,
    reviewNotes?: string,
    createParticipant?: boolean,
  ) {
    const response = await prisma.formResponse.findUnique({
      where: { id: responseId },
      include: { form: true, participant: true },
    });
    if (!response) throw new NotFoundError('Response not found');

    const allowed: FormResponseStatus[] = [
      FormResponseStatus.APPROVED,
      FormResponseStatus.REJECTED,
      FormResponseStatus.WAITLISTED,
      FormResponseStatus.UNDER_REVIEW,
    ];
    if (!allowed.includes(status)) {
      throw new ValidationError(`Invalid review status: ${status}`);
    }

    const updated = await prisma.formResponse.update({
      where: { id: responseId },
      data: { status, reviewedById, reviewedAt: new Date(), reviewNotes, updatedAt: new Date() },
      include: RESPONSE_INCLUDE,
    });

    // Auto-create participant on approval if form targets a participant type
    if (
      status === FormResponseStatus.APPROVED &&
      createParticipant &&
      response.form.targetParticipantType &&
      response.form.eventId &&
      !response.participant
    ) {
      const answers = response.answers as FormAnswers;
      await prisma.eventParticipant.create({
        data: {
          eventId: response.form.eventId,
          type: response.form.targetParticipantType,
          status: ParticipantStatus.APPROVED,
          name: response.respondentName ?? (answers['name'] as string) ?? response.respondentEmail,
          email: response.respondentEmail,
          userId: response.respondentId,
          formResponseId: response.id,
          addedById: reviewedById,
          reviewedById,
          reviewedAt: new Date(),
        },
      });
    }

    return updated;
  },
};
