import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { getAdminStaffEvents, type EventStaffAssignment } from '@/lib/admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';

const MarketerDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [assignedEvents, setAssignedEvents] = useState<EventStaffAssignment[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventStaffAssignment[]>([]);

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

        // Filter upcoming events (next 30 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextMonth = new Date(today);
        nextMonth.setDate(nextMonth.getDate() + 30);

        const upcoming = events.filter((assignment) => {
          if (!assignment.event?.startDate) return false;
          const eventDate = new Date(assignment.event.startDate);
          return eventDate >= today && eventDate <= nextMonth;
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
        <h1 className="text-lg font-semibold text-foreground">Marketer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage campaigns and view analytics for your assigned events
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
            <div className="font-semibold text-primary">{assignedEvents.length}</div>
            <p className="text-xs text-muted-foreground">Total assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-primary">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-primary">0</div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-primary">--</div>
            <p className="text-xs text-muted-foreground">Avg. engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
        <CardHeader>
          <CardTitle className={isMobile ? 'text-base' : ''}>Quick Actions</CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>
            Access frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
            <Link to="/admin/marketing/campaigns">
              <Button className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white" size={isMobile ? 'default' : 'lg'}>
                <Megaphone className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                Create Campaign
              </Button>
            </Link>
            <Link to="/admin/analytics/events">
              <Button className="w-full border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral" variant="outline" size={isMobile ? 'default' : 'lg'}>
                <BarChart3 className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                View Analytics
              </Button>
            </Link>
            <Link to="/admin/events/assigned">
              <Button className="w-full border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral" variant="outline" size={isMobile ? 'default' : 'lg'}>
                <Calendar className={`${isMobile ? 'mr-2 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                My Events
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Events */}
      {upcomingEvents.length > 0 && (
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events you're assigned to in the next 30 days</CardDescription>
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
                    <div className={`flex ${isMobile ? 'w-full gap-2' : 'gap-2'}`}>
                      <Link
                        to={`/admin/analytics/events?eventId=${assignment.event.id}`}
                        className={isMobile ? 'flex-1' : ''}
                      >
                        <Button
                          size={isMobile ? 'default' : 'sm'}
                          variant="outline"
                          className={isMobile ? 'w-full' : ''}
                        >
                          Analytics
                        </Button>
                      </Link>
                      <Link
                        to={`/admin/events/${assignment.event.id}`}
                        className={isMobile ? 'flex-1' : ''}
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
                  </div>
                );
              })}
            </div>
            {upcomingEvents.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/admin/events/assigned">
                  <Button variant="outline" className="border-primary text-primary hover:bg-accent-coral hover:text-white hover:border-accent-coral">
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
        <EmptyState
          icon={AlertCircle}
          title="No Assigned Events"
          description="You haven't been assigned to any events yet. Once an organizer assigns you to an event, it will appear here."
        />
      )}
    </div>
  );
};

export default MarketerDashboard;

