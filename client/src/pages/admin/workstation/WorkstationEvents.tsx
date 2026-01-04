import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  Calendar,
  Users,
  QrCode,
  Printer,
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  Star,
  Activity,
  Target,
  UserPlus,
  Download,
  Settings,
  Gift,
  Utensils,
  Car,
  Shield,
  MoreHorizontal,
  Filter
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import BackButton from "@/components/BackButton";

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  attendees: number;
  capacity: number;
  organizer: string;
  category: string;
  revenue?: number;
  scannedTickets?: number;
  facilities?: Facility[];
  attendeesList?: Attendee[];
}

interface Facility {
  id: string;
  name: string;
  type: 'entrance' | 'lunch' | 'gifts' | 'parking' | 'vip' | 'registration' | 'materials';
  capacity?: number;
  currentCount: number;
  icon: React.ReactNode;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ticketType: string;
  status: 'registered' | 'checked_in' | 'scanned';
  registeredDate: string;
  checkedInDate?: string;
  scannedAt?: string;
  facilities?: string[];
  qrCode: string;
  avatar?: string;
}

const WorkstationEvents: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  // Mock data for events
  const events: EventData[] = [
    {
      id: "1",
      title: "Seamless East Africa 2025",
      date: "July 2-3, 2025",
      time: "9:00 AM - 6:00 PM",
      location: "Nairobi, Kenya",
      venue: "Kenyatta International Convention Centre",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
      status: "upcoming",
      attendees: 485,
      capacity: 500,
      organizer: "EventKnit",
      category: "Technology",
      revenue: 145200,
      scannedTickets: 0,
      facilities: [
        { id: "1", name: "Main Entrance", type: "entrance", capacity: 500, currentCount: 0, icon: <Shield className="w-4 h-4" /> },
        { id: "2", name: "Lunch Area", type: "lunch", capacity: 300, currentCount: 0, icon: <Utensils className="w-4 h-4" /> },
        { id: "3", name: "Gifts Desk", type: "gifts", capacity: 200, currentCount: 0, icon: <Gift className="w-4 h-4" /> },
        { id: "4", name: "VIP Lounge", type: "vip", capacity: 50, currentCount: 0, icon: <Star className="w-4 h-4" /> },
        { id: "5", name: "Parking", type: "parking", capacity: 100, currentCount: 0, icon: <Car className="w-4 h-4" /> }
      ],
      attendeesList: [
        {
          id: "1",
          name: "Sarah Johnson",
          email: "sarah@example.com",
          phone: "+254 700 123 456",
          ticketType: "VIP",
          status: "registered",
          registeredDate: "2024-01-15",
          qrCode: "QR123456789",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
        },
        {
          id: "2",
          name: "Michael Chen",
          email: "michael@example.com",
          phone: "+254 700 234 567",
          ticketType: "Standard",
          status: "checked_in",
          registeredDate: "2024-01-20",
          checkedInDate: "2024-07-02T09:15:00Z",
          qrCode: "QR234567890",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
        },
        {
          id: "3",
          name: "Emma Wilson",
          email: "emma@example.com",
          phone: "+254 700 345 678",
          ticketType: "Student",
          status: "scanned",
          registeredDate: "2024-02-01",
          checkedInDate: "2024-07-02T08:45:00Z",
          scannedAt: "2024-07-02T09:30:00Z",
          facilities: ["Main Entrance", "Lunch Area"],
          qrCode: "QR345678901",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
        }
      ]
    }
  ];

  const selectedEvent = eventId ? events.find(e => e.id === eventId) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'ongoing':
        return "bg-green-100 text-green-800 border-green-200";
      case 'completed':
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
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

  const getAttendeeStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'checked_in':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'scanned':
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
  };

  const filteredAttendees = selectedEvent?.attendeesList?.filter(attendee =>
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (eventId && selectedEvent) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <BackButton to="/admin/workstation/events" label="Back to Events" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h1>
              <p className="text-muted-foreground mt-2">{selectedEvent.organizer} • {selectedEvent.date}</p>
            </div>
          </div>

          {/* Event Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                    <p className="font-semibold text-foreground">{selectedEvent.attendees}</p>
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
                    <p className="font-semibold text-foreground">
                      {selectedEvent.attendeesList?.filter(a => a.status === 'checked_in' || a.status === 'scanned').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scanned</p>
                    <p className="font-semibold text-foreground">
                      {selectedEvent.attendeesList?.filter(a => a.status === 'scanned').length || 0}
                    </p>
                  </div>
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="font-semibold text-foreground">{selectedEvent.capacity}</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facilities Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Facilities Management
                </div>
                <Button 
                  onClick={() => navigate('/admin/workstation/scanner')}
                  size="sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Open Scanner
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedEvent.facilities?.map((facility) => (
                  <Card 
                    key={facility.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedFacility === facility.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedFacility(selectedFacility === facility.id ? null : facility.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {facility.icon}
                          <span className="font-medium">{facility.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {facility.currentCount}/{facility.capacity || '∞'}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${facility.capacity ? (facility.currentCount / facility.capacity) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendees Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Attendees Management
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Attendee
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search attendees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>

                <div className="space-y-2">
                  {filteredAttendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {attendee.avatar ? (
                            <img 
                              src={attendee.avatar} 
                              alt={attendee.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-primary">
                              {attendee.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{attendee.name}</h4>
                          <p className="text-sm text-muted-foreground">{attendee.email}</p>
                          {attendee.phone && (
                            <p className="text-sm text-gray-500">{attendee.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`text-xs ${getAttendeeStatusColor(attendee.status)}`}>
                          {attendee.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {attendee.ticketType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {attendee.status === 'scanned' && attendee.scannedAt 
                            ? new Date(attendee.scannedAt).toLocaleTimeString()
                            : attendee.status === 'checked_in' && attendee.checkedInDate
                            ? new Date(attendee.checkedInDate).toLocaleTimeString()
                            : new Date(attendee.registeredDate).toLocaleDateString()
                          }
                        </span>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Events list view
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Event Management</h1>
            <p className="text-muted-foreground mt-2">Manage all events and their attendees</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/admin/workstation/scanner')}
              className="bg-primary hover:bg-primary/90"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Scanner
            </Button>
            <Button 
              onClick={() => navigate('/admin/workstation/print')}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Center
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search events..."
                  className="w-full"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate(`/admin/workstation/events/${event.id}`)}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`${getStatusColor(event.status)} border-0`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(event.status)}
                      <span className="capitalize">{event.status}</span>
                    </div>
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {event.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-accent-coral transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{event.organizer}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Attendees</p>
                        <p className="font-semibold">{event.attendees}/{event.capacity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Scanned</p>
                        <p className="font-semibold">{event.scannedTickets}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>

                  {event.facilities && event.facilities.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-2">Facilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.facilities.slice(0, 3).map((facility, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {facility.name}
                          </Badge>
                        ))}
                        {event.facilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.facilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default WorkstationEvents;
