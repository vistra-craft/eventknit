import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { NotificationPreferenceService } from '../services/notification-preference.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import { NotificationType, NotificationPriority } from '@prisma/client';

export class NotificationController {
  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  static async getUserNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        type,
        isRead,
        priority,
        eventId,
        limit,
        offset,
        startDate,
        endDate,
      } = req.query;

      const filters = {
        ...(type && { type: type as NotificationType }),
        ...(isRead !== undefined && { isRead: isRead === 'true' }),
        ...(priority && { priority: priority as NotificationPriority }),
        ...(eventId && { eventId: eventId as string }),
        ...(limit && { limit: parseInt(limit as string, 10) }),
        ...(offset && { offset: parseInt(offset as string, 10) }),
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
      };

      const notifications = await NotificationService.getUserNotifications(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  static async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const count = await NotificationService.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  static async markAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   */
  static async markAllAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await NotificationService.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { count: result.count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  static async deleteNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      await NotificationService.deleteNotification(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user notification preferences
   * GET /api/v1/users/me/notification-preferences
   */
  static async getPreferences(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const preferences = await NotificationPreferenceService.getUserPreferences(req.user.id);

      res.status(200).json({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user notification preferences
   * PUT /api/v1/users/me/notification-preferences
   */
  static async updatePreferences(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        emailEnabled,
        smsEnabled,
        pushEnabled,
        inAppEnabled,
        eventReminders,
        eventUpdates,
        eventCancellations,
        paymentNotifications,
        marketingEmails,
        systemAnnouncements,
        registrationUpdates,
        staffNotifications,
        reminderFrequency,
      } = req.body;

      // Validate reminderFrequency
      if (reminderFrequency && !['all', 'daily_digest', 'weekly_digest', 'none'].includes(reminderFrequency)) {
        throw new ValidationError('Invalid reminderFrequency. Must be: all, daily_digest, weekly_digest, or none');
      }

      // Force SMS to be disabled (we don't use SMS in this system)
      if (smsEnabled === true) {
        throw new ValidationError('SMS notifications are not available in this system. Only email notifications are supported.');
      }

      const preferences = await NotificationPreferenceService.updatePreferences(req.user.id, {
        emailEnabled,
        smsEnabled,
        pushEnabled,
        inAppEnabled,
        eventReminders,
        eventUpdates,
        eventCancellations,
        paymentNotifications,
        marketingEmails,
        systemAnnouncements,
        registrationUpdates,
        staffNotifications,
        reminderFrequency,
      });

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  }
}

