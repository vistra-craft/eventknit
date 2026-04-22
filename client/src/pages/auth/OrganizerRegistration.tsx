import { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { UserRole } from '@/types/auth';
import Lottie from 'lottie-react';
import loginAnimation from '@/assets/lottie/login.json';
import PhoneInput from '@/components/ui/PhoneInput';
import Logo from '@/components/layout/Logo';
import { EASE } from '@/lib/animation-constants';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  organizerRegistrationSchema,
  type OrganizerRegistrationData,
} from '@/lib/validations/auth';
import {
  requestRegistrationCode,
  checkEmailVerificationCode,
  confirmEmailVerification,
  register as registerApi,
} from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: EASE },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -30 : 30,
    opacity: 0,
    filter: 'blur(2px)',
    transition: { duration: 0.25, ease: EASE },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

// ---------------------------------------------------------------------------
// Google icon
// ---------------------------------------------------------------------------

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Screen = 'email' | 'verify' | 'details' | 'success';

// OTP expiry in seconds (matches backend 10 min)
const OTP_TTL = 10 * 60;

const OrganizerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAuthContext();
  useAuth(); // keep context subscribed

  const [screen, setScreen] = useState<Screen>('email');
  const [direction, setDirection] = useState(1);
  const [emailInput, setEmailInput] = useState(location.state?.email || '');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConflict, setIsConflict] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0); // seconds remaining
  const otpExpiryRef = useRef(0); // stable ref for use in callbacks
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);


  const { signUpWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth({
    role: 'ORGANIZER',
    onError: (err) => setError(err),
  });

  const form = useForm<OrganizerRegistrationData>({
    resolver: zodResolver(organizerRegistrationSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      organizationName: '',
      businessEmail: '',
    },
    mode: 'onChange',
  });

  const anyLoading = isLoading || isGoogleLoading;

  // -- OTP countdown timers --------------------------------------------------

  useEffect(() => {
    if (otpExpiry <= 0) return;
    const t = setInterval(() => setOtpExpiry((s) => {
      const next = Math.max(0, s - 1);
      otpExpiryRef.current = next;
      return next;
    }), 1000);
    return () => clearInterval(t);
  }, [otpExpiry]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatSeconds = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // -- Screen 1: Email gate --------------------------------------------------

  const sendOtp = useCallback(async (email: string) => {
    await requestRegistrationCode(email, 'ORGANIZER');
    otpExpiryRef.current = OTP_TTL;
    setOtpExpiry(OTP_TTL);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, []);

  const handleEmailContinue = useCallback(async () => {
    setEmailError('');
    const trimmed = emailInput.trim();
    if (!trimmed) { setEmailError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      form.setValue('email', trimmed);
      await sendOtp(trimmed);
      setDirection(1);
      setScreen('verify');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message : 'Failed to send verification code.';
      if (msg.toLowerCase().includes('already exists')) {
        setIsConflict(true);
        setEmailError('An account with this email already exists.');
      } else {
        setEmailError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [emailInput, form, sendOtp]);

  // -- Screen 2: OTP verify (immediate backend check, no account creation yet) ----

  // Validated code stored here — passed to submit on screen 3
  const verifiedCodeRef = useRef('');

  const submitWithCode = useCallback(async (code: string) => {
    if (otpExpiryRef.current <= 0) { setOtpError('Code expired — resend a new one'); return; }
    setIsLoading(true);
    setOtpError('');
    try {
      // Validate against backend immediately — no account created, no DB writes
      await checkEmailVerificationCode(emailInput.trim(), code);
      verifiedCodeRef.current = code;
      setDirection(1);
      setScreen('details');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message : 'Invalid code.';
      setOtpError(
        msg.toLowerCase().includes('expired')
          ? 'Code expired — tap "Resend code" to get a new one.'
          : 'Incorrect code. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [emailInput]); // stable — reads otpExpiry from ref, not state

  const handleVerifyAndCreate = useCallback(() => {
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Enter all 6 digits'); return; }
    submitWithCode(code);
  }, [otp, submitWithCode]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (value && index === 5 && next.every(d => d)) {
      submitWithCode(next.join(''));
    }
  }, [otp, submitWithCode]);

  // -- Screen 3: Details + account creation ------------------------------------

  const handleDetailsContinue = useCallback(async () => {
    const valid = await form.trigger(['firstName', 'lastName', 'password', 'confirmPassword', 'organizationName', 'phoneNumber', 'businessEmail']);
    if (!valid) return;
    setIsLoading(true);
    setError('');
    setIsConflict(false);
    try {
      const d = form.getValues();
      dispatch({ type: 'AUTH_START' });
      const response = await registerApi({
        email: d.email,
        password: d.password,
        firstName: d.firstName,
        lastName: d.lastName,
        phoneNumber: d.phoneNumber,
        organizationName: d.organizationName,
        businessEmail: d.businessEmail?.trim() || undefined,
        role: UserRole.ORGANIZER,
      });
      setAccessToken(response.data.accessToken);
      // Confirm the already-validated OTP (marks it as used + sets isEmailVerified on user)
      await confirmEmailVerification(d.email, verifiedCodeRef.current);
      // Show the Done step for 2.5s BEFORE dispatching AUTH_SUCCESS.
      // Dispatching first would cause GuestRoute (which wraps /auth/*) to
      // immediately redirect the now-authenticated user, unmounting this page
      // before the success screen renders.
      const registeredUser = response.data.user;
      setIsLoading(false);
      setDirection(1);
      setScreen('success');
      setTimeout(() => {
        dispatch({ type: 'AUTH_SUCCESS', payload: registeredUser });
        navigate('/user/dashboard', { replace: true });
      }, 2500);
    } catch (err: unknown) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Registration failed' });
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message : 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setIsConflict(true);
        setEmailError('An account with this email already exists.');
        setDirection(-1);
        setScreen('email');
      } else {
        setError(msg);
      }
      setIsLoading(false);
    }
  }, [form, dispatch, navigate]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
      submitWithCode(pasted);
    }
  }, [submitWithCode]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      await sendOtp(emailInput.trim());
    } catch {
      setOtpError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [resendCooldown, emailInput, sendOtp]);

  const handleBack = useCallback(() => {
    if (screen === 'verify') {
      setDirection(-1);
      setScreen('email');
      setOtpError('');
    } else if (screen === 'details') {
      setDirection(-1);
      setScreen('verify');
      setError('');
      setIsConflict(false);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [screen, navigate]);

  // -- Derived ---------------------------------------------------------------

  const watchPassword = form.watch('password');

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* ── Left Panel ── form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 relative bg-background">
        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Logo */}
          <motion.div
            className="mb-7"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo />
          </motion.div>

          {/* Intent heading + dot-separated tagline */}
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-primary mb-2">
              For Organizers
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground leading-snug">
              Create your organizer account
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
              <span>Host events</span>
              <span className="text-primary/50">·</span>
              <span>Sell tickets</span>
              <span className="text-primary/50">·</span>
              <span>Grow your audience</span>
            </div>
          </motion.div>

          {/* Step indicator — lines connect flush to nodes */}
          {(() => {
            const STEPS = ['Email', 'Verify', 'Details', 'Done'];
            const idx = screen === 'email' ? 0 : screen === 'verify' ? 1 : screen === 'details' ? 2 : 3;
            return (
              <div className="flex items-center mb-10">
                {STEPS.map((label, i) => {
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <Fragment key={label}>
                      {/* Node */}
                      <div className="relative flex flex-col items-center shrink-0">
                        <motion.div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-300',
                            done   && 'bg-emerald-500 border-emerald-500',
                            active && 'border-primary bg-primary',
                            !done && !active && 'border-muted-foreground/25 bg-transparent',
                          )}
                          layout
                        >
                          {done ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <span className={cn(
                              'w-2 h-2 rounded-full transition-colors duration-300',
                              active ? 'bg-primary-foreground' : 'bg-muted-foreground/20',
                            )} />
                          )}
                        </motion.div>
                        <span className={cn(
                          'absolute top-7 text-[10px] font-medium tracking-wide whitespace-nowrap transition-colors duration-300',
                          done   && 'text-emerald-500',
                          active && 'text-foreground',
                          !done && !active && 'text-muted-foreground/35',
                        )}>
                          {label}
                        </span>
                      </div>

                      {/* Connector — starts and ends flush at circle edges */}
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 relative h-px">
                          <div className="absolute inset-0 bg-muted-foreground/15" />
                          <motion.div
                            className="absolute inset-y-0 left-0 h-px bg-emerald-500"
                            animate={{ width: done ? '100%' : '0%' }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            );
          })()}

          <AnimatePresence mode="wait" custom={direction}>
            {/* ── Screen: Email Gate ─────────────────────────────────── */}
            {screen === 'email' && (
              <motion.div
                key="email"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-1">
                  What's your email?
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  We'll use it to set up your organizer account.
                </p>

                <div className="space-y-4">
                  {/* Email input */}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={emailInput}
                        onChange={(e) => { setEmailInput(e.target.value); setEmailError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                        className={cn('h-11 pl-10', emailError && 'border-destructive')}
                        autoFocus
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Continue button */}
                  <Button className="w-full h-11" onClick={handleEmailContinue} disabled={anyLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-3 text-muted-foreground">or sign up with</span>
                    </div>
                  </div>

                  {/* Google OAuth */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={signUpWithGoogle}
                    disabled={isGoogleLoading}
                  >
                    <GoogleIcon />
                    <span className="ml-2">Continue with Google</span>
                  </Button>

                  {/* Terms */}
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-2">
                    By continuing, you agree to EventKnit's{' '}
                    <Link to="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                  </p>
                </div>

                {/* Sign in link */}
                <p className="text-sm text-muted-foreground mt-8">
                  Already have an account?{' '}
                  <Link to="/auth/signin" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── Screen: Account Details ────────────────────────────── */}
            {screen === 'details' && (
              <motion.div
                key="details"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
                  Your details
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Setting up account for{' '}
                  <span className="font-medium text-foreground">{form.getValues('email')}</span>
                </p>

                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {/* Name row */}
                      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Jane" className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Doe" className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* Password row */}
                      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="8+ characters" className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="Re-enter" className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* Password strength */}
                      {watchPassword && (
                        <motion.div variants={staggerItem} className="flex gap-3 text-[11px] text-muted-foreground">
                          <span className={cn(watchPassword.length >= 8 && 'text-emerald-500')}>
                            {watchPassword.length >= 8 ? '✓' : '○'} 8+ chars
                          </span>
                          <span className={cn(/[a-zA-Z]/.test(watchPassword) && 'text-emerald-500')}>
                            {/[a-zA-Z]/.test(watchPassword) ? '✓' : '○'} Letter
                          </span>
                          <span className={cn(/\d/.test(watchPassword) && 'text-emerald-500')}>
                            {/\d/.test(watchPassword) ? '✓' : '○'} Number
                          </span>
                        </motion.div>
                      )}

                      {/* Phone */}
                      <motion.div variants={staggerItem}>
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                              <FormControl>
                                <PhoneInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="712 345 678"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* Organization name */}
                      <motion.div variants={staggerItem}>
                        <FormField
                          control={form.control}
                          name="organizationName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. Nairobi Events Co." className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      {/* Business email */}
                      <motion.div variants={staggerItem}>
                        <FormField
                          control={form.control}
                          name="businessEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="contact@yourorganization.com" className="h-10" />
                              </FormControl>
                              <p className="text-[11px] text-muted-foreground">Public-facing contact email shown to attendees on your events</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </motion.div>

                    {/* Create account */}
                    <Button
                      type="button"
                      onClick={handleDetailsContinue}
                      disabled={anyLoading}
                      className="w-full h-11 mt-6"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-4">
                      By continuing, you agree to EventKnit's{' '}
                      <Link to="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                    </p>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* ── Screen: Verify Email ───────────────────────────────── */}
            {screen === 'verify' && (
              <motion.div
                key="verify"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-1">
                  Verify your email
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-medium text-foreground">{emailInput}</span>
                </p>

                {/* OTP inputs */}
                <div className="flex gap-2.5 mb-4" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={isLoading}
                      className={cn(
                        'w-full aspect-square text-center text-xl font-semibold rounded-lg border bg-muted/40',
                        'focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        otpError ? 'border-destructive' : 'border-border',
                        digit && !isLoading && 'border-primary bg-primary/5',
                      )}
                    />
                  ))}
                </div>

                {/* OTP error */}
                {otpError && (
                  <p className="text-xs text-destructive flex items-center gap-1 mb-4">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {otpError}
                  </p>
                )}

                {/* Global error (e.g. conflict on account create) */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-destructive">{error}</p>
                          {isConflict && (
                            <Link
                              to="/auth/signin"
                              className="inline-flex items-center gap-1 mt-1.5 text-primary font-medium hover:underline"
                            >
                              Sign in instead <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expiry + resend */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
                  <span>
                    {otpExpiry > 0
                      ? <>Expires in <span className={cn('font-medium tabular-nums', otpExpiry < 60 && 'text-destructive')}>{formatSeconds(otpExpiry)}</span></>
                      : <span className="text-destructive">Code expired</span>}
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                <Button
                  className="w-full h-11"
                  onClick={handleVerifyAndCreate}
                  disabled={anyLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── Screen: Success ────────────────────────────────────── */}
            {screen === 'success' && (
              <motion.div
                key="success"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                className="py-8"
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                >
                  <Check className="w-8 h-8 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2 text-center">
                  You're all set!
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-1">
                  Your organizer account is live and ready.
                </p>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Start by completing your profile, then create your first event.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Taking you to your dashboard...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Right Panel ── Lottie animation (desktop only) ──────────── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden bg-background">

        {/* Top-right diagonal strips */}
        <svg
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          viewBox="0 0 256 256"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tr-grad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="256" y1="0"  x2="0"   y2="256" stroke="url(#tr-grad)" strokeWidth="1.5" />
          <line x1="256" y1="36" x2="36"  y2="256" stroke="url(#tr-grad)" strokeWidth="1"   />
          <line x1="256" y1="72" x2="72"  y2="256" stroke="url(#tr-grad)" strokeWidth="0.6" />
        </svg>

        {/* Top-left diagonal strips */}
        <svg
          className="absolute top-0 left-0 w-64 h-64 pointer-events-none scale-x-[-1]"
          viewBox="0 0 256 256"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tl-grad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="256" y1="0"  x2="0"   y2="256" stroke="url(#tl-grad)" strokeWidth="1.5" />
          <line x1="256" y1="36" x2="36"  y2="256" stroke="url(#tl-grad)" strokeWidth="1"   />
          <line x1="256" y1="72" x2="72"  y2="256" stroke="url(#tl-grad)" strokeWidth="0.6" />
        </svg>

        {/* Lottie + supporting text */}
        <div className="relative z-10 flex flex-col items-center px-10 text-center gap-6 w-full max-w-sm">
          <motion.div
            className="w-full max-w-xs"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Lottie animationData={loginAnimation} loop />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="space-y-2"
          >
            <p className="text-base font-semibold text-foreground">
              Create unforgettable events
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Set up your organizer account and start building events your audience will love.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="h-0.5 w-16 rounded-full bg-gradient-to-r from-primary to-primary/50 origin-left"
          />
        </div>
      </div>
    </div>
  );
};

export default OrganizerRegistration;
