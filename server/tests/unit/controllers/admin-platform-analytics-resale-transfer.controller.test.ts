import { Response } from 'express';
import { AuthenticatedRequest } from '../../../src/middleware/auth.middleware.js';
import { AdminPlatformAnalyticsController } from '../../../src/controllers/admin-platform-analytics.controller.js';
import { ResaleTransferAnalyticsService } from '../../../src/services/resale-transfer-analytics.service.js';

vi.mock('../../../src/services/resale-transfer-analytics.service.js');
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AdminPlatformAnalyticsController - Resale & Transfer', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      query: {},
      user: { id: 'admin-1', email: 'admin@test.com', role: 'SUPERADMIN' } as AuthenticatedRequest['user'],
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  // ─── getResaleStats ───

  describe('getResaleStats', () => {
    it('should return platform resale stats', async () => {
      const mockStats = {
        totalListings: 50,
        activeListings: 10,
        soldListings: 30,
        totalPlatformFees: 750,
        pendingPayouts: { count: 5, amount: 500 },
        topEvents: [],
      };
      (ResaleTransferAnalyticsService.getPlatformResaleStats as vi.Mock).mockResolvedValue(mockStats);

      await AdminPlatformAnalyticsController.getResaleStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockStats });
    });

    it('should pass date filters to service', async () => {
      mockRequest.query = { startDate: '2026-01-01', endDate: '2026-03-01' };
      (ResaleTransferAnalyticsService.getPlatformResaleStats as vi.Mock).mockResolvedValue({});

      await AdminPlatformAnalyticsController.getResaleStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(ResaleTransferAnalyticsService.getPlatformResaleStats).toHaveBeenCalledWith({
        startDate: '2026-01-01',
        endDate: '2026-03-01',
      });
    });

    it('should return 500 on service error', async () => {
      (ResaleTransferAnalyticsService.getPlatformResaleStats as vi.Mock).mockRejectedValue(
        new Error('DB connection failed'),
      );

      await AdminPlatformAnalyticsController.getResaleStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'DB connection failed',
      });
    });

    it('should handle non-Error exceptions with fallback message', async () => {
      (ResaleTransferAnalyticsService.getPlatformResaleStats as vi.Mock).mockRejectedValue('unexpected');

      await AdminPlatformAnalyticsController.getResaleStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get resale stats',
      });
    });
  });

  // ─── getTransferStats ───

  describe('getTransferStats', () => {
    it('should return platform transfer stats', async () => {
      const mockStats = { totalTransfers: 100, pendingTransfers: 10, acceptedTransfers: 70 };
      (ResaleTransferAnalyticsService.getPlatformTransferStats as vi.Mock).mockResolvedValue(mockStats);

      await AdminPlatformAnalyticsController.getTransferStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockStats });
    });

    it('should pass date filters', async () => {
      mockRequest.query = { startDate: '2026-02-01' };
      (ResaleTransferAnalyticsService.getPlatformTransferStats as vi.Mock).mockResolvedValue({});

      await AdminPlatformAnalyticsController.getTransferStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(ResaleTransferAnalyticsService.getPlatformTransferStats).toHaveBeenCalledWith({
        startDate: '2026-02-01',
        endDate: undefined,
      });
    });

    it('should return 500 on error', async () => {
      (ResaleTransferAnalyticsService.getPlatformTransferStats as vi.Mock).mockRejectedValue(
        new Error('Query timeout'),
      );

      await AdminPlatformAnalyticsController.getTransferStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Query timeout',
      });
    });
  });

  // ─── getResaleActivity ───

  describe('getResaleActivity', () => {
    it('should return resale activity with all filters', async () => {
      mockRequest.query = { status: 'SOLD', eventId: 'evt-1', page: '2', limit: '10' };
      const mockResult = { listings: [], total: 0, page: 2, totalPages: 0 };
      (ResaleTransferAnalyticsService.getPlatformResaleActivity as vi.Mock).mockResolvedValue(mockResult);

      await AdminPlatformAnalyticsController.getResaleActivity(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockResult });
      expect(ResaleTransferAnalyticsService.getPlatformResaleActivity).toHaveBeenCalledWith({
        status: 'SOLD',
        eventId: 'evt-1',
        page: 2,
        limit: 10,
      });
    });

    it('should handle empty filters', async () => {
      mockRequest.query = {};
      (ResaleTransferAnalyticsService.getPlatformResaleActivity as vi.Mock).mockResolvedValue({
        listings: [], total: 0, page: 1, totalPages: 0,
      });

      await AdminPlatformAnalyticsController.getResaleActivity(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(ResaleTransferAnalyticsService.getPlatformResaleActivity).toHaveBeenCalledWith({
        status: undefined,
        eventId: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should return 500 on error', async () => {
      (ResaleTransferAnalyticsService.getPlatformResaleActivity as vi.Mock).mockRejectedValue(
        new Error('Service unavailable'),
      );

      await AdminPlatformAnalyticsController.getResaleActivity(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getResalePendingPayouts ───

  describe('getResalePendingPayouts', () => {
    it('should return pending payouts with pagination', async () => {
      mockRequest.query = { page: '1', limit: '25' };
      const mockResult = {
        payouts: [{ id: 'r-1', sellerPayout: 135 }],
        total: 1,
        page: 1,
        totalPages: 1,
        summary: { totalPending: 1, totalPayoutAmount: 135, totalPlatformFees: 15 },
      };
      (ResaleTransferAnalyticsService.getResalePendingPayouts as vi.Mock).mockResolvedValue(mockResult);

      await AdminPlatformAnalyticsController.getResalePendingPayouts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockResult });
      expect(ResaleTransferAnalyticsService.getResalePendingPayouts).toHaveBeenCalledWith({
        page: 1,
        limit: 25,
      });
    });

    it('should use default pagination when no params', async () => {
      mockRequest.query = {};
      (ResaleTransferAnalyticsService.getResalePendingPayouts as vi.Mock).mockResolvedValue({
        payouts: [], total: 0, page: 1, totalPages: 0,
        summary: { totalPending: 0, totalPayoutAmount: 0, totalPlatformFees: 0 },
      });

      await AdminPlatformAnalyticsController.getResalePendingPayouts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(ResaleTransferAnalyticsService.getResalePendingPayouts).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
      });
    });

    it('should return 500 on error', async () => {
      (ResaleTransferAnalyticsService.getResalePendingPayouts as vi.Mock).mockRejectedValue(
        new Error('Aggregation failed'),
      );

      await AdminPlatformAnalyticsController.getResalePendingPayouts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Aggregation failed',
      });
    });
  });
});
