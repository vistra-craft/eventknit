import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { 
  Calendar, 
  Users, 
  QrCode, 
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  Activity,
  TrendingUp
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
  facilities?: string[];
}

const WorkstationOverview: React.FC = () => {
  const navigate = useNavigate();

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
      facilities: ["Registration", "Lunch", "Gifts", "VIP Lounge"]
    },
    {
      id: "2",
      title: "Tech Innovation Summit 2024",
      date: "March 15-17, 2024",
      time: "9:00 AM - 5:00 PM",
      location: "San Francisco, CA",
      venue: "Moscone Center",
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop",
      status: "ongoing",
      attendees: 1200,
      capacity: 1500,
      organizer: "TechCorp",
      category: "Technology",
      revenue: 360000,
      scannedTickets: 1150,
      facilities: ["Registration", "Lunch", "Gifts", "VIP Lounge", "Parking"]
    },
    {
      id: "3",
      title: "Digital Marketing Workshop",
      date: "February 28, 2024",
      time: "10:00 AM - 4:00 PM",
      location: "London, UK",
      venue: "London Business School",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
      status: "completed",
      attendees: 85,
      capacity: 100,
      organizer: "MarketingPro",
      category: "Marketing",
      revenue: 25500,
      scannedTickets: 85,
      facilities: ["Registration", "Lunch", "Materials"]
    }
  ];

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

  const totalEvents = events.length;
  const totalAttendees = events.reduce((sum, event) => sum + event.attendees, 0);
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const totalScanned = events.reduce((sum, event) => sum + (event.scannedTickets || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workstation Management</h1>
            <p className="text-gray-600 mt-2">Select an event to manage attendees, facilities, and operations</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{totalEvents}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                  <p className="text-2xl font-bold">{totalAttendees.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tickets Scanned</p>
                  <p className="text-2xl font-bold">{totalScanned.toLocaleString()}</p>
                </div>
                <QrCode className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Events Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Events</h2>
            <Button 
              onClick={() => navigate('/admin/workstation/events')}
              variant="outline"
            >
              Detailed View
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(`/admin/workstation/event/${event.id}`)}
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
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{event.organizer}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{event.venue}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Attendees</p>
                          <p className="font-semibold">{event.attendees}/{event.capacity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Scanned</p>
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
                        <p className="text-sm text-gray-600 mb-2">Facilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.facilities.slice(0, 3).map((facility, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {facility}
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
      </div>
    </AdminLayout>
  );
};

export default WorkstationOverview;
