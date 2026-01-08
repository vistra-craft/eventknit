import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Share2,
  CalendarPlus,
  Bookmark,
  Bell,
  Download,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { EventData, User } from "./EventAttendeeView";

interface EventMyEventProps {
  event: EventData;
  user: User;
}

export const EventMyEvent: React.FC<EventMyEventProps> = ({ event, user }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventStatus = () => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const endDate = event.endDate ? new Date(event.endDate) : eventDate;

    if (now < eventDate) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now >= eventDate && now <= endDate) return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
    return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
  };

  const status = getEventStatus();

  // Placeholder handlers
  const handleAddToCalendar = () => {
    // Generate ICS file or open calendar integration
    console.log('Add to calendar clicked');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out ${event.title}`,
        url: window.location.href,
      });
    }
  };

  const handleDownloadTicket = () => {
    console.log('Download ticket clicked');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registration Status Card */}
          <Card className="border border-border bg-background rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">You're Registered!</h2>
                  <p className="text-white/80 text-sm mt-1">
                    Your spot is confirmed for this event
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Event Date</p>
                  <p className="font-medium text-foreground mt-1">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground mt-1 line-clamp-1">
                    {event.venue || event.location}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <Badge className={`mx-auto ${status.color}`}>
                    {status.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">Event Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="border border-border bg-background rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{formatDate(event.date)}</p>
                  {event.endDate && event.endDate !== event.date && (
                    <p className="text-sm text-muted-foreground">to {formatDate(event.endDate)}</p>
                  )}
                </div>
              </div>

              {event.time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <p className="font-medium text-foreground">{event.time}</p>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{event.venue || event.location}</p>
                  {event.venue && event.location && event.venue !== event.location && (
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  )}
                </div>
              </div>

              {event.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Schedule (Placeholder for favorited sessions) */}
          <Card className="border border-border bg-background rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-primary" />
                My Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No sessions saved yet</h3>
                <p className="text-sm text-muted-foreground">
                  Browse the agenda and save sessions you want to attend
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border border-border bg-background rounded-2xl shadow-sm">
            <CardContent className="pt-6 text-center">
              <Avatar
                src={user.profileImage}
                name={user.name}
                alt={user.name}
                size="lg"
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold text-foreground">{user.name}</h3>
              {user.title && (
                <p className="text-sm text-muted-foreground">{user.title}</p>
              )}
              {user.company && (
                <p className="text-sm text-muted-foreground">{user.company}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-border bg-background rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddToCalendar}
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDownloadTicket}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Ticket
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Bell className="w-4 h-4 mr-2" />
                Set Reminder
              </Button>
            </CardContent>
          </Card>

          {/* Event Stats (Optional) */}
          {event.registrationDate && (
            <Card className="border border-border bg-background rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Registered on</p>
                  <p className="font-medium text-foreground mt-1">
                    {new Date(event.registrationDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventMyEvent;
