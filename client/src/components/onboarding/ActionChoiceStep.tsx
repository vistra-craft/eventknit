import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ActionChoiceStepProps {
  onComplete?: () => void;
}

export const ActionChoiceStep = ({ onComplete }: ActionChoiceStepProps) => {
  const navigate = useNavigate();
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleCreateEvent = () => {
    // Call onComplete if provided (onboarding will already be complete, but this ensures it)
    if (onComplete) {
      onComplete();
    }
    // Navigate to standalone creation (for new organizers without approved events)
    navigate('/organizer/events/create-standalone');
  };

  const dashboardFeatures = [
    'Manage event details and settings',
    'Track registrations and attendees',
    'View sales analytics and revenue',
    'Handle ticket management',
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Ready to Get Started?
        </h2>
        <p className="text-muted-foreground">
          Choose your next step to begin organizing events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Event Card */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Create Your First Event</CardTitle>
            <CardDescription>
              Start by creating your first event. Fill out the details and submit for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateEvent}
              className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white"
            >
              Create Event
            </Button>
          </CardContent>
        </Card>

        {/* Learn More Card */}
        <Card className="border-2 border-border hover:border-primary/20 transition-colors cursor-pointer">
          <CardHeader>
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>Learn More</CardTitle>
            <CardDescription>
              Find out what features you'll have access to after creating your first event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowLearnMore(true)}
              variant="outline"
              className="w-full"
            >
              Learn More
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Learn More Dialog */}
      <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Event Management Dashboard</DialogTitle>
            <DialogDescription>
              After you create and submit your first event, you'll have access to a comprehensive dashboard where you can:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {dashboardFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <p className="text-sm text-foreground">{feature}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button
              onClick={handleCreateEvent}
              className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white"
            >
              Get Started - Create Your First Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

