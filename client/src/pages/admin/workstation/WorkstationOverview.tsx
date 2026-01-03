import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  Activity,
  Printer,
  Layout,
  History,
  Scan,
  UserCheck,
  UserMinus,
  RefreshCw,
  Loader2,
  Zap,
  BarChart3
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import { getEvents, type EventData } from "@/lib/event-api";
import { getEvent, type EventStatistics } from "@/lib/workstation-api";
import { useToast } from "@/hooks/use-toast";

interface EventWithStats extends EventData {
  statistics?: EventStatistics;
}

const WorkstationOverview: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalAttendees: 0,
    totalScanned: 0,
    currentlyInside: 0,
    totalCheckouts: 0,
    reEntries: 0,
    scansToday: 0,
  });

  // Load events with statistics
  const loadEvents = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await getEvents({ limit: 100 });
      if (response.success && response.data) {
        const eventsWithStats: EventWithStats[] = [];

        // Load statistics for each event in parallel (up to 5 at a time)
        const batchSize = 5;
        for (let i = 0; i < response.data.events.length; i += batchSize) {
          const batch = response.data.events.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (event) => {
              try {
                const eventResponse = await getEvent(event.id);
                if (eventResponse.success && eventResponse.data) {
                  return {
                    ...event,
                    statistics: eventResponse.data.statistics,
                  };
                }
              } catch (error) {
                console.error(`Error loading statistics for event ${event.id}:`, error);
              }
              return event;
            })
          );
          eventsWithStats.push(...batchResults);
        }

        setEvents(eventsWithStats);

        // Calculate totals
        const now = new Date();
        const activeEvents = eventsWithStats.filter(e => {
          const start = new Date(e.startDate);
          const end = e.endDate ? new Date(e.endDate) : null;
          return start <= now && (!end || end >= now);
        }).length;

        setStats({
          totalEvents: eventsWithStats.length,
          activeEvents,
          totalAttendees: eventsWithStats.reduce((sum, e) => sum + (e.statistics?.totalAttendees || 0), 0),
          totalScanned: eventsWithStats.reduce((sum, e) => sum + (e.statistics?.checkedIn || 0), 0),
          currentlyInside: eventsWithStats.reduce((sum, e) => sum + (e.statistics?.currentlyInside || 0), 0),
          totalCheckouts: eventsWithStats.reduce((sum, e) => sum + (e.statistics?.checkedOut || 0), 0),
          reEntries: eventsWithStats.reduce((sum, e) => sum + (e.statistics?.reEntries || 0), 0),
          scansToday: eventsWithStats.reduce((sum, e) => sum + (e.statistics?.scansToday || 0), 0),
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Determine event status
  const getEventStatus = (event: EventWithStats): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    if (endDate && now > endDate) {
      return 'completed';
    } else if (now >= startDate && (!endDate || now <= endDate)) {
      return 'ongoing';
    } else {
      return 'upcoming';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return "bg-blue-100 text-blue-800";
      case 'ongoing':
        return "bg-green-100 text-green-800";
      case 'completed':
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
      case 'ongoing':
        return <Activity className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeRange = (event: EventWithStats) => {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      return `${formatDate(event.startDate)} - ${formatDate(event.endDate!)}`;
    }
    return formatDate(event.startDate);
  };

  // Quick actions
  const quickActions = [
    {
      title: "Scan Tickets",
      description: "Check in attendees at the venue",
      icon: Scan,
      color: "from-blue-500 to-blue-600",
      href: "/admin/workstation/scanner",
    },
    {
      title: "Print Badges",
      description: "Generate and print attendee badges",
      icon: Printer,
      color: "from-purple-500 to-purple-600",
      href: "/admin/workstation/print",
    },
    {
      title: "Edit Templates",
      description: "Customize badge designs",
      icon: Layout,
      color: "from-orange-500 to-orange-600",
      href: "/admin/workstation/templates",
    },
    {
      title: "Scan History",
      description: "View all check-in records",
      icon: History,
      color: "from-green-500 to-green-600",
      href: "/admin/workstation/history",
    },
  ];

  // Get ongoing events
  const ongoingEvents = events.filter(e => getEventStatus(e) === 'ongoing');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workstation</h1>
            <p className="text-muted-foreground mt-1">Manage event check-ins, badges, and attendee operations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEvents(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/admin/workstation/scanner')}
            >
              <Scan className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading workstation data...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Events</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalEvents}</p>
                    </div>
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Active Now</p>
                      <p className="text-2xl font-bold text-green-900">{stats.activeEvents}</p>
                    </div>
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">Attendees</p>
                      <p className="text-2xl font-bold text-indigo-900">{stats.totalAttendees.toLocaleString()}</p>
                    </div>
                    <Users className="w-6 h-6 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 font-medium">Checked In</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalScanned.toLocaleString()}</p>
                    </div>
                    <UserCheck className="w-6 h-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-600 font-medium">Inside Now</p>
                      <p className="text-2xl font-bold text-emerald-900">{stats.currentlyInside.toLocaleString()}</p>
                    </div>
                    <Zap className="w-6 h-6 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-600 font-medium">Checked Out</p>
                      <p className="text-2xl font-bold text-orange-900">{stats.totalCheckouts.toLocaleString()}</p>
                    </div>
                    <UserMinus className="w-6 h-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-cyan-600 font-medium">Re-entries</p>
                      <p className="text-2xl font-bold text-cyan-900">{stats.reEntries.toLocaleString()}</p>
                    </div>
                    <RefreshCw className="w-6 h-6 text-cyan-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 col-span-2 md:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-pink-600 font-medium">Today's Scans</p>
                      <p className="text-2xl font-bold text-pink-900">{stats.scansToday.toLocaleString()}</p>
                    </div>
                    <BarChart3 className="w-6 h-6 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-base font-semibold">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
                    <div
                      key={action.title}
                      className="group cursor-pointer"
                      onClick={() => navigate(action.href)}
                    >
                      <div className={`p-6 rounded-xl bg-gradient-to-br ${action.color} text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
                        <action.icon className="w-8 h-8 mb-3 opacity-90" />
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-white/80">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Events */}
            {ongoingEvents.length > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-base font-semibold text-green-800">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Live Events ({ongoingEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ongoingEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="group cursor-pointer hover:shadow-md transition-all duration-200 bg-card"
                        onClick={() => navigate(`/admin/workstation/event/${event.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">{event.location}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ml-2">
                              <Activity className="w-3 h-3 mr-1" />
                              Live
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center mb-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <p className="text-lg font-bold text-foreground">{event.statistics?.totalAttendees || 0}</p>
                              <p className="text-xs text-muted-foreground">Registered</p>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{event.statistics?.checkedIn || 0}</p>
                              <p className="text-xs text-muted-foreground">Checked In</p>
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">{event.statistics?.currentlyInside || 0}</p>
                              <p className="text-xs text-muted-foreground">Inside</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/workstation/scanner?event=${event.id}`);
                              }}
                            >
                              <Scan className="w-4 h-4 mr-1" />
                              Scan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/workstation/print?event=${event.id}`);
                              }}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Events */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-base font-semibold">
                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                    All Events
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/workstation/events')}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events found</p>
                    <p className="text-sm mt-1">Events will appear here once created</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.slice(0, 6).map((event) => {
                      const status = getEventStatus(event);
                      const imageUrl = event.image || event.images?.[0] || '/placeholder-event.jpg';

                      return (
                        <Card
                          key={event.id}
                          className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                          onClick={() => navigate(`/admin/workstation/event/${event.id}`)}
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-3 left-3">
                              <Badge className={getStatusColor(status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(status)}
                                  <span className="capitalize">{status}</span>
                                </div>
                              </Badge>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="font-semibold text-white truncate">
                                {event.title}
                              </h3>
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{formatTimeRange(event)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t">
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{event.statistics?.totalAttendees || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <UserCheck className="w-4 h-4 text-green-500" />
                                    <span className="font-medium text-green-600">{event.statistics?.checkedIn || 0}</span>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {events.length > 6 && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/workstation/events')}
                    >
                      View All {events.length} Events
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default WorkstationOverview;
