import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { 
  Calendar, 
  Users, 
  QrCode, 
  Printer, 
  Monitor, 
  History, 
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  Star,
  ArrowLeft,
  Activity,
  Zap,
  Settings,
  Gift,
  Utensils,
  Car,
  Shield,
  Download
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import { getEvent, getEventAttendees, type EventAttendee, type EventStatistics, TicketStatus } from "../../../lib/workstation-api";
import { getEvents, type EventData } from "../../../lib/event-api";
import { useToast } from "../../../hooks/use-toast";

interface Facility {
  name: string;
  checkedIn: number;
  currentlyInside: number;
  icon: React.ReactNode;
}

const WorkstationEventDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'facilities'>('overview');
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Load event data and statistics
  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) {
        toast({
          title: "Error",
          description: "Event ID is required",
          variant: "destructive",
        });
        navigate('/admin/workstation');
        return;
      }

      try {
        setLoading(true);
        
        // Load event details from event API
        const eventsResponse = await getEvents({ limit: 1000 });
        const event = eventsResponse.success && eventsResponse.data 
          ? eventsResponse.data.events.find(e => e.id === eventId)
          : null;

        if (!event) {
          toast({
            title: "Error",
            description: "Event not found",
            variant: "destructive",
          });
          navigate('/admin/workstation');
          return;
        }

        setEventData(event);

        // Load workstation statistics
        const workstationResponse = await getEvent(eventId);
        if (workstationResponse.success && workstationResponse.data) {
          setStatistics(workstationResponse.data.statistics);
        }
      } catch (error) {
        console.error('Error loading event data:', error);
        toast({
          title: "Error",
          description: "Failed to load event data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, navigate, toast]);

  // Load attendees when attendees tab is active
  useEffect(() => {
    const loadAttendees = async () => {
      if (!eventId || activeTab !== 'attendees') return;

      try {
        setAttendeesLoading(true);
        const response = await getEventAttendees(
          eventId,
          pagination.page,
          pagination.limit
        );

        if (response.success && response.data) {
          setAttendees(response.data.attendees);
          if (response.data.pagination) {
            setPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              total: response.data.attendees.length, // Use attendees length as total
              totalPages: response.data.pagination.totalPages,
            });
          }
        }
      } catch (error) {
        console.error('Error loading attendees:', error);
        toast({
          title: "Error",
          description: "Failed to load attendees",
          variant: "destructive",
        });
      } finally {
        setAttendeesLoading(false);
      }
    };

    loadAttendees();
  }, [eventId, activeTab, pagination.page, pagination.limit, toast]);

  // Determine event status
  const getEventStatus = (): 'upcoming' | 'ongoing' | 'completed' => {
    if (!eventData) return 'upcoming';
    
    const now = new Date();
    const startDate = new Date(eventData.startDate);
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;
    
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'ongoing':
        return "bg-green-100 text-green-800 border-green-200";
      case 'completed':
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const getTicketStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ACTIVE:
        return "bg-green-100 text-green-800 border-green-200";
      case TicketStatus.DEACTIVATED:
        return "bg-red-100 text-red-800 border-red-200";
      case TicketStatus.EXPIRED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case TicketStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format facilities from statistics
  const getFacilities = (): Facility[] => {
    // Note: facilitiesData is not currently in EventStatistics type
    // This functionality is reserved for future implementation
    interface ExtendedStatistics extends EventStatistics {
      facilitiesData?: Array<{ facility?: string; checkedIn?: number; currentlyInside?: number }>;
    }
    const facilitiesData = (statistics as ExtendedStatistics)?.facilitiesData;
    if (!facilitiesData) return [];

    const facilityIcons: Record<string, React.ReactNode> = {
      'Main Entrance': <Shield className="w-4 h-4" />,
      'Entrance': <Shield className="w-4 h-4" />,
      'Lunch': <Utensils className="w-4 h-4" />,
      'Lunch Area': <Utensils className="w-4 h-4" />,
      'Gifts': <Gift className="w-4 h-4" />,
      'Gifts Desk': <Gift className="w-4 h-4" />,
      'VIP': <Star className="w-4 h-4" />,
      'VIP Lounge': <Star className="w-4 h-4" />,
      'Parking': <Car className="w-4 h-4" />,
    };

    return facilitiesData.map((facility) => ({
      name: facility.facility || 'Unknown',
      checkedIn: facility.checkedIn ?? 0,
      currentlyInside: facility.currentlyInside ?? 0,
      icon: facilityIcons[facility.facility || ''] || <Building2 className="w-4 h-4" />,
    }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time range
  const formatTimeRange = () => {
    if (!eventData) return '';
    
    const startDate = new Date(eventData.startDate);
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;
    
    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      return `${formatDate(eventData.startDate)} - ${eventData.endDate ? formatDate(eventData.endDate) : 'Ongoing'}`;
    } else {
      return formatDate(eventData.startDate);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading event data...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!eventData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Event not found</div>
        </div>
      </AdminLayout>
    );
  }

  const status = getEventStatus();
  const imageUrl = eventData.image || eventData.images?.[0] || '/placeholder-event.jpg';
  const organizerName = eventData.organizer?.organizationName || eventData.organizer?.firstName || 'Unknown';
  const facilities = getFacilities();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/workstation')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{eventData.title}</h1>
            <p className="text-gray-600 mt-2">{organizerName} • {formatTimeRange()} • {eventData.location}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate(`/admin/workstation/scanner?event=${eventId}`)}
              className="bg-primary hover:bg-primary/90"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Scanner
            </Button>
            <Button 
              onClick={() => navigate(`/admin/workstation/print?event=${eventId}`)}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Center
            </Button>
          </div>
        </div>

        {/* Event Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={imageUrl}
                  alt={eventData.title}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getStatusColor(status)} border-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </div>
                    </Badge>
                    {eventData.category && (
                      <Badge variant="secondary">{eventData.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeRange()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{eventData.location}</span>
                    </div>
                    {eventData.venue && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{eventData.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Attendees</p>
                <p className="font-semibold text-gray-900">
                  {statistics?.totalAttendees || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Checked In: {statistics?.checkedIn || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/workstation/scanner?event=${eventId}`)}
              >
                <QrCode className="w-6 h-6" />
                <span>QR Scanner</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/workstation/print?event=${eventId}`)}
              >
                <Printer className="w-6 h-6" />
                <span>Print Center</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/workstation/templates?event=${eventId}`)}
              >
                <Settings className="w-6 h-6" />
                <span>Templates</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(`/admin/workstation/history?event=${eventId}`)}
              >
                <History className="w-6 h-6" />
                <span>Scan History</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'attendees' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('attendees')}
          >
            <Users className="w-4 h-4 mr-2" />
            Attendees
          </Button>
          <Button
            variant={activeTab === 'facilities' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('facilities')}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Facilities
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                    <p className="font-semibold text-gray-900">{statistics?.totalAttendees || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                    <p className="font-semibold text-gray-900">{statistics?.checkedIn || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currently Inside</p>
                    <p className="font-semibold text-gray-900">{statistics?.currentlyInside || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scans Today</p>
                    <p className="font-semibold text-gray-900">{statistics?.scansToday || 0}</p>
                  </div>
                  <QrCode className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'attendees' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Attendees Management
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendeesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-600">Loading attendees...</div>
                </div>
              ) : attendees.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-600">No attendees found</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendees.map((attendee) => (
                    <div 
                      key={attendee.registrationId} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {attendee.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{attendee.attendeeName}</h4>
                          <p className="text-sm text-gray-600">{attendee.email}</p>
                          {attendee.phoneNumber && (
                            <p className="text-sm text-gray-500">{attendee.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`text-xs ${getTicketStatusColor(attendee.ticketStatus)}`}>
                          {attendee.ticketStatus}
                        </Badge>
                        {attendee.ticketType && (
                          <Badge variant="outline" className="text-xs">
                            {attendee.ticketType}
                          </Badge>
                        )}
                        {attendee.isCurrentlyInside && (
                          <Badge variant="secondary" className="text-xs">
                            Inside
                          </Badge>
                        )}
                        <span className="text-sm text-gray-600">
                          {attendee.checkedInAt 
                            ? new Date(attendee.checkedInAt).toLocaleString()
                            : 'Not checked in'
                          }
                        </span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} attendees
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === 1}
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'facilities' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Facilities Management
                </div>
                <Button 
                  onClick={() => navigate(`/admin/workstation/scanner?event=${eventId}`)}
                  size="sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Open Scanner
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {facilities.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-600">No facilities data available</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilities.map((facility, index) => (
                    <Card key={index} className="cursor-pointer transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {facility.icon}
                            <span className="font-medium">{facility.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {facility.currentlyInside} inside
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <div>Checked In: {facility.checkedIn}</div>
                          <div>Currently Inside: {facility.currentlyInside}</div>
                        </div>
                        {facility.checkedIn > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min((facility.currentlyInside / facility.checkedIn) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default WorkstationEventDashboard;
