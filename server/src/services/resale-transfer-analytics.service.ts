import { prisma } from '../config/database';

/**
 * Service for resale & transfer analytics used by organizer and admin dashboards.
 */
export class ResaleTransferAnalyticsService {

  // ─── Organizer: Event-level resale/transfer stats ───

  static async getEventResaleStats(eventId: string, organizerId: string, isAdmin = false) {
    // Verify event belongs to organizer (admins bypass ownership check)
    const event = await prisma.event.findFirst({
      where: { id: eventId, ...(isAdmin ? {} : { organizerId }), deletedAt: null },
      select: { id: true },
    });
    if (!event) {
      throw new Error('Event not found or access denied');
    }

    const [aggregates, statusCounts] = await Promise.all([
      prisma.ticketResale.aggregate({
        where: {
          registration: { eventId },
        },
        _sum: {
          resalePrice: true,
          platformFee: true,
          sellerPayout: true,
        },
        _count: true,
      }),
      prisma.ticketResale.groupBy({
        by: ['status'],
        where: {
          registration: { eventId },
        },
        _count: true,
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count])
    );

    return {
      totalListings: aggregates._count,
      activeListings: statusMap['LISTED'] || 0,
      reservedListings: statusMap['RESERVED'] || 0,
      soldListings: statusMap['SOLD'] || 0,
      cancelledListings: statusMap['CANCELLED'] || 0,
      expiredListings: statusMap['EXPIRED'] || 0,
      totalResaleValue: Number(aggregates._sum.resalePrice || 0),
      totalPlatformFees: Number(aggregates._sum.platformFee || 0),
      totalSellerPayouts: Number(aggregates._sum.sellerPayout || 0),
    };
  }

  static async getEventResaleListings(
    eventId: string,
    organizerId: string,
    filters: { status?: string; page?: number; limit?: number } = {},
    isAdmin = false
  ) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, ...(isAdmin ? {} : { organizerId }), deletedAt: null },
      select: { id: true },
    });
    if (!event) {
      throw new Error('Event not found or access denied');
    }

    const { status, page = 1, limit = 20 } = filters;
    const where = {
      registration: { eventId },
      ...(status ? { status } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.ticketResale.findMany({
        where,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true, email: true } },
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          registration: {
            select: {
              id: true,
              ticketLineItems: { select: { ticketType: true, quantity: true } },
            },
          },
        },
        orderBy: { listedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticketResale.count({ where }),
    ]);

    return {
      listings: listings.map((l) => ({
        id: l.id,
        status: l.status,
        originalPrice: Number(l.originalPrice),
        resalePrice: Number(l.resalePrice),
        currency: l.currency,
        platformFee: l.platformFee ? Number(l.platformFee) : null,
        sellerPayout: l.sellerPayout ? Number(l.sellerPayout) : null,
        listedAt: l.listedAt,
        soldAt: l.soldAt,
        expiresAt: l.expiresAt,
        seller: l.seller,
        buyer: l.buyer,
        ticketType: l.registration.ticketLineItems[0]?.ticketType || 'Unknown',
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getEventTransferStats(eventId: string, organizerId: string, isAdmin = false) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, ...(isAdmin ? {} : { organizerId }), deletedAt: null },
      select: { id: true },
    });
    if (!event) {
      throw new Error('Event not found or access denied');
    }

    const [total, statusCounts] = await Promise.all([
      prisma.ticketTransfer.count({
        where: { registration: { eventId } },
      }),
      prisma.ticketTransfer.groupBy({
        by: ['status'],
        where: { registration: { eventId } },
        _count: true,
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count])
    );

    return {
      totalTransfers: total,
      pendingTransfers: statusMap['PENDING'] || 0,
      acceptedTransfers: statusMap['ACCEPTED'] || 0,
      rejectedTransfers: statusMap['REJECTED'] || 0,
      cancelledTransfers: statusMap['CANCELLED'] || 0,
      expiredTransfers: statusMap['EXPIRED'] || 0,
    };
  }

  static async getEventTransferHistory(
    eventId: string,
    organizerId: string,
    filters: { status?: string; page?: number; limit?: number } = {},
    isAdmin = false
  ) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, ...(isAdmin ? {} : { organizerId }), deletedAt: null },
      select: { id: true },
    });
    if (!event) {
      throw new Error('Event not found or access denied');
    }

    const { status, page = 1, limit = 20 } = filters;
    const where = {
      registration: { eventId },
      ...(status ? { status } : {}),
    };

    const [transfers, total] = await Promise.all([
      prisma.ticketTransfer.findMany({
        where,
        include: {
          fromUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          toUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          registration: {
            select: {
              id: true,
              ticketLineItems: { select: { ticketType: true, quantity: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticketTransfer.count({ where }),
    ]);

    return {
      transfers: transfers.map((t) => ({
        id: t.id,
        status: t.status,
        message: t.message,
        fromUser: t.fromUser,
        toUser: t.toUser,
        toEmail: t.toEmail,
        createdAt: t.createdAt,
        acceptedAt: t.acceptedAt,
        expiresAt: t.expiresAt,
        ticketType: t.registration.ticketLineItems[0]?.ticketType || 'Unknown',
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Admin: Platform-wide resale/transfer stats ───

  static async getPlatformResaleStats(filters: { startDate?: string; endDate?: string } = {}) {
    const dateFilter = this.buildDateFilter(filters.startDate, filters.endDate);

    const [aggregates, statusCounts, topEvents] = await Promise.all([
      prisma.ticketResale.aggregate({
        where: { ...(dateFilter ? { listedAt: dateFilter } : {}) },
        _sum: {
          resalePrice: true,
          platformFee: true,
          sellerPayout: true,
        },
        _count: true,
      }),
      prisma.ticketResale.groupBy({
        by: ['status'],
        where: { ...(dateFilter ? { listedAt: dateFilter } : {}) },
        _count: true,
      }),
      // Top events by resale volume
      prisma.$queryRaw`
        SELECT e.id, e.title, COUNT(tr.id)::int as "resaleCount",
               COALESCE(SUM(tr."resalePrice"), 0)::float as "totalValue",
               COALESCE(SUM(tr."platformFee"), 0)::float as "totalFees"
        FROM "TicketResale" tr
        JOIN "EventRegistration" er ON tr."registrationId" = er.id
        JOIN "Event" e ON er."eventId" = e.id
        WHERE tr.status = 'SOLD'
        GROUP BY e.id, e.title
        ORDER BY "resaleCount" DESC
        LIMIT 10
      ` as Promise<Array<{ id: string; title: string; resaleCount: number; totalValue: number; totalFees: number }>>,
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count])
    );

    // Pending seller payouts (sold but not yet disbursed)
    const pendingPayouts = await prisma.ticketResale.aggregate({
      where: {
        status: 'SOLD',
        paymentStatus: 'COMPLETED',
      },
      _sum: { sellerPayout: true },
      _count: true,
    });

    return {
      totalListings: aggregates._count,
      activeListings: statusMap['LISTED'] || 0,
      soldListings: statusMap['SOLD'] || 0,
      cancelledListings: statusMap['CANCELLED'] || 0,
      expiredListings: statusMap['EXPIRED'] || 0,
      totalResaleValue: Number(aggregates._sum.resalePrice || 0),
      totalPlatformFees: Number(aggregates._sum.platformFee || 0),
      totalSellerPayouts: Number(aggregates._sum.sellerPayout || 0),
      pendingPayouts: {
        count: pendingPayouts._count,
        amount: Number(pendingPayouts._sum.sellerPayout || 0),
      },
      topEvents,
    };
  }

  static async getPlatformTransferStats(filters: { startDate?: string; endDate?: string } = {}) {
    const dateFilter = this.buildDateFilter(filters.startDate, filters.endDate);

    const [total, statusCounts] = await Promise.all([
      prisma.ticketTransfer.count({
        where: { ...(dateFilter ? { createdAt: dateFilter } : {}) },
      }),
      prisma.ticketTransfer.groupBy({
        by: ['status'],
        where: { ...(dateFilter ? { createdAt: dateFilter } : {}) },
        _count: true,
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count])
    );

    return {
      totalTransfers: total,
      pendingTransfers: statusMap['PENDING'] || 0,
      acceptedTransfers: statusMap['ACCEPTED'] || 0,
      rejectedTransfers: statusMap['REJECTED'] || 0,
      cancelledTransfers: statusMap['CANCELLED'] || 0,
      expiredTransfers: statusMap['EXPIRED'] || 0,
    };
  }

  static async getPlatformResaleActivity(
    filters: { status?: string; eventId?: string; page?: number; limit?: number } = {}
  ) {
    const { status, eventId, page = 1, limit = 25 } = filters;

    const where = {
      ...(status ? { status } : {}),
      ...(eventId ? { registration: { eventId } } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.ticketResale.findMany({
        where,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true, email: true } },
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          registration: {
            select: {
              id: true,
              event: { select: { id: true, title: true } },
              ticketLineItems: { select: { ticketType: true, quantity: true } },
            },
          },
        },
        orderBy: { listedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticketResale.count({ where }),
    ]);

    return {
      listings: listings.map((l) => ({
        id: l.id,
        status: l.status,
        originalPrice: Number(l.originalPrice),
        resalePrice: Number(l.resalePrice),
        currency: l.currency,
        platformFee: l.platformFee ? Number(l.platformFee) : null,
        sellerPayout: l.sellerPayout ? Number(l.sellerPayout) : null,
        paymentStatus: l.paymentStatus,
        listedAt: l.listedAt,
        soldAt: l.soldAt,
        expiresAt: l.expiresAt,
        seller: l.seller,
        buyer: l.buyer,
        event: l.registration.event,
        ticketType: l.registration.ticketLineItems[0]?.ticketType || 'Unknown',
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getResalePendingPayouts(
    filters: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 25 } = filters;

    const where = {
      status: 'SOLD' as const,
      paymentStatus: 'COMPLETED' as const,
    };

    const [resales, total, summary] = await Promise.all([
      prisma.ticketResale.findMany({
        where,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true, email: true } },
          registration: {
            select: {
              event: { select: { id: true, title: true } },
              ticketLineItems: { select: { ticketType: true } },
            },
          },
        },
        orderBy: { soldAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticketResale.count({ where }),
      prisma.ticketResale.aggregate({
        where,
        _sum: { sellerPayout: true, platformFee: true },
        _count: true,
      }),
    ]);

    return {
      payouts: resales.map((r) => ({
        id: r.id,
        seller: r.seller,
        event: r.registration.event,
        ticketType: r.registration.ticketLineItems[0]?.ticketType || 'Unknown',
        resalePrice: Number(r.resalePrice),
        platformFee: r.platformFee ? Number(r.platformFee) : 0,
        sellerPayout: r.sellerPayout ? Number(r.sellerPayout) : 0,
        currency: r.currency,
        soldAt: r.soldAt,
        paymentReference: r.paymentReference,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalPending: summary._count,
        totalPayoutAmount: Number(summary._sum.sellerPayout || 0),
        totalPlatformFees: Number(summary._sum.platformFee || 0),
      },
    };
  }

  // ─── Helpers ───

  private static buildDateFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return null;
    const filter: { gte?: Date; lte?: Date } = {};
    if (startDate) filter.gte = new Date(startDate);
    if (endDate) filter.lte = new Date(endDate);
    return filter;
  }
}
