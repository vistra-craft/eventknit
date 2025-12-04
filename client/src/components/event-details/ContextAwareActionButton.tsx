import { Button } from '@/components/ui/button';
import { Ticket, Check } from 'lucide-react';
import type { EventData } from '@/types/event';

interface ContextAwareActionButtonProps {
  event: EventData;
  userAlreadyRegistered?: boolean;
  onClick: () => void;
  className?: string;
}

export const ContextAwareActionButton = ({
  event,
  userAlreadyRegistered = false,
  onClick,
  className = '',
}: ContextAwareActionButtonProps) => {
  // Determine button state and content
  const getButtonConfig = () => {
    if (userAlreadyRegistered) {
      return {
        label: 'View My Ticket',
        icon: <Check className="mr-2 h-5 w-5" />,
        variant: 'secondary' as const,
        disabled: false,
      };
    }

    if (event.isFree) {
      return {
        label: 'Register Free',
        icon: <Ticket className="mr-2 h-5 w-5" />,
        variant: 'default' as const,
        disabled: false,
      };
    }

    // Paid event
    const currency = event.currency || '$';

    if (event.ticketTypes && event.ticketTypes.length === 1) {
      const price = event.ticketTypes[0].price;
      return {
        label: `Get Tickets - ${currency}${price}`,
        icon: <Ticket className="mr-2 h-5 w-5" />,
        variant: 'default' as const,
        disabled: false,
      };
    }

    if (event.price && typeof event.price === 'number') {
      return {
        label: `Get Tickets - ${currency}${event.price}`,
        icon: <Ticket className="mr-2 h-5 w-5" />,
        variant: 'default' as const,
        disabled: false,
      };
    }

    return {
      label: 'Select Tickets',
      icon: <Ticket className="mr-2 h-5 w-5" />,
      variant: 'default' as const,
      disabled: false,
    };
  };

  const config = getButtonConfig();

  return (
    <Button
      size="lg"
      variant={config.variant}
      className={`w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all ${className}`}
      onClick={onClick}
      disabled={config.disabled}
    >
      {config.icon}
      {config.label}
    </Button>
  );
};

