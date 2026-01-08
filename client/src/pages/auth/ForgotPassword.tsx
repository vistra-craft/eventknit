import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';
import { forgotPassword } from '@/lib/auth-api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.message || 'Failed to send reset link. Please try again.');
      }
    } catch {
      // Don't reveal if email exists or not for security
      // Show success even if email doesn't exist
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <BackButton to="/" label="Back to home" />
            <Logo />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {isSubmitted ? 'Check your email' : 'Forgot password?'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSubmitted
                ? "We've sent you a password reset link"
                : "Enter your email and we'll send you a reset link"
              }
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card-surface rounded-2xl shadow-md p-6">
          {!isSubmitted ? (
            <>
              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    asChild
                  >
                    <Link to="/auth/signin">Sign in</Link>
                  </Button>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Email sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong className="text-foreground">{email}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setIsSubmitted(false)}
                    >
                      try again
                    </Button>
                  </p>

                  <Button
                    variant="outline"
                    className="w-full h-11"
                    asChild
                  >
                    <Link to="/auth/signin">Sign in</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
