import { prisma } from '../config/database.js';
import { logger } from './logger.js';
import { GeolocationService, type GeolocationData } from '../services/geolocation.service.js';

export interface AuditLogData {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  // If geolocation data is provided, skip auto-detection
  skipGeolocation?: boolean;
}

/**
 * Create an audit log entry
 * Automatically detects geolocation from IP if not provided
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    let geolocation: GeolocationData | null = null;

    // Auto-detect geolocation from IP if not provided and IP is available
    if (!data.skipGeolocation && data.ipAddress && !data.countryCode) {
      try {
        geolocation = await GeolocationService.getLocationFromIP(data.ipAddress);
      } catch (error) {
        // Log but don't fail - geolocation is optional
        logger.warn('Failed to get geolocation for audit log:', error);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        country: data.country || geolocation?.country || null,
        countryCode: data.countryCode || geolocation?.countryCode || null,
        region: data.region || geolocation?.region || null,
        city: data.city || geolocation?.city || null,
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
  STAFF_ASSIGNED_TO_EVENT: 'STAFF_ASSIGNED_TO_EVENT',
  STAFF_REMOVED_FROM_EVENT: 'STAFF_REMOVED_FROM_EVENT',
  STAFF_ASSIGNMENT_UPDATED: 'STAFF_ASSIGNMENT_UPDATED',
  
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
  
  // Payment and financial actions
  DISBURSEMENT_CREATED: 'DISBURSEMENT_CREATED',
  DISBURSEMENT_PROCESSED: 'DISBURSEMENT_PROCESSED',
  DISBURSEMENT_COMPLETED: 'DISBURSEMENT_COMPLETED',
  DISBURSEMENT_AUTO_CREATED: 'DISBURSEMENT_AUTO_CREATED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  PAYMENT_RECONCILIATION: 'PAYMENT_RECONCILIATION',
  
  // Security events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGIN_ATTEMPT_LOCKED: 'LOGIN_ATTEMPT_LOCKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  // GDPR / Privacy actions
  DATA_EXPORTED: 'DATA_EXPORTED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  DATA_ANONYMIZED: 'DATA_ANONYMIZED',

  // Credit/Voucher actions
  VOUCHER_CREATED: 'VOUCHER_CREATED',
  VOUCHER_REDEEMED: 'VOUCHER_REDEEMED',
  VOUCHER_DEACTIVATED: 'VOUCHER_DEACTIVATED',
  CREDIT_ADDED: 'CREDIT_ADDED',
  CREDIT_DEDUCTED: 'CREDIT_DEDUCTED',
} as const;



