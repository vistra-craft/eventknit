/**
 * Tests for authReducer
 */

import { describe, it, expect } from 'vitest';
import { authReducer, initialAuthState } from './authReducer';
import type { User } from '../types/auth';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ATTENDEE',
  status: 'ACTIVE',
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('authReducer', () => {
  describe('AUTH_LOGOUT', () => {
    it('should clear all auth state on logout', () => {
      const stateWithUser = {
        ...initialAuthState,
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        error: 'Some error',
      };

      const result = authReducer(stateWithUser, { type: 'AUTH_LOGOUT' });

      expect(result).toEqual({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });

    it('should reset to initial state', () => {
      const stateWithUser = {
        ...initialAuthState,
        user: mockUser,
        isAuthenticated: true,
      };

      const result = authReducer(stateWithUser, { type: 'AUTH_LOGOUT' });

      expect(result).toEqual(initialAuthState);
    });
  });

  describe('AUTH_START', () => {
    it('should set loading state and clear error', () => {
      const stateWithError = {
        ...initialAuthState,
        error: 'Previous error',
      };

      const result = authReducer(stateWithError, { type: 'AUTH_START' });

      expect(result).toEqual({
        ...initialAuthState,
        isLoading: true,
        error: null,
      });
    });
  });

  describe('AUTH_SUCCESS', () => {
    it('should set user and authenticated state', () => {
      const result = authReducer(initialAuthState, {
        type: 'AUTH_SUCCESS',
        payload: mockUser,
      });

      expect(result).toEqual({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('AUTH_FAILURE', () => {
    it('should set error and clear user', () => {
      const stateWithUser = {
        ...initialAuthState,
        user: mockUser,
        isAuthenticated: true,
      };

      const result = authReducer(stateWithUser, {
        type: 'AUTH_FAILURE',
        payload: 'Login failed',
      });

      expect(result).toEqual({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Login failed',
      });
    });
  });

  describe('AUTH_CLEAR_ERROR', () => {
    it('should clear error and loading state', () => {
      const stateWithError = {
        ...initialAuthState,
        error: 'Some error',
        isLoading: true,
      };

      const result = authReducer(stateWithError, { type: 'AUTH_CLEAR_ERROR' });

      expect(result).toEqual({
        ...initialAuthState,
        error: null,
        isLoading: false,
      });
    });
  });

  describe('UPDATE_USER', () => {
    it('should update user data', () => {
      const stateWithUser = {
        ...initialAuthState,
        user: mockUser,
        isAuthenticated: true,
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Updated',
      };

      const result = authReducer(stateWithUser, {
        type: 'UPDATE_USER',
        payload: updatedUser,
      });

      expect(result.user).toEqual(updatedUser);
      expect(result.isAuthenticated).toBe(true);
    });
  });
});

