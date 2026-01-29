/**
 * Offline Sync Routes
 * API endpoints for offline data download and batch scan uploads
 */

import { Router } from 'express';
import { OfflineSyncController } from '../controllers/offline-sync.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Offline Data Download ====================

// GET /offline/events/:eventId/data - Bulk download event data
router.get(
  '/events/:eventId/data',
  requireMinRole(UserRole.TELLER),
  OfflineSyncController.getEventDataForOffline,
);

// ==================== Batch Scan Upload ====================

// POST /offline/scans/batch - Upload batch of scans
router.post(
  '/scans/batch',
  requireMinRole(UserRole.TELLER),
  OfflineSyncController.processBatchScans,
);

// ==================== Sync Status ====================

// GET /offline/scans/status/:eventId - Get sync status
router.get(
  '/scans/status/:eventId',
  requireMinRole(UserRole.TELLER),
  OfflineSyncController.getSyncStatus,
);

// ==================== Conflict Management ====================

// GET /offline/scans/conflicts/:eventId - Get scan conflicts
router.get(
  '/scans/conflicts/:eventId',
  requireMinRole(UserRole.ADMIN_STAFF),
  OfflineSyncController.getConflicts,
);

// POST /offline/scans/conflicts/:conflictId/resolve - Resolve conflict
router.post(
  '/scans/conflicts/:conflictId/resolve',
  requireMinRole(UserRole.ADMIN_STAFF),
  OfflineSyncController.resolveConflict,
);

export default router;
