import { prisma } from '../config/database.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

export interface CreateEventSessionData {
  title: string;
  dayOfEvent: number;
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
}

export interface UpdateEventSessionData {
  title?: string;
  dayOfEvent?: number;
  startTime?: string;
  endTime?: string;
  location?: string | null;
  capacity?: number | null;
}

export interface SessionStatsSummary {
  id: string;
  title: string;
  dayOfEvent: number;
  startTime: Date;
  endTime: Date;
  location: string | null;
  capacity: number | null;
  totalAttendees: number;
  checkedInCount: number;
  checkedOutCount: number;
  averageDurationSeconds: number;
}

export class EventSessionService {
  private static async ensureOrganizerEvent(eventId: string, organizerId: string) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
      },
      select: { id: true },
    });

    if (!event) {
      throw new AuthorizationError('You do not have access to this event');
    }
  }

  static async createSession(
    organizerId: string,
    eventId: string,
    data: CreateEventSessionData,
  ) {
    await this.ensureOrganizerEvent(eventId, organizerId);

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ValidationError('Invalid session start or end time');
    }

    if (start >= end) {
      throw new ValidationError('Session end time must be after start time');
    }

    return prisma.eventSession.create({
      data: {
        eventId,
        title: data.title,
        dayOfEvent: data.dayOfEvent,
        startTime: start,
        endTime: end,
        location: data.location,
        capacity: data.capacity,
      },
    });
  }

  static async getEventSessions(
    organizerId: string,
    eventId: string,
    filters?: { dayOfEvent?: number },
  ) {
    await this.ensureOrganizerEvent(eventId, organizerId);

    return prisma.eventSession.findMany({
      where: {
        eventId,
        dayOfEvent: filters?.dayOfEvent,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  static async getSessionById(organizerId: string, sessionId: string) {
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: {
        event: { select: { organizerId: true } },
      },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (session.event.organizerId !== organizerId) {
      throw new AuthorizationError('You do not have access to this session');
    }

    return session;
  }

  static async updateSession(
    organizerId: string,
    sessionId: string,
    data: UpdateEventSessionData,
  ) {
    const session = await this.getSessionById(organizerId, sessionId);

    const start = data.startTime ? new Date(data.startTime) : session.startTime;
    const end = data.endTime ? new Date(data.endTime) : session.endTime;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ValidationError('Invalid session start or end time');
    }

    if (start >= end) {
      throw new ValidationError('Session end time must be after start time');
    }

    return prisma.eventSession.update({
      where: { id: sessionId },
      data: {
        title: data.title ?? undefined,
        dayOfEvent: data.dayOfEvent ?? undefined,
        startTime: data.startTime ? start : undefined,
        endTime: data.endTime ? end : undefined,
        location: data.location ?? undefined,
        capacity: data.capacity ?? undefined,
      },
    });
  }

  static async deleteSession(organizerId: string, sessionId: string) {
    await this.getSessionById(organizerId, sessionId);

    await prisma.eventSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }

  static async getEventSessionStats(
    organizerId: string,
    eventId: string,
    filters?: { dayOfEvent?: number },
  ): Promise<SessionStatsSummary[]> {
    await this.ensureOrganizerEvent(eventId, organizerId);

    const sessions = await prisma.eventSession.findMany({
      where: {
        eventId,
        dayOfEvent: filters?.dayOfEvent,
      },
      include: {
        attendance: {
          select: {
            checkedInAt: true,
            checkedOutAt: true,
            durationSeconds: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return sessions.map((session) => {
      const totalAttendees = session.attendance.length;
      const checkedInCount = session.attendance.filter((a) => a.checkedInAt !== null).length;
      const checkedOutCount = session.attendance.filter((a) => a.checkedOutAt !== null).length;
      const durations = session.attendance
        .map((a) => a.durationSeconds)
        .filter((duration): duration is number => typeof duration === 'number');
      const averageDurationSeconds = durations.length > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : 0;

      return {
        id: session.id,
        title: session.title,
        dayOfEvent: session.dayOfEvent,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        capacity: session.capacity,
        totalAttendees,
        checkedInCount,
        checkedOutCount,
        averageDurationSeconds,
      };
    });
  }
}
