/**
 * Tests for SignIn component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import SignIn from './SignIn';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    isAuthenticated: false,
  }),
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear loading state and error on mount', () => {
    render(
      <TestWrapper>
        <SignIn />
      </TestWrapper>
    );

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should have accessible form fields when not loading', () => {
    render(
      <TestWrapper>
        <SignIn />
      </TestWrapper>
    );

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
  });

  it('should submit form with email and password', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <SignIn />
      </TestWrapper>
    );

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockClearError).toHaveBeenCalled();
  });
});

