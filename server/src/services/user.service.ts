import { prisma } from '../config/database.js';
import { RegistrationStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

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
        reg.paymentStatus === 'COMPLETED'
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
}

