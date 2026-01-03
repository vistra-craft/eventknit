import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Users, Calendar } from 'lucide-react';
import { facebookAuth, googleAuth } from '@/lib/auth-api';

// Window type extensions are in SignIn.tsx

const EmailEntry = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE');

  const handleGoogleSignUp = async () => {
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
            window.location.href = result.data.user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard';
          } catch {
            setError('Google sign up failed. Please try again.');
            setIsLoading(false);
          }
        },
      });
      window.google?.accounts.id.prompt();
    } catch {
      setError('Google sign up failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
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
            window.location.href = result.data.user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard';
          } catch {
            setError('Facebook sign up failed. Please try again.');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      }, { scope: 'email' });
    } catch {
      setError('Facebook sign up failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleContinue = async (userType: 'attendee' | 'organizer') => {
    setIsLoading(true);
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Check if email exists in database
      // For now, we'll simulate the check
      const emailExists = false; // This would be an API call
      
      if (emailExists) {
        // Redirect to login with email pre-filled
        navigate('/auth/signin', { state: { email } });
      } else if (userType === 'organizer') {
        navigate('/auth/register/organizer', { state: { email } });
      } else {
        navigate('/auth/register/attendee', { state: { email } });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to home</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">EventKnit</span>
            </button>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-primary mb-1">
              Create your EventKnit account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to continue. We'll guide you through the next steps.
            </p>
          </div>
        </div>

        {/* Email + Role Selection */}
        <div className="bg-card-surface rounded-2xl shadow-sm p-6 space-y-5">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSelectedRole('ATTENDEE')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${selectedRole === 'ATTENDEE' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Sign up as Attendee
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ORGANIZER')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${selectedRole === 'ORGANIZER' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Sign up as Organizer
              </button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 bg-card-surface border border-border hover:bg-accent-coral hover:text-white text-foreground font-medium flex items-center justify-center gap-2 transition-colors"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 bg-card-surface border border-border hover:bg-accent-coral hover:text-white text-foreground font-medium flex items-center justify-center gap-2 transition-colors"
                onClick={handleFacebookSignUp}
                disabled={isLoading}
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Attendee card */}
            <Card
              className="border border-border bg-card-surface rounded-2xl shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => !isLoading && handleContinue('attendee')}
            >
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  I want to attend events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Discover and book events, save favorites, and keep all your tickets in one place.
                </p>
                <Button
                  type="button"
                  className="w-full h-9 bg-accent-coral hover:bg-accent-coral/90 text-white text-xs font-medium"
                  disabled={isLoading}
                  onClick={() => handleContinue('attendee')}
                >
                  Continue as attendee
                </Button>
              </CardContent>
            </Card>

            {/* Organizer card */}
            <Card
              className="border border-border bg-card-surface rounded-2xl shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => !isLoading && handleContinue('organizer')}
            >
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  I want to organize events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Create events, manage tickets, and understand your audience with simple tools.
                </p>
                <Button
                  type="button"
                  className="w-full h-9 bg-accent-coral hover:bg-accent-coral/90 text-white text-xs font-medium"
                  disabled={isLoading}
                  onClick={() => handleContinue('organizer')}
                >
                  Continue as organizer
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="pt-1 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/signin')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmailEntry;
