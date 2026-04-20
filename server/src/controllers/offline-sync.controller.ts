/**
 * Offline Sync Controller
 * Handles API requests for offline data download and batch scan uploads
 */

import { Response } from 'express';
import { OfflineSyncService, SyncScanInput } from '../services/offline-sync.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class OfflineSyncController {
  /**
   * GET /offline/events/:eventId/data
   * Download event data for offline caching
   */
  static async getEventDataForOffline(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const userId = req.user!.id;

      const data = await OfflineSyncService.getEventDataForOffline(
        eventId,
        userId,
      );

      res.status(200).json({
        success: true,
        data,
        message: 'Event data retrieved for offline use',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve event data',
      });
    }
  }

  /**
   * POST /offline/scans/batch
   * Upload batch of scans from mobile device
   */
  static async processBatchScans(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { scans } = req.body;

      if (!Array.isArray(scans) || scans.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid scans array',
        });
        return;
      }

      // Validate scan data
      for (const scan of scans) {
        if (
          !scan.id ||
          !scan.registrationId ||
          !scan.checkpointId ||
          !scan.qrCode ||
          !scan.scannedAt ||
          !scan.scannedBy
        ) {
          res.status(400).json({
            success: false,
            message: 'Invalid scan data: missing required fields',
          });
          return;
        }
      }

      const result = await OfflineSyncService.processBatchScans(scans);

      res.status(200).json({
        success: true,
        data: result,
        message: `Batch sync completed: ${result.successCount} successful, ${result.failureCount} failed`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to process batch scans',
      });
    }
  }

  /**
   * GET /offline/scans/status/:eventId
   * Get sync status for mobile device
   */
  static async getSyncStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const userId = req.user!.id;

      const status = await OfflineSyncService.getSyncStatus(eventId, userId);

      res.status(200).json({
        success: true,
        data: status,
        message: 'Sync status retrieved',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get sync status',
      });
    }
  }

  /**
   * GET /offline/scans/conflicts/:eventId
   * Get list of scan conflicts for event
   */
  static async getConflicts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const timeWindowMinutes = parseInt(
        (req.query.timeWindow as string) || '5',
        10,
      );

      const conflicts = await OfflineSyncService.detectConflicts(
        eventId,
        timeWindowMinutes,
      );

      res.status(200).json({
        success: true,
        data: {
          conflicts,
          count: conflicts.length,
        },
        message: `Found ${conflicts.length} conflicts`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to detect conflicts',
      });
    }
  }

  /**
   * POST /offline/scans/conflicts/:conflictId/resolve
   * Resolve a scan conflict
   */
  static async resolveConflict(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const conflictId = req.params.conflictId as string;
      const { resolution } = req.body;

      if (
        !resolution ||
        !['keep_first', 'keep_latest', 'keep_both'].includes(resolution)
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid resolution strategy. Must be: keep_first, keep_latest, or keep_both',
        });
        return;
      }

      await OfflineSyncService.resolveConflict(conflictId, resolution);

      res.status(200).json({
        success: true,
        message: 'Conflict resolved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to resolve conflict',
      });
    }
  }

  /**
   * POST /offline/sync-scans
   * Sync offline scans through the full check-in/check-out state machine.
   * Unlike /offline/scans/batch, this updates EventRegistration and emits
   * WebSocket stats so the dashboard reflects the synced scans in real time.
   */
  static async syncScans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { scans } = req.body as { scans: SyncScanInput[] };
      const userId = req.user!.id;

      if (!Array.isArray(scans) || scans.length === 0) {
        res.status(400).json({ success: false, message: 'scans array is required and must not be empty' });
        return;
      }

      for (const scan of scans) {
        if (!scan.id || !scan.registrationId || !scan.qrCode || !scan.scannedAt) {
          res.status(400).json({ success: false, message: 'Each scan must have id, registrationId, qrCode, and scannedAt' });
          return;
        }
      }

      const result = await OfflineSyncService.syncScansWithCheckIn(scans, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: `Sync completed: ${result.successCount} successful, ${result.failureCount} failed`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  }
}
