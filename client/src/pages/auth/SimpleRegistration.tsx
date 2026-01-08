import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Calendar } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import * as authApi from '@/lib/auth-api';
import { googleAuth, facebookAuth } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';

type UserRole = 'ATTENDEE' | 'ORGANIZER';
type RegistrationStep = 'role' | 'email' | 'code';

const SimpleRegistration = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();
  const [step, setStep] = useState<RegistrationStep>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setStep('email');
  };

  // Google OAuth signup
  const handleGoogleSignUp = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');
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
        setError('Google Sign-In not configured');
        setIsLoading(false);
        return;
      }
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const result = await googleAuth(response.credential, 'id_token', selectedRole);
            if (result.success && result.data) {
              setAccessToken(result.data.accessToken);
              dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });

              const role = result.data.user.role;
              if (role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER') {
                const needsOnboarding = result.data.user &&
                  typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === "boolean"
                    ? !(result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
                    : true;
                navigate(needsOnboarding ? '/organizer/onboarding' : '/organizer/dashboard');
              } else if (role === 'SUPERADMIN' || role === 'ADMIN_STAFF' || role === 'MARKETER' || role === 'SUPPORT' || role === 'TELLER') {
                navigate('/admin/dashboard');
              } else {
                navigate('/user/dashboard');
              }
            }
          } catch (err) {
            setError(extractErrorMessage(err, 'Google sign up failed. Please try again.'));
            setIsLoading(false);
          }
        },
      });
      window.google?.accounts.id.prompt();
    } catch (err) {
      setError(extractErrorMessage(err, 'Google sign up failed. Please try again.'));
      setIsLoading(false);
    }
  };

  // Facebook OAuth signup
  const handleFacebookSignUp = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');
    try {
      if (!window.FB) {
        window.fbAsyncInit = function() {
          window.FB?.init({ appId: import.meta.env.VITE_FACEBOOK_APP_ID || '', cookie: true, xfbml: true, version: 'v18.0' });
        };
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          const checkFB = setInterval(() => { if (window.FB) { clearInterval(checkFB); resolve(true); } }, 100);
        });
      }
      window.FB?.login(async (response) => {
        if (response.authResponse) {
          try {
            const result = await facebookAuth(response.authResponse.accessToken, selectedRole);
            if (result.success && result.data) {
              setAccessToken(result.data.accessToken);
              dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });

              const role = result.data.user.role;
              if (role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER') {
                const needsOnboarding = result.data.user &&
                  typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === "boolean"
                    ? !(result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
                    : true;
                navigate(needsOnboarding ? '/organizer/onboarding' : '/organizer/dashboard');
              } else if (role === 'SUPERADMIN' || role === 'ADMIN_STAFF' || role === 'MARKETER' || role === 'SUPPORT' || role === 'TELLER') {
                navigate('/admin/dashboard');
              } else {
                navigate('/user/dashboard');
              }
            }
          } catch (err) {
            setError(extractErrorMessage(err, 'Facebook sign up failed. Please try again.'));
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      }, { scope: 'email' });
    } catch (err) {
      setError(extractErrorMessage(err, 'Facebook sign up failed. Please try again.'));
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Request verification code with selected role
      await authApi.requestRegistrationCode(email, selectedRole);
      setSuccess('Verification code sent to your email!');
      setStep('code');
    } catch (err: unknown) {
      // Extract error message from various error formats
      let errorMessage = 'Failed to send verification code. Please try again.';

      if (err && typeof err === 'object') {
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        } else if ('success' in err && err.success === false && 'message' in err) {
          errorMessage = (err as { message: string }).message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Password validation (Eventbrite-style: 8+ chars, 1 letter, 1 number)
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (password.length > 128) {
      return 'Password must be no more than 128 characters';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    if (!password) {
      setError('Password is required');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    // Validate first and last name
    if (!firstName.trim()) {
      setError('First name is required');
      setIsLoading(false);
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      setIsLoading(false);
      return;
    }

    try {
      // Verify code and register with password
      const response = await authApi.verifyRegistrationCode(email, code, password, firstName.trim(), lastName.trim());

      if (response.success && response.data) {
        // Set access token and update auth context
        setAccessToken(response.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

        // Redirect to appropriate dashboard based on role
        const role = response.data.user.role;
        if (role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER') {
          // New organizers go to onboarding, existing ones go to dashboard
          // Check onboarding status from user data (will be added to response)
        const needsOnboarding =
          response.data.user &&
          typeof (response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === "boolean"
            ? !(response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
            : false;
          navigate(needsOnboarding ? '/organizer/onboarding' : '/organizer/dashboard');
        } else if (role === 'SUPERADMIN' || role === 'ADMIN_STAFF' || role === 'MARKETER' || role === 'SUPPORT' || role === 'TELLER') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Invalid verification code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.requestRegistrationCode(email, selectedRole);
      setSuccess('New verification code sent!');
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <BackButton to="/" label="Back to home" />
          <Logo />
        </div>

        {/* Registration Form */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">
              {step === 'role' ? (
                <>
                  Join <Logo textOnly to={undefined} />
                </>
              ) : step === 'email' ? (
                `Sign up as ${selectedRole === 'ORGANIZER' ? 'an organizer' : 'an attendee'}`
              ) : (
                'Verify your email'
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 'role'
                ? 'Choose how you want to use EventKnit. You can always switch later.'
                : step === 'email'
                ? 'Use your Google or Facebook account, or continue with email.'
                : 'Enter the 6-digit code we sent and create your password.'}
            </p>
          </CardHeader>
          <CardContent>
            {step === 'role' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('ATTENDEE')}
                    className="p-5 rounded-2xl bg-card-surface transition-all text-left group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">Attend events</h3>
                        <p className="text-xs text-muted-foreground">
                          Discover and register for events near you, and keep tickets in one place.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('ORGANIZER')}
                    className="p-5 rounded-2xl bg-card-surface transition-all text-left group cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">Organize events</h3>
                        <p className="text-xs text-muted-foreground">
                          Create and manage your own events, and track ticket sales with ease.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            ) : step === 'email' ? (
              <div className="space-y-6">
                {/* Social Login Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
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
                    onClick={handleFacebookSignUp}
                    disabled={isLoading}
                    type="button"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card-surface px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setError('');
                        }}
                        className="h-11"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setError('');
                        }}
                        className="h-11"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  {success && <p className="text-sm text-success">{success}</p>}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStep('role');
                        setEmail('');
                        setFirstName('');
                        setLastName('');
                        setError('');
                        setSuccess('');
                      }}
                      disabled={isLoading}
                      className="h-9 text-sm inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Change role</span>
                    </Button>

                    <Button
                      type="submit"
                      variant="default"
                      className="h-11 px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader size="sm" className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(value);
                      setError('');
                    }}
                    className="h-11 text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code sent to: <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="h-11"
                      required
                      disabled={isLoading}
                    />
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-foreground">Password requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-success' : ''}`}>
                          <span className={password.length >= 8 ? 'text-success' : 'text-muted-foreground'}>
                            {password.length >= 8 ? '✓' : '○'}
                          </span>
                          At least 8 characters
                        </li>
                        <li className={`flex items-center gap-2 ${/[a-zA-Z]/.test(password) ? 'text-success' : ''}`}>
                          <span className={/[a-zA-Z]/.test(password) ? 'text-success' : 'text-muted-foreground'}>
                            {/[a-zA-Z]/.test(password) ? '✓' : '○'}
                          </span>
                          At least one letter
                        </li>
                        <li className={`flex items-center gap-2 ${/\d/.test(password) ? 'text-success' : ''}`}>
                          <span className={/\d/.test(password) ? 'text-success' : 'text-muted-foreground'}>
                            {/\d/.test(password) ? '✓' : '○'}
                          </span>
                          At least one number
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                {success && <p className="text-sm text-success">{success}</p>}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 text-sm px-3"
                      onClick={handleResendCode}
                      disabled={isLoading}
                    >
                      Resend code
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 text-sm inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setStep('email');
                        setCode('');
                        setPassword('');
                        setConfirmPassword('');
                        setError('');
                        setSuccess('');
                      }}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Change email</span>
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    className="h-11 px-6"
                    disabled={isLoading || code.length !== 6 || !password || !confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Sign Up'
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  asChild
                >
                  <Link to="/auth/signin">Sign in</Link>
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleRegistration;
