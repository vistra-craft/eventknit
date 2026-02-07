/**
 * Dashboard Routes
 * RESTful API endpoints for real-time dashboard analytics and monitoring
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Real-Time Dashboard ====================

// GET /dashboard/events/:eventId/realtime-metrics - Get current totals
router.get(
  '/events/:eventId/realtime-metrics',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  DashboardController.getRealtimeMetrics,
);

// GET /dashboard/events/:eventId/recent-scans - Get last N scans
router.get(
  '/events/:eventId/recent-scans',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  DashboardController.getRecentScans,
);

// GET /dashboard/events/:eventId/heatmap - Get facility heatmap
router.get(
  '/events/:eventId/heatmap',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  DashboardController.getFacilityHeatmap,
);

// GET /dashboard/events/:eventId/staff-metrics - Get staff performance
router.get(
  '/events/:eventId/staff-metrics',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  DashboardController.getStaffMetrics,
);

// GET /dashboard/events/:eventId/capacity-overview - Get all zones capacity
router.get(
  '/events/:eventId/capacity-overview',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]),
  DashboardController.getCapacityOverview,
);

// GET /dashboard/events/:eventId/attendance-trend - Get hourly/daily trends
router.get(
  '/events/:eventId/attendance-trend',
  requireRole([UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]),
  DashboardController.getAttendanceTrend,
);

export default router;
