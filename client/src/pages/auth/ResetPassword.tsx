import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import { resetPassword } from '@/lib/auth-api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Show error state if no token
  if (!token && !isSubmitted) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-muted/10">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-destructive/20 rounded-full opacity-20 animate-pulse blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-destructive/20 rounded-full opacity-20 animate-pulse blur-3xl" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <BackButton to="/auth/forgot-password" label="Back" />
              <Logo />
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/40 p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-destructive to-red-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-destructive/10">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Invalid Reset Link</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  variant="default"
                  className="w-full h-12 transition-all duration-300 hover:scale-[1.02]"
                  asChild
                >
                  <Link to="/auth/forgot-password">Request New Link</Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 transition-all duration-300 hover:scale-[1.02]"
                  asChild
                >
                  <Link to="/auth/signin">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-muted/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full opacity-20 animate-pulse blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full opacity-20 animate-pulse blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full opacity-10 animate-pulse blur-3xl" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <BackButton to="/auth/forgot-password" label="Back" />
            <Logo />
          </div>
        </div>

        {/* Form Card with Glassmorphism */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/40 p-8 transition-all duration-300 hover:shadow-primary/5 hover:shadow-2xl">
          {!isSubmitted ? (
            <>
              {/* Icon Badge */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                  <Lock className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Reset Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create a new secure password for your account
                </p>
              </div>

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 backdrop-blur-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-destructive text-xs">✕</span>
                      </div>
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="pl-10 pr-10 h-12 border-2 transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Password strength: <span className="font-semibold">{getPasswordStrengthText(passwordStrength)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getPasswordStrengthColor(passwordStrength)}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (error) setError(null);
                      }}
                      className="pl-10 pr-10 h-12 border-2 transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-4 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/40">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Password Requirements</h3>
                      <ul className="space-y-1.5 text-xs">
                        <li className={`flex items-center gap-2 transition-colors ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-600' : 'bg-muted-foreground/40'}`}></div>
                          At least 8 characters
                        </li>
                        <li className={`flex items-center gap-2 transition-colors ${/[a-zA-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/[a-zA-Z]/.test(formData.password) ? 'bg-green-600' : 'bg-muted-foreground/40'}`}></div>
                          At least one letter
                        </li>
                        <li className={`flex items-center gap-2 transition-colors ${/\d/.test(formData.password) ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(formData.password) ? 'bg-green-600' : 'bg-muted-foreground/40'}`}></div>
                          At least one number
                        </li>
                        <li className={`flex items-center gap-2 transition-colors ${/[^a-zA-Z0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${/[^a-zA-Z0-9]/.test(formData.password) ? 'bg-green-600' : 'bg-muted-foreground/40'}`}></div>
                          Special character (recommended)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-12 text-base font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
                    asChild
                  >
                    <Link to="/auth/signin">Sign in</Link>
                  </Button>
                </p>
              </div>

              {/* Security Tips */}
              <div className="hidden mt-6 p-4 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/40">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Security Tips
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                      <li>• Use a unique password you don't use elsewhere</li>
                      <li>• Consider using a password manager</li>
                      <li>• Avoid common words and patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                {/* Icon Badge */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-green-500/10 animate-in zoom-in-50 duration-500">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
                  <h3 className="text-2xl font-bold text-foreground">Password Reset Successful!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Redirecting to sign in page in 3 seconds...
                    </p>
                  </div>

                  <Button
                    variant="default"
                    className="w-full h-12 transition-all duration-300 hover:scale-[1.02]"
                    asChild
                  >
                    <Link to="/auth/signin">Continue to Sign In</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? <Link to="/support" className="text-primary hover:text-primary/80 font-medium">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
