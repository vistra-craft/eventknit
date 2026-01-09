import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { verifyMagicLink, requestMagicLink } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { extractErrorMessage } from '@/lib/utils/error';

const MagicLinkVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useAuthContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('Invalid magic link. No token provided.');
      return;
    }

    // Verify magic link and auto-login
    verifyMagicLink(token)
      .then((response) => {
        if (response.success && response.data) {
          // Set access token (refresh token is set via HttpOnly cookie)
          setAccessToken(response.data.accessToken);

          // Update auth context
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

          setStatus('success');

          // Redirect to appropriate dashboard based on role
          setTimeout(() => {
            const role = response.data.user.role;
            if (role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER') {
              navigate('/organizer/dashboard');
            } else if (role === 'SUPERADMIN' || role === 'ADMIN_STAFF' || role === 'MARKETER' || role === 'SUPPORT' || role === 'TELLER') {
              navigate('/admin/dashboard');
            } else {
              navigate('/user/dashboard');
            }
          }, 2000); // Show success message for 2 seconds
        } else {
          setStatus('error');
          setError('Failed to verify magic link. Please try again.');
        }
      })
      .catch((err: unknown) => {
        setError(extractErrorMessage(err, 'Invalid or expired magic link. Please request a new one.'));
        setStatus('error');
      });
  }, [searchParams, navigate, dispatch]);

  const handleRequestNewLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await requestMagicLink(email);
      setError('');
      setStatus('success');
      // Show success message
      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to send magic link. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4">
              {status === 'loading' && <Loader size="lg" />}
              {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
              {status === 'error' && <XCircle className="w-8 h-8 text-destructive" />}
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {status === 'loading' && 'Logging you in...'}
              {status === 'success' && 'Login Successful!'}
              {status === 'error' && 'Link Expired or Invalid'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Verifying your magic link and logging you in...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <p className="text-green-600 font-medium">
                  You have been successfully logged in!
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to your dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Request a new magic link:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                      />
                      <Button
                        onClick={handleRequestNewLink}
                        variant="default"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Link
                      </Button>
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">or</div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/auth/signin')}
                  >
                    Go to login
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MagicLinkVerify;

