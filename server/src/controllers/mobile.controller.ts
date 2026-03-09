/**
 * Mobile Controller
 *
 * Handles mobile-specific API endpoints for iOS and Android apps
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { mobilePushService } from '../services/mobile-push.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';

export const mobileController = {
  /**
   * Register device for FCM push notifications
   * POST /api/v1/mobile/device/register
   */
  registerDevice: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { fcmToken, platform, deviceId, deviceModel, osVersion, appVersion } = req.body;

    if (!fcmToken) {
      throw new ValidationError('FCM token is required');
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      throw new ValidationError('Platform must be "ios" or "android"');
    }

    const device = await mobilePushService.registerDevice(userId, {
      fcmToken,
      platform,
      deviceId,
      deviceModel,
      osVersion,
      appVersion,
    });

    return res.status(201).json({
      success: true,
      message: 'Device registered for push notifications',
      data: {
        id: device.id,
        platform: device.platform,
        deviceModel: device.deviceModel,
      },
    });
  }),

  /**
   * Unregister device from push notifications
   * POST /api/v1/mobile/device/unregister
   */
  unregisterDevice: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
      throw new ValidationError('FCM token is required');
    }

    const success = await mobilePushService.unregisterDevice(userId, fcmToken);

    return res.json({
      success: true,
      message: success ? 'Device unregistered' : 'Device not found',
    });
  }),

  /**
   * Unregister all devices for the user (e.g., on logout from all devices)
   * DELETE /api/v1/mobile/device/unregister-all
   */
  unregisterAllDevices: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const result = await mobilePushService.unregisterAllDevices(userId);

    return res.json({
      success: true,
      message: `Unregistered ${result.count} device(s)`,
      data: result,
    });
  }),

  /**
   * Get user's registered devices
   * GET /api/v1/mobile/device/list
   */
  getDevices: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const devices = await mobilePushService.getUserDevices(userId);

    return res.json({
      success: true,
      data: devices,
    });
  }),

  /**
   * Subscribe device to event topic for updates
   * POST /api/v1/mobile/device/subscribe-event
   */
  subscribeToEvent: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { fcmToken, eventId } = req.body;

    if (!fcmToken || !eventId) {
      throw new ValidationError('FCM token and event ID are required');
    }

    const topic = `event_${eventId}`;
    const success = await mobilePushService.subscribeToTopic(fcmToken, topic);

    return res.json({
      success,
      message: success ? 'Subscribed to event updates' : 'Failed to subscribe',
      data: { topic },
    });
  }),

  /**
   * Unsubscribe device from event topic
   * POST /api/v1/mobile/device/unsubscribe-event
   */
  unsubscribeFromEvent: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { fcmToken, eventId } = req.body;

    if (!fcmToken || !eventId) {
      throw new ValidationError('FCM token and event ID are required');
    }

    const topic = `event_${eventId}`;
    const success = await mobilePushService.unsubscribeFromTopic(fcmToken, topic);

    return res.json({
      success,
      message: success ? 'Unsubscribed from event updates' : 'Failed to unsubscribe',
    });
  }),

  /**
   * Send test notification to device
   * POST /api/v1/mobile/device/test
   */
  sendTestNotification: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const result = await mobilePushService.sendToUser(userId, {
      title: 'Test Notification',
      body: 'Push notifications are working correctly!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    return res.json({
      success: true,
      message: 'Test notification sent',
      data: result,
    });
  }),

  /**
   * Get mobile dashboard summary
   * GET /api/v1/mobile/dashboard/summary
   * Lightweight endpoint optimized for mobile app home screen
   */
  getDashboardSummary: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const now = new Date();

    // Get counts in parallel
    const [
      upcomingTicketsCount,
      savedEventsCount,
      unreadNotificationsCount,
      recentTicket,
    ] = await Promise.all([
      // Upcoming tickets count
      prisma.eventRegistration.count({
        where: {
          attendeeId: userId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          event: {
            startDate: { gte: now },
          },
        },
      }),
      // Saved events count
      prisma.savedEvent.count({
        where: { userId },
      }),
      // Unread notifications count
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      // Most recent ticket with event info
      prisma.eventRegistration.findFirst({
        where: {
          attendeeId: userId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          event: {
            startDate: { gte: now },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          ticketNumber: true,
          qrCode: true,
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              location: true,
              image: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        counts: {
          upcomingTickets: upcomingTicketsCount,
          savedEvents: savedEventsCount,
          unreadNotifications: unreadNotificationsCount,
        },
        nextEvent: recentTicket ? {
          ticketId: recentTicket.id,
          ticketNumber: recentTicket.ticketNumber,
          qrCode: recentTicket.qrCode,
          event: recentTicket.event,
        } : null,
      },
    });
  }),

  /**
   * Get organizer dashboard stats for a specific event
   * GET /api/v1/mobile/dashboard/organizer/:eventId
   * Lightweight per-event stats optimized for the mobile organizer dashboard
   */
  getOrganizerEventDashboard: asyncHandler(async (req: Request, res: Response) => {
    const userId: string | undefined = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const eventId: string | undefined = typeof req.params.eventId === 'string'
      ? req.params.eventId
      : undefined;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Verify the user owns this event or is an admin
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        OR: [
          { organizerId: userId },
          { organizer: { role: { in: ['SUPERADMIN', 'ADMIN_STAFF'] } } },
        ],
      },
      select: { id: true, title: true },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied',
      });
    }

    // Get stats in parallel
    const [
      confirmedRegistrations,
      checkedInCount,
      currentlyInsideCount,
      recentActivity,
    ] = await Promise.all([
      // Total confirmed registrations with revenue
      prisma.eventRegistration.aggregate({
        where: {
          eventId,
          status: 'CONFIRMED',
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Checked-in count
      prisma.eventRegistration.count({
        where: {
          eventId,
          status: 'CONFIRMED',
          checkedInAt: { not: null },
        },
      }),
      // Currently inside venue count
      prisma.eventRegistration.count({
        where: {
          eventId,
          status: 'CONFIRMED',
          isCurrentlyInside: true,
        },
      }),
      // Recent activity (last 10 check-ins/registrations)
      prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: 'CONFIRMED',
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          attendee: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const ticketsSold: number = confirmedRegistrations._count ?? 0;
    const totalAmount = confirmedRegistrations._sum?.totalAmount;
    const revenue: number = totalAmount !== null && totalAmount !== undefined
      ? Number(totalAmount)
      : 0;
    const pending: number = ticketsSold - checkedInCount;

    // Format recent activity
    const formattedActivity = recentActivity.map(reg => {
      const name: string = [reg.attendee.firstName, reg.attendee.lastName]
        .filter(Boolean)
        .join(' ') || 'Attendee';

      if (reg.checkedInAt) {
        const timeDiff: number = Date.now() - reg.checkedInAt.getTime();
        return {
          type: 'check_in' as const,
          message: `${name} checked in`,
          time: formatRelativeTime(timeDiff),
        };
      }

      const timeDiff: number = Date.now() - reg.createdAt.getTime();
      const amount: number = Number(reg.totalAmount ?? 0);
      return {
        type: amount > 0 ? 'sale' as const : 'registration' as const,
        message: amount > 0
          ? `${name} purchased ticket`
          : `${name} registered`,
        time: formatRelativeTime(timeDiff),
      };
    });

    return res.json({
      success: true,
      data: {
        ticketsSold,
        revenue,
        checkedIn: checkedInCount,
        currentlyInside: currentlyInsideCount,
        pending,
        recentActivity: formattedActivity,
      },
    });
  }),

  /**
   * Batch sync offline scans (for staff/teller apps)
   * POST /api/v1/mobile/scan/sync
   * Processes multiple check-ins with idempotency
   */
  batchSyncScans: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { scans } = req.body;

    if (!Array.isArray(scans) || scans.length === 0) {
      throw new ValidationError('Scans array is required');
    }

    const results: Array<{
      qrCode: string;
      success: boolean;
      message: string;
      alreadyProcessed?: boolean;
    }> = [];

    // Process each scan with idempotency check
    for (const scan of scans) {
      const { qrCode, checkpointId, scannedAt, localId: _localId } = scan;

      if (!qrCode) {
        results.push({
          qrCode: qrCode || 'unknown',
          success: false,
          message: 'QR code is required',
        });
        continue;
      }

      try {
        // Find registration by QR code
        const registration = await prisma.eventRegistration.findFirst({
          where: { qrCode },
          include: {
            event: true,
          },
        });

        if (!registration) {
          results.push({
            qrCode,
            success: false,
            message: 'Invalid ticket',
          });
          continue;
        }

        // Check if already scanned (idempotency)
        if (registration.isCurrentlyInside) {
          results.push({
            qrCode,
            success: true,
            message: 'Already checked in',
            alreadyProcessed: true,
          });
          continue;
        }

        // Get current scan count for this registration
        const currentScanCount = await prisma.checkpointScan.count({
          where: {
            registrationId: registration.id,
            checkpointId: checkpointId || undefined,
          },
        });

        // Process check-in
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            isCurrentlyInside: true,
            checkedInAt: scannedAt ? new Date(scannedAt) : new Date(),
            checkedInBy: userId,
            reEntryCount: { increment: 1 },
          },
        });

        // Log the scan
        if (checkpointId) {
          await prisma.checkpointScan.create({
            data: {
              checkpointId,
              registrationId: registration.id,
              eventId: registration.eventId,
              scannedBy: userId,
              scannedAt: scannedAt ? new Date(scannedAt) : new Date(),
              scanNumber: currentScanCount + 1,
            },
          });
        }

        results.push({
          qrCode,
          success: true,
          message: 'Check-in successful',
        });
      } catch (error) {
        results.push({
          qrCode,
          success: false,
          message: error instanceof Error ? error.message : 'Processing error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        total: scans.length,
        successCount,
        failureCount,
        results,
      },
    });
  }),

  /**
   * Get event for offline caching
   * GET /api/v1/mobile/events/:eventId/offline
   * Returns event with all details and user's tickets in one call
   */
  getEventForOffline: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const eventId = (req.params.eventId as string) as string;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const [event, userTickets, isSaved] = await Promise.all([
      // Get full event details
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              organizationName: true,
              avatar: true,
            },
          },
        },
      }),
      // Get user's tickets for this event
      prisma.eventRegistration.findMany({
        where: {
          attendeeId: userId,
          eventId,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
        select: {
          id: true,
          ticketNumber: true,
          qrCode: true,
          ticketType: true,
          status: true,
          isCurrentlyInside: true,
          totalAmount: true,
          createdAt: true,
        },
      }),
      // Check if event is saved
      prisma.savedEvent.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      }),
    ]);

    if (!event) {
      throw new ValidationError('Event not found');
    }

    return res.json({
      success: true,
      data: {
        event: {
          ...event,
          isSaved: !!isSaved,
        },
        tickets: userTickets,
        cachedAt: new Date().toISOString(),
      },
    });
  }),
};

/** Format millisecond diff to a human-readable relative time string */
function formatRelativeTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
