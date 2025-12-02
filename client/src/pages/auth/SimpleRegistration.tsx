import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, Users, Calendar } from 'lucide-react';
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

  // Password validation
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[@$!%*?&]/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
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

    try {
      // Verify code and register with password
      const response = await authApi.verifyRegistrationCode(email, code, password);
      
      if (response.success && response.data) {
        // Set access token and update auth context
        setAccessToken(response.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        
        // Redirect to appropriate dashboard based on role
        const role = response.data.user.role;
        if (role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER') {
          navigate('/organizer/dashboard');
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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to home</span>
          </button>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">EK</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EventKnit</span>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="border-0 bg-white rounded-2xl shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">
              {step === 'role'
                ? 'Join EventKnit'
                : step === 'email'
                ? 'Enter your email'
                : 'Verify your email'}
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
                    className="p-5 rounded-2xl bg-white hover:bg-muted/40 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-900/5 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">Attend events</h3>
                        <p className="text-xs text-muted-foreground">
                          Discover and register for events near you, and keep tickets in one place.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('ORGANIZER')}
                    className="p-5 rounded-2xl bg-white hover:bg-muted/40 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-900/5 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">Organize events</h3>
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
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Continue'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-9 text-sm inline-flex items-center justify-center gap-1 rounded-md text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
                    onClick={() => {
                      setStep('role');
                      setEmail('');
                      setError('');
                      setSuccess('');
                    }}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change role</span>
                  </Button>
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
                    {password && (
                      <p className="text-xs text-muted-foreground">
                        Must contain: uppercase, lowercase, number, special character (@$!%*?&), min 8 chars
                      </p>
                    )}
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
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                    disabled={isLoading || code.length !== 6 || !password || !confirmPassword}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Sign Up'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-sm border border-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Resend code
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-9 inline-flex items-center justify-center gap-1 rounded-md text-gray-500 hover:bg-gray-900 hover:text-white transition-colors text-sm"
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
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-gray-900 hover:bg-gray-900 hover:text-white transition-colors font-medium"
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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
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

