/**
 * Become Organizer Modal
 * Informational modal that explains organizer benefits
 * and navigates to the event creation form where the upgrade happens
 */

import { Calendar, Users, BarChart3, DollarSign, CheckCircle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface BecomeOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BecomeOrganizerModal = ({
  isOpen,
  onClose,
  onSuccess,
}: BecomeOrganizerModalProps) => {
  const benefits = [
    {
      icon: Calendar,
      title: 'Create Events',
      description: 'Host your own events and build your community',
    },
    {
      icon: Users,
      title: 'Manage Attendees',
      description: 'Track registrations, check-ins, and engage with attendees',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'View detailed analytics and performance metrics',
    },
    {
      icon: DollarSign,
      title: 'Monetize Events',
      description: 'Sell tickets and manage revenue seamlessly',
    },
  ];

  const handleContinue = () => {
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Become an Event Organizer</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Start creating and managing your own events. Join thousands of organizers building communities.
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <div className="space-y-3 py-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex gap-3"
            >
              <div className="flex-shrink-0">
                <div className="p-2 rounded-lg bg-primary/10">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-0.5">
                  {benefit.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            What you get:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            {[
              'Unlimited event creation',
              'Full event management dashboard',
              'Attendee communication tools',
              'Detailed analytics and reports',
              'Ticket sales and revenue tracking'
            ].map((item) => (
              <li key={item}>
                • {item}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleContinue}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Become an Organizer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
