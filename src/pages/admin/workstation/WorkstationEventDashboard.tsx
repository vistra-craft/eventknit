import React, { useState } from "react";
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
  Target,
  Settings,
  Gift,
  Utensils,
  Car,
  Shield,
  UserPlus,
  Download
} from "lucide-react";
import AdminLayout from "../AdminLayout";

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

const WorkstationEventDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'facilities'>('overview');

  // Mock event data
  const eventData: EventData = {
    id: eventId || "1",
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

  const getAttendeeStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'checked_in':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'scanned':
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">{eventData.title}</h1>
            <p className="text-gray-600 mt-2">{eventData.organizer} • {eventData.date} • {eventData.location}</p>
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
                  src={eventData.image}
                  alt={eventData.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getStatusColor(eventData.status)} border-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(eventData.status)}
                        <span className="capitalize">{eventData.status}</span>
                      </div>
                    </Badge>
                    <Badge variant="secondary">{eventData.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{eventData.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{eventData.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{eventData.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{eventData.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Attendees</p>
                <p className="text-2xl font-bold">{eventData.attendees}/{eventData.capacity}</p>
                <p className="text-sm text-gray-500">Scanned: {eventData.scannedTickets}</p>
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
                    <p className="text-2xl font-bold">{eventData.attendees}</p>
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
                    <p className="text-2xl font-bold">
                      {eventData.attendeesList?.filter(a => a.status === 'checked_in' || a.status === 'scanned').length || 0}
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
                    <p className="text-2xl font-bold">
                      {eventData.attendeesList?.filter(a => a.status === 'scanned').length || 0}
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
                    <p className="text-2xl font-bold">{eventData.capacity}</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
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
              <div className="space-y-2">
                {eventData.attendeesList?.map((attendee) => (
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
                        <h4 className="font-medium text-gray-900">{attendee.name}</h4>
                        <p className="text-sm text-gray-600">{attendee.email}</p>
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
                      <span className="text-sm text-gray-600">
                        {attendee.status === 'scanned' && attendee.scannedAt 
                          ? new Date(attendee.scannedAt).toLocaleTimeString()
                          : attendee.status === 'checked_in' && attendee.checkedInDate
                          ? new Date(attendee.checkedInDate).toLocaleTimeString()
                          : new Date(attendee.registeredDate).toLocaleDateString()
                        }
                      </span>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventData.facilities?.map((facility) => (
                  <Card key={facility.id} className="cursor-pointer transition-all duration-200 hover:shadow-md">
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
        )}
      </div>
    </AdminLayout>
  );
};

export default WorkstationEventDashboard;
