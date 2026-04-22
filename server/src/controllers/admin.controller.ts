import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { SubscriptionService } from '../services/subscription.service.js';
import { TicketIssuanceService } from '../services/ticket-issuance.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import { roleHierarchy, canCreateRole, canModifyUser, canDeleteUser } from '../utils/privileges.js';

export class AdminController {
  /**
   * Create user
   */
  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Extract sendEmailNotification from request body (optional, defaults to false)
      const { sendEmailNotification, ...userData } = req.body;

      const user = await AdminService.createUser(
        userData,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
        sendEmailNotification === true || sendEmailNotification === 'true',
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   */
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        role: req.query.role ? (req.query.role as UserRole) : undefined,
        status: req.query.status ? (req.query.status as UserStatus) : undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await AdminService.getUsers(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AdminService.getUserById((req.params.id as string));

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enriched organizer details (for admin slide-over panel)
   */
  static async getOrganizerDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getOrganizerDetails(req.params.id as string);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.updateUser(
        (req.params.id as string),
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user role
   */
  static async changeUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { role } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.changeUserRole(
        req.params.id as string,
        role,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: `Role updated to ${role}`,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await AdminService.deleteUser(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Force password reset
   */
  static async forcePasswordReset(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await AdminService.forcePasswordReset(
        (req.params.id as string),
        req.body.password,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get admin dashboard stats
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as '7d' | '30d' | '90d' | '1y') || '30d';
      const stats = await AdminService.getDashboardStats(timeRange);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUsersStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeRange = (req.query.timeRange as '7d' | '30d' | '90d' | '1y') || '30d';
      const stats = await AdminService.getUsersStats(timeRange);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get admin dashboard growth series for charts
   */
  static async getDashboardGrowth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as 'monthly' | 'quarterly' | 'semiannual' | 'yearly') || 'monthly';
      const growth = await AdminService.getDashboardGrowth(period);

      res.status(200).json({
        success: true,
        data: growth,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent events for admin dashboard
   */
  static async getRecentEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const events = await AdminService.getRecentEvents(limit);

      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activity for admin dashboard
   */
  static async getRecentActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const activities = await AdminService.getRecentActivity(limit);

      res.status(200).json({
        success: true,
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system alerts for admin dashboard
   */
  static async getSystemAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await AdminService.getSystemAlerts();

      res.status(200).json({
        success: true,
        data: { alerts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Seed test users (temporary endpoint for production setup)
   */
  static async seedTestUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await AdminService.seedTestUsers(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Test users seeded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend user
   */
  static async suspendUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.suspendUser(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        req.body.reason,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'User suspended successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.deactivateUser(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        req.body.reason,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate user
   */
  static async activateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.activateUser(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a pending organizer
   */
  static async approveOrganizer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.approveOrganizer(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Organizer approved successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend an organizer with a reason (manual review / rejection gate)
   */
  static async suspendOrganizerWithReason(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { reason } = req.body as { reason: string };
      if (!reason || !reason.trim()) {
        res.status(400).json({ success: false, message: 'A reason is required when suspending an organizer' });
        return;
      }
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const user = await AdminService.suspendOrganizerWithReason(
        req.params.id as string,
        req.user.id,
        req.user.role,
        reason.trim(),
        ipAddress,
        userAgent,
      );

      res.status(200).json({ success: true, message: 'Organizer suspended successfully', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attendees
   */
  static async getAttendees(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        eventId: req.query.eventId as string | undefined,
        search: req.query.search as string | undefined,
        status: req.query.status ? (req.query.status as UserStatus) : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await AdminService.getAttendees(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recall event (admin function - pull down approved event)
   */
  static async recallEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { action, reason } = req.body;

      if (!action || (action !== 'PENDING' && action !== 'CANCELLED')) {
        res.status(400).json({
          success: false,
          message: 'Action is required and must be either PENDING or CANCELLED',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const { EventService } = await import('../services/event.service.js');
      const event = await EventService.recallEvent(
        (req.params.id as string),
        action,
        req.user.id,
        req.user.role,
        reason,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: action === 'PENDING'
          ? 'Event recalled and set to pending for re-approval'
          : 'Event recalled and permanently cancelled',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all roles
   */
  static async getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get all available roles
      const allRoles = Object.values(UserRole);
      const currentUserRole = req.user.role;

      // Build role information with permissions
      const roles = allRoles.map((role) => {
        const hierarchy = roleHierarchy[role];
        const canCreate = canCreateRole(currentUserRole, role);
        const canModify = canModifyUser(currentUserRole, role);
        const canDelete = canDeleteUser(currentUserRole, role);

        // Get roles that this role can create
        const creatableRoles: UserRole[] = [];
        allRoles.forEach((targetRole) => {
          if (canCreateRole(role, targetRole)) {
            creatableRoles.push(targetRole);
          }
        });

        // Get roles that this role can modify
        const modifiableRoles: UserRole[] = [];
        allRoles.forEach((targetRole) => {
          if (canModifyUser(role, targetRole)) {
            modifiableRoles.push(targetRole);
          }
        });

        return {
          role,
          hierarchy,
          displayName: role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          description: getRoleDescription(role),
          canCreate,
          canModify,
          canDelete,
          creatableRoles,
          modifiableRoles,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          roles,
          currentUserRole,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Subscription Plan Management
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get all subscription plans
   */
  static async getSubscriptionPlans(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await SubscriptionService.getPlans();

      res.status(200).json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a subscription plan (pricing, description, features)
   */
  static async updateSubscriptionPlan(req: AuthenticatedRequest<{ tier: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { tier } = req.params;
      if (!Object.values(SubscriptionTier).includes(tier as SubscriptionTier)) {
        res.status(400).json({ success: false, message: `Invalid tier: ${tier}` });
        return;
      }

      const { price, description, features, isActive } = req.body;
      const plan = await SubscriptionService.updatePlan(tier as SubscriptionTier, { price, description, features, isActive });

      res.status(200).json({
        success: true,
        message: `Subscription plan ${tier} updated successfully`,
        data: { plan },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer subscription summary (subscription + overrides + effective tier)
   */
  static async getOrganizerSubscription(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: organizerId } = req.params;
      const summary = await SubscriptionService.getOrganizerSubscriptionSummary(organizerId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set a subscription override for an organizer
   */
  static async setOrganizerSubscriptionOverride(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id: organizerId } = req.params;
      const { tier, reason, expiresAt } = req.body;

      if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
        res.status(400).json({ success: false, message: `Invalid tier: ${tier}` });
        return;
      }

      const override = await SubscriptionService.createOverride(
        organizerId,
        tier,
        req.user.id,
        reason,
        expiresAt ? new Date(expiresAt) : undefined,
      );

      res.status(201).json({
        success: true,
        message: `Subscription override set to ${tier} for organizer`,
        data: { override },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a subscription override
   */
  static async removeOrganizerSubscriptionOverride(req: AuthenticatedRequest<{ id: string; overrideId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { overrideId } = req.params;
      const override = await SubscriptionService.removeOverride(overrideId);

      res.status(200).json({
        success: true,
        message: 'Subscription override removed',
        data: { override },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all ticket issuances across the platform (admin view)
   */
  static async getTicketIssuances(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, eventId, page, limit } = req.query as Record<string, string>;
      const result = await TicketIssuanceService.listAll({
        status: status || undefined,
        eventId: eventId || undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event analytics (for admin mobile app)
   */
  static async getEventAnalytics(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId } = req.params;
      const analytics = await AdminService.getEventAnalytics(eventId);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a ticket issuance (admin, no ownership check)
   */
  static async cancelTicketIssuance(req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const issuance = await TicketIssuanceService.adminCancel(id);
      res.status(200).json({ success: true, message: 'Issuance cancelled', data: { issuance } });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Get role description
 */
function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Full platform access including system health, database, logs, and backups',
    [UserRole.ADMIN]: 'Full admin dashboard access except system management',
    [UserRole.SUPPORT]: 'Customer support, communications, marketing, and flagged content review',
    [UserRole.TELLER]: 'Event day hub — QR scanning, badge printing, and walk-in registration',
    [UserRole.ORGANIZER]: 'Full organizer dashboard — events, staff, analytics, finance, branding',
    [UserRole.ORGANIZER_ADMIN]: 'Manage organizer events, attendees, and analytics (no finance or settings)',
    [UserRole.ORGANIZER_TELLER]: 'Event day operations — QR scanning and check-in for assigned events',
    [UserRole.ATTENDEE]: 'Browse events, register, manage tickets and transfers',
  };

  return descriptions[role] || 'No description available';
}

