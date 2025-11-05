/**
 * Tests for useAuth hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from './useAuth';
import * as authApi from '../lib/auth-api';
import { removeAccessToken, setAccessToken } from '../lib/api';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('../lib/auth-api');
vi.mock('../lib/api', () => ({
  setAccessToken: vi.fn(),
  removeAccessToken: vi.fn(),
  getAccessToken: vi.fn(() => null),
  setLogoutCallback: vi.fn(),
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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logout', () => {
    it('should clear token immediately', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      expect(removeAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should dispatch AUTH_LOGOUT action immediately', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should clear activeViewRole from localStorage', () => {
      localStorage.setItem('activeViewRole', 'ADMIN_STAFF');
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('activeViewRole')).toBe(null);
    });

    it('should navigate to home page immediately', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call logout API (fire-and-forget)', async () => {
      const mockLogoutApi = vi.spyOn(authApi, 'logout').mockResolvedValue({
        success: true,
      } as any);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      // API call should be made (but not awaited)
      await waitFor(() => {
        expect(mockLogoutApi).toHaveBeenCalled();
      });
    });

    it('should not block navigation if logout API fails', async () => {
      const mockLogoutApi = vi
        .spyOn(authApi, 'logout')
        .mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      // Navigation should still happen immediately
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      
      // State should still be cleared
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);

      // API call should fail but not block
      await waitFor(() => {
        expect(mockLogoutApi).toHaveBeenCalled();
      });
    });

    it('should dispatch tokenChange event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.logout();
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tokenChange',
        })
      );
    });

    it('should be synchronous (no async/await)', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      let logoutCompleted = false;

      act(() => {
        result.current.logout();
        logoutCompleted = true;
      });

      // Should complete synchronously
      expect(logoutCompleted).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set loading state during login', async () => {
      const mockLogin = vi.spyOn(authApi, 'login').mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: {
                    user: {
                      id: '1',
                      email: 'test@example.com',
                      firstName: 'Test',
                      lastName: 'User',
                      role: 'ATTENDEE',
                      status: 'ACTIVE',
                      isEmailVerified: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                    accessToken: 'token123',
                    expiresIn: 3600,
                  },
                } as any),
              100
            );
          })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(setAccessToken).toHaveBeenCalledWith('token123');
    });

    it('should handle login errors', async () => {
      const mockLogin = vi
        .spyOn(authApi, 'login')
        .mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong');
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error and loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      // Set error state first
      act(() => {
        result.current.dispatch({ type: 'AUTH_FAILURE', payload: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });
});

