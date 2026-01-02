import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  Eye,
  MoreHorizontal,
  Share2,
  Copy,
  Download,
  ChevronRight,
  Ticket,
  CalendarPlus,
  TrendingUp,
  Sparkles,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import EmptyState from "../../components/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { EventThumbnail } from "../../components/ui/event-thumbnail";
import { Avatar } from "../../components/ui/avatar";
import { getUserRegisteredEvents } from "../../lib/event-api";
import { useAuth } from "../../hooks/useAuth";
import { shareEvent } from "../../lib/utils/share";
import { downloadTicket } from "../../lib/utils/ticket";
import { useToast } from "../../hooks/use-toast";

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
  venue?: string;
  description?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  category?: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface DashboardHomeProps {
  user: User;
}

type FilterTab = 'all' | 'upcoming' | 'completed';

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [userEvents, setUserEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const companyAffiliation = authUser?.companyAffiliation || null;

  const fetchUserEvents = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await getUserRegisteredEvents({ page: pageNum, limit: 12 });
      if (response.success && response.data) {
        const newEvents = response.data.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          type: event.type || 'In-Person',
          image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
          registrationDate: event.registrationDate,
          venue: event.venue || event.location,
          description: event.description || '',
          status: event.status || 'upcoming',
          category: event.category || '',
        }));

        if (append) {
          setUserEvents(prev => [...prev, ...newEvents]);
        } else {
          setUserEvents(newEvents);
          if (response.data.total !== undefined) {
            setTotalEvents(response.data.total);
          }
        }

        setHasMore(response.data.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching user events:", error);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserEvents(1, false);
  }, [fetchUserEvents]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchUserEvents(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, fetchUserEvents]);

  // Computed values
  const upcomingEvents = useMemo(() =>
    userEvents.filter(e => e.status === 'upcoming'),
    [userEvents]
  );

  const completedEvents = useMemo(() =>
    userEvents.filter(e => e.status === 'completed'),
    [userEvents]
  );

  const nextEvent = useMemo(() => {
    if (upcomingEvents.length === 0) return null;
    // Sort by date and get the nearest one
    return [...upcomingEvents].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
  }, [upcomingEvents]);

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingEvents;
      case 'completed':
        return completedEvents;
      default:
        return userEvents;
    }
  }, [activeTab, userEvents, upcomingEvents, completedEvents]);

  // Calculate days until next event
  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-primary/10 text-primary';
      case 'ongoing': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewEvent = (event: EventData) => {
    navigate(`/user/event/${event.id}`);
  };

  const handleCopyLink = async (eventId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/event/${eventId}`);
      toast({
        title: "Copied",
        description: "Event link copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (event: EventData) => {
    const shared = await shareEvent(event.title, event.id);
    toast({
      title: shared ? "Shared" : "Link Copied",
      description: shared ? "Event shared successfully" : "Event link copied to clipboard",
    });
  };

  const handleDownloadTicket = (event: EventData) => {
    try {
      downloadTicket({
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        attendeeName: user.name,
        attendeeEmail: user.email,
        ticketType: event.type || 'Standard',
        ticketId: `${event.id}-${Date.now()}`,
      });
      toast({
        title: "Downloaded",
        description: "Ticket downloaded successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download ticket",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">

          {/* Left Sidebar - Redesigned Profile Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Profile Card */}
              <Card className="overflow-hidden border-0 shadow-card">
                {/* Profile Header with gradient */}
                <div className="h-20 bg-gradient-to-br from-primary via-primary to-primary-dark" />

                {/* Avatar overlapping the header */}
                <div className="px-6 -mt-10">
                  <Avatar
                    src={(authUser as { profileImage?: string })?.profileImage || undefined}
                    name={user.name}
                    alt={user.name}
                    size="lg"
                    className="ring-4 ring-card"
                  />
                </div>

                <CardContent className="pt-4 pb-6 px-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                    {companyAffiliation && (
                      <p className="text-sm text-muted-foreground">{companyAffiliation}</p>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 py-4 border-y border-border">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold text-foreground">{totalEvents || userEvents.length}</p>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold text-foreground">{upcomingEvents.length}</p>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold text-foreground">{completedEvents.length}</p>
                      <p className="text-xs text-muted-foreground">Attended</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => navigate('/')}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find Events
                  </Button>

                  {/* Edit Profile Link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-muted-foreground"
                    onClick={() => navigate('/user/profile')}
                  >
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Links Card */}
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</p>
                  <nav className="space-y-1">
                    {[
                      { label: 'My Tickets', icon: Ticket, section: 'tickets' },
                      { label: 'Saved Events', icon: Star, section: 'saved' },
                      { label: 'Recommendations', icon: Sparkles, section: 'recommendations' },
                    ].map((item) => (
                      <button
                        key={item.section}
                        onClick={() => navigate(`/user/dashboard?section=${item.section}`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors group"
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          {item.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Header */}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your events
              </p>
            </div>

            {/* Stats Cards - Redesigned */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Upcoming Events Card */}
              <Card className="border-0 shadow-card overflow-hidden group hover:shadow-card-hover transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{upcomingEvents.length}</p>
                      {nextEvent && (
                        <p className="text-xs text-primary mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Next in {getDaysUntil(nextEvent.date)} days
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Events Card */}
              <Card className="border-0 shadow-card overflow-hidden group hover:shadow-card-hover transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Registered</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{totalEvents || userEvents.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">All time</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Events Card */}
              <Card className="border-0 shadow-card overflow-hidden group hover:shadow-card-hover transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Attended</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{completedEvents.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">Completed events</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                      <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Next Event - Hero Style */}
            {nextEvent && (
              <Card className="border-0 shadow-card overflow-hidden">
                <div className="relative h-48 sm:h-56">
                  <img
                    src={nextEvent.image}
                    alt={nextEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary text-white border-0">
                            Next Event
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                            {getDaysUntil(nextEvent.date) === 0 ? 'Today' :
                             getDaysUntil(nextEvent.date) === 1 ? 'Tomorrow' :
                             `In ${getDaysUntil(nextEvent.date)} days`}
                          </Badge>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2">
                          {nextEvent.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(nextEvent.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {nextEvent.venue || nextEvent.location}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-white text-foreground hover:bg-white/90"
                          onClick={() => handleViewEvent(nextEvent)}
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          View Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                          onClick={() => {
                            // Add to calendar functionality
                            toast({
                              title: "Coming Soon",
                              description: "Calendar integration coming soon!",
                            });
                          }}
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Events Section with Tabs */}
            <div>
              {/* Section Header with Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-foreground">My Events</h2>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'completed', label: 'Past' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as FilterTab)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab.key
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading your events...</span>
                  </div>
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group border-0 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                      onClick={() => handleViewEvent(event)}
                    >
                      <div className="flex gap-4 p-4">
                        {/* Event Image */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {event.category && (
                            <div className="absolute bottom-1 left-1">
                              <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0 backdrop-blur-sm">
                                {event.category}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {event.title}
                              </h3>
                              <Badge className={`${getStatusColor(event.status || 'upcoming')} border-0 text-[10px] flex-shrink-0`}>
                                {event.status === 'upcoming' ? 'Upcoming' : event.status === 'completed' ? 'Attended' : event.status}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(event.date)}
                              </p>
                              <p className="flex items-center gap-1.5 line-clamp-1">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                {event.venue || event.location}
                              </p>
                            </div>
                          </div>

                          {/* Actions Row */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.type}
                            </span>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEvent(event);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Event Page
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadTicket(event)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Ticket
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleCopyLink(event.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShare(event)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share Event
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title={activeTab === 'all' ? "No Events Yet" : activeTab === 'upcoming' ? "No Upcoming Events" : "No Past Events"}
                  description={
                    activeTab === 'all'
                      ? "You haven't registered for any events yet. Start exploring amazing events!"
                      : activeTab === 'upcoming'
                      ? "You don't have any upcoming events. Find something exciting to attend!"
                      : "You haven't attended any events yet."
                  }
                  action={{
                    label: "Browse Events",
                    onClick: () => navigate('/'),
                  }}
                />
              )}

              {/* Infinite Scroll Loader */}
              {hasMore && filteredEvents.length > 0 && (
                <div ref={loadMoreRef} className="py-8 text-center">
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading more events...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
