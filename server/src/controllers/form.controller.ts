import type { Request, Response, NextFunction } from 'express';
import { FormService } from '../services/form.service.js';
import { FormStatus, FormPurpose, FormResponseStatus } from '@prisma/client';

export const FormController = {
  // ─── Forms ───────────────────────────────────────────────────────────────

  async listForms(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, purpose, eventId } = req.query;
      const result = await FormService.listForms({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as FormStatus | undefined,
        purpose: purpose as FormPurpose | undefined,
        eventId: eventId as string | undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getFormById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const form = await FormService.getFormById(id);
      res.json({ success: true, form });
    } catch (err) {
      next(err);
    }
  },

  async createForm(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = req.user!.id;
      const form = await FormService.createForm(req.body, createdById);
      res.status(201).json({ success: true, form });
    } catch (err) {
      next(err);
    }
  },

  async updateForm(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const form = await FormService.updateForm(id, req.body);
      res.json({ success: true, form });
    } catch (err) {
      next(err);
    }
  },

  async deleteForm(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await FormService.deleteForm(id);
      res.json({ success: true, message: 'Form deleted' });
    } catch (err) {
      next(err);
    }
  },

  // ─── Responses ───────────────────────────────────────────────────────────

  async listResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const formId = req.params.id as string;
      const { page, limit, status } = req.query;
      const result = await FormService.listResponses(formId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as FormResponseStatus | undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getResponseById(req: Request, res: Response, next: NextFunction) {
    try {
      const responseId = req.params.responseId as string;
      const response = await FormService.getResponseById(responseId);
      res.json({ success: true, response });
    } catch (err) {
      next(err);
    }
  },

  async reviewResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const responseId = req.params.responseId as string;
      const reviewedById = req.user!.id;
      const { status, reviewNotes, createParticipant } = req.body as {
        status: FormResponseStatus;
        reviewNotes?: string;
        createParticipant?: boolean;
      };
      const response = await FormService.reviewResponse(
        responseId,
        status,
        reviewedById,
        reviewNotes,
        createParticipant,
      );
      res.json({ success: true, response });
    } catch (err) {
      next(err);
    }
  },

  // ─── Public ──────────────────────────────────────────────────────────────

  async getPublicForm(req: Request, res: Response, next: NextFunction) {
    try {
      const shareToken = req.params.shareToken as string;
      const form = await FormService.getFormByShareToken(shareToken);
      // Strip internal fields from public response
      const { createdById, notificationEmail, ...publicForm } = form as typeof form & {
        createdById: string;
        notificationEmail: string | null;
      };
      void createdById;
      void notificationEmail;
      res.json({ success: true, form: publicForm });
    } catch (err) {
      next(err);
    }
  },

  async submitPublicForm(req: Request, res: Response, next: NextFunction) {
    try {
      const shareToken = req.params.shareToken as string;
      const respondentId = req.user?.id;
      const response = await FormService.submitResponse(shareToken, {
        ...req.body,
        respondentId,
      });
      res.status(201).json({ success: true, response: { id: response.id, submittedAt: response.submittedAt } });
    } catch (err) {
      next(err);
    }
  },
};
