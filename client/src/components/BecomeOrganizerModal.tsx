/**
 * Become Organizer Modal
 * Prompts attendees to upgrade to organizer role
 * Explains benefits and handles the upgrade flow
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ButtonLoader } from './ui/loader';
import { becomeOrganizer } from '../lib/role-api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

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

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);

      // Call the API to upgrade role
      const response = await becomeOrganizer();

      if (response.success) {
        // Refresh user profile to get updated role
        await refreshProfile();

        // Show success message
        toast({
          title: 'Welcome, Event Organizer! 🎉',
          description: 'You can now create and manage events.',
        });

        // Close modal
        onClose();

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate to event creation (unified dashboard)
          navigate('/user/create-event');
        }
      } else {
        throw new Error(response.message || 'Failed to upgrade to organizer');
      }
    } catch (error) {
      console.error('Error becoming organizer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upgrade to organizer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
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
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="flex gap-3 animate-in fade-in-0 slide-in-from-left-3"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-shrink-0">
                <div className="p-2 rounded-lg bg-primary/10 transition-transform duration-200 hover:scale-110">
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
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 animate-in fade-in-0 zoom-in-95 duration-500 delay-500">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary animate-in spin-in-0 duration-700 delay-600" />
            What you get:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            {[
              'Unlimited event creation',
              'Full event management dashboard',
              'Attendee communication tools',
              'Detailed analytics and reports',
              'Ticket sales and revenue tracking'
            ].map((item, index) => (
              <li
                key={item}
                className="animate-in fade-in-0 slide-in-from-left-2"
                style={{ animationDelay: `${700 + index * 100}ms` }}
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpgrading}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="gap-2"
          >
            {isUpgrading ? (
              <>
                <ButtonLoader size="sm" />
                Upgrading...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Become an Organizer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
