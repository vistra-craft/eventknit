import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import * as authApi from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';

const SimpleRegistration = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Request verification code
      await authApi.requestRegistrationCode(email);
      setSuccess('Verification code sent to your email!');
      setStep('code');
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to send verification code. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verify code and register
      const response = await authApi.verifyRegistrationCode(email, code);
      
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
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.requestRegistrationCode(email);
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
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-eventknit hover:text-eventknit/80 transition-colors"
            >
              EventKnit
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {step === 'email' ? 'Join EventKnit' : 'Verify Your Email'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'email'
              ? 'Enter your email to get started'
              : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {/* Registration Form */}
        <Card className="border-2 hover:border-eventknit/20 transition-all duration-300">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4">
              {step === 'email' ? (
                <Mail className="w-8 h-8 text-eventknit" />
              ) : (
                <CheckCircle className="w-8 h-8 text-eventknit" />
              )}
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {step === 'email' ? "Let's get started" : 'Enter verification code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
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

                <Button
                  type="submit"
                  className="w-full bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground h-12"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </Button>
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
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {success && <p className="text-sm text-green-600">{success}</p>}
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground h-12"
                    disabled={isLoading || code.length !== 6}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Sign Up'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Resend Code
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError('');
                      setSuccess('');
                    }}
                    disabled={isLoading}
                  >
                    Change Email
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="text-eventknit hover:text-eventknit/80 font-medium"
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
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleRegistration;

