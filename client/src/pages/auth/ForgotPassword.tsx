import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import BackButton from '@/components/BackButton';
import Logo from '@/components/layout/Logo';
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
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="p-4 w-full">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card-surface rounded-2xl shadow-md overflow-hidden">
            <div className="p-5 lg:p-6">
              {/* Header - always visible */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <BackButton to="/auth/signin" label="Back to sign in" />
                <Logo />
              </div>

              {!isSubmitted ? (
                <>
                  {/* Title */}
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-foreground mb-1">Forgot password?</h1>
                    <p className="text-sm text-muted-foreground">
                      Enter your email and we'll send you a reset link
                    </p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                          {error}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                          }}
                          className="h-11 border-border focus:border-primary focus:ring-primary"
                          required
                          disabled={isLoading}
                        />
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
                            Sending reset link...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                    </form>

                    {/* Sign in link */}
                    <div className="text-center pt-1">
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

                    {/* Help tip */}
                    <p className="text-xs text-center text-muted-foreground">
                      Can't find the email? Check your spam folder. The reset link expires in 1 hour.
                    </p>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Check your email</h2>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to{' '}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium"
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                    >
                      Try again
                    </Button>
                  </p>

                  <Button
                    variant="outline"
                    className="w-full h-11"
                    asChild
                  >
                    <Link to="/auth/signin">Return to Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
