import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic here
    console.log('Forgot password for:', email);
    setIsSubmitted(true);
  };

  const handleBackToSignIn = () => {
    navigate('/auth/signin');
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
              Reset your password
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Don't worry, it happens to the best of us. Enter your email address and we'll send you a link to reset your password.
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

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Forgot password?</h1>
            <p className="text-muted-foreground">
              {isSubmitted 
                ? "Check your email for reset instructions" 
                : "Enter your email address and we'll send you a reset link"
              }
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground">
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={handleBackToSignIn}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Check your email</h3>
                  <p className="text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-eventknit hover:text-eventknit/80 transition-colors"
                    >
                      try again
                    </button>
                  </p>

                  <Button
                    onClick={handleBackToSignIn}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Back to sign in
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our{' '}
              <Link to="/support" className="text-eventknit hover:text-eventknit/80 transition-colors">
                support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
