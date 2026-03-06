import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../src/middleware/auth.middleware.js';
import { OrganizerDashboardController } from '../../../src/controllers/organizer-dashboard.controller.js';
import { ResaleTransferAnalyticsService } from '../../../src/services/resale-transfer-analytics.service.js';

jest.mock('../../../src/services/resale-transfer-analytics.service.js');
jest.mock('../../../src/services/event-session.service.js');
jest.mock('../../../src/services/event-template.service.js');
jest.mock('../../../src/services/event-draft.service.js');
jest.mock('../../../src/services/attendee-segmentation.service.js');
jest.mock('../../../src/services/attendee-tag.service.js');
jest.mock('../../../src/services/attendee-communication.service.js');
jest.mock('../../../src/services/organizer-analytics.service.js');
jest.mock('../../../src/services/advanced-promo-code.service.js');
jest.mock('../../../src/services/organizer-financial.service.js');
jest.mock('../../../src/services/payout-management.service.js');
jest.mock('../../../src/services/event-collaboration.service.js');
jest.mock('../../../src/services/advanced-ticket-types.service.js');
jest.mock('../../../src/services/dynamic-pricing.service.js');
jest.mock('../../../src/services/affiliate-program.service.js');
jest.mock('../../../src/services/email-marketing.service.js');
jest.mock('../../../src/services/social-media.service.js');
jest.mock('../../../src/services/advanced-team.service.js');
jest.mock('../../../src/services/permission.service.js');
jest.mock('../../../src/services/kyc.service.js');
jest.mock('../../../src/services/subscription.service.js');
jest.mock('../../../src/services/consent.service.js');

describe('OrganizerDashboardController - Resale & Transfer Analytics', () => {
  let mockRequest: Partial<AuthenticatedRequest<{ eventId: string }>>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: { eventId: 'event-123' },
      query: {},
      user: { id: 'organizer-456', email: 'org@test.com', role: 'ORGANIZER' } as AuthenticatedRequest<{ eventId: string }>['user'],
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ─── getEventResaleStats ───

  describe('getEventResaleStats', () => {
    it('should return resale stats successfully', async () => {
      const mockStats = { totalListings: 5, activeListings: 2, soldListings: 3 };
      (ResaleTransferAnalyticsService.getEventResaleStats as jest.Mock).mockResolvedValue(mockStats);

      await OrganizerDashboardController.getEventResaleStats(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockStats });
      expect(ResaleTransferAnalyticsService.getEventResaleStats).toHaveBeenCalledWith('event-123', 'organizer-456');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await OrganizerDashboardController.getEventResaleStats(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Service error');
      (ResaleTransferAnalyticsService.getEventResaleStats as jest.Mock).mockRejectedValue(error);

      await OrganizerDashboardController.getEventResaleStats(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── getEventResaleListings ───

  describe('getEventResaleListings', () => {
    it('should return listings with filter params', async () => {
      mockRequest.query = { status: 'SOLD', page: '2', limit: '10' };
      const mockResult = { listings: [], total: 0, page: 2, totalPages: 0 };
      (ResaleTransferAnalyticsService.getEventResaleListings as jest.Mock).mockResolvedValue(mockResult);

      await OrganizerDashboardController.getEventResaleListings(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(ResaleTransferAnalyticsService.getEventResaleListings).toHaveBeenCalledWith(
        'event-123',
        'organizer-456',
        { status: 'SOLD', page: 2, limit: 10 },
      );
    });

    it('should handle missing optional query params', async () => {
      mockRequest.query = {};
      const mockResult = { listings: [], total: 0, page: 1, totalPages: 0 };
      (ResaleTransferAnalyticsService.getEventResaleListings as jest.Mock).mockResolvedValue(mockResult);

      await OrganizerDashboardController.getEventResaleListings(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(ResaleTransferAnalyticsService.getEventResaleListings).toHaveBeenCalledWith(
        'event-123',
        'organizer-456',
        { status: undefined, page: undefined, limit: undefined },
      );
    });
  });

  // ─── getEventTransferStats ───

  describe('getEventTransferStats', () => {
    it('should return transfer stats successfully', async () => {
      const mockStats = { totalTransfers: 10, pendingTransfers: 3, acceptedTransfers: 7 };
      (ResaleTransferAnalyticsService.getEventTransferStats as jest.Mock).mockResolvedValue(mockStats);

      await OrganizerDashboardController.getEventTransferStats(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockStats });
    });

    it('should return 401 when unauthenticated', async () => {
      mockRequest.user = undefined;

      await OrganizerDashboardController.getEventTransferStats(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should pass errors to next', async () => {
      const error = new Error('Access denied');
      (ResaleTransferAnalyticsService.getEventTransferStats as jest.Mock).mockRejectedValue(error);

      await OrganizerDashboardController.getEventTransferStats(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── getEventTransferHistory ───

  describe('getEventTransferHistory', () => {
    it('should return transfer history with filters', async () => {
      mockRequest.query = { status: 'PENDING', page: '1', limit: '20' };
      const mockResult = { transfers: [], total: 0, page: 1, totalPages: 0 };
      (ResaleTransferAnalyticsService.getEventTransferHistory as jest.Mock).mockResolvedValue(mockResult);

      await OrganizerDashboardController.getEventTransferHistory(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(ResaleTransferAnalyticsService.getEventTransferHistory).toHaveBeenCalledWith(
        'event-123',
        'organizer-456',
        { status: 'PENDING', page: 1, limit: 20 },
      );
    });

    it('should return 401 when unauthenticated', async () => {
      mockRequest.user = undefined;

      await OrganizerDashboardController.getEventTransferHistory(
        mockRequest as AuthenticatedRequest<{ eventId: string }>,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });
});
