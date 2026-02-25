import { Request, Response, NextFunction } from 'express';
import { KYCService } from '../services/kyc.service.js';
import { KYCStatus, OrganizerEntityType } from '@prisma/client';

// ─── Typed request shapes ───────────────────────────────────────────────

interface ListKYCQuery {
  status?: KYCStatus;
  entityType?: OrganizerEntityType;
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface RejectDocumentBody {
  rejectionReason: string;
}

interface RejectOrganizerBody {
  reason: string;
}

// ─── Controller ─────────────────────────────────────────────────────────

export class AdminKYCController {
  /**
   * Get KYC stats for admin dashboard
   */
  static async getKYCStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await KYCService.getKYCStats();
      res.json({ success: true, data: { stats } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List KYC submissions with pagination and filters
   */
  static async listKYCSubmissions(
    req: Request<Record<string, never>, unknown, unknown, ListKYCQuery>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { status, entityType, search, page, limit, sortBy, sortOrder } = req.query;

      const result = await KYCService.listKYCSubmissions({
        status,
        entityType,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        sortBy,
        sortOrder,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get full KYC details for a specific organizer
   */
  static async getOrganizerKYCDetails(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await KYCService.getOrganizerKYCDetails(req.params.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a single KYC document
   */
  static async approveDocument(
    req: Request<{ documentId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const document = await KYCService.approveKYCDocument(req.params.documentId, adminId);
      res.json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a single KYC document
   */
  static async rejectDocument(
    req: Request<{ documentId: string }, unknown, RejectDocumentBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const { rejectionReason } = req.body;
      const document = await KYCService.rejectKYCDocument(req.params.documentId, adminId, rejectionReason);
      res.json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve an organizer's entire KYC
   */
  static async approveOrganizerKYC(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const result = await KYCService.approveOrganizerKYC(req.params.userId, adminId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject an organizer's entire KYC
   */
  static async rejectOrganizerKYC(
    req: Request<{ userId: string }, unknown, RejectOrganizerBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const { reason } = req.body;
      const result = await KYCService.rejectOrganizerKYC(req.params.userId, adminId, reason);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
