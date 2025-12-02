import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/10 flex flex-col">
      <div className="container mx-auto px-6 py-8 flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Panel - Branding */}
            <div className="hidden lg:block">
              {/* Background Pattern */}
              <div className="relative">
                <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-black/5 rounded-full blur-2xl"></div>
                <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10 flex flex-col justify-between h-full">
                  {/* Logo */}
                  <div className="flex items-center justify-between gap-3 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">EventKnit</h1>
                        <span className="text-sm text-muted-foreground">
                          {import.meta.env.VITE_APP_VERSION || '1.0.0 Development'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to home</span>
                    </button>
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
                </div>
              </div>
            </div>

            {/* Right Panel - Forgot Password Form */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-none">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Forgot password?</h1>
            <p className="text-sm text-muted-foreground">
              {isSubmitted 
                ? "Check your email for reset instructions" 
                : "Enter your email address and we'll send you a reset link"
              }
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <Button type="submit" className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium">
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={handleBackToSignIn}
                  className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to sign in</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gray-900/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-gray-900" />
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
                      className="text-gray-900 hover:text-gray-700 transition-colors"
                    >
                      try again
                    </button>
                  </p>

                  <Button
                    onClick={handleBackToSignIn}
                    variant="outline"
                    className="w-full h-11 border border-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    Back to sign in
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our{' '}
              <Link to="/support" className="text-gray-900 hover:text-gray-700 hover:underline transition-colors">
                support team
              </Link>
            </p>
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
