import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Calendar, Users, BarChart3, DollarSign, CheckCircle2, Clock } from 'lucide-react';

interface LockedDashboardProps {
  pendingEvents?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export const LockedDashboard = ({ pendingEvents = [] }: LockedDashboardProps) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Create, edit, and manage all your events in one place',
    },
    {
      icon: Users,
      title: 'Attendee Tracking',
      description: 'Track registrations and manage your event attendees',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'View detailed analytics and insights about your events',
    },
    {
      icon: DollarSign,
      title: 'Revenue Tracking',
      description: 'Monitor ticket sales and revenue in real-time',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Create Your First Event to Access Your Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Once your event is approved, you'll have full access to manage your events, track registrations, view analytics, and handle ticket sales from your dashboard.
        </p>
      </div>

      {/* Pending Events */}
      {pendingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Your Pending Events
            </CardTitle>
            <CardDescription>
              Your events are currently being reviewed. You'll receive an email when they're approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">Status: Pending Approval</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/organizer/event/${event.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Preview */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Dashboard Features You'll Have Access To
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          onClick={() => navigate('/organizer/events/create-standalone')}
          size="lg"
          className="bg-accent-coral hover:bg-accent-coral/90 text-white font-medium px-8"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Your First Event
        </Button>
      </div>
    </div>
  );
};

