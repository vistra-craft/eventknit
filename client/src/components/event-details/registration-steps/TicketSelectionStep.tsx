import { Minus, Plus, Ticket, AlertCircle, Clock, CheckCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { EventData } from '@/types/event';
import type { TicketSelection } from '../UnifiedRegistrationModal';
import { 
  isVIPTicket, 
  hasDiscount, 
  calculateDiscountPercentage, 
  calculateTimeRemaining, 
  isTicketTypeAvailable 
} from '@/utils/ticket-helpers';

interface TicketSelectionStepProps {
  event: EventData;
  selectedTickets: TicketSelection;
  onTicketsChange: (tickets: TicketSelection) => void;
  onContinue: (tickets: TicketSelection) => void;
}

export const TicketSelectionStep = ({
  event,
  selectedTickets,
  onTicketsChange,
  onContinue,
}: TicketSelectionStepProps) => {
  const currency = event.currency || '$';

  const updateQuantity = (ticketName: string, change: number) => {
    const newQuantities = {
      ...selectedTickets,
      [ticketName]: Math.max(0, (selectedTickets[ticketName] || 0) + change),
    };
    onTicketsChange(newQuantities);
  };

  const totalPrice = event.ticketTypes?.reduce(
    (sum, ticket) => sum + (ticket.price || 0) * (selectedTickets[ticket.name] || 0),
    0
  ) || 0;

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-header mb-2">Select Your Tickets</h3>
        <p className="text-card-description">
          Choose the ticket type and quantity you'd like to purchase
        </p>
      </div>

      {/* Ticket Types */}
      <div className="space-y-3">
        {event.ticketTypes?.map((ticket, index) => {
          const quantity = selectedTickets[ticket.name] || 0;
          const isVip = isVIPTicket(ticket.name);
          const availability = isTicketTypeAvailable({
            availableFrom: ticket.availableFrom || undefined,
            availableUntil: ticket.availableUntil || undefined,
          });
          const isAvailable = availability.available;
          const discounted = hasDiscount({
            originalPrice: ticket.originalPrice || undefined,
            price: ticket.price,
          });

          return (
            <div
              key={`${ticket.name}-${index}`}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                quantity > 0
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${!isAvailable ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-card-title">{ticket.name}</h4>
                    {isVip && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 text-[10px] px-1.5 h-5"
                      >
                        <Crown className="w-3 h-3 mr-1" /> VIP
                      </Badge>
                    )}
                  </div>

                  {ticket.features && ticket.features.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {ticket.features.join(' • ')}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  {discounted && ticket.originalPrice ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground line-through">
                        {currency} {ticket.originalPrice}
                      </span>
                      <span className="font-bold text-lg text-primary">
                        {currency} {ticket.price}
                      </span>
                    </div>
                  ) : (
                    <p className="font-bold text-lg text-primary">
                      {currency} {ticket.price}
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {discounted && ticket.originalPrice && (
                  <Badge variant="destructive" className="text-[10px] h-5">
                    {calculateDiscountPercentage(ticket.originalPrice, ticket.price)}% OFF
                  </Badge>
                )}
                {ticket.availableUntil && new Date(ticket.availableUntil) > new Date() && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    <Clock className="w-3 h-3" />
                    <span>Ends in {calculateTimeRemaining(ticket.availableUntil)}</span>
                  </div>
                )}
                {ticket.quantity && ticket.quantity < 50 && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    <AlertCircle className="w-3 h-3" />
                    <span>Only {ticket.quantity} left</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm">
                  {!isAvailable ? (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {availability.reason}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-3 h-3" /> Available
                    </span>
                  )}
                </span>

                {/* Quantity Selector */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(ticket.name, -1)}
                    disabled={!quantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(ticket.name, 1)}
                    disabled={
                      !isAvailable ||
                      (ticket.quantity !== null &&
                        ticket.quantity !== undefined &&
                        quantity >= ticket.quantity)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo Code (Optional) */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Have a promo code?</label>
        <div className="flex gap-2">
          <Input placeholder="Enter promo code" className="flex-1" />
          <Button variant="outline">Apply</Button>
        </div>
      </div>

      {/* Total & Continue */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">
            {currency} {totalPrice.toFixed(2)}
          </span>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={totalTickets === 0}
          onClick={() => onContinue(selectedTickets)}
        >
          <Ticket className="mr-2 h-5 w-5" />
          {totalTickets === 0
            ? 'Select at least one ticket'
            : `Continue with ${totalTickets} ticket${totalTickets > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};

