import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Calendar, Mail, Lock } from 'lucide-react';

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in logic here
    console.log('Sign in:', formData);
    navigate('/');
  };

  const handleSocialSignIn = (provider: string) => {
    console.log(`Sign in with ${provider}`);
    // Handle social sign in logic here
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-muted/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-eventknit/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-accent-electric/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-eventknit rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-eventknit-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-eventknit">EventKnit</h1>
              <span className="text-sm text-muted-foreground">2.0.0 Beta</span>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-foreground mb-6 leading-tight">
              Welcome back to EventKnit
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              EventKnit is your comprehensive event management platform that helps you create, manage, and promote amazing events. From planning to execution, we've got you covered.
            </p>
          </div>

          {/* Footer Links */}
          <div className="space-y-4">
            <nav className="flex gap-6 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link>
            </nav>
            <p className="text-xs text-muted-foreground">
              ©2025 <span className="text-eventknit">EventKnit</span> Technologies Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Sign in</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Social Sign In */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full h-12 flex items-center gap-3"
              onClick={() => handleSocialSignIn('google')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-12 flex items-center gap-3"
              onClick={() => handleSocialSignIn('facebook')}
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            <Button type="submit" className="w-full h-12 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-eventknit hover:text-eventknit/80 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you acknowledge that you understand and agree to the{' '}
              <Link to="/terms-of-service" className="underline hover:no-underline">Terms & Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="underline hover:no-underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
