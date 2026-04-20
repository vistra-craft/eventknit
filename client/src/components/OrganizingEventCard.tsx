/**
 * Organizing Event Card Component
 * Displays event with organizer metrics and quick actions
 * Optimized with React.memo for better performance
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle, DollarSign, BarChart3, MoreVertical } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { OrganizingEvent } from '../hooks/useMyEvents';


interface OrganizingEventCardProps {
  event: OrganizingEvent;
  onManage?: (eventId: string) => void;
}

const OrganizingEventCardComponent = ({ event, onManage }: OrganizingEventCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'published' || statusLower === 'upcoming') return 'default';
    if (statusLower === 'draft') return 'secondary';
    if (statusLower === 'completed' || statusLower === 'past') return 'outline';
    if (statusLower === 'cancelled') return 'destructive';
    return 'default';
  };

  const handleManageClick = () => {
    if (onManage) {
      onManage(event.id);
    } else {
      navigate(`/organizer/event/${event.id}`);
    }
  };

  const attendancePercentage = event.capacity > 0
    ? Math.round((event.ticketsSold || event.attendees) / event.capacity * 100)
    : 0;

  const checkinPercentage = event.ticketsSold || event.attendees > 0
    ? Math.round((event.checkedIn || 0) / (event.ticketsSold || event.attendees) * 100)
    : 0;

  return (
    <Card
      variant="interactive"
      className="group overflow-hidden bg-card-surface rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      role="article"
      aria-label={`Event: ${event.title}`}
    >
      {/* Event Image */}
      <div className="relative overflow-hidden h-48">
        <img
          src={event.image}
          alt={`Cover image for ${event.title}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 right-3">
          <Badge variant={getStatusColor(event.status)}>
            {event.status}
          </Badge>
        </div>
      </div>

      <CardContent className="pt-4 pb-4 px-4">
        {/* Event Title & Category */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 leading-tight mb-1">
            {event.title}
          </h3>
          {event.category && (
            <span className="text-xs text-muted-foreground">{event.category}</span>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{formatDate(event.date)}</span>
            {event.time && <span className="ml-1">• {event.time}</span>}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue || event.location}</span>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-t border-border">
          {/* Tickets Sold */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Users className="h-3 w-3" />
              <span>Sold</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {event.ticketsSold || event.attendees}/{event.capacity || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {attendancePercentage}%
            </div>
          </div>

          {/* Checked In */}
          <div className="flex flex-col items-center border-l border-r border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <CheckCircle className="h-3 w-3" />
              <span>Checked In</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {event.checkedIn || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {checkinPercentage}%
            </div>
          </div>

          {/* Revenue */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <DollarSign className="h-3 w-3" />
              <span>Revenue</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formatCurrency(event.revenue || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {event.views || 0} views
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleManageClick}
            className="flex-1 hover:scale-105 active:scale-95 transition-transform duration-200"
            aria-label={`Manage ${event.title}`}
          >
            Manage Event
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/organizer/event/${event.id}?tab=analytics`)}
            className="px-2 hover:scale-105 active:scale-95 transition-transform duration-200"
            aria-label={`View analytics for ${event.title}`}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:scale-105 active:scale-95 transition-transform duration-200"
            aria-label={`More options for ${event.title}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
// Will only re-render if event or onManage props change
export const OrganizingEventCard = memo(OrganizingEventCardComponent);
