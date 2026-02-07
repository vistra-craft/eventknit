import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, BarChart3, DollarSign, Clock, AlertCircle, Eye, Edit, FileText } from 'lucide-react';
import { type DashboardAccessTier } from '@/lib/organizer-api';

interface PendingEvent {
  id: string;
  title: string;
  status: string;
}

interface LockedDashboardProps {
  tier?: DashboardAccessTier;
  pendingEvents?: PendingEvent[];
}

export const LockedDashboard = ({ tier = 0, pendingEvents = [] }: LockedDashboardProps) => {
  const navigate = useNavigate();

  // Features available at different tiers
  const tier1Features = [
    {
      icon: Eye,
      title: 'View Event Details',
      description: 'View your pending event information and status',
      available: true,
    },
    {
      icon: Edit,
      title: 'Edit Event Draft',
      description: 'Make changes to your event while waiting for approval',
      available: true,
    },
    {
      icon: FileText,
      title: 'Upload Documents',
      description: 'Add supporting documents for your event review',
      available: true,
    },
    {
      icon: Users,
      title: 'Attendee Management',
      description: 'Manage registrations and track attendees',
      available: false,
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'View detailed analytics about your events',
      available: false,
    },
    {
      icon: DollarSign,
      title: 'Revenue & Tickets',
      description: 'Monitor ticket sales and revenue',
      available: false,
    },
  ];

  const tier0Features = [
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

  // Tier 1: Has pending events, show read-only dashboard
  if (tier === 1) {
    return (
      <div className="space-y-8">
        {/* Pending Approval Banner */}
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Event Pending Approval</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Your event is currently being reviewed by our team. You have limited access to the dashboard
            until your event is approved. This typically takes 1-2 business days.
          </AlertDescription>
        </Alert>

        {/* Pending Events */}
        {pendingEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Your Pending Events
              </CardTitle>
              <CardDescription>
                These events are awaiting approval. You can view and edit them while waiting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Pending Approval
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/organizer/events/${event.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available vs Locked Features */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Dashboard Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tier1Features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`border-border ${!feature.available ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        feature.available
                          ? 'bg-primary/10'
                          : 'bg-muted'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          feature.available ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{feature.title}</h3>
                          {!feature.available && (
                            <Badge variant="secondary" className="text-xs">
                              After Approval
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA to create another event */}
        <div className="text-center pt-4">
          <p className="text-muted-foreground mb-4">
            Want to create another event while waiting?
          </p>
          <Button
            onClick={() => navigate('/organizer/events/create-standalone')}
            variant="outline"
            className="font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Another Event
          </Button>
        </div>
      </div>
    );
  }

  // Tier 0: No events at all
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

      {/* Features Preview */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Dashboard Features You'll Have Access To
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tier0Features.map((feature, index) => {
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
          className="font-medium px-8"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Your First Event
        </Button>
      </div>
    </div>
  );
};
