import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  HeadphonesIcon,
  Clock,
  AlertCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAdminStaffEvents, type EventStaffAssignment } from '@/lib/admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SupportDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState<EventStaffAssignment[]>([]);
  const [todaysEvents, setTodaysEvents] = useState<EventStaffAssignment[]>([]);

  const fetchAssignedEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await getAdminStaffEvents(user.id, {
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

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Active</Badge>;
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
        <h1 className="text-base font-semibold text-foreground">Support Dashboard</h1>
        <p className="text-gray-600">
          Manage support requests and view your assigned events
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
            <div className="font-semibold text-gray-900">{assignedEvents.length}</div>
            <p className="text-xs text-muted-foreground">Total assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-gray-900">{todaysEvents.length}</div>
            <p className="text-xs text-muted-foreground">Events happening today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-gray-900">0</div>
            <p className="text-xs text-muted-foreground">Pending support</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-gray-900">--</div>
            <p className="text-xs text-muted-foreground">Avg. response</p>
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
            <Link to="/admin/support">
              <Button className="w-full" size={isMobile ? 'default' : 'lg'}>
                <HeadphonesIcon className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                Support Inbox
              </Button>
            </Link>
            <Link to="/admin/support/queries">
              <Button className="w-full" variant="outline" size={isMobile ? 'default' : 'lg'}>
                <MessageSquare className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                Recent Queries
              </Button>
            </Link>
            <Link to="/admin/events/assigned">
              <Button className="w-full" variant="outline" size={isMobile ? 'default' : 'lg'}>
                <Calendar className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                My Events
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
            <CardDescription>Events happening today that you're assigned to</CardDescription>
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
                        {getEventStatusBadge('APPROVED')}
                        <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>
                          {assignment.role}
                        </Badge>
                      </div>
                      <div className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        {assignment.event.startDate && (
                          <div>{formatDate(assignment.event.startDate)}</div>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/admin/events/${assignment.event.id}`}
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

export default SupportDashboard;

