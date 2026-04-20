import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Ticket, AlertCircle } from "lucide-react";
import type { EventData } from "@/types/event";

interface MobileActionBarProps {
  event: EventData;
  isRegistrationClosed: boolean;
  isSoldOut: boolean;
  userAlreadyRegistered: boolean;
  onRegisterClick: () => void;
  /** ID of the element whose visibility triggers the bar */
  triggerElementId?: string;
}

export function MobileActionBar({
  event,
  isRegistrationClosed,
  isSoldOut,
  userAlreadyRegistered,
  onRegisterClick,
  triggerElementId = "sidebar-cta",
}: MobileActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(triggerElementId);
    if (!target) {
      // If no trigger element, show after scrolling 600px
      const onScroll = () => setVisible(window.scrollY > 600);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [triggerElementId]);

  const lowestPrice =
    event.ticketTypes && event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : event.price ?? 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-lg border-t border-border/40 px-4 py-3 safe-area-bottom"
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            {/* Price summary */}
            <div className="flex-shrink-0">
              {event.isFree ? (
                <p className="text-lg font-bold text-primary">Free</p>
              ) : (
                <>
                  <p className="text-[10px] text-muted-foreground leading-none">From</p>
                  <p className="text-lg font-bold text-primary leading-tight">
                    {event.currency || "$"}{lowestPrice.toLocaleString()}
                  </p>
                </>
              )}
            </div>

            {/* CTA */}
            {isSoldOut ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Sold Out</span>
              </div>
            ) : isRegistrationClosed ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Closed</span>
              </div>
            ) : (
              <Button
                size="lg"
                className="flex-1 max-w-[240px] h-12 text-base font-semibold shadow-lg bg-primary hover:bg-primary/90"
                onClick={onRegisterClick}
              >
                <Ticket className="mr-2 h-4 w-4" />
                {userAlreadyRegistered ? "View Ticket" : "Register"}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
