import { Response, NextFunction } from 'express';
import { OnboardingController } from '../../../src/controllers/onboarding.controller.js';
import { prisma } from '../../../src/config/database.js';
import { AuthenticatedRequest } from '../../../src/middleware/auth.middleware.js';

// Mock Prisma
vi.mock('../../../src/config/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendOrganizerPendingEmail: vi.fn().mockResolvedValue(undefined),
    sendAdminNewOrganizerNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('OnboardingController', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'ATTENDEE',
      },
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();

    vi.clearAllMocks();
  });

  describe('completeOnboarding', () => {
    it('should upgrade to ORGANIZER when intent is "organize"', async () => {
      req.body = {
        preferences: {
          intent: 'organize',
          organizerEventTypes: ['conference', 'workshop'],
        },
      };

      const mockUser = {
        eventPreferences: null,
        role: 'ATTENDEE',
      };

      const mockUpdatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ORGANIZER', // Upgraded!
        status: 'ACTIVE',
        isEmailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        eventPreferences: {
          intent: 'organize',
          organizerEventTypes: ['conference', 'workshop'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (prisma.user.update as vi.Mock).mockResolvedValue(mockUpdatedUser as any);
      (prisma.user.findMany as vi.Mock).mockResolvedValue([]);

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          role: 'ORGANIZER',
          onboardingCompleted: true,
          onboardingCompletedAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Onboarding completed successfully',
        data: { user: mockUpdatedUser },
      });
    });

    it('should upgrade to ORGANIZER when intent is "both"', async () => {
      req.body = {
        preferences: {
          intent: 'both',
          eventInterests: ['tech', 'music'],
          organizerEventTypes: ['conference'],
        },
      };

      const mockUser = {
        eventPreferences: null,
        role: 'ATTENDEE',
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (prisma.user.update as vi.Mock).mockResolvedValue({
        id: 'test-user-id',
        role: 'ORGANIZER',
        onboardingCompleted: true,
      } as any);

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'ORGANIZER',
          }),
        }),
      );
    });

    it('should keep ATTENDEE when intent is "attend"', async () => {
      req.body = {
        preferences: {
          intent: 'attend',
          eventInterests: ['tech', 'music'],
          location: { city: 'Nairobi', country: 'Kenya' },
        },
      };

      const mockUser = {
        eventPreferences: null,
        role: 'ATTENDEE',
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (prisma.user.update as vi.Mock).mockResolvedValue({
        id: 'test-user-id',
        role: 'ATTENDEE',
        onboardingCompleted: true,
      } as any);

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'ATTENDEE',
          }),
        }),
      );
    });

    it('should keep current role when no intent is specified', async () => {
      req.body = {
        preferences: {
          notificationPreferences: { email: true, push: false },
        },
      };

      const mockUser = {
        eventPreferences: null,
        role: 'ATTENDEE',
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (prisma.user.update as vi.Mock).mockResolvedValue({
        id: 'test-user-id',
        role: 'ATTENDEE',
        onboardingCompleted: true,
      } as any);

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'ATTENDEE',
          }),
        }),
      );
    });

    it('should merge existing preferences with new preferences', async () => {
      req.body = {
        preferences: {
          intent: 'organize',
          organizerEventTypes: ['workshop'],
        },
      };

      const mockUser = {
        eventPreferences: {
          eventInterests: ['tech'], // Existing preference
        },
        role: 'ATTENDEE',
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (prisma.user.update as vi.Mock).mockResolvedValue({
        id: 'test-user-id',
        role: 'ORGANIZER',
        eventPreferences: {
          eventInterests: ['tech'],
          intent: 'organize',
          organizerEventTypes: ['workshop'],
        },
      } as any);

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventPreferences: {
              eventInterests: ['tech'],
              intent: 'organize',
              organizerEventTypes: ['workshop'],
            },
          }),
        }),
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      req.user = undefined;

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle errors and call next', async () => {
      req.body = { preferences: { intent: 'organize' } };

      const error = new Error('Database error');
      (prisma.user.findUnique as vi.Mock).mockRejectedValue(error);

      await OnboardingController.completeOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('saveProgress', () => {
    it('should save onboarding progress without completing', async () => {
      req.body = {
        preferences: {
          eventInterests: ['tech', 'music'],
        },
      };

      const mockUser = {
        eventPreferences: null,
      };

      const mockUpdatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ATTENDEE',
        onboardingCompleted: false,
        eventPreferences: {
          eventInterests: ['tech', 'music'],
        },
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);
      (prisma.user.update as vi.Mock).mockResolvedValue(mockUpdatedUser as any);

      await OnboardingController.saveProgress(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          eventPreferences: {
            eventInterests: ['tech', 'music'],
          },
        },
        select: expect.any(Object),
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Onboarding progress saved',
        data: { user: mockUpdatedUser },
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      req.user = undefined;

      await OnboardingController.saveProgress(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });
  });

  describe('skipOnboarding', () => {
    it('should mark onboarding as completed when skipped', async () => {
      const mockUpdatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ATTENDEE',
        status: 'ACTIVE',
        isEmailVerified: true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        eventPreferences: null,
      };

      (prisma.user.update as vi.Mock).mockResolvedValue(mockUpdatedUser as any);

      await OnboardingController.skipOnboarding(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Onboarding skipped',
        data: { user: mockUpdatedUser },
      });
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status and saved preferences', async () => {
      const mockUser = {
        id: 'test-user-id',
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        eventPreferences: {
          eventInterests: ['tech'],
        },
      };

      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser as any);

      await OnboardingController.getOnboardingStatus(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          onboardingCompleted: false,
          onboardingCompletedAt: null,
          savedPreferences: {
            eventInterests: ['tech'],
          },
        },
      });
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);

      await OnboardingController.getOnboardingStatus(
        req as AuthenticatedRequest,
        res as Response,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });
  });
});
