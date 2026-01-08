import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import { resetPassword } from '@/lib/auth-api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(token, formData.password);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.message || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setError('Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show error state if no token
  if (!token && !isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <BackButton to="/auth/forgot-password" label="Back" />
              <Logo />
            </div>
          </div>

          <div className="bg-card-surface rounded-2xl shadow-md p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Invalid Reset Link</h3>
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                variant="default"
                className="w-full h-11"
                asChild
              >
                <Link to="/auth/forgot-password">Request New Link</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full h-11"
                asChild
              >
                <Link to="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <BackButton to="/auth/forgot-password" label="Back" />
            <Logo />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {isSubmitted ? 'Password reset!' : 'Reset password'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSubmitted
                ? "Your password has been successfully reset"
                : "Enter your new password below"
              }
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card-surface rounded-2xl shadow-md p-6">
          {!isSubmitted ? (
            <>
              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 h-11"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10 h-11"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li className={formData.password.length >= 8 ? 'text-success' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[a-zA-Z]/.test(formData.password) ? 'text-success' : ''}>
                      At least one letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-success' : ''}>
                      At least one number
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    asChild
                  >
                    <Link to="/auth/signin">Sign in</Link>
                  </Button>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Password reset successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>

                <Button
                  variant="default"
                  className="w-full h-11"
                  asChild
                >
                  <Link to="/auth/signin">Continue to sign in</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
