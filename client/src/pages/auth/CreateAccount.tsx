import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import * as authApi from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';

const CreateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useAuthContext();
  
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showResend, setShowResend] = useState(false);

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

  // Verify token and pre-fill email from the invitation
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setShowResend(true);
      setIsVerifyingToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.verifyInvitationToken(token);
        if (response.success && response.data) {
          setEmail(response.data.email);
        }
      } catch (err: unknown) {
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? (err.message as string)
            : 'Invalid or expired invitation link';
        setError(errorMessage);
        setShowResend(true);
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleResendInvitation = async () => {
    if (!email) {
      setError('Please enter your email address to resend the invitation');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      await authApi.resendAccountInvitation(email);
      setSuccess(true);
      setError('');
      // Show success message
      setTimeout(() => {
        setSuccess(false);
        setShowResend(false);
      }, 3000);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to resend invitation. Please try again.';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid invitation link');
      return;
    }

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

    try {
      const response = await authApi.createAccountFromInvitation(token, password);

      if (response.success && response.data) {
        // Set access token
        setAccessToken(response.data.accessToken);

        // Update auth context
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

        setSuccess(true);

        // Determine navigation path based on role and onboarding status
        const role = response.data.user.role;
        const onboardingCompleted = (response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted;

        // Redirect after a short delay
        setTimeout(() => {
          if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'SUPPORT' || role === 'TELLER') {
            navigate('/admin/dashboard');
          } else if (role === 'ORGANIZER' || role === 'ORGANIZER_ADMIN' || role === 'ORGANIZER_TELLER') {
            // Organizers need onboarding if not completed
            navigate(onboardingCompleted === false ? '/organizer/onboarding' : '/organizer/dashboard');
          } else {
            // ATTENDEE — go directly to user dashboard
            navigate('/user/dashboard');
          }
        }, 2000);
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to create account. Please try again.';
      setError(errorMessage);
      
      // Show resend option if token is invalid or expired
      if (
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('already been used')
      ) {
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying invitation link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-4">
              Your EventKnit account has been created successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>
            Set a password to secure your EventKnit account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only if token exists, editable if resending) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={!showResend && token !== null}
                  className="pl-10"
                  required={showResend}
                />
              </div>
              {!showResend && token && (
                <p className="text-xs text-muted-foreground">
                  Your email is pre-filled from your event registration
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="pl-10"
                />
              </div>
              {password && (
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
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && !showResend && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Invitation email sent! Please check your inbox.</AlertDescription>
              </Alert>
            )}

            {!showResend && (
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !token}
              >
                {isLoading ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            )}

            {showResend && (
              <div className="space-y-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your invitation link is invalid or has expired. Enter your email to receive a new invitation.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  onClick={handleResendInvitation}
                  className="w-full"
                  disabled={isResending || !email}
                >
                  {isResending ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Invitation
                    </>
                  )}
                </Button>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAccount;




