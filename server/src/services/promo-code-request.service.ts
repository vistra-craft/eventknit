import { prisma } from '../config/database.js';
import { PromoCodeRequestStatus, UserRole, UserStatus } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { OrganizerService } from './organizer.service.js';
import { emailService } from './email.service.js';

export class PromoCodeRequestService {
  /**
   * Create a promo code request (organizer)
   */
  static async createRequest(
    organizerId: string,
    data: { eventId?: string; message?: string },
  ) {
    // Verify organizer has at least one approved event
    const hasApproved = await OrganizerService.hasApprovedEvent(organizerId);
    if (!hasApproved) {
      throw new ValidationError(
        'You need at least one approved event to request promo codes',
      );
    }

    // If eventId provided, verify it belongs to the organizer
    if (data.eventId) {
      const event = await prisma.event.findFirst({
        where: {
          id: data.eventId,
          organizerId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!event) {
        throw new ValidationError('Event not found or does not belong to you');
      }
    }

    const request = await prisma.promoCodeRequest.create({
      data: {
        organizerId,
        eventId: data.eventId || null,
        message: data.message || null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
        event: {
          select: { id: true, title: true },
        },
      },
    });

    // Notify admins
    this.notifyAdmins(request).catch((err) => {
      logger.error('Failed to notify admins of promo code request:', err);
    });

    return request;
  }

  /**
   * Get all requests with filtering (admin)
   */
  static async getRequests(filters: {
    status?: PromoCodeRequestStatus;
    organizerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.organizerId) where.organizerId = filters.organizerId;

    const [requests, total] = await Promise.all([
      prisma.promoCodeRequest.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organizationName: true,
            },
          },
          event: {
            select: { id: true, title: true },
          },
          reviewer: {
            select: { id: true, firstName: true, lastName: true },
          },
          promoCode: {
            select: {
              id: true,
              code: true,
              discountType: true,
              discountValue: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCodeRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get organizer's own requests
   */
  static async getOrganizerRequests(
    organizerId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.promoCodeRequest.findMany({
        where: { organizerId },
        include: {
          event: {
            select: { id: true, title: true },
          },
          promoCode: {
            select: {
              id: true,
              code: true,
              discountType: true,
              discountValue: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCodeRequest.count({ where: { organizerId } }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve a request (admin)
   */
  static async approveRequest(
    requestId: string,
    adminId: string,
    promoCodeId: string,
  ) {
    const request = await prisma.promoCodeRequest.findUnique({
      where: { id: requestId },
      include: {
        organizer: {
          select: { email: true, firstName: true },
        },
        event: {
          select: { title: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Promo code request not found');
    }

    if (request.status !== PromoCodeRequestStatus.PENDING) {
      throw new ValidationError('This request has already been reviewed');
    }

    // Verify promo code exists
    const promoCode = await prisma.promoCode.findUnique({
      where: { id: promoCodeId },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        validFrom: true,
        validUntil: true,
      },
    });

    if (!promoCode) {
      throw new NotFoundError('Promo code not found');
    }

    const updated = await prisma.promoCodeRequest.update({
      where: { id: requestId },
      data: {
        status: PromoCodeRequestStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        promoCodeId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: { id: true, title: true },
        },
        promoCode: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    // Notify organizer of approval
    emailService
      .sendPromoCodeRequestApproved(
        request.organizer.email,
        request.organizer.firstName || 'Organizer',
        promoCode,
        request.event?.title,
      )
      .catch((err) => {
        logger.error('Failed to send promo code approval email:', err);
      });

    return updated;
  }

  /**
   * Reject a request (admin)
   */
  static async rejectRequest(
    requestId: string,
    adminId: string,
    reason?: string,
  ) {
    const request = await prisma.promoCodeRequest.findUnique({
      where: { id: requestId },
      include: {
        organizer: {
          select: { email: true, firstName: true },
        },
        event: {
          select: { title: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Promo code request not found');
    }

    if (request.status !== PromoCodeRequestStatus.PENDING) {
      throw new ValidationError('This request has already been reviewed');
    }

    const updated = await prisma.promoCodeRequest.update({
      where: { id: requestId },
      data: {
        status: PromoCodeRequestStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason || null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: { id: true, title: true },
        },
      },
    });

    // Notify organizer of rejection
    emailService
      .sendPromoCodeRequestRejected(
        request.organizer.email,
        request.organizer.firstName || 'Organizer',
        reason,
        request.event?.title,
      )
      .catch((err) => {
        logger.error('Failed to send promo code rejection email:', err);
      });

    return updated;
  }

  /**
   * Get a single request by ID
   */
  static async getRequestById(id: string) {
    const request = await prisma.promoCodeRequest.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
        event: {
          select: { id: true, title: true },
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        promoCode: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Promo code request not found');
    }

    return request;
  }

  /**
   * Get count of pending requests (for admin badge)
   */
  static async getPendingCount() {
    return prisma.promoCodeRequest.count({
      where: { status: PromoCodeRequestStatus.PENDING },
    });
  }

  /**
   * Notify all active admins about a new promo code request
   */
  private static async notifyAdmins(request: {
    organizer: {
      firstName: string | null;
      lastName: string | null;
      email: string;
      organizationName: string | null;
    };
    event?: { title: string } | null;
    message?: string | null;
  }): Promise<void> {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPERADMIN, UserRole.ADMIN] },
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: { email: true, firstName: true },
    });

    if (admins.length === 0) {
      logger.warn(
        'No active admins found to notify about promo code request',
      );
      return;
    }

    const organizerName =
      `${request.organizer.firstName || ''} ${request.organizer.lastName || ''}`.trim() ||
      request.organizer.email;

    await Promise.allSettled(
      admins.map((admin) =>
        emailService.sendPromoCodeRequestNotification(
          admin.email,
          admin.firstName || 'Admin',
          {
            name: organizerName,
            email: request.organizer.email,
            organizationName: request.organizer.organizationName,
          },
          request.event?.title,
          request.message,
        ),
      ),
    );
  }
}
