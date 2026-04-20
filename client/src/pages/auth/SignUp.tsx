import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  Compass,
  CalendarPlus,
  Users,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';
import { useAuthContext } from '@/hooks/useAuthContext';
import { setAccessToken } from '@/lib/api';
import { requestRegistrationCode, verifyRegistrationCode } from '@/lib/auth-api';
import { extractErrorMessage } from '@/lib/utils/error';
import Logo from '@/components/layout/Logo';

// Google Icon Component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Apple Icon Component
const AppleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

// Feature pill config with individual colors
const FEATURES = [
  { label: 'Discover Events', icon: Compass, color: 'text-sky-500' },
  { label: 'Create & Manage', icon: CalendarPlus, color: 'text-emerald-500' },
  { label: 'Connect with Others', icon: Users, color: 'text-orange-500' },
] as const;

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
  autoFocus,
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
  autoFocus?: boolean;
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
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-transparent pl-12 pr-12 pt-6 pb-2 text-foreground outline-none rounded-xl disabled:cursor-not-allowed',
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

type Step = 'email' | 'verify';

const SignUp = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { signUpWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth({
    onError: (err) => setError(err),
  });
  const { signInWithApple, isLoading: isAppleLoading } = useAppleAuth({
    onError: (err) => setError(err),
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required'); return; }
    setIsLoading(true);
    try {
      await requestRegistrationCode(email);
      setStep('verify');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.length !== 6) { setError('Please enter the 6-digit verification code'); return; }
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim()) { setError('Last name is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[a-zA-Z]/.test(password)) { setError('Password must contain at least one letter'); return; }
    if (!/\d/.test(password)) { setError('Password must contain at least one number'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!agreedToTerms) { setError('You must agree to the Terms of Service and Privacy Policy'); return; }

    setIsLoading(true);
    try {
      const result = await verifyRegistrationCode(email, code, password, firstName, lastName);
      if (result.success && result.data) {
        setAccessToken(result.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
        setIsSuccess(true);

        const role = result.data.user.role;
        const needsOnboarding = typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === 'boolean'
          ? !(result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
          : true;

        setTimeout(() => {
          if (role === 'SUPERADMIN' || role === 'ADMIN') {
            navigate('/admin/dashboard');
          } else if (needsOnboarding) {
            navigate('/onboarding/welcome');
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsLoading(true);
    try {
      await requestRegistrationCode(email);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'verify') { setStep('email'); setCode(''); }
  };

  const anyLoading = isLoading || isGoogleLoading || isAppleLoading;
  const stepNumber = step === 'email' ? 1 : 2;

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side — clean ambient background */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-background">
        {/* Top-left diagonal strips */}
        <svg className="absolute top-0 left-0 w-72 h-72 pointer-events-none" viewBox="0 0 288 288" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="signup-tl-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.1" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="0" x2="288" y2="288" stroke="url(#signup-tl-grad)" strokeWidth="1.5" />
          <line x1="0" y1="40" x2="248" y2="288" stroke="url(#signup-tl-grad)" strokeWidth="1" />
          <line x1="0" y1="80" x2="208" y2="288" stroke="url(#signup-tl-grad)" strokeWidth="0.6" />
          <line x1="40" y1="0" x2="288" y2="248" stroke="url(#signup-tl-grad)" strokeWidth="0.6" />
        </svg>
        {/* Bottom-right diagonal strips */}
        <svg className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none" viewBox="0 0 288 288" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="signup-br-grad" x1="1" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.1" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="288" y1="288" x2="0" y2="0" stroke="url(#signup-br-grad)" strokeWidth="1.5" />
          <line x1="288" y1="248" x2="40" y2="0" stroke="url(#signup-br-grad)" strokeWidth="1" />
          <line x1="288" y1="208" x2="80" y2="0" stroke="url(#signup-br-grad)" strokeWidth="0.6" />
          <line x1="248" y1="288" x2="0" y2="40" stroke="url(#signup-br-grad)" strokeWidth="0.6" />
        </svg>

        <motion.div
          className="relative z-10 flex flex-col justify-center px-8 xl:px-10 mx-auto w-full max-w-lg"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Logo />
          </motion.div>

          <motion.h1
            className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join the
            <br />
            <span className="text-primary">Community</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-md mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Create, discover, and manage amazing events. Start your journey with EventKnit today.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              >
                <feature.icon className={cn('h-4 w-4', feature.color)} />
                <span className="text-sm font-medium text-foreground">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative bg-background">
        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

            <div className="relative p-8 sm:p-10">
              {/* Mobile Logo */}
              <div className="flex justify-center lg:hidden">
                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Logo />
                </motion.div>
              </div>

              {/* Header with step progress */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Back button for step 2 */}
                {step === 'verify' && (
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {/* Step Progress */}
                <div className="flex gap-2 mb-4 max-w-xs">
                  {[1, 2].map((s) => (
                    <motion.div
                      key={s}
                      className={cn('h-1 flex-1 rounded-full transition-all duration-300', s <= stepNumber ? 'bg-primary' : 'bg-border')}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, delay: s * 0.1 }}
                    />
                  ))}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {step === 'email' ? 'Create your account' : 'Complete your profile'}
                </h2>
                <p className="text-muted-foreground">
                  {step === 'email'
                    ? 'Sign up to discover and create amazing events.'
                    : <>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span></>
                  }
                </p>
              </motion.div>

              {/* Success State */}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}>
                        <Check className="h-10 w-10 text-emerald-500" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                    <motion.h3 className="text-xl font-semibold text-foreground mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      Account created!
                    </motion.h3>
                    <motion.p className="text-muted-foreground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                      Setting up your experience...
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive mb-5"
                        >
                          <AlertCircle className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ===== Email Step ===== */}
                    {step === 'email' && (
                      <div className="space-y-5">
                        {/* Social Login Buttons */}
                        <motion.div
                          className="flex gap-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <motion.button
                            type="button"
                            onClick={signUpWithGoogle}
                            disabled={anyLoading}
                            className="flex-1 relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
                            whileHover={!anyLoading ? { scale: 1.02, y: -1 } : {}}
                            whileTap={!anyLoading ? { scale: 0.98 } : {}}
                          >
                            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <GoogleIcon />}
                            <span className="text-sm font-medium text-foreground">Google</span>
                          </motion.button>

                          <motion.button
                            type="button"
                            onClick={signInWithApple}
                            disabled={anyLoading}
                            className="flex-1 relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
                            whileHover={!anyLoading ? { scale: 1.02, y: -1 } : {}}
                            whileTap={!anyLoading ? { scale: 0.98 } : {}}
                          >
                            {isAppleLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <AppleIcon />}
                            <span className="text-sm font-medium text-foreground">Apple</span>
                          </motion.button>
                        </motion.div>

                        {/* Divider */}
                        <motion.div
                          className="relative flex items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                          <div className="flex-grow border-t border-border" />
                          <span className="mx-4 text-sm text-muted-foreground">or continue with email</span>
                          <div className="flex-grow border-t border-border" />
                        </motion.div>

                        {/* Email Form */}
                        <form onSubmit={handleSendCode} className="space-y-5">
                          <AnimatedInput
                            id="email"
                            type="email"
                            label="Email address"
                            value={email}
                            onChange={setEmail}
                            icon={Mail}
                            autoComplete="email"
                            disabled={anyLoading}
                            autoFocus
                          />

                          <motion.button
                            type="submit"
                            disabled={anyLoading || !email}
                            className="w-full relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            whileHover={!anyLoading ? { scale: 1.01, y: -1 } : {}}
                            whileTap={!anyLoading ? { scale: 0.98 } : {}}
                          >
                            <span className={cn(isLoading && 'opacity-0')}>Continue with email</span>
                            <ArrowRight className={cn('h-4 w-4', isLoading && 'opacity-0')} />
                            {isLoading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            )}
                          </motion.button>
                        </form>

                        {/* Sign in link */}
                        <motion.p
                          className="text-center text-sm text-muted-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                        >
                          Already have an account?{' '}
                          <Link to="/auth/signin" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                            Log in
                          </Link>
                        </motion.p>
                      </div>
                    )}

                    {/* ===== Verify Step ===== */}
                    {step === 'verify' && (
                      <form onSubmit={handleCreateAccount} className="space-y-5">
                        {/* Verification Code */}
                        <div className="space-y-2">
                          <AnimatedInput
                            id="code"
                            type="text"
                            label="Verification code"
                            value={code}
                            onChange={(val) => setCode(val.replace(/\D/g, '').slice(0, 6))}
                            icon={KeyRound}
                            autoComplete="one-time-code"
                            disabled={anyLoading}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleResendCode}
                            className="text-xs text-primary hover:underline ml-1"
                            disabled={anyLoading}
                          >
                            Didn't get a code? Resend
                          </button>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-3">
                          <AnimatedInput
                            id="firstName"
                            type="text"
                            label="First name"
                            value={firstName}
                            onChange={setFirstName}
                            icon={User}
                            autoComplete="given-name"
                            disabled={anyLoading}
                          />
                          <AnimatedInput
                            id="lastName"
                            type="text"
                            label="Last name"
                            value={lastName}
                            onChange={setLastName}
                            icon={User}
                            autoComplete="family-name"
                            disabled={anyLoading}
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                          <AnimatedInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            value={password}
                            onChange={setPassword}
                            icon={Lock}
                            autoComplete="new-password"
                            disabled={anyLoading}
                            rightElement={
                              <motion.button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </motion.button>
                            }
                          />
                          {password && (
                            <motion.div
                              className="flex gap-3 text-xs text-muted-foreground ml-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <span className={password.length >= 8 ? 'text-emerald-500' : ''}>
                                {password.length >= 8 ? '\u2713' : '\u25CB'} 8+ chars
                              </span>
                              <span className={/[a-zA-Z]/.test(password) ? 'text-emerald-500' : ''}>
                                {/[a-zA-Z]/.test(password) ? '\u2713' : '\u25CB'} Letter
                              </span>
                              <span className={/\d/.test(password) ? 'text-emerald-500' : ''}>
                                {/\d/.test(password) ? '\u2713' : '\u25CB'} Number
                              </span>
                            </motion.div>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <AnimatedInput
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          label="Confirm password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          icon={Lock}
                          autoComplete="new-password"
                          disabled={anyLoading}
                        />

                        {/* Terms of Service */}
                        <motion.div
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <motion.div
                            className={cn(
                              'w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors duration-300 cursor-pointer',
                              agreedToTerms ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'
                            )}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                          >
                            <AnimatePresence>
                              {agreedToTerms && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          <Label
                            htmlFor="terms"
                            className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                          >
                            I agree to the{' '}
                            <Link to="/terms-of-service" className="text-primary hover:underline" target="_blank">Terms of Service</Link>{' '}
                            and{' '}
                            <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
                          </Label>
                        </motion.div>

                        {/* Submit */}
                        <motion.button
                          type="submit"
                          disabled={anyLoading || code.length !== 6 || !agreedToTerms}
                          className="w-full relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:shadow-none"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          whileHover={!anyLoading ? { scale: 1.01, y: -1 } : {}}
                          whileTap={!anyLoading ? { scale: 0.98 } : {}}
                        >
                          <span className={cn(isLoading && 'opacity-0')}>Create account</span>
                          <ArrowRight className={cn('h-4 w-4', isLoading && 'opacity-0')} />
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </motion.button>

                        {/* Sign in link */}
                        <motion.p
                          className="text-center text-sm text-muted-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                        >
                          Already have an account?{' '}
                          <Link to="/auth/signin" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                            Log in
                          </Link>
                        </motion.p>
                      </form>
                    )}
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
    </div>
  );
};

export default SignUp;
