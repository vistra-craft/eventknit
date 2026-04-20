import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from '@/lib/utils/error';
import { getOrganizerStaffAssignments, getOrganizerEvents, type EventStaffAssignment } from "@/lib/organizer-api";

interface EventAssignment {
  id: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  staff: {
    id: string;
    name: string;
    role: string;
    status: 'confirmed' | 'pending' | 'declined';
  }[];
  totalCapacity: number;
  confirmedAttendees: number;
}

interface StaffSchedule {
  id: string;
  name: string;
  role: string;
  events: {
    eventId: string;
    eventName: string;
    date: string;
    time: string;
    status: 'confirmed' | 'pending' | 'declined';
  }[];
}

const TeamCalendar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [eventAssignments, setEventAssignments] = useState<EventAssignment[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get upcoming events
      const eventsResponse = await getOrganizerEvents({ 
        status: 'APPROVED',
        upcoming: true,
      });
      
      // Get all staff assignments
      const assignmentsResponse = await getOrganizerStaffAssignments();
      
      if (!eventsResponse.success || !eventsResponse.data || !assignmentsResponse.success || !assignmentsResponse.data) {
        return;
      }

      const events = eventsResponse.data.events || [];
      const assignments = assignmentsResponse.data.assignments || [];

      // Group assignments by event
      const assignmentsByEvent = new Map<string, EventStaffAssignment[]>();
      assignments.forEach(assignment => {
        if (assignment.eventId) {
          const existing = assignmentsByEvent.get(assignment.eventId) || [];
          existing.push(assignment);
          assignmentsByEvent.set(assignment.eventId, existing);
        }
      });

      // Transform to EventAssignment format
      const transformedEvents: EventAssignment[] = events
        .filter(event => {
          const eventDate = event.startDate ? new Date(event.startDate) : null;
          if (!eventDate) return false;
          return eventDate >= new Date(); // Only upcoming events
        })
        .map(event => {
          const eventAssignments = assignmentsByEvent.get(event.id) || [];
          const eventDate = event.startDate ? new Date(event.startDate) : new Date();
          
          return {
            id: event.id,
            eventName: event.title,
            date: event.startDate || eventDate.toISOString().split('T')[0],
            time: event.startTime && event.endTime 
              ? `${event.startTime} - ${event.endTime}` 
              : event.startTime || 'TBA',
            location: event.venue || event.location || 'TBA',
            staff: eventAssignments
              .filter(a => a.isActive)
              .map(a => ({
                id: a.staffId,
                name: `${a.staff.firstName} ${a.staff.lastName}`,
                role: a.role,
                status: a.isActive ? 'confirmed' as const : 'pending' as const,
              })),
            totalCapacity: event.capacity || 0,
            confirmedAttendees: 0, // Would need registration count - placeholder
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEventAssignments(transformedEvents);

      // Transform to StaffSchedule format
      const staffMap = new Map<string, StaffSchedule>();
      
      assignments
        .filter(a => a.isActive && a.event)
        .forEach(assignment => {
          const staffId = assignment.staffId;
          const staffName = `${assignment.staff.firstName} ${assignment.staff.lastName}`;
          const event = assignment.event!;
          
          if (!staffMap.has(staffId)) {
            staffMap.set(staffId, {
              id: staffId,
              name: staffName,
              role: assignment.staff.role,
              events: [],
            });
          }
          
          const schedule = staffMap.get(staffId)!;
          const eventDate = event.startDate ? new Date(event.startDate) : new Date();
          const eventTime = event.startTime && event.endTime 
            ? `${event.startTime} - ${event.endTime}` 
            : event.startTime || 'TBA';
          
          schedule.events.push({
            eventId: event.id,
            eventName: event.title,
            date: event.startDate || eventDate.toISOString().split('T')[0],
            time: eventTime,
            status: assignment.isActive ? 'confirmed' : 'pending',
          });
        });

      setStaffSchedules(Array.from(staffMap.values()));
    } catch (error) {
      showErrorToast(toast, error, 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return "bg-success-light text-success";
      case 'pending': return "bg-warning/10 text-warning";
      case 'declined': return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'declined': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-page-title mb-2">Team Calendar</h1>
          <p className="text-page-subtitle">
            Schedule staff assignments and track event coverage
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="flex-1 sm:flex-none"
            >
              Week
            </Button>
            <Button 
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="flex-1 sm:flex-none"
            >
              Month
            </Button>
          </div>
          <Button 
            onClick={() => navigate('/organizer/events')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Events
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size="md" />
                </div>
              ) : eventAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming events with staff assignments
                </div>
              ) : (
                <div className="space-y-4">
                  {eventAssignments.map((event) => (
                    <div key={event.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-foreground">{event.eventName}</h3>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(event.date)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.time}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            {event.totalCapacity > 0 && (
                              <span className="text-muted-foreground">
                                Capacity: <span className="font-medium text-foreground">{event.confirmedAttendees}/{event.totalCapacity}</span>
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              Staff: <span className="font-medium text-foreground">{event.staff.length}</span>
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/organizer/event/${event.id}`)}
                        >
                          Manage
                        </Button>
                      </div>
                    
                    {/* Staff Assignments */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-foreground mb-2">Assigned Staff</h4>
                      <div className="space-y-2">
                        {event.staff.map((staff) => (
                          <div key={staff.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{staff.name}</span>
                              <Badge className={`text-xs ${getStatusColor(staff.status)}`}>
                                {staff.role}
                              </Badge>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(staff.status)}`}>
                              {getStatusIcon(staff.status)}
                              <span className="ml-1 capitalize">{staff.status}</span>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff Schedules */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Staff Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size="md" />
                </div>
              ) : staffSchedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff schedules available
                </div>
              ) : (
                <div className="space-y-4">
                  {staffSchedules.map((staff) => (
                    <div key={staff.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{staff.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {staff.role}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {staff.events.map((event) => (
                          <div key={event.eventId} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground">{event.eventName}</span>
                              <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                                {getStatusIcon(event.status)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(event.date)} • {event.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Events</span>
                  <span className="font-medium text-foreground">{eventAssignments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Staff Assigned</span>
                  <span className="font-medium text-foreground">
                    {eventAssignments.reduce((sum, event) => sum + event.staff.length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="font-medium text-success">
                    {eventAssignments.reduce((sum, event) => 
                      sum + event.staff.filter(s => s.status === 'confirmed').length, 0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Staff</span>
                  <span className="font-medium text-foreground">
                    {new Set(staffSchedules.map(s => s.id)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamCalendar;

         