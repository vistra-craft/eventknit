/**
 * Printer Routes
 * RESTful API endpoints for printer management and print job operations
 */

import { Router } from 'express';
import { PrinterController } from '../controllers/printer.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Printer Discovery ====================
// GET /printers/discover?driver=cups|windows
router.get(
  '/printers/discover',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  PrinterController.discoverPrinters,
);

// ==================== Printer Management ====================
// POST /printers - Register a new printer
router.post(
  '/printers',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  PrinterController.registerPrinter,
);

// GET /printers - Get all printers
router.get(
  '/printers',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.getPrinters,
);

// GET /printers/:printerId - Get printer by ID
router.get(
  '/printers/:printerId',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.getPrinterById,
);

// PUT /printers/:printerId - Update printer configuration
router.put(
  '/printers/:printerId',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  PrinterController.updatePrinter,
);

// DELETE /printers/:printerId - Delete printer
router.delete(
  '/printers/:printerId',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  PrinterController.deletePrinter,
);

// GET /printers/:printerId/status - Check printer status
router.get(
  '/printers/:printerId/status',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.checkPrinterStatus,
);

// POST /printers/:printerId/test - Test printer
router.post(
  '/printers/:printerId/test',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  PrinterController.testPrinter,
);

// ==================== Print Job Management ====================
// POST /print-jobs - Create a print job
router.post(
  '/print-jobs',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.createPrintJob,
);

// POST /print-jobs/bulk - Bulk create print jobs
router.post(
  '/print-jobs/bulk',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.bulkCreatePrintJobs,
);

// GET /print-jobs - Get print jobs with filters
router.get(
  '/print-jobs',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.getPrintJobs,
);

// POST /print-jobs/:jobId/cancel - Cancel a print job
router.post(
  '/print-jobs/:jobId/cancel',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  PrinterController.cancelPrintJob,
);

export default router;
