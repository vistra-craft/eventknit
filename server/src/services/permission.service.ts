import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Permission categories
 */
export enum PermissionCategory {
  EVENTS = 'events',
  ATTENDEES = 'attendees',
  TICKETS = 'tickets',
  ANALYTICS = 'analytics',
  FINANCIAL = 'financial',
  TEAM = 'team',
  COMMUNICATION = 'communication',
  SETTINGS = 'settings',
}

/**
 * System permissions definition
 * These are the granular permissions that can be assigned to roles
 */
export const SYSTEM_PERMISSIONS = [
  // Events
  { key: 'events.view', name: 'View Events', description: 'View all events', category: PermissionCategory.EVENTS },
  { key: 'events.create', name: 'Create Events', description: 'Create new events', category: PermissionCategory.EVENTS },
  { key: 'events.edit', name: 'Edit Events', description: 'Edit existing events', category: PermissionCategory.EVENTS },
  { key: 'events.delete', name: 'Delete Events', description: 'Delete events', category: PermissionCategory.EVENTS },
  { key: 'events.publish', name: 'Publish Events', description: 'Publish events for public viewing', category: PermissionCategory.EVENTS },
  { key: 'events.duplicate', name: 'Duplicate Events', description: 'Duplicate existing events', category: PermissionCategory.EVENTS },
  { key: 'events.cancel', name: 'Cancel Events', description: 'Cancel events', category: PermissionCategory.EVENTS },

  // Attendees
  { key: 'attendees.view', name: 'View Attendees', description: 'View attendee lists', category: PermissionCategory.ATTENDEES },
  { key: 'attendees.export', name: 'Export Attendees', description: 'Export attendee data', category: PermissionCategory.ATTENDEES },
  { key: 'attendees.manage', name: 'Manage Attendees', description: 'Edit attendee information', category: PermissionCategory.ATTENDEES },
  { key: 'attendees.checkin', name: 'Check-in Attendees', description: 'Check in attendees at events', category: PermissionCategory.ATTENDEES },
  { key: 'attendees.refund', name: 'Refund Attendees', description: 'Process refunds for attendees', category: PermissionCategory.ATTENDEES },

  // Tickets
  { key: 'tickets.view', name: 'View Tickets', description: 'View ticket information', category: PermissionCategory.TICKETS },
  { key: 'tickets.manage', name: 'Manage Tickets', description: 'Create and edit ticket types', category: PermissionCategory.TICKETS },
  { key: 'tickets.scan', name: 'Scan Tickets', description: 'Scan QR codes to verify tickets', category: PermissionCategory.TICKETS },
  { key: 'tickets.validate', name: 'Validate Tickets', description: 'Validate ticket authenticity', category: PermissionCategory.TICKETS },

  // Analytics
  { key: 'analytics.view', name: 'View Analytics', description: 'View analytics and reports', category: PermissionCategory.ANALYTICS },
  { key: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', category: PermissionCategory.ANALYTICS },
  { key: 'analytics.financial', name: 'Financial Analytics', description: 'View financial analytics and reports', category: PermissionCategory.ANALYTICS },

  // Financial
  { key: 'financial.view', name: 'View Financials', description: 'View financial information', category: PermissionCategory.FINANCIAL },
  { key: 'financial.manage', name: 'Manage Financials', description: 'Manage financial settings and transactions', category: PermissionCategory.FINANCIAL },
  { key: 'financial.disbursements', name: 'View Disbursements', description: 'View payout and disbursement information', category: PermissionCategory.FINANCIAL },
  { key: 'financial.refunds', name: 'Manage Refunds', description: 'Process and manage refunds', category: PermissionCategory.FINANCIAL },

  // Team
  { key: 'team.view', name: 'View Team', description: 'View team members', category: PermissionCategory.TEAM },
  { key: 'team.invite', name: 'Invite Team Members', description: 'Invite new team members', category: PermissionCategory.TEAM },
  { key: 'team.manage', name: 'Manage Team', description: 'Edit and manage team members', category: PermissionCategory.TEAM },
  { key: 'team.roles', name: 'Manage Roles', description: 'Create and manage custom roles', category: PermissionCategory.TEAM },

  // Communication
  { key: 'communication.send', name: 'Send Messages', description: 'Send messages to attendees', category: PermissionCategory.COMMUNICATION },
  { key: 'communication.templates', name: 'Manage Templates', description: 'Create and manage email templates', category: PermissionCategory.COMMUNICATION },
  { key: 'communication.bulk', name: 'Bulk Communication', description: 'Send bulk messages and campaigns', category: PermissionCategory.COMMUNICATION },

  // Settings
  { key: 'settings.view', name: 'View Settings', description: 'View organization settings', category: PermissionCategory.SETTINGS },
  { key: 'settings.edit', name: 'Edit Settings', description: 'Edit organization settings', category: PermissionCategory.SETTINGS },
  { key: 'settings.billing', name: 'Manage Billing', description: 'Manage billing and payment settings', category: PermissionCategory.SETTINGS },
] as const;

/**
 * Permission Service
 * Manages permissions and permission checks
 */
export class PermissionService {
  /**
   * Seed system permissions (idempotent)
   */
  static async seedPermissions() {
    try {
      const permissions = [];

      for (const perm of SYSTEM_PERMISSIONS) {
        const permission = await prisma.permission.upsert({
          where: { key: perm.key },
          update: {
            name: perm.name,
            description: perm.description,
            category: perm.category,
            isSystem: true,
          },
          create: {
            key: perm.key,
            name: perm.name,
            description: perm.description,
            category: perm.category,
            isSystem: true,
          },
        });
        permissions.push(permission);
      }

      logger.info(`Seeded ${permissions.length} system permissions`);
      return permissions;
    } catch (error) {
      logger.error('Error seeding permissions:', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions(category?: string) {
    try {
      const where: { category?: string } = {};
      if (category) {
        where.category = category;
      }

      const permissions = await prisma.permission.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });

      return permissions;
    } catch (error) {
      logger.error('Error getting permissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions by category
   */
  static async getPermissionsByCategory() {
    try {
      const permissions = await this.getAllPermissions();

      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
      }, {} as Record<string, typeof permissions>);

      return grouped;
    } catch (error) {
      logger.error('Error getting permissions by category:', error);
      throw error;
    }
  }

  /**
   * Get permission by key
   */
  static async getPermissionByKey(key: string) {
    try {
      const permission = await prisma.permission.findUnique({
        where: { key },
      });

      if (!permission) {
        throw new NotFoundError(`Permission not found: ${key}`);
      }

      return permission;
    } catch (error) {
      logger.error(`Error getting permission by key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(roleId: string) {
    try {
      const rolePermissions = await prisma.teamRolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map(rp => rp.permission);
    } catch (error) {
      logger.error(`Error getting permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a role has a specific permission
   */
  static async roleHasPermission(roleId: string, permissionKey: string): Promise<boolean> {
    try {
      const permission = await this.getPermissionByKey(permissionKey);

      const rolePermission = await prisma.teamRolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
      });

      return !!rolePermission;
    } catch (error) {
      logger.error(`Error checking permission ${permissionKey} for role ${roleId}:`, error);
      return false;
    }
  }

  /**
   * Get effective permissions for a user.
   * - SUPERADMIN, ADMIN_STAFF, ORGANIZER: all permissions (full access)
   * - ORGANIZER_STAFF, ORGANIZER_TELLER: permissions from their custom role
   * - ATTENDEE and others: no permissions
   */
  static async getUserEffectivePermissions(userId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          customRoleId: true,
        },
      });

      if (!user) {
        return [];
      }

      // Admin roles and organizer get all permissions
      if (
        user.role === 'SUPERADMIN' ||
        user.role === 'ADMIN_STAFF' ||
        user.role === 'ORGANIZER'
      ) {
        const allPermissions = await prisma.permission.findMany({ select: { key: true } });
        return allPermissions.map(p => p.key);
      }

      // Staff roles: return permissions from their custom role
      if (user.customRoleId) {
        const customPermissions = await this.getRolePermissions(user.customRoleId);
        return customPermissions.map(p => p.key);
      }

      // Default: no permissions
      return [];
    } catch (error) {
      logger.error(`Error getting effective permissions for user ${userId}:`, error);
      return [];
    }
  }
}