import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/hooks/useAuth';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import { requestEmailOAuthCode, verifyEmailOAuthCode, googleAuth, appleAuth } from '@/lib/auth-api';
import loginImage from '@/assets/login.jpeg';

const SignIn = () => {
  const { login, isLoading, error: authError, clearError } = useAuth();
  const { dispatch } = useAuthContext();
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
  // Local error state for login errors — immune to external auth state changes
  // (e.g., concurrent refreshProfile from initAuth dispatching AUTH_LOGOUT)
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load remembered email on component mount
  useEffect(() => {
    // Always clear loading state and error when component mounts
    clearError();

    // Reset OAuth form state only
    setEmailOAuthEmail('');
    setEmailOAuthCode('');
    setEmailOAuthCodeSent(false);
    setShowEmailOAuthForm(false);

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true); // Check the remember me box if email is remembered
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - clearError is stable from useAuth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoginError(null);

    try {
      // Save or clear email based on rememberMe checkbox
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(formData.email, formData.password, rememberMe);
      // Navigation is handled by the useAuth hook
    } catch (error) {
      // Extract error message and store locally so it can't be cleared
      // by concurrent auth state changes (e.g., initAuth's refreshProfile failing)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Invalid email or password. Please try again.';
      setLoginError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      const win = window as unknown as { google?: { accounts: { oauth2: { initTokenClient: (config: { client_id: string; scope: string; callback: (r: { access_token: string; error?: string }) => void; error_callback?: (e: { type: string }) => void }) => { requestAccessToken: () => void } } } } };
      // Load Google Sign-In script if not already loaded
      if (!win.google?.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        console.error('Google Client ID not configured');
        return;
      }
      const tokenClient = win.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error || !response.access_token) return;
          try {
            const result = await googleAuth(response.access_token, 'access_token');
            if (result.success && result.data) {
              setAccessToken(result.data.accessToken);
              dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
              const userRole = result.data.user.role;
              if (userRole === 'ORGANIZER' || userRole === 'ORGANIZER_STAFF' || userRole === 'ORGANIZER_TELLER') {
                window.location.href = '/organizer/dashboard';
              } else if (userRole === 'SUPERADMIN' || userRole === 'ADMIN_STAFF' || userRole === 'MARKETER' || userRole === 'SUPPORT' || userRole === 'TELLER') {
                window.location.href = '/admin/dashboard';
              } else {
                window.location.href = '/user/dashboard';
              }
            }
          } catch (error: unknown) {
            console.error('Google login error:', error);
          }
        },
        error_callback: (err) => {
          if (err.type !== 'popup_closed') {
            console.error('Google sign in error:', err);
          }
        },
      });
      tokenClient.requestAccessToken();
    } catch (error: unknown) {
      console.error('Google sign in error:', error);
    }
  };


  const handleAppleSignIn = async () => {
    clearError();
    try {
      const win = window as unknown as { AppleID?: { auth: { init: (config: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void; signIn: () => Promise<{ authorization: { code: string; id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }> } } };
      // Load Apple Sign-In script if not already loaded
      if (!win.AppleID) {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || '';
      if (!clientId) {
        console.error('Apple Client ID not configured');
        return;
      }
      win.AppleID?.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const response = await win.AppleID!.auth.signIn();
      try {
        const result = await appleAuth(
          response.authorization.code,
          response.authorization.id_token,
          undefined,
          response.user ? { name: response.user.name } : undefined
        );
        if (result.success && result.data) {
          setAccessToken(result.data.accessToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
          const userRole = result.data.user.role;
          if (userRole === 'ORGANIZER' || userRole === 'ORGANIZER_STAFF' || userRole === 'ORGANIZER_TELLER') {
            window.location.href = '/organizer/dashboard';
          } else if (userRole === 'SUPERADMIN' || userRole === 'ADMIN_STAFF' || userRole === 'MARKETER' || userRole === 'SUPPORT' || userRole === 'TELLER') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/user/dashboard';
          }
        }
      } catch (error: unknown) {
        console.error('Apple login error:', error);
      }
    } catch (error: unknown) {
      console.error('Apple sign in error:', error);
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
      if (result.success && result.data) {
        setAccessToken(result.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data.user });
        const userRole = result.data.user.role;
        if (userRole === 'ORGANIZER' || userRole === 'ORGANIZER_STAFF' || userRole === 'ORGANIZER_TELLER') {
          window.location.href = '/organizer/dashboard';
        } else if (userRole === 'SUPERADMIN' || userRole === 'ADMIN_STAFF' || userRole === 'MARKETER' || userRole === 'SUPPORT' || userRole === 'TELLER') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/user/dashboard';
        }
      }
    } catch (error: unknown) {
      console.error('Email OAuth verification error:', error);
      clearError();
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      {/* Main Content */}
      <div className="p-4 w-full">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-card-surface rounded-2xl shadow-md overflow-hidden flex flex-col lg:flex-row">
          {/* Left Panel - Image with Overlay */}
          <div className="hidden lg:block lg:w-1/2 relative">
            <div className="absolute inset-0">
              <img
                src={loginImage}
                alt="Welcome to EventKnit"
                className="w-full h-full object-cover"
              />
              {/* Overlay Text - Centered */}
              <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/30">
                <div className="text-center">
                  <h2 className="text-white text-3xl font-bold mb-2">Your Event Management Hub</h2>
                  <p className="text-white/90 text-lg">Sign in to manage your events and ticketing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Sign In Form */}
          <div className="w-full lg:w-1/2 p-5 lg:p-6">
            <div className="w-full max-w-md mx-auto">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <BackButton to="/" label="Back to home" />
                  <Logo />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Log in to your account</h1>
                <p className="text-sm text-muted-foreground">Welcome back! Please enter your details.</p>
              </div>

              {/* Social Login Buttons - Side by Side */}
              <div className="mb-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handleGoogleSignIn}
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
                  onClick={handleAppleSignIn}
                  disabled={isLoading}
                  type="button"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card-surface px-2 text-muted-foreground">Or continue with email</span>
                </div>
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
                  {(loginError || authError) && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                      {loginError || authError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="letsdesignabrar@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-11 border-border focus:border-primary focus:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-11 pr-10 border-border focus:border-primary focus:ring-primary"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        onCheckedChange={(checked) => {
                          const isChecked = checked === true;
                          setRememberMe(isChecked);
                          // Clear remembered email immediately when unchecking
                          if (!isChecked) {
                            localStorage.removeItem('rememberedEmail');
                          }
                        }}
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        Remember for 30 days
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      asChild
                    >
                      <Link to="/auth/forgot-password">
                        Forgot password?
                      </Link>
                    </Button>
                  </div>

                  {/* Log In Button */}
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Log In'
                    )}
                  </Button>
                </form>

                {/* Sign up link */}
                <div className="text-center pt-1">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium"
                      asChild
                    >
                      <Link to="/auth/signup">Sign up</Link>
                    </Button>
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