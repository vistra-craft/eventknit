import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const SignIn = () => {
  const { login, isLoading, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

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

  const handleSocialSignIn = (provider: string) => {
    console.log(`Sign in with ${provider}`);
    // Handle social sign in logic here
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
                {/* Social Sign In */}
                <div className="space-y-3 mb-4">
                  <Button
                    variant="outline"
                    className="w-full h-11 flex items-center gap-3"
                    onClick={() => handleSocialSignIn('google')}
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-11 flex items-center gap-3"
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
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