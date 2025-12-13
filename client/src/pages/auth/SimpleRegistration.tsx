import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Calendar } from 'lucide-react';
import Logo from '@/components/Logo';
import * as authApi from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';

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
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
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
          const needsOnboarding = !response.data.user.onboardingCompleted;
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to home</span>
          </button>
          <div className="flex items-center justify-center gap-2">
            <Logo to={undefined} />
          </div>
        </div>

        {/* Registration Form */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              {step === 'role' ? (
                <>
                  Join <Logo textOnly to={undefined} />
                </>
              ) : step === 'email' ? (
                'Enter your email'
              ) : (
                'Verify your email'
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 'role'
                ? 'Choose how you want to use EventKnit. You can always switch later.'
                : step === 'email'
                ? 'We’ll send a verification code to confirm your account.'
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
                    className="p-5 rounded-2xl bg-card-surface hover:bg-primary/5 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
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
                    className="p-5 rounded-2xl bg-card-surface hover:bg-primary/5 transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
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
              <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                      className="h-12"
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
                      className="h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
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
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {success && <p className="text-sm text-green-600">{success}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center">
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
                        className="h-9 text-sm inline-flex items-center gap-2 text-primary hover:bg-accent-coral hover:text-white rounded-md transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Change role</span>
                      </Button>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="ghost"
                        className="inline-flex h-11 px-4 text-primary hover:bg-accent-coral hover:text-white font-medium shadow-none"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Continue'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
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
                    className="h-12 text-center text-2xl tracking-widest font-mono"
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
                      className="h-12"
                      required
                      disabled={isLoading}
                    />
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-foreground">Password requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                          <span className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                            {password.length >= 8 ? '✓' : '○'}
                          </span>
                          At least 8 characters
                        </li>
                        <li className={`flex items-center gap-2 ${/[a-zA-Z]/.test(password) ? 'text-green-600' : ''}`}>
                          <span className={/[a-zA-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                            {/[a-zA-Z]/.test(password) ? '✓' : '○'}
                          </span>
                          At least one letter
                        </li>
                        <li className={`flex items-center gap-2 ${/\d/.test(password) ? 'text-green-600' : ''}`}>
                          <span className={/\d/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
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
                      className="h-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 text-sm px-3 rounded-md border-border text-foreground hover:bg-accent-coral hover:text-white shadow-none"
                        onClick={handleResendCode}
                        disabled={isLoading}
                      >
                        Resend code
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 text-sm inline-flex items-center gap-1 text-primary hover:underline shadow-none"
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

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="inline-flex h-11 px-4 bg-accent-coral hover:bg-accent-coral/90 text-white font-medium shadow-none"
                        disabled={isLoading || code.length !== 6 || !password || !confirmPassword}
                      >
                        {isLoading ? 'Verifying...' : 'Verify & Sign Up'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'role') {
                navigate('/');
              } else {
                setStep(step === 'code' ? 'email' : 'role');
                setError('');
                setSuccess('');
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs text-primary hover:bg-accent-coral hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>{step === 'role' ? 'Back to home' : 'Back'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleRegistration;

