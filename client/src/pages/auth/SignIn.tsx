import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import Logo from '@/components/layout/Logo';
import { requestEmailOAuthCode, verifyEmailOAuthCode, googleAuth, appleAuth } from '@/lib/auth-api';
import { extractErrorMessage } from '@/lib/utils/error';

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

// Feature pill config with individual colors
const FEATURES = [
  { label: 'Event Analytics', icon: BarChart3, color: 'text-sky-500' },
  { label: 'Secure Ticketing', icon: Shield, color: 'text-emerald-500' },
  { label: 'Real-time Updates', icon: Zap, color: 'text-orange-500' },
] as const;

// Animated Input Component with floating label and icon
const AnimatedInput = ({
  id,
  type,
  label,
  value,
  onChange,
  error,
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
  error?: string;
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
            : error
            ? 'border-destructive'
            : 'border-border hover:border-primary/50'
        )}
      >
        {/* Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon
            className={cn(
              'h-5 w-5 transition-colors duration-300',
              isFocused ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>

        {/* Floating Label */}
        <motion.label
          htmlFor={id}
          className={cn(
            'absolute left-12 pointer-events-none transition-colors duration-300',
            isActive ? 'text-xs text-primary' : 'text-sm text-muted-foreground'
          )}
          animate={{
            top: isActive ? 8 : '50%',
            translateY: isActive ? 0 : '-50%',
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {label}
        </motion.label>

        {/* Input */}
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
            'w-full bg-transparent pl-12 pr-12 pt-6 pb-2 text-foreground outline-none rounded-xl disabled:cursor-not-allowed',
            rightElement && 'pr-12'
          )}
        />

        {/* Right Element (e.g., password toggle) */}
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1 mt-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main SignIn Component
const SignIn = () => {
  const { login, isLoading, error: authError, clearError } = useAuth();
  const { dispatch } = useAuthContext();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [showPassword, setShowPassword] = useState(false);
  const [emailOAuthEmail, setEmailOAuthEmail] = useState('');
  const [emailOAuthCode, setEmailOAuthCode] = useState('');
  const [emailOAuthCodeSent, setEmailOAuthCodeSent] = useState(false);
  const [showEmailOAuthForm, setShowEmailOAuthForm] = useState(false);
  const [emailOAuthRole, setEmailOAuthRole] = useState<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const redirectAfterLogin = (role: string) => {
    const destination = returnTo
      ? returnTo
      : role === 'ORGANIZER' || role === 'ORGANIZER_ADMIN' || role === 'ORGANIZER_TELLER'
      ? '/organizer/dashboard'
      : role === 'SUPERADMIN' || role === 'ADMIN' || role === 'SUPPORT' || role === 'TELLER'
      ? '/admin/dashboard'
      : '/user/dashboard';

    setTimeout(() => {
      window.location.href = destination;
    }, 1500);
  };

  useEffect(() => {
    clearError();
    setEmailOAuthEmail('');
    setEmailOAuthCode('');
    setEmailOAuthCodeSent(false);
    setShowEmailOAuthForm(false);

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoginError(null);

    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(formData.email, formData.password, rememberMe);
      setIsSuccess(true);
      // Navigation is handled by the useAuth hook
    } catch (error: unknown) {
      setLoginError(extractErrorMessage(error, 'Invalid email or password. Please try again.'));
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsGoogleLoading(true);
    try {
      if (!window.google?.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        setLoginError('Google sign-in is not configured. Please try another method.');
        setIsGoogleLoading(false);
        return;
      }
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error || !response.access_token) {
            setIsGoogleLoading(false);
            return;
          }
          try {
            const result = await googleAuth(response.access_token, 'access_token');
            if (result.success && result.data) {
              setAccessToken(result.data.accessToken);
              dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
              setIsGoogleLoading(false);
              setIsSuccess(true);
              redirectAfterLogin(result.data.user.role);
            }
          } catch (error: unknown) {
            setIsGoogleLoading(false);
            setLoginError(extractErrorMessage(error, 'Google sign-in failed. Please try again.'));
          }
        },
        error_callback: (err) => {
          setIsGoogleLoading(false);
          if (err.type !== 'popup_closed') {
            setLoginError('Google sign-in was interrupted. Please try again.');
          }
        },
      });
      tokenClient.requestAccessToken();
    } catch (error: unknown) {
      setIsGoogleLoading(false);
      setLoginError(extractErrorMessage(error, 'Google sign-in failed. Please try again.'));
    }
  };

  const handleAppleSignIn = async () => {
    clearError();
    setIsAppleLoading(true);
    try {
      if (!window.AppleID) {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || '';
      if (!clientId) {
        setLoginError('Apple sign-in is not configured. Please try another method.');
        setIsAppleLoading(false);
        return;
      }
      window.AppleID?.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const response = await window.AppleID!.auth.signIn();
      try {
        const result = await appleAuth(
          response.authorization.code,
          response.authorization.id_token,
          undefined,
          response.user ? { name: response.user.name } : undefined
        );
        if (result.success && result.data) {
          setAccessToken(result.data.accessToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
          setIsAppleLoading(false);
          setIsSuccess(true);
          redirectAfterLogin(result.data.user.role);
        }
      } catch (error: unknown) {
        setIsAppleLoading(false);
        setLoginError(extractErrorMessage(error, 'Apple sign-in failed. Please try again.'));
      }
    } catch (error: unknown) {
      setIsAppleLoading(false);
      setLoginError(extractErrorMessage(error, 'Apple sign-in failed. Please try again.'));
    }
  };

  const handleEmailOAuthRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!emailOAuthEmail) return;
    try {
      await requestEmailOAuthCode(emailOAuthEmail, emailOAuthRole);
      setEmailOAuthCodeSent(true);
    } catch (error: unknown) {
      setLoginError(extractErrorMessage(error, 'Failed to send sign-in code. Please try again.'));
    }
  };

  const handleEmailOAuthVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!emailOAuthCode || !emailOAuthEmail) return;
    try {
      const result = await verifyEmailOAuthCode(emailOAuthEmail, emailOAuthCode);
      if (result.success && result.data) {
        setAccessToken(result.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
        setIsSuccess(true);
        redirectAfterLogin(result.data.user.role);
      }
    } catch (error: unknown) {
      setLoginError(extractErrorMessage(error, 'Verification failed. Please check your code and try again.'));
    }
  };

  const anyLoading = isLoading || isGoogleLoading || isAppleLoading;

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Left Side — clean ambient background */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-background">
        {/* Two soft blue glows */}
        <AmbientGlow className="w-[700px] h-[700px] bg-primary/15 -top-60 -left-40" delay={0} duration={30} />
        <AmbientGlow className="w-[500px] h-[500px] bg-primary/10 bottom-0 right-0" delay={4} duration={35} />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col justify-center px-12 xl:px-20"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Link to="/">
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Logo />
            </motion.div>
          </Link>

          <motion.h1
            className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Your Event
            <br />
            <span className="text-primary">Management Hub</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-md mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Sign in to manage your events, track ticket sales, and grow your audience with powerful insights.
          </motion.p>

          {/* Feature Pills — each with its own accent color */}
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative bg-background">
        {/* Login Card */}
        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

            <div className="relative p-8 sm:p-10">
              {/* Mobile Logo */}
              <Link to="/" className="flex justify-center lg:hidden">
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Logo />
                </motion.div>
              </Link>

              {/* Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Sign in
                </h2>
                <p className="text-muted-foreground">
                  Welcome back! Enter your credentials to continue
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                      >
                        <Check className="h-10 w-10 text-emerald-500" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                    <motion.h3
                      className="text-xl font-semibold text-foreground mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Welcome back!
                    </motion.h3>
                    <motion.p
                      className="text-muted-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      Redirecting to dashboard...
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    className="space-y-5"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* API Error Alert */}
                    <AnimatePresence>
                      {(loginError || authError) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
                        >
                          <AlertCircle className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{loginError || authError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Social Login Buttons */}
                    <motion.div
                      className="flex gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <motion.button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={anyLoading}
                        className="flex-1 relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
                        whileHover={!anyLoading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!anyLoading ? { scale: 0.98 } : {}}
                      >
                        {isGoogleLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <GoogleIcon />
                        )}
                        <span className="text-sm font-medium text-foreground">Google</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleAppleSignIn}
                        disabled={anyLoading}
                        className="flex-1 relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
                        whileHover={!anyLoading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!anyLoading ? { scale: 0.98 } : {}}
                      >
                        {isAppleLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <AppleIcon />
                        )}
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

                    {/* Email OAuth Section */}
                    {(showEmailOAuthForm || emailOAuthCodeSent) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        {!emailOAuthCodeSent ? (
                          showEmailOAuthForm && (
                            <form onSubmit={handleEmailOAuthRequest} className="w-full space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  id="email-oauth-input"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={emailOAuthEmail}
                                  onChange={(e) => setEmailOAuthEmail(e.target.value)}
                                  className="flex-1 h-11 rounded-xl"
                                  required
                                  disabled={anyLoading}
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                  className="h-11 px-4 rounded-xl"
                                  disabled={anyLoading || !emailOAuthEmail}
                                >
                                  Send Code
                                </Button>
                              </div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="emailOAuthRole"
                                    value="ATTENDEE"
                                    checked={emailOAuthRole === 'ATTENDEE'}
                                    onChange={(e) => setEmailOAuthRole(e.target.value as 'ATTENDEE' | 'ORGANIZER')}
                                    className="w-3 h-3"
                                  />
                                  Attendee
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="emailOAuthRole"
                                    value="ORGANIZER"
                                    checked={emailOAuthRole === 'ORGANIZER'}
                                    onChange={(e) => setEmailOAuthRole(e.target.value as 'ATTENDEE' | 'ORGANIZER')}
                                    className="w-3 h-3"
                                  />
                                  Organizer
                                </label>
                              </div>
                            </form>
                          )
                        ) : (
                          <form onSubmit={handleEmailOAuthVerify} className="w-full space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={emailOAuthCode}
                                onChange={(e) => setEmailOAuthCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="flex-1 h-11 text-center text-lg tracking-widest rounded-xl"
                                maxLength={6}
                                required
                                disabled={anyLoading}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                className="h-11 px-4 rounded-xl"
                                disabled={anyLoading || emailOAuthCode.length !== 6}
                              >
                                Verify
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                              Code sent to {emailOAuthEmail}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full h-9 text-xs"
                              onClick={() => {
                                setEmailOAuthCodeSent(false);
                                setEmailOAuthCode('');
                                setShowEmailOAuthForm(false);
                              }}
                              disabled={anyLoading}
                            >
                              Use a different email
                            </Button>
                          </form>
                        )}
                      </motion.div>
                    )}

                    {/* Main Sign In Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email Input */}
                      <AnimatedInput
                        id="email"
                        type="email"
                        label="Email address"
                        value={formData.email}
                        onChange={(value) => setFormData({ ...formData, email: value })}
                        icon={Mail}
                        autoComplete="email"
                        disabled={anyLoading}
                      />

                      {/* Password Input */}
                      <AnimatedInput
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Password"
                        value={formData.password}
                        onChange={(value) => setFormData({ ...formData, password: value })}
                        icon={Lock}
                        autoComplete="current-password"
                        disabled={anyLoading}
                        rightElement={
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
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </motion.div>
                            </AnimatePresence>
                          </motion.button>
                        }
                      />

                      {/* Remember Me & Forgot Password */}
                      <motion.div
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                      >
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <motion.div
                            className={cn(
                              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-300',
                              rememberMe
                                ? 'bg-primary border-primary'
                                : 'border-border group-hover:border-primary/50'
                            )}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const next = !rememberMe;
                              setRememberMe(next);
                              if (!next) localStorage.removeItem('rememberedEmail');
                            }}
                          >
                            <AnimatePresence>
                              {rememberMe && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            Remember for 30 days
                          </span>
                        </label>
                        <Link
                          to="/auth/forgot-password"
                          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          Forgot password?
                        </Link>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={anyLoading}
                        className="w-full relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-primary-foreground bg-primary transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        whileHover={!anyLoading ? { scale: 1.01, y: -1 } : {}}
                        whileTap={!anyLoading ? { scale: 0.98 } : {}}
                      >
                        <span className={cn(isLoading && 'opacity-0')}>Sign in</span>
                        <ArrowRight className={cn('h-4 w-4', isLoading && 'opacity-0')} />
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </motion.button>
                    </form>

                    {/* Email Sign-In Link */}
                    {!showEmailOAuthForm && !emailOAuthCodeSent && (
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.65 }}
                      >
                        <button
                          type="button"
                          onClick={() => setShowEmailOAuthForm(true)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          Sign in with email code instead
                        </button>
                      </motion.div>
                    )}

                    {/* Sign Up Link */}
                    <motion.p
                      className="text-center text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                    >
                      Don&apos;t have an account?{' '}
                      <Link
                        to="/auth/signup"
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Sign up
                      </Link>
                    </motion.p>
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
            <Link to="/terms-of-service" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
