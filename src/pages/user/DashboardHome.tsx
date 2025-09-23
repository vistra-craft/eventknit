import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Download,
  Video,
  Globe,
  Bell,
  MessageCircle,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";
import { Button } from "../../components/ui/button";

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardHomeProps {
  eventData: EventData;
  user: User;
  registration?: Registration;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ eventData, user, registration }) => {
  const [userTimezone, setUserTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState([]);
  const [liveStats, setLiveStats] = useState({
    attendeesOnline: 1247,
    sessionsLive: 3,
    networkingConnections: 89,
  });

  const calculateDaysUntilEvent = () => {
    const eventDate = new Date("2024-03-15");
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatEventTime = (dateString: string) => {
    const eventDate = new Date(dateString);
    return eventDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: userTimezone,
    });
  };

  const daysUntilEvent = calculateDaysUntilEvent();

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        ...prev,
        attendeesOnline:
          prev.attendeesOnline + Math.floor(Math.random() * 10 - 5),
        sessionsLive: Math.max(
          0,
          prev.sessionsLive + Math.floor(Math.random() * 3 - 1)
        ),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here's your event dashboard with all the important information.
        </p>
      </div>

      {/* Live Activity Bar */}
      <div className="mb-6 bg-gradient-primary rounded-lg p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-neon rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Event</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">{liveStats.attendeesOnline}</span>{" "}
              attendees online
            </div>
            <div className="text-sm">
              <span className="font-semibold">{liveStats.sessionsLive}</span>{" "}
              sessions live
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{userTimezone}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details Card */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-card p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-neon" />
                Your Registered Event
              </h2>
            </div>
            <div className="flex gap-4">
              <img
                src={eventData.image}
                alt={eventData.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {eventData.title}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div>{eventData.date}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatEventTime("2024-03-15T09:00:00")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {eventData.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {eventData.type} Event
                  </div>
                  {registration && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Ticket ID: {registration.ticketId}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="bg-accent-neon hover:bg-accent-neon/80 text-primary">
                    <Video className="h-4 w-4 mr-2" />
                    Join Virtual Session
                  </Button>
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Countdown */}
        <div>
          <div className="bg-card rounded-lg shadow-card p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-electric" />
                Event Countdown
              </h2>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-electric mb-2">
                {daysUntilEvent}
              </div>
              <p className="text-muted-foreground">Days Until Event</p>
              <div className="mt-4 p-3 bg-accent-electric/10 rounded-lg">
                <p className="text-sm text-accent-electric">
                  Don't forget to prepare for the event!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-card rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow cursor-pointer group">
          <div className="text-center">
            <Users className="h-8 w-8 text-accent-coral mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">View Speakers</h3>
            <p className="text-sm text-muted-foreground">
              Explore event speakers and their sessions
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow cursor-pointer group">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Exhibitors</h3>
            <p className="text-sm text-muted-foreground">
              Browse exhibitors and their booths
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow cursor-pointer group">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-accent-neon mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Event Agenda</h3>
            <p className="text-sm text-muted-foreground">
              View the complete event schedule
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow cursor-pointer group">
          <div className="text-center">
            <Download className="h-8 w-8 text-destructive mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">My Badge</h3>
            <p className="text-sm text-muted-foreground">Download your event badge</p>
          </div>
        </div>
      </div>

      {/* Enhanced Networking Section */}
      <div className="mt-8">
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent-electric" />
              Networking & Connections
            </h2>
            <p className="text-muted-foreground">
              Connect with fellow attendees and expand your network
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-accent-electric/10 rounded-lg">
              <div className="w-12 h-12 bg-accent-electric rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Find Attendees
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Discover people with similar interests
              </p>
              <Button className="bg-accent-electric hover:bg-accent-electric/80 text-primary text-sm">
                Browse Attendees
              </Button>
            </div>

            <div className="text-center p-4 bg-accent-neon/10 rounded-lg">
              <div className="w-12 h-12 bg-accent-neon rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                My Connections
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {liveStats.networkingConnections} connections made
              </p>
              <Button className="bg-accent-neon hover:bg-accent-neon/80 text-primary text-sm">
                View Connections
              </Button>
            </div>

            <div className="text-center p-4 bg-accent-coral/10 rounded-lg">
              <div className="w-12 h-12 bg-accent-coral rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Networking Score
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Track your networking progress
              </p>
              <Button className="bg-accent-coral hover:bg-accent-coral/80 text-primary text-sm">
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent-neon/10 rounded-lg">
              <div className="w-2 h-2 bg-accent-neon rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Registration Confirmed</p>
                <p className="text-xs text-muted-foreground">
                  Successfully registered for {eventData.title}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">2 days ago</span>
            </div>

            {registration && registration.status === "confirmed" && (
              <div className="flex items-center gap-3 p-3 bg-accent-electric/10 rounded-lg">
                <div className="w-2 h-2 bg-accent-electric rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment Processed</p>
                  <p className="text-xs text-muted-foreground">
                    Payment confirmation sent to your email
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Event Reminder</p>
                <p className="text-xs text-muted-foreground">
                  Event starts in {daysUntilEvent} days
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
