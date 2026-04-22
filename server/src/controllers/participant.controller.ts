import type { Request, Response, NextFunction } from 'express';
import { ParticipantService } from '../services/participant.service.js';
import { ParticipantType, ParticipantStatus } from '@prisma/client';

export const ParticipantController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const { page, limit, type, status, search } = req.query;
      const result = await ParticipantService.list(eventId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type as ParticipantType | undefined,
        status: status as ParticipantStatus | undefined,
        search: search as string | undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, participantId } = req.params as { eventId: string; participantId: string };
      const participant = await ParticipantService.getById(eventId, participantId);
      res.json({ success: true, participant });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const addedById = req.user!.id;
      const participant = await ParticipantService.create(eventId, req.body, addedById);
      res.status(201).json({ success: true, participant });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, participantId } = req.params as { eventId: string; participantId: string };
      const participant = await ParticipantService.update(eventId, participantId, req.body);
      res.json({ success: true, participant });
    } catch (err) {
      next(err);
    }
  },

  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, participantId } = req.params as { eventId: string; participantId: string };
      const { status, reviewNotes } = req.body as { status: ParticipantStatus; reviewNotes?: string };
      const reviewedById = req.user!.id;
      const participant = await ParticipantService.review(
        eventId,
        participantId,
        status,
        reviewedById,
        reviewNotes,
      );
      res.json({ success: true, participant });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, participantId } = req.params as { eventId: string; participantId: string };
      await ParticipantService.delete(eventId, participantId);
      res.json({ success: true, message: 'Participant removed' });
    } catch (err) {
      next(err);
    }
  },
};
