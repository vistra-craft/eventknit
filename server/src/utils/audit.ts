import { prisma } from '../config/database';
import { logger } from './logger';

export interface AuditLogData {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main flow
    logger.error('Failed to create audit log:', error);
  }
};

/**
 * Audit log actions
 */
export const AuditActions = {
  // User actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  USER_EMAIL_CHANGED: 'USER_EMAIL_CHANGED',
  
  // Staff management
  STAFF_CREATED: 'STAFF_CREATED',
  STAFF_DELETED: 'STAFF_DELETED',
  STAFF_DEACTIVATED: 'STAFF_DEACTIVATED',
  
  // Event actions
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_DELETED: 'EVENT_DELETED',
  EVENT_PUBLISHED: 'EVENT_PUBLISHED',
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  
  // Ticket actions
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  TICKET_PURCHASED: 'TICKET_PURCHASED',
  TICKET_CANCELLED: 'TICKET_CANCELLED',
  TICKET_REFUNDED: 'TICKET_REFUNDED',
  
  // Admin actions
  ADMIN_USER_CREATED: 'ADMIN_USER_CREATED',
  ADMIN_USER_INVITED: 'ADMIN_USER_INVITED',
  ADMIN_ORGANIZER_APPROVED: 'ADMIN_ORGANIZER_APPROVED',
  ADMIN_ORGANIZER_REJECTED: 'ADMIN_ORGANIZER_REJECTED',
  EVENT_APPROVED: 'EVENT_APPROVED',
  EVENT_REJECTED: 'EVENT_REJECTED',
  
  // Invitation actions
  INVITATION_CREATED: 'INVITATION_CREATED',
  INVITATION_UPDATED: 'INVITATION_UPDATED',
  INVITATION_REVOKED: 'INVITATION_REVOKED',
  INVITATION_DELETED: 'INVITATION_DELETED',
  REGISTRATION_VIA_INVITATION: 'REGISTRATION_VIA_INVITATION',
  
  // Template actions
  TEMPLATE_CREATED: 'TEMPLATE_CREATED',
  TEMPLATE_UPDATED: 'TEMPLATE_UPDATED',
  TEMPLATE_DELETED: 'TEMPLATE_DELETED',
  
  // Featured event actions
  FEATURED_EVENT_CREATED: 'FEATURED_EVENT_CREATED',
  FEATURED_EVENT_UPDATED: 'FEATURED_EVENT_UPDATED',
  FEATURED_EVENT_DELETED: 'FEATURED_EVENT_DELETED',
} as const;



