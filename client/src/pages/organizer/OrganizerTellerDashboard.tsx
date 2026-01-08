import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Monitor,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useMobile';
import { getOrganizerStaffEvents, type EventStaffAssignment } from '@/lib/organizer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const OrganizerTellerDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState<EventStaffAssignment[]>([]);
  const [todaysEvents, setTodaysEvents] = useState<EventStaffAssignment[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventStaffAssignment[]>([]);
  const [scanStats] = useState({
    today: 0,
    thisWeek: 0,
    total: 0,
  });

  const fetchAssignedEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await getOrganizerStaffEvents(user.id, {
        status: 'APPROVED',
      });

      if (response.success && response.data) {
        const events = response.data.assignments;
        setAssignedEvents(events);

        // Filter today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayEvents = events.filter((assignment) => {
          if (!assignment.event?.startDate) return false;
          const eventDate = new Date(assignment.event.startDate);
          return eventDate >= today && eventDate < tomorrow;
        });
        setTodaysEvents(todayEvents);

        // Filter upcoming events (next 7 days)
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcoming = events.filter((assignment) => {
          if (!assignment.event?.startDate) return false;
          const eventDate = new Date(assignment.event.startDate);
          return eventDate >= tomorrow && eventDate <= nextWeek;
        });
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error('Error fetching assigned events:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchAssignedEvents();
    }
  }, [user?.id, fetchAssignedEvents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-success text-white">Active</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div>
        <h1 className="text-page-title">Teller Dashboard</h1>
        <p className={`${isMobile ? 'text-sm' : ''} text-muted-foreground`}>
          Manage your assigned events and scanning activities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedEvents.length}</div>
            <p className="text-xs text-muted-foreground">Total assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysEvents.length}</div>
            <p className="text-xs text-muted-foreground">Events happening today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scanStats.today}</div>
            <p className="text-xs text-muted-foreground">Tickets scanned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scanStats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Total scans</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? 'text-lg' : ''}>Quick Actions</CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>
            Access frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
            <Link to="/organizer/service-point/scanner">
              <Button className="w-full" size={isMobile ? 'default' : 'lg'}>
                <QrCode className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                Open Scanner
              </Button>
            </Link>
            <Link to="/organizer/service-point">
              <Button className="w-full" variant="outline" size={isMobile ? 'default' : 'lg'}>
                <Monitor className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                Service Point
              </Button>
            </Link>
            <Link to="/organizer/events/assigned">
              <Button className="w-full" variant="outline" size={isMobile ? 'default' : 'lg'}>
                <Calendar className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                All Events
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Today's Events */}
      {todaysEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Events</CardTitle>
            <CardDescription>Events happening today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysEvents.map((assignment) => {
                if (!assignment.event) return null;
                return (
                  <div
                    key={assignment.id}
                    className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-3 ${isMobile ? 'p-3' : 'p-4'} border rounded-lg hover:bg-muted/50 transition-colors`}
                  >
                    <div className="flex-1">
                      <div className={`flex ${isMobile ? 'flex-wrap' : 'items-center'} gap-2 md:gap-3`}>
                        <h3 className={`${isMobile ? 'text-base' : ''} font-semibold`}>
                          {assignment.event.title}
                        </h3>
                        {getEventStatusBadge(assignment.event.status || 'APPROVED')}
                        <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>
                          {assignment.role}
                        </Badge>
                      </div>
                      <div className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        {assignment.event.startDate && (
                          <div>{formatDate(assignment.event.startDate)}</div>
                        )}
                        {assignment.facility && (
                          <div className="mt-1">Facility: {assignment.facility}</div>
                        )}
                        {assignment.shiftStart && assignment.shiftEnd && (
                          <div className="mt-1">
                            Shift: {formatTime(assignment.shiftStart)} -{' '}
                            {formatTime(assignment.shiftEnd)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`flex ${isMobile ? 'w-full gap-2' : 'gap-2'}`}>
                      <Link
                        to={`/organizer/service-point/scanner?eventId=${assignment.event.id}`}
                        className={isMobile ? 'flex-1' : ''}
                      >
                        <Button size={isMobile ? 'default' : 'sm'} className={isMobile ? 'w-full' : ''}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Scan
                        </Button>
                      </Link>
                      <Link
                        to={`/organizer/events/${assignment.event.id}`}
                        className={isMobile ? 'flex-1' : ''}
                      >
                        <Button
                          size={isMobile ? 'default' : 'sm'}
                          variant="outline"
                          className={isMobile ? 'w-full' : ''}
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.slice(0, 5).map((assignment) => {
                if (!assignment.event) return null;
                return (
                  <div
                    key={assignment.id}
                    className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-3 ${isMobile ? 'p-3' : 'p-4'} border rounded-lg hover:bg-muted/50 transition-colors`}
                  >
                    <div className="flex-1">
                      <div className={`flex ${isMobile ? 'flex-wrap' : 'items-center'} gap-2 md:gap-3`}>
                        <h3 className={`${isMobile ? 'text-base' : ''} font-semibold`}>
                          {assignment.event.title}
                        </h3>
                        {getEventStatusBadge(assignment.event.status || 'APPROVED')}
                        <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>
                          {assignment.role}
                        </Badge>
                      </div>
                      <div className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        {assignment.event.startDate && (
                          <div>{formatDate(assignment.event.startDate)}</div>
                        )}
                        {assignment.facility && (
                          <div className="mt-1">Facility: {assignment.facility}</div>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/organizer/events/${assignment.event.id}`}
                      className={isMobile ? 'w-full' : ''}
                    >
                      <Button
                        size={isMobile ? 'default' : 'sm'}
                        variant="outline"
                        className={isMobile ? 'w-full' : ''}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
            {upcomingEvents.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/organizer/events/assigned">
                  <Button variant="outline">
                    View All {upcomingEvents.length} Upcoming Events
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Events */}
      {assignedEvents.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assigned Events</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't been assigned to any events yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizerTellerDashboard;

