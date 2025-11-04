import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';

const EmailEntry = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        // Proceed to role selection with email
        navigate('/auth/user-type', { state: { email } });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-eventknit hover:text-eventknit/80 transition-colors"
            >
              EventKnit
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join EventKnit
          </h1>
          <p className="text-muted-foreground">
            Enter your email to get started
          </p>
        </div>

        {/* Email Entry Form */}
        <Card className="border-2 hover:border-eventknit/20 transition-all duration-300">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-eventknit" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Let's get started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground h-12"
                disabled={isLoading}
              >
                {isLoading ? 'Checking...' : 'Continue'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="text-eventknit hover:text-eventknit/80 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-eventknit/5 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-eventknit/5 to-transparent rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

export default EmailEntry;
