import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Users, Calendar } from 'lucide-react';

const EmailEntry = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async (userType: 'attendee' | 'organizer') => {
    setIsLoading(true);
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Check if email exists in database
      // For now, we'll simulate the check
      const emailExists = false; // This would be an API call
      
      if (emailExists) {
        // Redirect to login with email pre-filled
        navigate('/auth/signin', { state: { email } });
      } else if (userType === 'organizer') {
        navigate('/auth/register/organizer', { state: { email } });
      } else {
        navigate('/auth/register/attendee', { state: { email } });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/10 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-900 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to home</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">EK</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EventKnit</span>
            </button>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Create your EventKnit account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to continue. We'll guide you through the next steps.
            </p>
          </div>
        </div>

        {/* Email + Role Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Attendee card */}
            <Card
              className="border border-border bg-white rounded-2xl shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => !isLoading && handleContinue('attendee')}
            >
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-gray-900/5 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-gray-900" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  I want to attend events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Discover and book events, save favorites, and keep all your tickets in one place.
                </p>
                <Button
                  type="button"
                  className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium"
                  disabled={isLoading}
                  onClick={() => handleContinue('attendee')}
                >
                  Continue as attendee
                </Button>
              </CardContent>
            </Card>

            {/* Organizer card */}
            <Card
              className="border border-border bg-white rounded-2xl shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => !isLoading && handleContinue('organizer')}
            >
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-gray-900/5 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-900" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  I want to organize events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Create events, manage tickets, and understand your audience with simple tools.
                </p>
                <Button
                  type="button"
                  className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium"
                  disabled={isLoading}
                  onClick={() => handleContinue('organizer')}
                >
                  Continue as organizer
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="pt-1 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/signin')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-gray-900 hover:bg-gray-900 hover:text-white transition-colors font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="pointer-events-none absolute top-10 left-4 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl" />
        <div className="pointer-events-none absolute bottom-10 right-4 w-24 h-24 bg-gradient-to-br from-gray-900/5 to-transparent rounded-full blur-xl" />
      </div>
    </div>
  );
};

export default EmailEntry;
