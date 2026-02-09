import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { WhiteLabelService } from '../services/white-label.service.js';
import { logger } from '../utils/logger.js';

export class WhiteLabelController {
  /**
   * Get organizer's branding
   */
  static async getBranding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const branding = await WhiteLabelService.getOrCreateBranding(organizerId);
      res.json(branding);
    } catch (error: any) {
      logger.error('Get branding error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get branding',
      });
    }
  }

  /**
   * Create or update branding
   */
  static async upsertBranding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const branding = await WhiteLabelService.upsertBranding(
        organizerId,
        req.body,
      );
      res.json(branding);
    } catch (error: any) {
      logger.error('Upsert branding error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update branding',
      });
    }
  }

  /**
   * Get all brandings (admin only)
   */
  static async getAllBrandings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const brandings = await WhiteLabelService.getAllBrandings(req.query as any);
      res.json(brandings);
    } catch (error: any) {
      logger.error('Get all brandings error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get brandings',
      });
    }
  }

  /**
   * Update branding status (admin only)
   */
  static async updateBrandingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const brandingId = req.params.brandingId as string;
      const { status, rejectionReason } = req.body;
      const approvedBy = req.user!.id;

      const branding = await WhiteLabelService.updateBrandingStatus(
        brandingId,
        status,
        approvedBy,
        rejectionReason,
      );
      res.json(branding);
    } catch (error: any) {
      logger.error('Update branding status error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update branding status',
      });
    }
  }

  /**
   * Admin: get branding for a specific organizer
   */
  static async adminGetBrandingByOrganizer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.params.organizerId as string;
      const branding = await WhiteLabelService.getBrandingByOrganizerId(organizerId);
      res.json(branding);
    } catch (error: any) {
      logger.error('Admin get branding by organizer error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get branding',
      });
    }
  }

  /**
   * Admin: create or update branding for any organizer (auto-approved)
   */
  static async adminUpsertBranding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const organizerId = req.params.organizerId as string;
      const branding = await WhiteLabelService.adminUpsertBranding(
        organizerId,
        req.body,
        adminId,
      );
      res.json(branding);
    } catch (error: any) {
      logger.error('Admin upsert branding error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update branding',
      });
    }
  }

  /**
   * Admin: get all custom domains across all organizers
   */
  static async adminGetAllCustomDomains(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const domains = await WhiteLabelService.getAllCustomDomains(req.query as any);
      res.json(domains);
    } catch (error: any) {
      logger.error('Admin get all custom domains error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get custom domains',
      });
    }
  }

  /**
   * Admin: add custom domain for any organizer
   */
  static async adminAddCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.params.organizerId as string;
      const domain = await WhiteLabelService.addCustomDomain(organizerId, req.body);
      res.status(201).json(domain);
    } catch (error: any) {
      logger.error('Admin add custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to add custom domain',
      });
    }
  }

  /**
   * Admin: delete any custom domain
   */
  static async adminDeleteCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const domainId = req.params.domainId as string;
      await WhiteLabelService.adminDeleteCustomDomain(domainId);
      res.json({ success: true, message: 'Custom domain deleted' });
    } catch (error: any) {
      logger.error('Admin delete custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete custom domain',
      });
    }
  }

  /**
   * Get custom domains for organizer
   */
  static async getCustomDomains(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const domains = await WhiteLabelService.getCustomDomains(organizerId);
      res.json(domains);
    } catch (error: any) {
      logger.error('Get custom domains error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get custom domains',
      });
    }
  }

  /**
   * Add custom domain
   */
  static async addCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const domain = await WhiteLabelService.addCustomDomain(organizerId, req.body);
      res.status(201).json(domain);
    } catch (error: any) {
      logger.error('Add custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to add custom domain',
      });
    }
  }

  /**
   * Get custom domain by ID
   */
  static async getCustomDomainById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      const domainId = (req.params.domainId as string) as string;

      const domain = await WhiteLabelService.getCustomDomainById(domainId, organizerId);
      res.json(domain);
    } catch (error: any) {
      logger.error('Get custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get custom domain',
      });
    }
  }

  /**
   * Update custom domain
   */
  static async updateCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const domainId = (req.params.domainId as string) as string;
      const domain = await WhiteLabelService.updateCustomDomain(
        domainId,
        organizerId,
        req.body,
      );
      res.json(domain);
    } catch (error: any) {
      logger.error('Update custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update custom domain',
      });
    }
  }

  /**
   * Verify custom domain (admin only)
   */
  static async verifyCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const domainId = req.params.domainId as string;
      const { status, failureReason } = req.body;
      const verifiedBy = req.user!.id;

      const domain = await WhiteLabelService.verifyCustomDomain(
        domainId,
        verifiedBy,
        status,
        failureReason,
      );
      res.json(domain);
    } catch (error: any) {
      logger.error('Verify custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to verify custom domain',
      });
    }
  }

  /**
   * Delete custom domain
   */
  static async deleteCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = req.user?.id;
      if (!organizerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const domainId = (req.params.domainId as string) as string;
      await WhiteLabelService.deleteCustomDomain(domainId, organizerId);
      res.json({ success: true, message: 'Custom domain deleted' });
    } catch (error: any) {
      logger.error('Delete custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete custom domain',
      });
    }
  }

  /**
   * Get active branding (public API)
   */
  static async getActiveBranding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req.params.organizerId as string) as string;
      const branding = await WhiteLabelService.getActiveBranding(organizerId);
      
      if (!branding) {
        res.status(404).json({ error: 'Active branding not found' });
        return;
      }

      res.json(branding);
    } catch (error: any) {
      logger.error('Get active branding error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get active branding',
      });
    }
  }

  /**
   * Get active custom domain (public API)
   */
  static async getActiveCustomDomain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizerId = (req.params.organizerId as string) as string;
      const domain = await WhiteLabelService.getActiveCustomDomain(organizerId);
      
      if (!domain) {
        res.status(404).json({ error: 'Active custom domain not found' });
        return;
      }

      res.json(domain);
    } catch (error: any) {
      logger.error('Get active custom domain error:', error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to get active custom domain',
      });
    }
  }
}
