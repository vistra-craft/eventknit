import { prisma } from '../config/database.js';
import { RegistrationStatus, UserRole, UserStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError, ConflictError, NotFoundError } from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';

export class UserService {
  /**
   * Get user dashboard statistics
   * Similar to Eventbrite's user dashboard stats
   */
  static async getDashboardStats(userId: string) {
    try {
      // Get all user registrations
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          attendeeId: userId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              category: true,
              isFree: true,
              price: true,
            },
          },
        },
      });

      const now = new Date();

      // Calculate statistics
      const totalEvents = registrations.length;
      
      // Separate upcoming and past events
      const upcomingEvents = registrations.filter(reg => {
        const eventStart = new Date(reg.event.startDate);
        return eventStart > now;
      });

      const pastEvents = registrations.filter(reg => {
        const eventEnd = reg.event.endDate ? new Date(reg.event.endDate) : new Date(reg.event.startDate);
        return eventEnd < now;
      });

      // Calculate total spent (only from paid events with completed payment)
      const paidRegistrations = registrations.filter(reg => 
        !reg.event.isFree && 
        reg.paymentStatus === 'COMPLETED',
      );
      
      const totalSpent = paidRegistrations.reduce((sum, reg) => {
        return sum + Number(reg.totalAmount || 0);
      }, 0);

      // Events this month
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const eventsThisMonth = registrations.filter(reg => {
        const eventDate = new Date(reg.event.startDate);
        return eventDate.getMonth() === currentMonth && 
               eventDate.getFullYear() === currentYear;
      }).length;

      // Favorite category (most registered category)
      const categoryCount: Record<string, number> = {};
      registrations.forEach(reg => {
        const category = reg.event.category || 'Uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const favoriteCategory = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

      // Get recent activity (last 5 registrations)
      const recentActivity = registrations
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(reg => ({
          id: reg.id,
          eventTitle: reg.event.title,
          eventId: reg.event.id,
          date: reg.createdAt,
          status: reg.status,
          paymentStatus: reg.paymentStatus,
        }));

      // Get upcoming events (next 3)
      const upcomingEventsList = upcomingEvents
        .sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime())
        .slice(0, 3)
        .map(reg => ({
          id: reg.event.id,
          title: reg.event.title,
          startDate: reg.event.startDate,
          category: reg.event.category,
          registrationId: reg.id,
        }));

      return {
        stats: {
          totalEvents: {
            value: totalEvents,
            label: 'Total Events',
          },
          upcomingEvents: {
            value: upcomingEvents.length,
            label: 'Upcoming Events',
          },
          pastEvents: {
            value: pastEvents.length,
            label: 'Past Events',
          },
          totalSpent: {
            value: `$${totalSpent.toFixed(2)}`,
            label: 'Total Spent',
          },
          eventsThisMonth: {
            value: eventsThisMonth,
            label: 'Events This Month',
          },
          favoriteCategory: {
            value: favoriteCategory,
            label: 'Favorite Category',
          },
        },
        recentActivity,
        upcomingEvents: upcomingEventsList,
      };
    } catch (error) {
      logger.error('Failed to get user dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Switch user role from ATTENDEE to ORGANIZER
   * Requires organization details for organizer role
   */
  static async becomeOrganizer(
    userId: string,
    data: {
      organizationName: string;
      businessEmail?: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Only attendees can become organizers through this method
    if (user.role !== UserRole.ATTENDEE) {
      throw new ValidationError(
        `Cannot switch to organizer from ${user.role}. Only attendees can become organizers.`,
      );
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new ValidationError('Only active users can switch roles');
    }

    // Validate required fields
    if (!data.organizationName || data.organizationName.trim() === '') {
      throw new ValidationError('Organization name is required to become an organizer');
    }

    // Update user role to ORGANIZER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: UserRole.ORGANIZER,
        organizationName: data.organizationName.trim(),
        businessEmail: data.businessEmail?.trim() || user.email,
        onboardingCompleted: false, // Reset onboarding for new organizers
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        onboardingCompleted: true,
        avatar: true,
        companyAffiliation: true,
        phoneNumber: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: AuditActions.USER_ROLE_CHANGED,
      entity: 'User',
      entityId: userId,
      metadata: {
        previousRole: UserRole.ATTENDEE,
        newRole: UserRole.ORGANIZER,
        organizationName: data.organizationName,
        selfInitiated: true,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User ${userId} switched from ATTENDEE to ORGANIZER`);

    return updatedUser;
  }

  /**
   * Switch user role from ORGANIZER to ATTENDEE
   * Note: This will remove organizer privileges but preserve the organization data
   */
  static async becomeAttendee(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Only organizers (not staff/teller) can become attendees through this method
    if (user.role !== UserRole.ORGANIZER) {
      throw new ValidationError(
        `Cannot switch to attendee from ${user.role}. Only organizers can switch to attendee.`,
      );
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new ValidationError('Only active users can switch roles');
    }

    // Check if organizer has active events
    const activeEvents = await prisma.event.count({
      where: {
        organizerId: userId,
        deletedAt: null,
        endDate: { gte: new Date() },
      },
    });

    if (activeEvents > 0) {
      throw new ConflictError(
        `Cannot switch to attendee while you have ${activeEvents} active event(s). ` +
        'Please complete or cancel your events first.',
      );
    }

    // Update user role to ATTENDEE
    // Note: We preserve organizationName and businessEmail in case they want to switch back
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: UserRole.ATTENDEE,
        // Don't clear organization data - they may want to switch back
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        avatar: true,
        companyAffiliation: true,
        phoneNumber: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: AuditActions.USER_ROLE_CHANGED,
      entity: 'User',
      entityId: userId,
      metadata: {
        previousRole: UserRole.ORGANIZER,
        newRole: UserRole.ATTENDEE,
        selfInitiated: true,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User ${userId} switched from ORGANIZER to ATTENDEE`);

    return updatedUser;
  }

  /**
   * Get user's current role and available role switches
   */
  static async getRoleSwitchOptions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        organizationName: true,
        businessEmail: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const options: {
      currentRole: UserRole;
      canBecomeOrganizer: boolean;
      canBecomeAttendee: boolean;
      hasOrganizerHistory: boolean;
      blockedReason?: string;
    } = {
      currentRole: user.role,
      canBecomeOrganizer: false,
      canBecomeAttendee: false,
      hasOrganizerHistory: !!(user.organizationName || user.businessEmail),
    };

    if (user.status !== UserStatus.ACTIVE) {
      options.blockedReason = 'Account is not active';
      return options;
    }

    if (user.role === UserRole.ATTENDEE) {
      options.canBecomeOrganizer = true;
    } else if (user.role === UserRole.ORGANIZER) {
      // Check for active events
      const activeEvents = await prisma.event.count({
        where: {
          organizerId: userId,
          deletedAt: null,
          endDate: { gte: new Date() },
        },
      });

      if (activeEvents === 0) {
        options.canBecomeAttendee = true;
      } else {
        options.blockedReason = `You have ${activeEvents} active event(s). Complete or cancel them to switch roles.`;
      }
    } else {
      options.blockedReason = 'Role switching is only available for Attendee and Organizer roles';
    }

    return options;
  }
}

