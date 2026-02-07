import { useState } from "react";
import { Minus, Plus, Ticket, AlertCircle, Clock, CheckCircle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventData } from "@/types/event";
import { isVIPTicket, hasDiscount, calculateDiscountPercentage, calculateTimeRemaining, isTicketTypeAvailable } from "@/utils/ticket-helpers";

interface TicketSelectorProps {
  ticketTypes: EventData['ticketTypes'];
  onRegister: (quantities: Record<string, number>) => void;
  currency?: string;
}

export const TicketSelector = ({ ticketTypes, onRegister, currency = "$" }: TicketSelectorProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (name: string, change: number) => {
    setQuantities((prev) => ({
      ...prev,
      [name]: Math.max(0, (prev[name] || 0) + change),
    }));
  };

  const totalPrice = ticketTypes?.reduce(
    (sum, ticket) => sum + (ticket.price || 0) * (quantities[ticket.name] || 0),
    0
  ) || 0;

  const totalTickets = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  // If no ticket types, show a simple register button
  if (!ticketTypes || ticketTypes.length === 0) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1">Register for Event</h2>
          <p className="text-sm text-muted-foreground">Complete your registration to attend this event</p>
        </div>
        <Button 
          className="w-full h-10 text-base font-semibold shadow-md"
          onClick={() => onRegister({})}
        >
          <Ticket className="mr-2 h-4 w-4" />
          Register Now
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Get Tickets</h2>
        <p className="text-sm text-muted-foreground">Select your ticket type and quantity</p>
      </div>

      {/* Ticket Tiers */}
      <div className="space-y-3 mb-4">
        {ticketTypes.map((ticket, index) => {
          const quantity = quantities[ticket.name] || 0;
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
              className={`border rounded-lg p-3 transition-all duration-200 ${
                quantity > 0 ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'
              } ${!isAvailable ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{ticket.name}</h3>
                    {isVip && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 text-[10px] px-1.5 h-5">
                        <Crown className="w-3 h-3 mr-1" /> VIP
                      </Badge>
                    )}
                  </div>
                  
                  {ticket.features && ticket.features.length > 0 && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.features.join(" • ")}
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
                    <p className="font-bold text-lg text-primary">{currency} {ticket.price}</p>
                  )}
                </div>
              </div>

              {/* Badges & Info */}
              <div className="flex flex-wrap gap-2 mb-2">
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

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">
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
                  <span className="w-8 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(ticket.name, 1)}
                    disabled={!isAvailable || (ticket.quantity !== null && ticket.quantity !== undefined && quantity >= ticket.quantity)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total & Checkout */}
      <div className="border-t border-border pt-3">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">
            {currency} {totalPrice.toFixed(2)}
          </span>
        </div>

        <Button 
          className="w-full h-10 text-base font-semibold shadow-md"
          disabled={totalTickets === 0}
          onClick={() => onRegister(quantities)}
        >
          <Ticket className="mr-2 h-4 w-4" />
          {totalTickets === 0 ? "Select Tickets" : `Purchase ${totalTickets} Ticket${totalTickets > 1 ? "s" : ""}`}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Secure checkout powered by PesaSwap
        </p>
        
        {/* Refund Policy Link */}
        <div className="mt-3 pt-3 border-t border-border">
          <Link 
            to="/terms-of-service#refund-policy"
            className="text-primary hover:text-primary hover:underline font-medium text-xs transition-colors text-center block"
          >
            View Refund Policy →
          </Link>
        </div>
      </div>
    </div>
  );
};
