/**
 * Become Organizer Modal
 * Informational modal that explains organizer benefits
 * and navigates to the event creation form where the upgrade happens
 */

import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const handleContinue = () => {
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Start organizing events</DialogTitle>
          <DialogDescription className="text-sm pt-1">
            Switch to an organizer account to create events, sell tickets, and manage attendees.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <p className="text-sm font-medium text-foreground mb-2.5">As an organizer, you can:</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground/60 mt-0.5">&mdash;</span>
              Create and publish events with ticketing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground/60 mt-0.5">&mdash;</span>
              Track registrations, check-ins, and revenue
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground/60 mt-0.5">&mdash;</span>
              Message attendees and view event analytics
            </li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Not now
          </Button>
          <Button
            onClick={handleContinue}
            className="gap-2"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
