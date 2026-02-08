import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, KeyRound, Info } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-muted/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full opacity-20 animate-pulse blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full opacity-20 animate-pulse blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full opacity-10 animate-pulse blur-3xl" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <BackButton to="/" label="Back to home" />
            <Logo />
          </div>
        </div>

        {/* Form Card with Glassmorphism */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/40 p-8 transition-all duration-300 hover:shadow-primary/5 hover:shadow-2xl">
          {!isSubmitted ? (
            <>
              {/* Icon Badge */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                  <KeyRound className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Forgot password?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-destructive text-xs">✕</span>
                      </div>
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-10 h-12 border-2 transition-all duration-300 focus:ring-4 focus:ring-primary/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-12 text-base font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
                    asChild
                  >
                    <Link to="/auth/signin">Sign in</Link>
                  </Button>
                </p>
              </div>

              {/* Security Tips */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 backdrop-blur-sm border border-border/40">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Can't find the email?
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Check your spam folder or try again with a different email address. The reset link expires in 1 hour.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                {/* Icon Badge */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-green-500/10 animate-in zoom-in-50 duration-500">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
                  <h3 className="text-2xl font-bold text-foreground">Check your email!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We've sent a password reset link to <strong className="text-foreground font-semibold">{email}</strong>
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the email? Check your spam folder or{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
                        onClick={() => {
                          setIsSubmitted(false);
                          setEmail('');
                        }}
                      >
                        try again
                      </Button>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 transition-all duration-300 hover:scale-[1.02]"
                    asChild
                  >
                    <Link to="/auth/signin">Return to Sign In</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? <Link to="/support" className="text-primary hover:text-primary/80 font-medium">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
