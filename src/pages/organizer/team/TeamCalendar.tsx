import { useState } from "react";
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
  AlertCircle
} from "lucide-react";

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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Mock data
  const eventAssignments: EventAssignment[] = [
    {
      id: "1",
      eventName: "Tech Conference 2024",
      date: "2024-01-15",
      time: "09:00 - 17:00",
      location: "Convention Center",
      staff: [
        { id: "1", name: "Alex Rodriguez", role: "Ticket Scanner", status: "confirmed" },
        { id: "2", name: "Maria Santos", role: "Event Manager", status: "confirmed" },
        { id: "3", name: "David Kim", role: "Check-in Staff", status: "pending" }
      ],
      totalCapacity: 500,
      confirmedAttendees: 450
    },
    {
      id: "2",
      eventName: "Music Festival",
      date: "2024-01-20",
      time: "14:00 - 23:00",
      location: "Central Park",
      staff: [
        { id: "1", name: "Alex Rodriguez", role: "Ticket Scanner", status: "confirmed" },
        { id: "4", name: "Sarah Johnson", role: "Supervisor", status: "confirmed" }
      ],
      totalCapacity: 2000,
      confirmedAttendees: 1850
    },
    {
      id: "3",
      eventName: "Workshop Series",
      date: "2024-01-22",
      time: "10:00 - 16:00",
      location: "Community Center",
      staff: [
        { id: "2", name: "Maria Santos", role: "Event Manager", status: "confirmed" },
        { id: "3", name: "David Kim", role: "Check-in Staff", status: "confirmed" }
      ],
      totalCapacity: 100,
      confirmedAttendees: 95
    }
  ];

  const staffSchedules: StaffSchedule[] = [
    {
      id: "1",
      name: "Alex Rodriguez",
      role: "Ticket Scanner",
      events: [
        { eventId: "1", eventName: "Tech Conference 2024", date: "2024-01-15", time: "09:00 - 17:00", status: "confirmed" },
        { eventId: "2", eventName: "Music Festival", date: "2024-01-20", time: "14:00 - 23:00", status: "confirmed" }
      ]
    },
    {
      id: "2",
      name: "Maria Santos",
      role: "Event Manager",
      events: [
        { eventId: "1", eventName: "Tech Conference 2024", date: "2024-01-15", time: "09:00 - 17:00", status: "confirmed" },
        { eventId: "3", eventName: "Workshop Series", date: "2024-01-22", time: "10:00 - 16:00", status: "confirmed" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return "bg-green-100 text-green-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'declined': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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

  const getUpcomingEvents = () => {
    const today = new Date();
    return eventAssignments.filter(event => new Date(event.date) >= today);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Team Calendar</h1>
          <p className="text-muted-foreground">
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
          <Button className="bg-accent-neon hover:bg-accent-neon/80 text-primary w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Assign Staff
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
              <div className="space-y-4">
                {getUpcomingEvents().map((event) => (
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
                          <span className="text-muted-foreground">
                            Capacity: <span className="font-medium text-foreground">{event.confirmedAttendees}/{event.totalCapacity}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Staff: <span className="font-medium text-foreground">{event.staff.length}</span>
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
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
                  <span className="font-medium text-foreground">{getUpcomingEvents().length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Staff Assigned</span>
                  <span className="font-medium text-foreground">
                    {eventAssignments.reduce((sum, event) => sum + event.staff.length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="font-medium text-green-600">
                    {eventAssignments.reduce((sum, event) => 
                      sum + event.staff.filter(s => s.status === 'confirmed').length, 0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-yellow-600">
                    {eventAssignments.reduce((sum, event) => 
                      sum + event.staff.filter(s => s.status === 'pending').length, 0
                    )}
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
