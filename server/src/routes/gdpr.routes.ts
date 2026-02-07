import { Router, Request, Response } from 'express';
import { GDPRService } from '../services/gdpr.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/v1/gdpr/export
 * Request a data export (authenticated users only)
 */
router.post('/export', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await GDPRService.requestDataExport(userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    logger.error('Error requesting data export:', error);
    const message = error instanceof Error ? error.message : 'Failed to request data export';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/v1/gdpr/export
 * Get user's data directly (authenticated users only)
 * Returns the export data as JSON
 */
router.get('/export', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const exportData = await GDPRService.exportUserData(userId);

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error: unknown) {
    logger.error('Error exporting user data:', error);
    const message = error instanceof Error ? error.message : 'Failed to export data';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

/**
 * GET /api/v1/gdpr/download/:token
 * Download exported data by token (no auth required, token-based access)
 */
router.get('/download/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

    const exportData = await GDPRService.downloadExport(token);

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="eventknit-data-export-${new Date().toISOString().split('T')[0]}.json"`);

    res.json(exportData);
  } catch (error: unknown) {
    logger.error('Error downloading export:', error);
    const message = error instanceof Error ? error.message : 'Failed to download export';
    res.status(404).json({
      success: false,
      message,
    });
  }
});

/**
 * DELETE /api/v1/gdpr/account
 * Delete user account (authenticated users only)
 */
router.delete('/account', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { confirmEmail, reason } = req.body;

    if (!confirmEmail) {
      res.status(400).json({
        success: false,
        message: 'Please confirm your email address to delete your account',
      });
      return;
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : req.ip) || undefined;
    const userAgent = req.headers['user-agent'];

    const result = await GDPRService.deleteAccount(
      userId,
      { confirmEmail, reason },
      ipAddress,
      userAgent,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    logger.error('Error deleting account:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete account';
    const status = message.includes('not found') ? 404 : message.includes('does not match') ? 400 : 500;
    res.status(status).json({
      success: false,
      message,
    });
  }
});

export default router;
