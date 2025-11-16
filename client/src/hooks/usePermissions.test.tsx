/**
 * Tests for usePermissions hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import {
  useCanCreateRole,
  useCanModifyUser,
  useCanDeleteUser,
  usePermissions,
  useCanCreateRoles,
  useCurrentUserRole,
} from './usePermissions';
import { UserRole } from '@/types/auth';
import type { ReactNode } from 'react';

// Mock useAuth
const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.ADMIN_STAFF,
  status: 'ACTIVE' as const,
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUseAuth = vi.fn(() => ({
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
}));

vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

describe('usePermissions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe('useCanCreateRole', () => {
    it('should return false when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanCreateRole(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should return true when ADMIN_STAFF can create TELLER', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanCreateRole(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should return false when ADMIN_STAFF cannot create SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanCreateRole(UserRole.SUPERADMIN), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should return true when SUPERADMIN can create ADMIN_STAFF', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.SUPERADMIN },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanCreateRole(UserRole.ADMIN_STAFF), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useCanModifyUser', () => {
    it('should return false when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanModifyUser(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should return true when ADMIN_STAFF can modify TELLER', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanModifyUser(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should return false when ADMIN_STAFF cannot modify SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanModifyUser(UserRole.SUPERADMIN), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should return true when SUPERADMIN can modify anyone', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.SUPERADMIN },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanModifyUser(UserRole.ADMIN_STAFF), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should return true when ORGANIZER can modify ORGANIZER_STAFF', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ORGANIZER },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanModifyUser(UserRole.ORGANIZER_STAFF), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useCanDeleteUser', () => {
    it('should return false when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanDeleteUser(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });

    it('should return true when SUPERADMIN can delete anyone', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.SUPERADMIN },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanDeleteUser(UserRole.ADMIN_STAFF), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should return false when ADMIN_STAFF cannot delete SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanDeleteUser(UserRole.SUPERADMIN), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });
  });

  describe('usePermissions', () => {
    it('should return all false permissions when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current).toEqual({
        canCreate: false,
        canModify: false,
        canDelete: false,
      });
    });

    it('should return correct permissions for ADMIN_STAFF modifying TELLER', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions(UserRole.TELLER), {
        wrapper: TestWrapper,
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canModify).toBe(true);
      expect(result.current.canDelete).toBe(false);
    });
  });

  describe('useCanCreateRoles', () => {
    it('should return all false when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(
        () => useCanCreateRoles([UserRole.TELLER, UserRole.MARKETER]),
        {
          wrapper: TestWrapper,
        },
      );

      expect(result.current[UserRole.TELLER]).toBe(false);
      expect(result.current[UserRole.MARKETER]).toBe(false);
    });

    it('should return correct permissions for multiple roles', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(
        () => useCanCreateRoles([UserRole.TELLER, UserRole.SUPERADMIN]),
        {
          wrapper: TestWrapper,
        },
      );

      expect(result.current[UserRole.TELLER]).toBe(true);
      expect(result.current[UserRole.SUPERADMIN]).toBe(false);
    });
  });

  describe('useCurrentUserRole', () => {
    it('should return null when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCurrentUserRole(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(null);
    });

    it('should return user role when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN_STAFF },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCurrentUserRole(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(UserRole.ADMIN_STAFF);
    });
  });
});

