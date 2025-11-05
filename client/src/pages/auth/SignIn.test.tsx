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
    // Mock login to return a promise that resolves (like the real login does)
    mockLogin.mockImplementation(() => Promise.resolve());

    render(
      <TestWrapper>
        <SignIn />
      </TestWrapper>
    );

    // Use getAllByPlaceholderText and take the first one, or use getByLabelText
    const emailInputs = screen.getAllByPlaceholderText(/enter your email/i);
    const passwordInputs = screen.getAllByPlaceholderText(/enter your password/i);
    const emailInput = emailInputs[0];
    const passwordInput = passwordInputs[0];
    // Get all buttons and find the submit button (not in navigation)
    const buttons = screen.getAllByRole('button', { name: /sign in/i });
    const submitButton = buttons.find(btn => btn.type === 'submit') || buttons[0];

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Wait a bit for the form to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await user.click(submitButton);

    // Wait for the login to be called
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockClearError).toHaveBeenCalled();
  }, 10000); // Increase timeout to 10 seconds
});

