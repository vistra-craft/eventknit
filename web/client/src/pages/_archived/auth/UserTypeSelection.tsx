import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Mail } from 'lucide-react';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from previous step
  const email = location.state?.email || '';

  const handleUserTypeSelection = (userType: 'organizer' | 'attendee') => {
    // Navigate to appropriate registration form with email
    if (userType === 'organizer') {
      navigate('/auth/register/organizer', { state: { email } });
    } else {
      navigate('/auth/register/attendee', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/10 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <BackButton to="/auth/signup" label="Back" />
            <Logo />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Choose how you’ll use EventKnit
              </h1>
              <p className="text-sm text-muted-foreground">
                Pick the option that best matches what you want to do on the platform.
              </p>
            </div>
            {email && (
              <div className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 bg-white/80 rounded-full shadow-sm border border-border text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <span className="truncate max-w-[200px]">{email}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Attendee Card */}
          <Card
            className="group border border-border bg-card-surface rounded-2xl shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            onClick={() => handleUserTypeSelection('attendee')}
          >
            <CardHeader className="pb-3">
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Attend events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Discover concerts, conferences, meetups, and more. Save favorites, get tickets,
                and keep everything in one place.
              </p>
              <Button
                type="button"
                variant="default"
                className="w-full h-11"
              >
                Continue as attendee
              </Button>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card
            className="group border border-border bg-card-surface rounded-2xl shadow-none hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            onClick={() => handleUserTypeSelection('organizer')}
          >
            <CardHeader className="pb-3">
              <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Organize events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage events, track ticket sales, and understand your audience with
                simple, powerful tools.
              </p>
              <Button
                type="button"
                variant="default"
                className="w-full h-11"
              >
                Continue as organizer
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default UserTypeSelection;
