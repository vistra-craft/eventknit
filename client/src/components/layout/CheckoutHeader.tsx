import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface CheckoutHeaderProps {
  backLink?: string;
  backLabel?: string;
  eventTitle?: string;
}

/**
 * Minimal header for checkout flow pages (Registration, Payment, Confirmation)
 * Provides logo + back navigation without full navbar distractions
 */
const CheckoutHeader = ({ backLink, backLabel = "Back", eventTitle }: CheckoutHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Back link or Logo */}
        <div className="flex items-center gap-4">
          {backLink ? (
            <Link
              to={backLink}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <span className="font-semibold text-foreground">EventKnit</span>
            </Link>
          )}
        </div>

        {/* Center: Event title (optional, truncated on mobile) */}
        {eventTitle && (
          <div className="hidden sm:block flex-1 text-center px-4">
            <span className="text-sm font-medium text-muted-foreground truncate block">
              {eventTitle}
            </span>
          </div>
        )}

        {/* Right: Logo when back link is shown */}
        {backLink && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">E</span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
};

export default CheckoutHeader;
