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
} from './usePermissions';
import { UserRole } from '@/types/auth';
import type { ReactNode } from 'react';

// Mock useAuth
const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.ADMIN,
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

    it('should return true when ADMIN can create TELLER', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN },
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

    it('should return false when ADMIN cannot create SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN },
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

    it('should return true when SUPERADMIN can create ADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.SUPERADMIN },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanCreateRole(UserRole.ADMIN), {
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

    it('should return true when ADMIN can modify TELLER', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN },
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

    it('should return false when ADMIN cannot modify SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN },
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

      const { result } = renderHook(() => useCanModifyUser(UserRole.ADMIN), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should return true when ORGANIZER can modify ORGANIZER_ADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ORGANIZER },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => useCanModifyUser(UserRole.ORGANIZER_ADMIN), {
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

      const { result } = renderHook(() => useCanDeleteUser(UserRole.ADMIN), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it('should return false when ADMIN cannot delete SUPERADMIN', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN },
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

      const { result } = renderHook(() => usePermissions(), {
        wrapper: TestWrapper,
      });

      expect(result.current.canCreateRole(UserRole.TELLER)).toBe(false);
      expect(result.current.canModifyUser(UserRole.TELLER)).toBe(false);
      expect(result.current.canDeleteUser(UserRole.TELLER)).toBe(false);
      expect(result.current.canManageStaff).toBe(false);
      expect(result.current.isAdminStaff).toBe(false);
      expect(result.current.isOrganizerStaff).toBe(false);
      expect(result.current.canAccessAllEvents).toBe(false);
      expect(result.current.creatableRoles).toEqual([]);
      expect(result.current.modifiableRoles).toEqual([]);
      expect(result.current.deletableRoles).toEqual([]);
    });

    it('should return correct permissions for ADMIN modifying TELLER', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: UserRole.ADMIN },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions(), {
        wrapper: TestWrapper,
      });

      expect(result.current.canCreateRole(UserRole.TELLER)).toBe(true);
      expect(result.current.canModifyUser(UserRole.TELLER)).toBe(true);
      expect(result.current.canDeleteUser(UserRole.TELLER)).toBe(false);
    });
  });

});






