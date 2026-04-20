import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { KYCService } from '../services/kyc.service.js';
import { KYCStatus, OrganizerEntityType } from '@prisma/client';

// ─── Typed request shapes ───────────────────────────────────────────────

interface _ListKYCQuery {
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

interface CreateRequirementBody {
  documentType: string;
  description?: string;
  isRequired: boolean;
}

interface UpdateRequirementBody {
  description?: string;
  isRequired?: boolean;
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
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const query = req.query as Record<string, any>;
      const status = typeof query.status === 'string' ? query.status : undefined;
      const entityType = typeof query.entityType === 'string' ? query.entityType : undefined;
      const search = typeof query.search === 'string' ? query.search : undefined;
      const page = typeof query.page === 'string' ? query.page : undefined;
      const limit = typeof query.limit === 'string' ? query.limit : undefined;
      const sortBy = typeof query.sortBy === 'string' ? query.sortBy : undefined;
      const sortOrder = typeof query.sortOrder === 'string' ? query.sortOrder : undefined;

      const result = await KYCService.listKYCSubmissions({
        status: status as any,
        entityType: entityType as any,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder as any,
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
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req.params as Record<string, string>).userId;
      const result = await KYCService.getOrganizerKYCDetails(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a single KYC document
   */
  static async approveDocument(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const documentId = req.params.documentId as string;
      const document = await KYCService.approveKYCDocument(documentId, adminId);
      res.json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a single KYC document
   */
  static async rejectDocument(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const documentId = req.params.documentId as string;
      const { rejectionReason } = req.body as RejectDocumentBody;
      const document = await KYCService.rejectKYCDocument(documentId, adminId, rejectionReason);
      res.json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve an organizer's entire KYC
   */
  static async approveOrganizerKYC(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const userId = req.params.userId as string;
      const result = await KYCService.approveOrganizerKYC(userId, adminId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject an organizer's entire KYC
   */
  static async rejectOrganizerKYC(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user!.id;
      const userId = req.params.userId as string;
      const { reason } = req.body as RejectOrganizerBody;
      const result = await KYCService.rejectOrganizerKYC(userId, adminId, reason);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all entity types
   */
  static async getEntityTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const entityTypes = await KYCService.getAllEntityTypes();
      res.json({ success: true, data: { entityTypes } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document requirements for a specific entity type
   */
  static async getEntityRequirements(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const entityType = (req.params as Record<string, string>).entityType as OrganizerEntityType;
      const requirements = await KYCService.getEntityRequirements(entityType);
      res.json({ success: true, data: { requirements } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a document requirement for an entity type
   */
  static async addEntityRequirement(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { documentType, description, isRequired } = req.body as CreateRequirementBody;
      const entityType = (req.params as Record<string, string>).entityType as OrganizerEntityType;
      const requirement = await KYCService.addEntityRequirement(
        entityType,
        documentType,
        description,
        isRequired,
      );
      res.json({ success: true, data: { requirement } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a document requirement
   */
  static async updateEntityRequirement(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { description, isRequired } = req.body as UpdateRequirementBody;
      const requirementId = (req.params as Record<string, string>).requirementId;
      const requirement = await KYCService.updateEntityRequirement(
        requirementId,
        description,
        isRequired,
      );
      res.json({ success: true, data: { requirement } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a document requirement
   */
  static async deleteEntityRequirement(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const requirementId = (req.params as Record<string, string>).requirementId;
      await KYCService.deleteEntityRequirement(requirementId);
      res.json({ success: true, message: 'Requirement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
