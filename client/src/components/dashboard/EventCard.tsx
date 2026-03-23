/**
 * Shared Event Card — used by both Attending and Saved tabs
 *
 * Horizontal layout with event image, info, badges, and contextual actions.
 * Designed for consistency across the attendee dashboard.
 */

import { Calendar, MapPin, Timer, ArrowRight, Download, Share2, Bookmark, BookmarkX } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface EventCardProps {
  id: string;
  slug?: string | null;
  title: string;
  date: string;
  location: string;
  image: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  /** Card context determines available actions and navigation */
  context: 'attending' | 'saved';
  /** Animation delay index */
  index?: number;
  onViewEvent: (id: string) => void;
  onShare?: (event: { id: string; slug?: string | null; title: string }) => void;
  onDownload?: (event: { id: string; title: string; date: string; location: string }) => void;
  onUnsave?: (id: string) => void;
}

function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDaysUntil(dateString: string): number {
  const diff = new Date(dateString).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const EventCard = ({
  id,
  slug,
  title,
  date,
  location,
  image,
  status,
  context,
  index = 0,
  onViewEvent,
  onShare,
  onDownload,
  onUnsave,
}: EventCardProps) => {
  const isPast = status === 'completed';
  const isUpcoming = !isPast;
  const daysUntil = getDaysUntil(date);

  return (
    <div
      onClick={() => onViewEvent(id)}
      className={`relative rounded-xl overflow-hidden border border-border/40 bg-card cursor-pointer group transition-all duration-300 hover:shadow-md hover:border-primary/20 animate-in fade-in-0 slide-in-from-bottom-2 ${
        isPast ? 'opacity-75' : ''
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
      role="article"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-48 lg:w-56 flex-shrink-0">
          <img
            src={image}
            alt={title}
            className={`w-full h-32 sm:h-full object-cover ${isPast ? 'grayscale-[30%]' : ''}`}
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isPast && (
                <Badge className="bg-muted text-muted-foreground border-0 text-xs">
                  Completed
                </Badge>
              )}
              {isUpcoming && daysUntil <= 7 && (
                <Badge className="bg-success/10 text-success border-0 text-xs">
                  <Timer className="w-3 h-3 mr-1" />
                  {daysUntil === 0
                    ? 'Today'
                    : daysUntil === 1
                      ? 'Tomorrow'
                      : `In ${daysUntil} days`}
                </Badge>
              )}
              {isUpcoming && !isPast && daysUntil > 7 && (
                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                  Upcoming
                </Badge>
              )}
              {context === 'saved' && (
                <Bookmark className="w-3.5 h-3.5 fill-current text-primary opacity-60" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2 truncate">
              {title}
            </h3>

            {/* Date & Location */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {formatEventDate(date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate max-w-[200px]">{location}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant={isPast ? 'outline' : 'default'}
              className="gap-1.5 text-xs"
              onClick={(e) => { e.stopPropagation(); onViewEvent(id); }}
            >
              View Event
              <ArrowRight className="w-3 h-3" />
            </Button>

            {/* Attending-specific actions */}
            {context === 'attending' && isUpcoming && onDownload && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => { e.stopPropagation(); onDownload({ id, title, date, location }); }}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Ticket
              </Button>
            )}

            {/* Saved-specific actions */}
            {context === 'saved' && onUnsave && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onUnsave(id); }}
              >
                <BookmarkX className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            )}

            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onShare({ id, slug, title }); }}
                title="Share event"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
