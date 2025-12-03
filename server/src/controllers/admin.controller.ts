import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole, UserStatus } from '@prisma/client';
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
      const user = await AdminService.getUserById(req.params.id);

      res.status(200).json({
        success: true,
        data: { user },
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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
}

/**
 * Get role description
 */
function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Full system access with all permissions',
    [UserRole.ADMIN_STAFF]: 'Administrative staff with management capabilities',
    [UserRole.MARKETER]: 'Marketing team member with event promotion access',
    [UserRole.SUPPORT]: 'Customer support team member',
    [UserRole.TELLER]: 'Event staff member for ticket scanning and check-in',
    [UserRole.ORGANIZER]: 'Event organizer with full event management capabilities',
    [UserRole.ORGANIZER_STAFF]: 'Organizer staff member with limited event management',
    [UserRole.ORGANIZER_TELLER]: 'Organizer teller for ticket scanning at specific events',
    [UserRole.ATTENDEE]: 'Regular event attendee',
  };

  return descriptions[role] || 'No description available';
}

