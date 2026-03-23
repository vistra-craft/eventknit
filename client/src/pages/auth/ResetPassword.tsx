import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/layout/Logo';
import { resetPassword } from '@/lib/auth-api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
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

  // Auto-redirect to login after success
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        navigate('/auth/signin');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, navigate]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength: number): string => {
    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return levels[strength] || 'Very Weak';
  };

  const getPasswordStrengthColor = (strength: number): string => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return colors[strength] || 'bg-red-500';
  };

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

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
    if (error) setError(null);
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

  // Invalid token state
  if (!token && !isSubmitted) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="p-4 w-full">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-card-surface rounded-2xl shadow-md overflow-hidden">
              <div className="p-5 lg:p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <BackButton to="/auth/forgot-password" label="Back" />
                  <Logo />
                </div>

                <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Invalid Reset Link</h2>
                    <p className="text-sm text-muted-foreground">
                      This password reset link is invalid or has expired. Please request a new one.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="p-4 w-full">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card-surface rounded-2xl shadow-md overflow-hidden">
            <div className="p-5 lg:p-6">
              {/* Header - always visible */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <BackButton to="/auth/forgot-password" label="Back" />
                <Logo />
              </div>

              {!isSubmitted ? (
                <>
                  {/* Title */}
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-foreground mb-1">Reset password</h1>
                    <p className="text-sm text-muted-foreground">
                      Create a new secure password for your account
                    </p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                          {error}
                        </div>
                      )}

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">New password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={formData.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                            required
                            minLength={8}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Password strength & requirements */}
                        {formData.password && (
                          <div className="space-y-2">
                            {/* Strength meter */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {getPasswordStrengthText(passwordStrength)}
                              </span>
                            </div>

                            {/* Requirements */}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span className={formData.password.length >= 8 ? 'text-success' : ''}>
                                {formData.password.length >= 8 ? '\u2713' : '\u25CB'} 8+ chars
                              </span>
                              <span className={/[a-zA-Z]/.test(formData.password) ? 'text-success' : ''}>
                                {/[a-zA-Z]/.test(formData.password) ? '\u2713' : '\u25CB'} Letter
                              </span>
                              <span className={/\d/.test(formData.password) ? 'text-success' : ''}>
                                {/\d/.test(formData.password) ? '\u2713' : '\u25CB'} Number
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm new password</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            if (error) setError(null);
                          }}
                          className="h-11 border-border focus:border-primary focus:ring-primary"
                          required
                          minLength={8}
                          disabled={isLoading}
                        />
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
                            Resetting password...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                    </form>

                    {/* Sign in link */}
                    <div className="text-center pt-1">
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
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Password reset successful</h2>
                    <p className="text-sm text-muted-foreground">
                      Your password has been updated. You can now sign in with your new password.
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Redirecting to sign in...
                  </p>

                  <Button
                    variant="default"
                    className="w-full h-11"
                    asChild
                  >
                    <Link to="/auth/signin">Continue to Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
