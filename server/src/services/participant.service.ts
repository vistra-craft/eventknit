import {
  ParticipantType,
  ParticipantStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface ListParticipantsOptions {
  page?: number;
  limit?: number;
  type?: ParticipantType;
  status?: ParticipantStatus;
  search?: string;
}

export interface CreateParticipantData {
  name: string;
  email: string;
  type: ParticipantType;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  customType?: string;
  userId?: string;
  formResponseId?: string;
}

export interface UpdateParticipantData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  customType?: string;
  status?: ParticipantStatus;
}

const PARTICIPANT_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  addedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  reviewedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  formResponse: {
    select: { id: true, formId: true, submittedAt: true },
  },
} satisfies Prisma.EventParticipantInclude;

export const ParticipantService = {
  async list(eventId: string, opts: ListParticipantsOptions = {}) {
    const { page = 1, limit = 20, type, status, search } = opts;
    const skip = (page - 1) * limit;

    const where: Prisma.EventParticipantWhereInput = { eventId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [participants, total] = await Promise.all([
      prisma.eventParticipant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PARTICIPANT_INCLUDE,
      }),
      prisma.eventParticipant.count({ where }),
    ]);

    return { participants, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(eventId: string, participantId: string) {
    const participant = await prisma.eventParticipant.findFirst({
      where: { id: participantId, eventId },
      include: PARTICIPANT_INCLUDE,
    });
    if (!participant) throw new NotFoundError('Participant not found');
    return participant;
  },

  async create(eventId: string, data: CreateParticipantData, addedById: string) {
    // Verify event exists
    const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
    if (!event) throw new NotFoundError('Event not found');

    if (data.type === ParticipantType.CUSTOM && !data.customType) {
      throw new ValidationError('customType is required when type is CUSTOM');
    }

    return prisma.eventParticipant.create({
      data: {
        eventId,
        name: data.name,
        email: data.email,
        type: data.type,
        phone: data.phone,
        company: data.company,
        bio: data.bio,
        website: data.website,
        linkedin: data.linkedin,
        twitter: data.twitter,
        avatarUrl: data.avatarUrl,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        customType: data.customType,
        userId: data.userId,
        formResponseId: data.formResponseId,
        addedById,
        status: ParticipantStatus.INVITED,
      },
      include: PARTICIPANT_INCLUDE,
    });
  },

  async update(eventId: string, participantId: string, data: UpdateParticipantData) {
    const existing = await prisma.eventParticipant.findFirst({
      where: { id: participantId, eventId },
    });
    if (!existing) throw new NotFoundError('Participant not found');

    if (existing.type === ParticipantType.CUSTOM && data.customType === '') {
      throw new ValidationError('customType cannot be empty when type is CUSTOM');
    }

    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        updatedAt: new Date(),
      },
      include: PARTICIPANT_INCLUDE,
    });
  },

  async review(
    eventId: string,
    participantId: string,
    status: ParticipantStatus,
    reviewedById: string,
    reviewNotes?: string,
  ) {
    const existing = await prisma.eventParticipant.findFirst({
      where: { id: participantId, eventId },
    });
    if (!existing) throw new NotFoundError('Participant not found');

    const allowed: ParticipantStatus[] = [
      ParticipantStatus.APPROVED,
      ParticipantStatus.REJECTED,
      ParticipantStatus.WAITLISTED,
      ParticipantStatus.UNDER_REVIEW,
    ];
    if (!allowed.includes(status)) {
      throw new ValidationError(`Invalid review status: ${status}`);
    }

    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: { status, reviewedById, reviewedAt: new Date(), reviewNotes, updatedAt: new Date() },
      include: PARTICIPANT_INCLUDE,
    });
  },

  async delete(eventId: string, participantId: string) {
    const existing = await prisma.eventParticipant.findFirst({
      where: { id: participantId, eventId },
    });
    if (!existing) throw new NotFoundError('Participant not found');
    await prisma.eventParticipant.delete({ where: { id: participantId } });
  },
};
