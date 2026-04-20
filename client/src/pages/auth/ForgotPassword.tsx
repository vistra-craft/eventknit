import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/layout/Logo';
import { forgotPassword } from '@/lib/auth-api';

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
  autoComplete,
  disabled,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
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
          className="w-full bg-transparent pl-12 pr-4 pt-6 pb-2 text-foreground outline-none rounded-xl disabled:cursor-not-allowed"
        />
      </div>
    </motion.div>
  );
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.message || 'Failed to send reset link. Please try again.');
      }
    } catch {
      // Don't reveal if email exists or not for security
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

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
                      Forgot password?
                    </h2>
                    <p className="text-muted-foreground">
                      Enter your email and we'll send you a reset link
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
                    <AnimatedInput
                      id="email"
                      type="email"
                      label="Email address"
                      value={email}
                      onChange={(val) => {
                        setEmail(val);
                        if (error) setError(null);
                      }}
                      icon={Mail}
                      autoComplete="email"
                      disabled={isLoading}
                    />

                    <motion.button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      whileHover={!isLoading ? { scale: 1.01, y: -1 } : {}}
                      whileTap={!isLoading ? { scale: 0.98 } : {}}
                    >
                      <span className={cn(isLoading && 'opacity-0')}>Send Reset Link</span>
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

                  {/* Help tip */}
                  <motion.p
                    className="text-xs text-center text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Can't find the email? Check your spam folder. The reset link expires in 1 hour.
                  </motion.p>
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
                    <h3 className="text-xl font-semibold text-foreground mb-2">Check your email</h3>
                    <p className="text-muted-foreground">
                      We've sent a password reset link to{' '}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </motion.div>

                  <motion.p
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Didn't receive the email?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Try again
                    </button>
                  </motion.p>

                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      to="/auth/signin"
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all duration-300 text-sm font-medium text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Sign In
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

export default ForgotPassword;
