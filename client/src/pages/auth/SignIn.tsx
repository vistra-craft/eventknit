import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { requestEmailOAuthCode, verifyEmailOAuthCode, facebookAuth } from '@/lib/auth-api';
import loginImage from '@/assets/login.jpeg';

const SignIn = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, clearError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOAuthEmail, setEmailOAuthEmail] = useState('');
  const [emailOAuthCode, setEmailOAuthCode] = useState('');
  const [emailOAuthCodeSent, setEmailOAuthCodeSent] = useState(false);
  const [showEmailOAuthForm, setShowEmailOAuthForm] = useState(false);
  const [emailOAuthRole, setEmailOAuthRole] = useState<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Clear loading state and reset form when component mounts or when navigating to login
  // This ensures the form is immediately accessible after logout
  useEffect(() => {
    // Always clear loading state and error when component mounts
    // This ensures fresh state when navigating back to login page
    clearError();
    
    // Reset form data to ensure clean state
    setFormData({
      email: '',
      password: ''
    });
    setEmailOAuthEmail('');
    setEmailOAuthCode('');
    setEmailOAuthCodeSent(false);
    setShowEmailOAuthForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - clearError is stable from useAuth

  // Watch for auth state changes and ensure form is accessible
  useEffect(() => {
    // If we're not authenticated, ensure we're not in loading state
    // This fixes the issue where form stays disabled after logout
    if (!isAuthenticated) {
      if (isLoading) {
        clearError(); // clearError also clears isLoading in reducer
      }
    }
  }, [isAuthenticated, isLoading, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(formData.email, formData.password);
      // Navigation is handled by the useAuth hook
    } catch (error) {
      // Error is handled by the auth context
      console.error('Sign in error:', error);
    }
  };

  const handleFacebookSignIn = async () => {
    clearError();
    try {
      // Load Facebook SDK
      if (!window.FB) {
        // Initialize Facebook SDK
        window.fbAsyncInit = function() {
          window.FB.init({
            appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
        };

        // Load Facebook SDK script
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        // Wait for SDK to load
        await new Promise((resolve) => {
          const checkFB = setInterval(() => {
            if (window.FB) {
              clearInterval(checkFB);
              resolve(true);
            }
          }, 100);
        });
      }

      // Request Facebook login
      interface FacebookLoginResponse {
        authResponse?: {
          accessToken: string;
        };
      }
      window.FB.login(async (response: FacebookLoginResponse) => {
        if (response.authResponse) {
          try {
            const result = await facebookAuth(response.authResponse.accessToken);
            // Handle successful login - useAuth hook will handle navigation
            window.location.href = result.data.user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard';
          } catch (error: unknown) {
            clearError();
            console.error('Facebook login error:', error);
          }
        } else {
          console.log('User cancelled Facebook login');
        }
      }, { scope: 'email' });
    } catch (error: unknown) {
      clearError();
      console.error('Facebook sign in error:', error);
    }
  };

  const handleEmailOAuthRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!emailOAuthEmail) {
      return;
    }

    try {
      await requestEmailOAuthCode(emailOAuthEmail, emailOAuthRole);
      setEmailOAuthCodeSent(true);
    } catch (error: unknown) {
      console.error('Email OAuth code request error:', error);
      clearError();
    }
  };

  const handleEmailOAuthVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!emailOAuthCode || !emailOAuthEmail) {
      return;
    }

    try {
      const result = await verifyEmailOAuthCode(emailOAuthEmail, emailOAuthCode);
      // Handle successful login/registration - navigate to appropriate dashboard
      window.location.href = result.data.user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard';
    } catch (error: unknown) {
      console.error('Email OAuth verification error:', error);
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden flex flex-col lg:flex-row min-h-[420px] max-h-[600px]">
          {/* Left Panel - Image with Overlay */}
          <div className="hidden lg:flex lg:w-1/2 relative">
            <img 
              src={loginImage} 
              alt="Welcome to EventKnit" 
              className="w-full h-full object-cover"
            />
            {/* Overlay Text - Centered */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <h2 className="text-white text-3xl font-bold mb-2">Your Event Management Hub</h2>
                <p className="text-white/90 text-lg">Sign in to manage your events and ticketing</p>
              </div>
            </div>
          </div>

          {/* Right Panel - Sign In Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
            <div className="w-full max-w-md mx-auto">
              {/* Logo at top */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <Link to="/" className="inline-flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-primary">EventKnit</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to home</span>
                  </button>
                </div>
                <h1 className="text-2xl font-bold text-primary mb-1">Log in to your account</h1>
                <p className="text-sm text-muted-foreground">Welcome back! Please enter your details.</p>
              </div>

              {/* Continue with Google Button */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white border border-border hover:bg-accent-coral hover:text-white text-foreground font-medium flex items-center justify-center gap-3 transition-colors"
                  onClick={handleFacebookSignIn}
                  disabled={isLoading}
                  type="button"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              {/* Sign In Form */}
              <div className="space-y-4">
                {/* OAuth Options - Hidden by default, can be shown if needed */}
                {(showEmailOAuthForm || emailOAuthCodeSent) && (
                  <div className="space-y-3">
                    {!emailOAuthCodeSent ? (
                      showEmailOAuthForm && (
                        <form onSubmit={handleEmailOAuthRequest} className="w-full space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="email-oauth-input"
                              type="email"
                              placeholder="Enter your email"
                              value={emailOAuthEmail}
                              onChange={(e) => setEmailOAuthEmail(e.target.value)}
                              className="flex-1 h-11"
                              required
                              disabled={isLoading}
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              className="h-11 px-4"
                              disabled={isLoading || !emailOAuthEmail}
                            >
                              Send Code
                            </Button>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="emailOAuthRole"
                                value="ATTENDEE"
                                checked={emailOAuthRole === 'ATTENDEE'}
                                onChange={(e) => setEmailOAuthRole(e.target.value as 'ATTENDEE' | 'ORGANIZER')}
                                className="w-3 h-3"
                              />
                              Attendee
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name="emailOAuthRole"
                                value="ORGANIZER"
                                checked={emailOAuthRole === 'ORGANIZER'}
                                onChange={(e) => setEmailOAuthRole(e.target.value as 'ATTENDEE' | 'ORGANIZER')}
                                className="w-3 h-3"
                              />
                              Organizer
                            </label>
                          </div>
                        </form>
                      )
                    ) : (
                      <form onSubmit={handleEmailOAuthVerify} className="w-full space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={emailOAuthCode}
                            onChange={(e) => setEmailOAuthCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 h-11 text-center text-lg tracking-widest"
                            maxLength={6}
                            required
                            disabled={isLoading}
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="h-11 px-4"
                            disabled={isLoading || emailOAuthCode.length !== 6}
                          >
                            Verify
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          Code sent to {emailOAuthEmail}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full h-9 text-xs"
                          onClick={() => {
                            setEmailOAuthCodeSent(false);
                            setEmailOAuthCode('');
                            setShowEmailOAuthForm(false);
                          }}
                          disabled={isLoading}
                        >
                          Use a different email
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {/* Main Sign In Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authError && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                      {authError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="letsdesignabrar@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 border-border focus:border-primary focus:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 pr-10 border-border focus:border-primary focus:ring-primary"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me and Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        Remember for 30 days
                      </Label>
                    </div>
                    <Link 
                      to="/auth/forgot-password" 
                      className="text-sm text-primary hover:text-accent-coral hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Log In Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-accent-coral hover:bg-accent-coral/90 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Log In'}
                  </Button>
                </form>

                {/* Sign up link */}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/auth/signup" className="text-primary font-medium hover:text-accent-coral hover:underline transition-colors">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;