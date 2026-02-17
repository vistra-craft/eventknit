import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { Ticket, Heart, Share2, Users, Zap, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import type { EventData } from "@/types/event";

interface EventSidebarProps {
  event: EventData;
  isRegistrationClosed: boolean;
  userAlreadyRegistered: boolean;
  onRegisterClick: () => void;
}

export function EventSidebar({
  event,
  isRegistrationClosed,
  userAlreadyRegistered,
  onRegisterClick,
}: EventSidebarProps) {
  const lowestPrice =
    event.ticketTypes && event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : event.price ?? 0;

  const spotsLeft = event.availableSlots;
  const capacity = event.capacity;
  const isSoldOut = spotsLeft !== null && spotsLeft !== undefined && spotsLeft <= 0;
  const isScarcity =
    spotsLeft != null &&
    capacity != null &&
    capacity > 0 &&
    spotsLeft / capacity < 0.2 &&
    spotsLeft > 0;

  // Determine target date for countdown: use registrationDeadline if available, otherwise startDate
  const countdownTarget = event.registrationDeadline || event.startDate;
  const countdownLabel = event.registrationDeadline
    ? "Registration closes in"
    : "Event starts in";

  return (
    <div className="sticky top-20 self-start space-y-5 rounded-2xl border border-border/40 bg-card p-6 shadow-lg">
      {/* Countdown */}
      {!isRegistrationClosed && !isSoldOut && (
        <CountdownTimer targetDate={countdownTarget} label={countdownLabel} />
      )}

      {/* Price */}
      {!event.isFree ? (
        <div className="text-center pb-4 border-b border-border/30">
          <p className="text-xs text-muted-foreground mb-1">Starting from</p>
          <p className="text-3xl font-bold text-primary">
            {event.currency || "$"}
            {lowestPrice.toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="text-center pb-4 border-b border-border/30">
          <p className="text-xs text-muted-foreground mb-1">This event is</p>
          <p className="text-3xl font-bold text-primary">Free</p>
        </div>
      )}

      {/* Social proof */}
      <div className="space-y-2">
        {typeof event.registrationCount === "number" && event.registrationCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>{event.registrationCount} people registered</span>
          </div>
        )}
        {isScarcity && spotsLeft != null && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
            <Zap className="h-4 w-4" />
            <span>Only {spotsLeft} spots left</span>
          </div>
        )}
      </div>

      {/* CTA */}
      {isSoldOut ? (
        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted border border-border">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Sold Out</p>
        </div>
      ) : isRegistrationClosed ? (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted border border-border">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Registration Closed</p>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {event.registrationDeadline
              ? `Ended ${new Date(event.registrationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "This event has already started"}
          </p>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
          onClick={onRegisterClick}
        >
          <Ticket className="mr-2 h-5 w-5" />
          {userAlreadyRegistered
            ? "View My Ticket"
            : event.isFree
              ? "Register Free"
              : "Register for Event"}
        </Button>
      )}

      {/* Trust indicator */}
      {!isSoldOut && !isRegistrationClosed && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure checkout &middot; Instant confirmation
        </p>
      )}

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Heart className="h-4 w-4" />
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
