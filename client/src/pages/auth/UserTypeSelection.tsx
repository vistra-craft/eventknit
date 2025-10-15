import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, ArrowLeft, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
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
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Choose your role
          </h1>
          <p className="text-lg text-muted-foreground">
            How would you like to use EventKnit?
          </p>
          {email && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-muted rounded-lg">
              <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{email}</span>
            </div>
          )}
        </div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendee Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-eventknit/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-eventknit" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Find an experience
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Discover amazing events, connect with like-minded people, and create unforgettable memories.
              </p>
              <Button
                onClick={() => handleUserTypeSelection('attendee')}
                className="w-full bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground h-12"
              >
                Tell us what you love
              </Button>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-eventknit/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-10 h-10 text-eventknit" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Organize an event
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Create, manage, and promote your events with our comprehensive event management tools.
              </p>
              <Button
                onClick={() => handleUserTypeSelection('organizer')}
                className="w-full bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground h-12"
              >
                Plan your best event ever
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth/email-entry')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to email entry
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-eventknit/5 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-eventknit/5 to-transparent rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
