import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface MinimalHeaderProps {
  backTo?: string;
  backLabel?: string;
}

/**
 * Minimal header for legal/static pages (Terms, Privacy, Cookies)
 * Simple back navigation + logo, no distractions
 */
const MinimalHeader = ({ backTo = '/', backLabel = 'Back to home' }: MinimalHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Back link */}
        <Link
          to={backTo}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </Link>

        {/* Right: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">EventKnit</span>
        </Link>
      </div>
    </header>
  );
};

export default MinimalHeader;
