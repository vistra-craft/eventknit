import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';
import { useAuthContext } from '@/hooks/useAuthContext';
import { setAccessToken } from '@/lib/api';
import { requestRegistrationCode, verifyRegistrationCode } from '@/lib/auth-api';
import { extractErrorMessage } from '@/lib/utils/error';
import BackButton from '@/components/BackButton';
import Logo from '@/components/layout/Logo';
import signupImage from '@/assets/event-concert.jpg';

type Step = 'email' | 'verify';

const SignUp = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  // Step management
  const [step, setStep] = useState<Step>('email');

  // Form state
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth (no role parameter - all users default to ATTENDEE)
  const { signUpWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth({
    onError: (err) => setError(err),
  });

  // Apple OAuth (no role parameter - all users default to ATTENDEE)
  const { signInWithApple, isLoading: isAppleLoading } = useAppleAuth({
    onError: (err) => setError(err),
  });

  // Step 2: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

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

  // Step 3: Verify code and create account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter');
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyRegistrationCode(email, code, password, firstName, lastName);

      if (result.success && result.data) {
        setAccessToken(result.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });

        // NEW: All new users go through unified onboarding
        const role = result.data.user.role;
        const needsOnboarding = typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === 'boolean'
          ? !(result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
          : true;

        if (role === 'SUPERADMIN' || role === 'ADMIN') {
          // Admins skip onboarding, go directly to admin dashboard
          navigate('/admin/dashboard');
        } else if (needsOnboarding) {
          // All non-admin users go to unified onboarding
          navigate('/onboarding/welcome');
        } else {
          // Existing users (shouldn't happen for new signups, but included for safety)
          navigate('/dashboard');
        }
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
    if (step === 'verify') {
      setStep('email');
      setCode('');
    }
  };

  // Step progress (2 steps: email, verify)
  const stepNumber = step === 'email' ? 1 : 2;

  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="p-4 w-full">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-card-surface rounded-2xl shadow-md overflow-hidden flex flex-col lg:flex-row">
            {/* Left Panel - Image with Overlay */}
            <div className="hidden lg:block lg:w-1/2 relative">
              <div className="absolute inset-0">
                <img
                  src={signupImage}
                  alt="Join EventKnit"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/30">
                  <div className="text-center">
                    <h2 className="text-white text-3xl font-bold mb-2">Join the Community</h2>
                    <p className="text-white/90 text-lg">Create, discover, and manage amazing events</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Sign Up Form */}
            <div className="w-full lg:w-1/2 p-5 lg:p-6">
              <div className="w-full max-w-md mx-auto">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    {step === 'email' ? (
                      <BackButton to="/" label="Back to home" />
                    ) : (
                      <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                    <Logo />
                  </div>

                  {/* Step Progress */}
                  <div className="flex gap-2 mb-4 max-w-xs">
                    {[1, 2].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          s <= stepNumber ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>

                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {step === 'email' && 'Create your account'}
                    {step === 'verify' && 'Complete your profile'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {step === 'email' && 'Sign up to discover and create amazing events.'}
                    {step === 'verify' && (
                      <>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span></>
                    )}
                  </p>
                </div>

                {/* ===== Email Step ===== */}
                {step === 'email' && (
                  <>
                    {/* Social Login Buttons */}
                    <div className="mb-4 flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-11"
                        onClick={signUpWithGoogle}
                        disabled={isLoading || isGoogleLoading || isAppleLoading}
                        type="button"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-11"
                        onClick={signInWithApple}
                        disabled={isLoading || isGoogleLoading || isAppleLoading}
                        type="button"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                        Apple
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card-surface px-2 text-muted-foreground">Or continue with email</span>
                      </div>
                    </div>

                    {/* Email Form */}
                    <div className="space-y-4">
                      <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 border-border focus:border-primary focus:ring-primary"
                            required
                            disabled={isLoading}
                            autoComplete="email"
                            autoFocus
                          />
                        </div>

                        {error && (
                          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                            {error}
                          </div>
                        )}

                        <Button
                          type="submit"
                          variant="default"
                          className="w-full h-11"
                          disabled={isLoading || !email}
                        >
                          {isLoading ? (
                            <>
                              <Loader size="sm" className="mr-2" />
                              Sending code...
                            </>
                          ) : (
                            'Continue with email'
                          )}
                        </Button>
                      </form>

                      {/* Sign in link */}
                      <div className="text-center pt-1">
                        <p className="text-sm text-muted-foreground">
                          Already have an account?{' '}
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium"
                            asChild
                          >
                            <Link to="/auth/signin">Log in</Link>
                          </Button>
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== Verify Step ===== */}
                {step === 'verify' && (
                  <div className="space-y-4">
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                      {/* Verification Code */}
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-foreground">Verification code</Label>
                        <Input
                          id="code"
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter 6-digit code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-11 text-center text-lg tracking-widest border-border focus:border-primary focus:ring-primary"
                          maxLength={6}
                          required
                          disabled={isLoading}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="text-xs text-primary hover:underline"
                          disabled={isLoading}
                        >
                          Didn't get a code? Resend
                        </button>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First name</Label>
                          <Input
                            id="firstName"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="h-11 border-border focus:border-primary focus:ring-primary"
                            required
                            disabled={isLoading}
                            autoComplete="given-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last name</Label>
                          <Input
                            id="lastName"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="h-11 border-border focus:border-primary focus:ring-primary"
                            required
                            disabled={isLoading}
                            autoComplete="family-name"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {password && (
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className={password.length >= 8 ? 'text-success' : ''}>
                              {password.length >= 8 ? '\u2713' : '\u25CB'} 8+ chars
                            </span>
                            <span className={/[a-zA-Z]/.test(password) ? 'text-success' : ''}>
                              {/[a-zA-Z]/.test(password) ? '\u2713' : '\u25CB'} Letter
                            </span>
                            <span className={/\d/.test(password) ? 'text-success' : ''}>
                              {/\d/.test(password) ? '\u2713' : '\u25CB'} Number
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm password</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 border-border focus:border-primary focus:ring-primary"
                          required
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                      </div>

                      {/* Terms of Service */}
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="terms"
                          className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
                        >
                          I agree to the{' '}
                          <Link to="/terms" className="text-primary hover:underline" target="_blank">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>

                      {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="default"
                        className="w-full h-11"
                        disabled={isLoading || code.length !== 6 || !agreedToTerms}
                      >
                        {isLoading ? (
                          <>
                            <Loader size="sm" className="mr-2" />
                            Creating account...
                          </>
                        ) : (
                          'Create account'
                        )}
                      </Button>
                    </form>

                    {/* Sign in link */}
                    <div className="text-center pt-1">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium"
                          asChild
                        >
                          <Link to="/auth/signin">Log in</Link>
                        </Button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
