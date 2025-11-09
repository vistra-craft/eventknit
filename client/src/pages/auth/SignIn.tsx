import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { requestEmailOAuthCode, verifyEmailOAuthCode, facebookAuth } from '@/lib/auth-api';

const SignIn = () => {
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6">
        <div className="flex min-h-screen">
          {/* Left Panel - Informational Content */}
          <div className="hidden lg:flex lg:w-1/2 bg-background relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-5">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <path d="M200 50C150 50 100 100 100 150C100 200 150 250 200 250C250 250 300 200 300 150C300 100 250 50 200 50Z" fill="currentColor" className="text-eventknit"/>
                <path d="M200 150C180 150 160 170 160 190C160 210 180 230 200 230C220 230 240 210 240 190C240 170 220 150 200 150Z" fill="currentColor" className="text-eventknit"/>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col justify-between py-6 w-full px-6 h-full">
              {/* Top section - Reserved for logo */}
              <div className="flex items-start pt-6">
                {/* Logo placeholder - will be embedded here */}
              </div>

              {/* Main content - positioned to align with right panel */}
              <div className="max-w-sm mt-64">
                <h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                  Welcome back to <span className="text-eventknit">EventKnit</span>
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  EventKnit is your comprehensive event management platform that helps you create, manage, and promote amazing events. From planning to execution, we've got you covered.
                </p>
                
                {/* Feature highlights */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-eventknit rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Create and manage events effortlessly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-eventknit rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Connect with attendees and organizers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-eventknit rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Track analytics and insights</span>
                  </div>
                </div>
              </div>

              {/* Footer links - positioned at bottom */}
              <div className="flex gap-6 text-sm text-muted-foreground pb-6">
                <Link to="/about" className="hover:text-nav-hover transition-colors">About</Link>
                <Link to="/terms-of-service" className="hover:text-nav-hover transition-colors">Terms</Link>
                <Link to="/privacy-policy" className="hover:text-nav-hover transition-colors">Privacy</Link>
                <Link to="/support" className="hover:text-nav-hover transition-colors">Support</Link>
              </div>
            </div>
          </div>

          {/* Right Panel - Sign In Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center py-6 px-6">
            <div className="w-full max-w-sm">
              {/* Logo */}
              <div className="text-center mb-6">
                <Link to="/" className="inline-flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-eventknit rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-eventknit-foreground" />
                  </div>
                  <span className="text-xl font-bold text-eventknit">EventKnit</span>
                </Link>
                <h2 className="text-2xl font-bold text-foreground mb-2">Sign in</h2>
                <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
              </div>

              {/* Sign In Form */}
              <div className="bg-background rounded-lg p-6">
                {/* OAuth Sign In */}
                <div className="space-y-3 mb-4">
                  <Button
                    variant="outline"
                    className="w-full h-11 flex items-center gap-3"
                    onClick={handleFacebookSignIn}
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-11 flex items-center gap-3"
                    onClick={() => {
                      if (!showEmailOAuthForm) {
                        setShowEmailOAuthForm(true);
                        // Focus email input after a brief delay to ensure it's rendered
                        setTimeout(() => {
                          const emailInput = document.getElementById('email-oauth-input');
                          if (emailInput) {
                            emailInput.focus();
                          }
                        }, 100);
                      } else if (emailOAuthEmail) {
                        handleEmailOAuthRequest({ preventDefault: () => {} } as React.FormEvent);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Mail className="w-4 h-4" />
                    Continue with Email
                  </Button>
                  
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

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Sign In Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authError && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                      {authError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 h-11"
                        style={{ borderColor: '#4285F4' }}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10 h-11"
                        style={{ borderColor: '#1877F2' }}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link 
                      to="/auth/forgot-password" 
                      className="text-sm text-eventknit hover:text-eventknit/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/auth/signup" className="text-eventknit hover:text-eventknit/80 transition-colors font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>

              {/* Legal text - moved to same level as footer links */}
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  By continuing, you acknowledge that you understand and agree to the{' '}
                  <Link to="/terms-of-service" className="text-foreground underline hover:no-underline hover:text-nav-hover transition-colors">Terms & Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="text-foreground underline hover:no-underline hover:text-nav-hover transition-colors">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;