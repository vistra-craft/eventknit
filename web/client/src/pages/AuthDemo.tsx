import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowRight } from 'lucide-react';

const AuthDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            New Authentication Flow Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            Experience the updated registration process with role-based user types
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Type Selection */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-eventknit/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                User Type Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Choose between Event Organizer or Attendee registration paths.
              </p>
              <Button
                onClick={() => navigate('/auth/user-type')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
              >
                Try User Type Selection
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Stepwise Event Creation */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-eventknit/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-eventknit/10 to-eventknit/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Stepwise Event Creation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Create events with a guided, step-by-step process instead of tabs.
              </p>
              <Button
                onClick={() => navigate('/create-event-stepwise')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
              >
                Try Stepwise Creation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">New Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Authentication Flow</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    User type selection (Organizer vs Attendee)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Multi-step registration forms
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    KYC placeholders for organizers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Interest-based attendee registration
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Mock data navigation (no backend required)
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Event Creation</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Step-by-step guided flow
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Progress indicators
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Form validation and completion tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Review and publish step
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-eventknit rounded-full"></div>
                    Clean, modern UI with EventKnit branding
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="px-6"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;
