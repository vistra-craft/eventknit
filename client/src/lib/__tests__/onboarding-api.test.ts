/**
 * Tests for onboarding API functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOnboardingStatus,
  saveOnboardingProgress,
  completeOnboarding,
  skipOnboarding,
} from '../onboarding-api';
import * as api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

describe('Onboarding API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('should call apiGet with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          onboardingCompleted: false,
          onboardingCompletedAt: null,
          savedPreferences: {
            eventInterests: ['tech'],
          },
        },
      };

      vi.mocked(api.apiGet).mockResolvedValue(mockResponse);

      const result = await getOnboardingStatus();

      expect(api.apiGet).toHaveBeenCalledWith('/onboarding/status');
      expect(result).toEqual(mockResponse);
    });

    it('should handle completed onboarding status', async () => {
      const mockResponse = {
        success: true,
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: '2024-01-15T10:00:00Z',
          savedPreferences: {
            intent: 'organize',
            organizerEventTypes: ['conference'],
          },
        },
      };

      vi.mocked(api.apiGet).mockResolvedValue(mockResponse);

      const result = await getOnboardingStatus();

      expect(result.data.onboardingCompleted).toBe(true);
      expect(result.data.onboardingCompletedAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('saveOnboardingProgress', () => {
    it('should call apiPost with correct parameters', async () => {
      const preferences = {
        eventInterests: ['tech', 'music'],
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding progress saved',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await saveOnboardingProgress(preferences);

      expect(api.apiPost).toHaveBeenCalledWith('/onboarding/progress', {
        preferences,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should save multiple preference types', async () => {
      const preferences = {
        eventInterests: ['tech'],
        location: {
          city: 'Nairobi',
          country: 'Kenya',
        },
        notificationPreferences: {
          email: true,
          push: false,
        },
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding progress saved',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await saveOnboardingProgress(preferences);

      expect(api.apiPost).toHaveBeenCalledWith('/onboarding/progress', {
        preferences,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('should call apiPost with correct parameters for attendee', async () => {
      const preferences = {
        intent: 'attend' as const,
        eventInterests: ['tech', 'music'],
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
            onboardingCompleted: true,
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await completeOnboarding(preferences);

      expect(api.apiPost).toHaveBeenCalledWith('/onboarding/complete', {
        preferences,
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.user.role).toBe('ATTENDEE');
    });

    it('should upgrade to ORGANIZER when intent is "organize"', async () => {
      const preferences = {
        intent: 'organize' as const,
        organizerEventTypes: ['conference', 'workshop'],
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ORGANIZER', // Smart role upgrade
            onboardingCompleted: true,
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await completeOnboarding(preferences);

      expect(api.apiPost).toHaveBeenCalledWith('/onboarding/complete', {
        preferences,
      });
      expect(result.data.user.role).toBe('ORGANIZER');
    });

    it('should upgrade to ORGANIZER when intent is "both"', async () => {
      const preferences = {
        intent: 'both' as const,
        eventInterests: ['tech'],
        organizerEventTypes: ['conference'],
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ORGANIZER', // Smart role upgrade
            onboardingCompleted: true,
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await completeOnboarding(preferences);

      expect(result.data.user.role).toBe('ORGANIZER');
    });

    it('should include all preference types', async () => {
      const preferences = {
        intent: 'attend' as const,
        eventInterests: ['tech', 'sports'],
        location: {
          city: 'San Francisco',
          country: 'USA',
        },
        notificationPreferences: {
          email: true,
          push: true,
          sms: false,
        },
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
            onboardingCompleted: true,
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await completeOnboarding(preferences);

      expect(api.apiPost).toHaveBeenCalledWith('/onboarding/complete', {
        preferences,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('skipOnboarding', () => {
    it('should call apiPost with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        message: 'Onboarding skipped',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
            onboardingCompleted: true,
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await skipOnboarding();

      expect(api.apiPost).toHaveBeenCalledWith('/onboarding/skip');
      expect(result).toEqual(mockResponse);
    });

    it('should mark onboarding as completed without preferences', async () => {
      const mockResponse = {
        success: true,
        message: 'Onboarding skipped',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
            onboardingCompleted: true,
            eventPreferences: null,
          },
        },
      };

      vi.mocked(api.apiPost).mockResolvedValue(mockResponse);

      const result = await skipOnboarding();

      expect(result.data.user.onboardingCompleted).toBe(true);
      expect(result.data.user.eventPreferences).toBe(null);
    });
  });
});
