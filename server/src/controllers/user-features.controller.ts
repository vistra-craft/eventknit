import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { TicketResaleService } from '../services/ticket-resale.service.js';
import { DigitalWalletService } from '../services/digital-wallet.service.js';
import { EventCalendarService } from '../services/event-calendar.service.js';
import { PersonalEventFeedService } from '../services/personal-event-feed.service.js';
import { EventUpdatesSubscriptionService } from '../services/event-updates-subscription.service.js';

export class UserFeaturesController {
  // ========== Ticket Resale ==========

  static async listTicketForResale(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { registrationId, resalePrice, expiresAt } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await TicketResaleService.listTicketForResale(
        userId,
        registrationId,
        resalePrice,
        expiresAt ? new Date(expiresAt) : undefined,
      );

      res.status(201).json({
        success: true,
        message: 'Ticket listed for resale successfully',
        data: { resale: result },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketplaceTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, category, minPrice, maxPrice, page, limit } = req.query;

      const filters: {
        eventId?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        page?: number;
        limit?: number;
      } = {};
      if (eventId) filters.eventId = eventId as string;
      if (category) filters.category = category as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (page) filters.page = parseInt(page as string, 10);
      if (limit) filters.limit = parseInt(limit as string, 10);

      const result = await TicketResaleService.getMarketplaceTickets(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserResales(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status } = req.query;
      const resales = await TicketResaleService.getUserResales(userId, status as string);

      res.status(200).json({
        success: true,
        data: { resales },
      });
    } catch (error) {
      next(error);
    }
  }

  /** @deprecated Use initializeResalePayment + verifyResalePayment instead */
  static async purchaseResaleTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const resaleId = req.params.resaleId as string;
      await TicketResaleService.purchaseResaleTicket(userId, resaleId);

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async initializeResalePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const resaleId = req.params.resaleId as string;
      const email = req.user?.email;

      if (!email) {
        res.status(400).json({ success: false, message: 'User email not available' });
        return;
      }

      const result = await TicketResaleService.initializeResalePayment(userId, resaleId, email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyResalePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const reference = req.query.reference as string;
      if (!reference) {
        res.status(400).json({ success: false, message: 'Payment reference is required' });
        return;
      }

      const result = await TicketResaleService.verifyResalePayment(reference, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelResale(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const resaleId = (req.params.resaleId as string) as string;
      await TicketResaleService.cancelResale(userId, resaleId);

      res.status(200).json({
        success: true,
        message: 'Resale cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Digital Wallet ==========

  static async getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const wallet = await DigitalWalletService.getOrCreateWallet(userId);

      res.status(200).json({
        success: true,
        data: { wallet },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addTicketToWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { registrationId } = req.body;
      const walletTicket = await DigitalWalletService.addTicketToWallet(userId, registrationId);

      res.status(201).json({
        success: true,
        message: 'Ticket added to wallet successfully',
        data: { walletTicket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeTicketFromWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const registrationId = (req.params.registrationId as string) as string;
      await DigitalWalletService.removeTicketFromWallet(userId, registrationId);

      res.status(200).json({
        success: true,
        message: 'Ticket removed from wallet successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateWalletPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { autoAddTickets, backupEnabled } = req.body;
      const wallet = await DigitalWalletService.updateWalletPreferences(userId, {
        autoAddTickets,
        backupEnabled,
      });

      res.status(200).json({
        success: true,
        message: 'Wallet preferences updated successfully',
        data: { wallet },
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateAppleWalletPass(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const registrationId = (req.params.registrationId as string) as string;
      const result = await DigitalWalletService.generateAppleWalletPass(userId, registrationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateGooglePayPass(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const registrationId = (req.params.registrationId as string) as string;
      const result = await DigitalWalletService.generateGooglePayPass(userId, registrationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Event Calendar Integration ==========

  static async syncToCalendar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { registrationId, calendarType, reminderMinutes } = req.body;
      const result = await EventCalendarService.syncToCalendar(
        userId,
        registrationId,
        calendarType,
        reminderMinutes,
      );

      res.status(201).json({
        success: true,
        message: 'Event synced to calendar successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserCalendarSyncs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const syncs = await EventCalendarService.getUserCalendarSyncs(userId);

      res.status(200).json({
        success: true,
        data: { syncs },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeCalendarSync(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const syncId = (req.params.syncId as string) as string;
      await EventCalendarService.removeCalendarSync(userId, syncId);

      res.status(200).json({
        success: true,
        message: 'Calendar sync removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Personal Event Feed ==========

  static async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const feed = await PersonalEventFeedService.getOrCreateFeed(userId);

      res.status(200).json({
        success: true,
        data: { feed },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshFeed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await PersonalEventFeedService.refreshFeed(userId);

      res.status(200).json({
        success: true,
        message: 'Feed refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateFeedPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { preferences, filters } = req.body;
      const feed = await PersonalEventFeedService.updateFeedPreferences(userId, {
        preferences,
        filters,
      });

      res.status(200).json({
        success: true,
        message: 'Feed preferences updated successfully',
        data: { feed },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markFeedItemViewed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const itemId = (req.params.itemId as string) as string;
      await PersonalEventFeedService.markItemViewed(userId, itemId);

      res.status(200).json({
        success: true,
        message: 'Item marked as viewed',
      });
    } catch (error) {
      next(error);
    }
  }

  static async dismissFeedItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const itemId = (req.params.itemId as string) as string;
      await PersonalEventFeedService.dismissItem(userId, itemId);

      res.status(200).json({
        success: true,
        message: 'Item dismissed',
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Event Updates Subscription ==========

  static async subscribeToEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { eventId, updateTypes, channels } = req.body;
      const subscription = await EventUpdatesSubscriptionService.subscribeToEvent(
        userId,
        eventId,
        updateTypes,
        channels,
      );

      res.status(201).json({
        success: true,
        message: 'Subscribed to event updates successfully',
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  static async unsubscribeFromEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      await EventUpdatesSubscriptionService.unsubscribeFromEvent(userId, eventId);

      res.status(200).json({
        success: true,
        message: 'Unsubscribed from event updates successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserSubscriptions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { activeOnly } = req.query;
      const subscriptions = await EventUpdatesSubscriptionService.getUserSubscriptions(
        userId,
        activeOnly !== 'false',
      );

      res.status(200).json({
        success: true,
        data: { subscriptions },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSubscriptionPreferences(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { updateTypes, channels } = req.body;
      const subscription = await EventUpdatesSubscriptionService.updateSubscriptionPreferences(
        userId,
        eventId,
        { updateTypes, channels },
      );

      res.status(200).json({
        success: true,
        message: 'Subscription preferences updated successfully',
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }
}
