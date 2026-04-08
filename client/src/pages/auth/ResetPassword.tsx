import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/layout/Logo';
import { resetPassword } from '@/lib/auth-api';

// Ambient Glow — gentle drift, blue only
const AmbientGlow = ({
  className,
  delay = 0,
  duration = 30,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    className={cn('absolute rounded-full blur-3xl', className)}
    animate={{
      x: [0, 40, -20, 0],
      y: [0, -30, 20, 0],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

// Animated Input Component with floating label and icon
const AnimatedInput = ({
  id,
  type,
  label,
  value,
  onChange,
  icon: Icon,
  rightElement,
  autoComplete,
  disabled,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  rightElement?: React.ReactNode;
  autoComplete?: string;
  disabled?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className={cn(
          'relative rounded-xl border-2 transition-all duration-300',
          isFocused
            ? 'border-primary shadow-lg shadow-primary/10'
            : 'border-border hover:border-primary/50'
        )}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon className={cn('h-5 w-5 transition-colors duration-300', isFocused ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <motion.label
          htmlFor={id}
          className={cn(
            'absolute left-12 pointer-events-none transition-colors duration-300',
            isActive ? 'text-xs text-primary' : 'text-sm text-muted-foreground'
          )}
          animate={{ top: isActive ? 8 : '50%', translateY: isActive ? 0 : '-50%' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {label}
        </motion.label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent pl-12 pr-4 pt-6 pb-2 text-foreground outline-none rounded-xl disabled:cursor-not-allowed',
            rightElement && 'pr-12'
          )}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </motion.div>
  );
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => navigate('/auth/signin'), 3000);
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
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
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

  const passwordToggle = (
    <motion.button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-muted-foreground hover:text-foreground transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={showPassword ? 'visible' : 'hidden'}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: 0.15 }}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );

  // Invalid token state
  if (!token && !isSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <AmbientGlow className="w-[600px] h-[600px] bg-primary/10 -top-40 -left-40" delay={0} duration={30} />
          <AmbientGlow className="w-[500px] h-[500px] bg-primary/8 bottom-0 right-0" delay={4} duration={35} />
        </div>

        <motion.div
          className="w-full max-w-md relative z-10 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

            <div className="relative p-8 sm:p-10">
              <Link to="/" className="flex justify-center">
                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Logo />
                </motion.div>
              </Link>

              <motion.div
                className="flex flex-col items-center text-center space-y-5 py-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h2>
                  <p className="text-muted-foreground">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                </div>

                <div className="w-full space-y-3 pt-2">
                  <Link
                    to="/auth/forgot-password"
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                  >
                    Request New Link
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/auth/signin"
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all duration-300 text-sm font-medium text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Sign In
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <AmbientGlow className="w-[600px] h-[600px] bg-primary/10 -top-40 -left-40" delay={0} duration={30} />
        <AmbientGlow className="w-[500px] h-[500px] bg-primary/8 bottom-0 right-0" delay={4} duration={35} />
      </div>

      {/* Card */}
      <motion.div
        className="w-full max-w-md relative z-10 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

          <div className="relative p-8 sm:p-10">
            {/* Logo */}
            <Link to="/" className="flex justify-center">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Logo />
              </motion.div>
            </Link>

            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Header */}
                  <motion.div
                    className="text-center mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      Reset password
                    </h2>
                    <p className="text-muted-foreground">
                      Create a new secure password for your account
                    </p>
                  </motion.div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-2">
                      <AnimatedInput
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        label="New password"
                        value={formData.password}
                        onChange={handlePasswordChange}
                        icon={Lock}
                        autoComplete="new-password"
                        disabled={isLoading}
                        rightElement={passwordToggle}
                      />

                      {/* Password strength & requirements */}
                      {formData.password && (
                        <motion.div
                          className="space-y-2 ml-1"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className={cn('h-full rounded-full', getPasswordStrengthColor(passwordStrength))}
                                initial={{ width: 0 }}
                                animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getPasswordStrengthText(passwordStrength)}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className={formData.password.length >= 8 ? 'text-emerald-500' : ''}>
                              {formData.password.length >= 8 ? '\u2713' : '\u25CB'} 8+ chars
                            </span>
                            <span className={/[a-zA-Z]/.test(formData.password) ? 'text-emerald-500' : ''}>
                              {/[a-zA-Z]/.test(formData.password) ? '\u2713' : '\u25CB'} Letter
                            </span>
                            <span className={/\d/.test(formData.password) ? 'text-emerald-500' : ''}>
                              {/\d/.test(formData.password) ? '\u2713' : '\u25CB'} Number
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <AnimatedInput
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      label="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(val) => {
                        setFormData({ ...formData, confirmPassword: val });
                        if (error) setError(null);
                      }}
                      icon={Lock}
                      autoComplete="new-password"
                      disabled={isLoading}
                    />

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      whileHover={!isLoading ? { scale: 1.01, y: -1 } : {}}
                      whileTap={!isLoading ? { scale: 0.98 } : {}}
                    >
                      <span className={cn(isLoading && 'opacity-0')}>Reset Password</span>
                      <ArrowRight className={cn('h-4 w-4', isLoading && 'opacity-0')} />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </motion.button>
                  </form>

                  {/* Back to sign in */}
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <Link
                      to="/auth/signin"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to sign in
                    </Link>
                  </motion.div>
                </motion.div>
              ) : (
                /* Success State */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center py-6 space-y-5"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                    >
                      <Check className="h-10 w-10 text-emerald-500" strokeWidth={3} />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-xl font-semibold text-foreground mb-2">Password reset successful</h3>
                    <p className="text-muted-foreground">
                      Your password has been updated. You can now sign in with your new password.
                    </p>
                  </motion.div>

                  <motion.p
                    className="text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Redirecting to sign in...
                  </motion.p>

                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      to="/auth/signin"
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                    >
                      Continue to Sign In
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          By continuing, you agree to our{' '}
          <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
