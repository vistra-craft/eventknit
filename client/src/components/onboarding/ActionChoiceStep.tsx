import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, BarChart3, Users, Ticket, LineChart } from 'lucide-react';
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

const DASHBOARD_FEATURES = [
  { icon: Users, label: 'Track registrations and attendees in real time' },
  { icon: Ticket, label: 'Manage ticket types, pricing, and capacity' },
  { icon: LineChart, label: 'View sales analytics and revenue breakdown' },
  { icon: BarChart3, label: 'Monitor check-ins and event day operations' },
];

export const ActionChoiceStep = ({ onComplete }: ActionChoiceStepProps) => {
  const navigate = useNavigate();
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleCreateEvent = () => {
    if (onComplete) onComplete();
    navigate('/organizer/events/create-standalone');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">You're all set!</h2>
        <p className="text-sm text-muted-foreground">
          Create your first event and our team will review it within 24-48 hours.
        </p>
      </div>

      {/* Primary CTA */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm mb-0.5">Create your first event</p>
            <p className="text-xs text-muted-foreground mb-4">
              Fill out event details, set ticket prices or keep it free, and submit for review.
            </p>
            <Button onClick={handleCreateEvent} className="w-full sm:w-auto h-10 px-5">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Secondary */}
      <button
        type="button"
        onClick={() => setShowLearnMore(true)}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
      >
        What features will I have access to?
      </button>

      {/* Learn More Dialog */}
      <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your organizer dashboard</DialogTitle>
            <DialogDescription>
              After your first event is approved, you get full access to the organizer dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {DASHBOARD_FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground">{label}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleCreateEvent} className="w-full h-11 mt-4">
            Create your first event
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
