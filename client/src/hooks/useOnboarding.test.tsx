/**
 * Tests for useOnboarding hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { useOnboarding } from './useOnboarding';
import * as onboardingApi from '../lib/onboarding-api';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('../lib/onboarding-api', () => ({
  getOnboardingStatus: vi.fn(),
  saveOnboardingProgress: vi.fn(),
  completeOnboarding: vi.fn(),
  skipOnboarding: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should get onboarding status successfully', async () => {
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

      vi.spyOn(onboardingApi, 'getOnboardingStatus').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(false);

      let statusResult;
      await act(async () => {
        statusResult = await result.current.getStatus();
      });

      expect(onboardingApi.getOnboardingStatus).toHaveBeenCalledTimes(1);
      expect(statusResult).toEqual(mockResponse.data);
      expect(result.current.onboardingCompleted).toBe(false);
      expect(result.current.savedPreferences).toEqual({ eventInterests: ['tech'] });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle error when getting status fails', async () => {
      const mockError = new Error('Failed to fetch status');
      vi.spyOn(onboardingApi, 'getOnboardingStatus').mockRejectedValue(mockError);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.getStatus();
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Failed to fetch status');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('saveProgress', () => {
    it('should save onboarding progress successfully', async () => {
      const preferences = {
        eventInterests: ['tech', 'music'],
      };

      const mockResponse = {
        success: true,
        message: 'Progress saved',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ATTENDEE',
          },
        },
      };

      vi.spyOn(onboardingApi, 'saveOnboardingProgress').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      let progressResult;
      await act(async () => {
        progressResult = await result.current.saveProgress(preferences);
      });

      expect(onboardingApi.saveOnboardingProgress).toHaveBeenCalledWith(preferences);
      expect(progressResult).toEqual(mockResponse);
      expect(result.current.savedPreferences).toEqual(preferences);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle error when saving progress fails', async () => {
      const preferences = { eventInterests: ['tech'] };
      const mockError = new Error('Network error');

      vi.spyOn(onboardingApi, 'saveOnboardingProgress').mockRejectedValue(mockError);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.saveProgress(preferences);
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('complete', () => {
    it('should complete onboarding and navigate to dashboard', async () => {
      const preferences = {
        intent: 'organize' as const,
        organizerEventTypes: ['conference'],
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ORGANIZER',
            onboardingCompleted: true,
          },
        },
      };

      vi.spyOn(onboardingApi, 'completeOnboarding').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.complete(preferences);
      });

      expect(onboardingApi.completeOnboarding).toHaveBeenCalledWith(preferences);
      expect(result.current.onboardingCompleted).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should upgrade to ORGANIZER when intent is "organize"', async () => {
      const preferences = {
        intent: 'organize' as const,
        organizerEventTypes: ['workshop'],
      };

      const mockResponse = {
        success: true,
        message: 'Onboarding completed',
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            role: 'ORGANIZER', // Upgraded from ATTENDEE
            onboardingCompleted: true,
          },
        },
      };

      vi.spyOn(onboardingApi, 'completeOnboarding').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.complete(preferences);
      });

      expect(onboardingApi.completeOnboarding).toHaveBeenCalledWith(preferences);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle error when completing onboarding fails', async () => {
      const preferences = { intent: 'attend' as const };
      const mockError = new Error('Server error');

      vi.spyOn(onboardingApi, 'completeOnboarding').mockRejectedValue(mockError);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.complete(preferences);
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.isLoading).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('skip', () => {
    it('should skip onboarding and navigate to dashboard', async () => {
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

      vi.spyOn(onboardingApi, 'skipOnboarding').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.skip();
      });

      expect(onboardingApi.skipOnboarding).toHaveBeenCalledTimes(1);
      expect(result.current.onboardingCompleted).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle error when skipping onboarding fails', async () => {
      const mockError = new Error('Network error');
      vi.spyOn(onboardingApi, 'skipOnboarding').mockRejectedValue(mockError);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.skip();
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockError = new Error('Test error');
      vi.spyOn(onboardingApi, 'getOnboardingStatus').mockRejectedValue(mockError);

      const { result } = renderHook(() => useOnboarding(), {
        wrapper: TestWrapper,
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.getStatus();
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
