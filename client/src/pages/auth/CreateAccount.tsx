import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as authApi from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';

const CreateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useAuthContext();
  
  const token = searchParams.get('token');
  const [email] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  // Verify token and get email (optional - we can skip this and just show form)
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setIsVerifyingToken(false);
      return;
    }
    // For now, we'll just show the form - email will be pre-filled from the token verification
    // In a full implementation, we could verify the token first to show the email
    setIsVerifyingToken(false);
  }, [token]);

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

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to create account. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-4">
              Your EventKnit account has been created successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
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
            {/* Email (read-only, pre-filled) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="your.email@example.com"
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your email is pre-filled from your event registration
              </p>
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
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !token}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

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




