import { Request, Response, NextFunction } from 'express';
import { UserDashboardService } from '../services/user-dashboard.service.js';
import { EventReviewService } from '../services/event-review.service.js';
import { TicketTransferService } from '../services/ticket-transfer.service.js';
import { EventCollectionService } from '../services/event-collection.service.js';
import { UserInterestService } from '../services/user-interest.service.js';
import { SavedSearchService } from '../services/saved-search.service.js';
import { DirectMessageService } from '../services/direct-message.service.js';
import { SocialNetworkingService } from '../services/social-networking.service.js';
import { EventShareService } from '../services/event-share.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class UserDashboardController {
  /**
   * Check if user is registered for an event
   */
  static async getRegistrationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.params.eventId as string;
      const { prisma } = await import('../config/database.js');

      const registration = await prisma.eventRegistration.findUnique({
        where: {
          eventId_attendeeId: {
            eventId,
            attendeeId: req.user.id,
          },
        },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });

      const isRegistered = registration !== null && registration.status !== 'CANCELLED';

      res.status(200).json({
        success: true,
        data: {
          isRegistered,
          registrationId: isRegistered ? registration!.id : null,
          status: isRegistered ? registration!.status : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get personalized event recommendations
   */
  static async getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const recommendations = await UserDashboardService.getPersonalizedRecommendations(req.user.id, limit);

      res.status(200).json({
        success: true,
        data: { recommendations },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get personal analytics
   */
  static async getPersonalAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const analytics = await UserDashboardService.getPersonalAnalytics(req.user.id);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity history
   */
  static async getActivityHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        activityType: req.query.activityType as string | undefined,
      };

      const result = await UserDashboardService.getActivityHistory(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update event review
   */
  static async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { rating, title, review, pros, cons, registrationId } = req.body;

      const reviewData = await EventReviewService.createOrUpdateReview(req.user.id, eventId, {
        rating,
        title,
        review,
        pros,
        cons,
        registrationId,
      });

      res.status(200).json({
        success: true,
        data: { review: reviewData },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event reviews
   */
  static async getEventReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.params.eventId as string) as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        rating: req.query.rating ? parseInt(req.query.rating as string, 10) : undefined,
        status: req.query.status as string | undefined,
      };

      const result = await EventReviewService.getEventReviews(eventId, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark review as helpful
   */
  static async markReviewHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const reviewId = (req.params.reviewId as string) as string;
      const review = await EventReviewService.markReviewHelpful(reviewId, req.user.id);

      res.status(200).json({
        success: true,
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transfer details by token (public, no auth required)
   */
  static async getTransferByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transferToken = req.params.transferToken as string;
      const transfer = await TicketTransferService.getTransferByToken(transferToken);

      res.status(200).json({
        success: true,
        data: { transfer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiate ticket transfer
   */
  static async initiateTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const registrationId = (req.params.registrationId as string) as string;
      const { toUserId, toEmail, message } = req.body;

      const transfer = await TicketTransferService.initiateTransfer(req.user.id, registrationId, {
        toUserId,
        toEmail,
        message,
      });

      res.status(200).json({
        success: true,
        data: { transfer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept ticket transfer
   */
  static async acceptTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const transferToken = (req.params.transferToken as string) as string;
      const result = await TicketTransferService.acceptTransfer(transferToken, req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel ticket transfer
   */
  static async cancelTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const transferId = (req.params.transferId as string) as string;
      const transfer = await TicketTransferService.cancelTransfer(transferId, req.user.id);

      res.status(200).json({
        success: true,
        data: { transfer },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transfer history
   */
  static async getTransferHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        type: req.query.type as 'sent' | 'received' | undefined,
      };

      const result = await TicketTransferService.getTransferHistory(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Event Collections
  static async createCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collection = await EventCollectionService.createCollection(req.user.id, req.body);
      res.status(200).json({ success: true, data: { collection } });
    } catch (error) {
      next(error);
    }
  }

  static async getUserCollections(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        isPublic: req.query.isPublic === 'true' ? true : undefined,
      };

      const result = await EventCollectionService.getUserCollections(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await EventCollectionService.getPublicCollections(filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCollectionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const collectionId = (req.params.collectionId as string) as string;
      const collection = await EventCollectionService.getCollectionById(collectionId, req.user?.id);
      res.status(200).json({ success: true, data: { collection } });
    } catch (error) {
      next(error);
    }
  }

  static async addEventToCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collectionId = (req.params.collectionId as string) as string;
      const eventId = (req.params.eventId as string) as string;
      const { notes } = req.body;
      const item = await EventCollectionService.addEventToCollection(collectionId, eventId, req.user.id, notes);
      res.status(200).json({ success: true, data: { item } });
    } catch (error) {
      next(error);
    }
  }

  static async removeEventFromCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collectionId = (req.params.collectionId as string) as string;
      const eventId = (req.params.eventId as string) as string;
      const result = await EventCollectionService.removeEventFromCollection(collectionId, eventId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async toggleFollowCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collectionId = (req.params.collectionId as string) as string;
      const result = await EventCollectionService.toggleFollowCollection(collectionId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collectionId = (req.params.collectionId as string) as string;
      const collection = await EventCollectionService.updateCollection(collectionId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { collection } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCollection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collectionId = (req.params.collectionId as string) as string;
      const result = await EventCollectionService.deleteCollection(collectionId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // User Interests
  static async upsertInterest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const interest = await UserInterestService.upsertInterest(req.user.id, req.body);
      res.status(200).json({ success: true, data: { interest } });
    } catch (error) {
      next(error);
    }
  }

  static async getUserInterests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const interests = await UserInterestService.getUserInterests(req.user.id);
      res.status(200).json({ success: true, data: { interests } });
    } catch (error) {
      next(error);
    }
  }

  static async removeInterest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const category = (req.params.category as string) as string;
      const result = await UserInterestService.removeInterest(req.user.id, category);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateInterestWeight(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const category = (req.params.category as string) as string;
      const { weight } = req.body;
      const interest = await UserInterestService.updateInterestWeight(req.user.id, category, weight);
      res.status(200).json({ success: true, data: { interest } });
    } catch (error) {
      next(error);
    }
  }

  // Saved Searches
  static async createSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const search = await SavedSearchService.createSavedSearch(req.user.id, req.body);
      res.status(200).json({ success: true, data: { search } });
    } catch (error) {
      next(error);
    }
  }

  static async getUserSavedSearches(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const searches = await SavedSearchService.getUserSavedSearches(req.user.id);
      res.status(200).json({ success: true, data: { searches } });
    } catch (error) {
      next(error);
    }
  }

  static async updateSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const searchId = (req.params.searchId as string) as string;
      const search = await SavedSearchService.updateSavedSearch(searchId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { search } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const searchId = (req.params.searchId as string) as string;
      const result = await SavedSearchService.deleteSavedSearch(searchId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async executeSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const searchId = (req.params.searchId as string) as string;
      const result = await SavedSearchService.executeSavedSearch(searchId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Direct Messaging
  static async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const message = await DirectMessageService.sendMessage(req.user.id, req.body);
      res.status(200).json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  }

  static async getInbox(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      };

      const result = await DirectMessageService.getInbox(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSentMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await DirectMessageService.getSentMessages(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await DirectMessageService.getConversations(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getConversationWithUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const partnerId = req.params.partnerId as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await DirectMessageService.getConversationWithUser(req.user.id, partnerId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMessageThread(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const messageId = (req.params.messageId as string) as string;
      const message = await DirectMessageService.getMessageThread(messageId, req.user.id);
      res.status(200).json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  }

  static async markMessageAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const messageId = (req.params.messageId as string) as string;
      const message = await DirectMessageService.markAsRead(messageId, req.user.id);
      res.status(200).json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const messageId = (req.params.messageId as string) as string;
      const result = await DirectMessageService.deleteMessage(messageId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Social Networking
  static async followUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = (req.params.userId as string) as string;
      const follow = await SocialNetworkingService.followUser(req.user.id, userId);
      res.status(200).json({ success: true, data: { follow } });
    } catch (error) {
      next(error);
    }
  }

  static async unfollowUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = (req.params.userId as string) as string;
      const result = await SocialNetworkingService.unfollowUser(req.user.id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await SocialNetworkingService.getFollowers(userId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await SocialNetworkingService.getFollowing(userId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async isFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const userId = (req.params.userId as string) as string;
      const result = await SocialNetworkingService.isFollowing(req.user.id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const profile = await SocialNetworkingService.getUserProfile(userId, req.user?.id);
      res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      next(error);
    }
  }

  // Event Sharing
  static async trackShare(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.params.eventId as string) as string;
      const share = await EventShareService.trackShare(eventId, {
        userId: req.user?.id,
        ...req.body,
      });
      res.status(200).json({ success: true, data: { share } });
    } catch (error) {
      next(error);
    }
  }

  static async getShareAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.params.eventId as string) as string;
      const analytics = await EventShareService.getEventShareAnalytics(eventId, req.user?.id);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }
}
